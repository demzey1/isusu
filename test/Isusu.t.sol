// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {IAgentId, Isusu} from "../src/Isusu.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {MockAgentId} from "./mocks/MockAgentId.sol";
import {MockUSDT} from "./mocks/MockUSDT.sol";

contract IsusuTest is Test {
    Isusu internal isusu;
    MockUSDT internal usdt;
    MockAgentId internal agent;

    uint128 internal constant C = 1e18;
    uint8 internal constant N = 5;
    uint64 internal constant DUR = 1 days;
    uint64 internal constant WINDOW = 7 days;

    address internal creator;
    address[] internal members;

    function setUp() public {
        usdt = new MockUSDT();
        agent = new MockAgentId();
        isusu = new Isusu(IERC20(address(usdt)), IAgentId(address(agent)));

        creator = makeAddr("creator");
        agent.setHolder(creator, true);

        for (uint256 i; i < 10; ++i) {
            address m = makeAddr(string.concat("member", vm.toString(i)));
            members.push(m);
            agent.setHolder(m, true);
            usdt.mint(m, 1_000_000e18);
            vm.prank(m);
            usdt.approve(address(isusu), type(uint256).max);
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    function _create() internal returns (uint256 id) {
        return _createWith(C, DUR, WINDOW);
    }

    function _createWith(uint128 contribution, uint64 roundDuration, uint64 joinWindow) internal returns (uint256 id) {
        vm.prank(creator);
        id = isusu.createCircle(contribution, roundDuration, joinWindow);
    }

    function _joinAll(uint256 id) internal {
        for (uint256 i; i < N; ++i) {
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }
    }

    function _contributeAll(uint256 id) internal {
        for (uint256 i; i < N; ++i) {
            address m = members[i];
            if (isusu.getMember(id, m).defaulted) continue;
            vm.prank(m);
            isusu.contribute(id);
        }
    }

    function _assertSolvent() internal view {
        uint256 liabilities;
        for (uint256 id = 1; id <= isusu.circleCount(); ++id) {
            liabilities += isusu.circleBalance(id);
        }
        assertEq(usdt.balanceOf(address(isusu)), liabilities, "contract balance != circle liabilities");
    }

    // ------------------------------------------------------------------
    // Creation
    // ------------------------------------------------------------------

    function testConstants() public view {
        assertEq(isusu.SLOTS(), 5, "five seats");
        assertEq(isusu.ONE_USDT(), 1e18, "1 USDT");
        assertEq(isusu.TWO_USDT(), 2e18, "2 USDT");
        assertEq(isusu.GRACE_PERIOD(), 24 hours, "grace");
    }

    function testCreateRequiresAgentId() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(Isusu.NotAgentHolder.selector);
        isusu.createCircle(C, DUR, WINDOW);
    }

    function testCreateRejectsBadContribution() public {
        uint128[4] memory contributions = [uint128(0), uint128(5e17), uint128(1e18 - 1), uint128(3e18)];
        vm.startPrank(creator);
        for (uint256 i; i < contributions.length; ++i) {
            vm.expectRevert(Isusu.BadContribution.selector);
            isusu.createCircle(contributions[i], DUR, WINDOW);
        }
        vm.stopPrank();
    }

    function testCreateRejectsBadRoundDuration() public {
        uint64[4] memory durations = [uint64(30 minutes), uint64(2 days), uint64(8 days), uint64(30 days)];
        vm.startPrank(creator);
        for (uint256 i; i < durations.length; ++i) {
            vm.expectRevert(Isusu.BadRoundDuration.selector);
            isusu.createCircle(C, durations[i], WINDOW);
        }
        vm.stopPrank();
    }

    function testCreateRejectsBadJoinWindow() public {
        uint64[4] memory windows = [uint64(1 hours), uint64(2 days), uint64(8 days), uint64(14 days)];
        vm.startPrank(creator);
        for (uint256 i; i < windows.length; ++i) {
            vm.expectRevert(Isusu.BadJoinDeadline.selector);
            isusu.createCircle(C, DUR, windows[i]);
        }
        vm.stopPrank();
    }

    function testCreateAcceptsExactAllowedParameters() public {
        uint128[2] memory contributions = [uint128(1e18), uint128(2e18)];
        uint64[3] memory periods = [uint64(1 days), uint64(3 days), uint64(7 days)];

        for (uint256 ci; ci < contributions.length; ++ci) {
            for (uint256 ri; ri < periods.length; ++ri) {
                for (uint256 ji; ji < periods.length; ++ji) {
                    uint256 id = _createWith(contributions[ci], periods[ri], periods[ji]);
                    Isusu.CircleView memory c = isusu.getCircle(id);
                    assertEq(c.contribution, contributions[ci], "contribution");
                    assertEq(c.roundDuration, periods[ri], "round duration");
                    assertEq(c.joinDeadline, uint64(block.timestamp) + periods[ji], "deadline is relative");
                    assertEq(c.slots, N, "five seats");
                }
            }
        }
    }

    function testJoinDeadlineStartsAtCreation() public {
        vm.warp(1_700_000_000);
        uint256 id = _createWith(C, 3 days, 3 days);
        assertEq(isusu.getCircle(id).joinDeadline, uint64(block.timestamp) + 3 days);
    }

    // ------------------------------------------------------------------
    // Joining
    // ------------------------------------------------------------------

    function testJoinPullsCollateralPlusRoundOne() public {
        uint256 id = _create();

        uint256 before = usdt.balanceOf(members[0]);
        vm.prank(members[0]);
        isusu.join(id, 1);

        // slot 1: collateral (5 - 1) * C, plus round 1.
        assertEq(before - usdt.balanceOf(members[0]), C * N, "slot1 pays N * C");
        assertEq(isusu.getMember(id, members[0]).credit, C * (N - 1), "slot1 collateral");

        before = usdt.balanceOf(members[4]);
        vm.prank(members[4]);
        isusu.join(id, 5);

        // slot 5: zero collateral, only the round-1 contribution.
        assertEq(before - usdt.balanceOf(members[4]), C, "slotN pays no collateral");
        assertEq(isusu.getMember(id, members[4]).credit, 0, "slotN credit");
    }

    function testJoinGates() public {
        uint256 id = _create();

        address stranger = makeAddr("stranger");
        usdt.mint(stranger, C * 10);
        vm.startPrank(stranger);
        usdt.approve(address(isusu), type(uint256).max);
        vm.expectRevert(Isusu.NotAgentHolder.selector);
        isusu.join(id, 2);
        vm.stopPrank();

        vm.startPrank(members[0]);
        vm.expectRevert(Isusu.BadSlot.selector);
        isusu.join(id, 0);
        vm.expectRevert(Isusu.BadSlot.selector);
        isusu.join(id, N + 1);
        isusu.join(id, 1);
        vm.stopPrank();

        vm.startPrank(members[1]);
        vm.expectRevert(Isusu.SlotTaken.selector);
        isusu.join(id, 1);
        vm.stopPrank();

        vm.startPrank(members[0]);
        vm.expectRevert(Isusu.AlreadyMember.selector);
        isusu.join(id, 2);
        vm.stopPrank();

        for (uint256 i = 1; i < N; ++i) {
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }

        address late = makeAddr("late");
        agent.setHolder(late, true);
        vm.prank(late);
        vm.expectRevert(Isusu.CircleFull.selector);
        isusu.join(id, 1);
    }

    function testStartsWhenFullAndPaysSlotOne() public {
        uint256 id = _create();
        _joinAll(id);

        Isusu.CircleView memory c = isusu.getCircle(id);
        assertEq(c.round, 2, "round 2 after round 1 settles");
        assertEq(c.deadline, uint64(block.timestamp) + DUR, "round 2 deadline");
        assertEq(c.pot, 0, "pot cleared");

        // Slot 1 paid N * C on join (collateral + round 1) and got the pot back.
        assertEq(usdt.balanceOf(members[0]), 1_000_000e18, "slot1 received N * C");
        _assertSolvent();
    }

    function testJoinRevertsAfterFinish() public {
        uint256 id = _create();
        _joinAll(id);
        for (uint256 r = 2; r <= N; ++r) {
            _contributeAll(id);
        }
        assertTrue(isusu.getCircle(id).finished);

        vm.prank(makeAddr("late"));
        vm.expectRevert(Isusu.CircleFinished.selector);
        isusu.join(id, 1);
    }

    // ------------------------------------------------------------------
    // Join deadline and cancellation
    // ------------------------------------------------------------------

    function testCancelBeforeDeadlineReverts() public {
        uint256 id = _create();
        vm.prank(members[0]);
        isusu.join(id, 1);

        vm.warp(uint256(isusu.getCircle(id).joinDeadline));
        vm.expectRevert(Isusu.JoinStillOpen.selector);
        isusu.cancelCircle(id);
    }

    function testCancelWhenFullReverts() public {
        uint256 id = _create();
        _joinAll(id);

        vm.warp(uint256(isusu.getCircle(id).joinDeadline) + 1);
        vm.expectRevert(Isusu.CircleFull.selector);
        isusu.cancelCircle(id);
    }

    function testJoinAfterDeadlineReverts() public {
        uint256 id = _create();

        vm.warp(uint256(isusu.getCircle(id).joinDeadline) + 1);
        vm.prank(members[0]);
        vm.expectRevert(Isusu.JoinClosed.selector);
        isusu.join(id, 1);
    }

    function testCancelRefundsEveryoneExactly() public {
        uint256 id = _create();
        uint256[] memory start = new uint256[](3);
        for (uint256 i; i < 3; ++i) {
            start[i] = usdt.balanceOf(members[i]);
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }

        // Anyone can cancel once the deadline has passed.
        vm.warp(uint256(isusu.getCircle(id).joinDeadline) + 1);
        isusu.cancelCircle(id);

        Isusu.CircleView memory c = isusu.getCircle(id);
        assertTrue(c.cancelled);
        assertTrue(c.finished);
        assertEq(c.pot, 0);

        for (uint256 i; i < 3; ++i) {
            uint256 owed = C * (N + 1 - (i + 1));
            assertEq(isusu.getMember(id, members[i]).credit, owed, "full round 1 + collateral");
            vm.prank(members[i]);
            isusu.withdraw(id);
            assertEq(usdt.balanceOf(members[i]), start[i], "refunded exactly");
        }

        assertEq(usdt.balanceOf(address(isusu)), 0, "no funds stranded");
        _assertSolvent();
    }

    function testDoubleWithdrawReverts() public {
        uint256 id = _create();
        vm.prank(members[0]);
        isusu.join(id, 1);

        vm.warp(uint256(isusu.getCircle(id).joinDeadline) + 1);
        isusu.cancelCircle(id);

        vm.startPrank(members[0]);
        isusu.withdraw(id);
        vm.expectRevert(Isusu.NothingToWithdraw.selector);
        isusu.withdraw(id);
        vm.stopPrank();
    }

    function testFuzz_CancelledCircleDrainsToZero(uint8 joinedSeed, bool twoUsdt) public {
        uint8 joined = uint8(bound(joinedSeed, 0, N - 1));
        uint128 contribution = twoUsdt ? isusu.TWO_USDT() : isusu.ONE_USDT();

        uint256 id = _createWith(contribution, DUR, WINDOW);

        for (uint256 i; i < joined; ++i) {
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }

        vm.warp(uint256(isusu.getCircle(id).joinDeadline) + 1);
        isusu.cancelCircle(id);

        for (uint256 i; i < joined; ++i) {
            vm.prank(members[i]);
            isusu.withdraw(id);
        }

        assertEq(usdt.balanceOf(address(isusu)), 0, "contract balance must be zero");
        assertEq(isusu.circleBalance(id), 0, "no remaining liabilities");
    }

    // ------------------------------------------------------------------
    // Contributions
    // ------------------------------------------------------------------

    function testContributeAdvancesRoundAndPaysNextSlot() public {
        uint256 id = _create();
        _joinAll(id);

        uint256 before = usdt.balanceOf(members[1]);
        for (uint256 j; j < N; ++j) {
            vm.prank(members[j]);
            isusu.contribute(id);
        }
        // Slot 2 received the full pot but also paid its own contribution.
        assertEq(usdt.balanceOf(members[1]) - before, C * (N - 1), "slot2 net pot minus own share");
        assertEq(isusu.getCircle(id).round, 3, "moved to round 3");
        _assertSolvent();
    }

    function testContributeGates() public {
        uint256 id = _create();

        vm.prank(members[0]);
        vm.expectRevert(Isusu.NotStarted.selector);
        isusu.contribute(id);

        _joinAll(id);

        vm.prank(makeAddr("stranger"));
        vm.expectRevert(Isusu.NotMember.selector);
        isusu.contribute(id);

        vm.prank(members[0]);
        isusu.contribute(id);

        vm.prank(members[0]);
        vm.expectRevert(Isusu.AlreadyPaid.selector);
        isusu.contribute(id);
    }

    function testRoundCannotBeClosedBeforeGrace() public {
        uint256 id = _create();
        _joinAll(id);

        uint64 deadline = isusu.getCircle(id).deadline;
        vm.warp(uint256(deadline) + 24 hours);

        vm.expectRevert(Isusu.NotOverdue.selector);
        isusu.closeRound(id);
    }

    /// @dev Settlement is permissionless: no seat, no Agent ID, no role.
    function testAnyoneCanCloseOverdueRound() public {
        uint256 id = _create();
        _joinAll(id);

        // One payer is enough to keep the round open until the grace period.
        vm.prank(members[1]);
        isusu.contribute(id);

        vm.warp(uint256(isusu.getCircle(id).deadline) + 24 hours + 1);
        vm.prank(makeAddr("passerby"));
        isusu.closeRound(id);

        assertEq(isusu.getCircle(id).round, 3, "round advanced");
        _assertSolvent();
    }

    // ------------------------------------------------------------------
    // Defaults and slashing
    // ------------------------------------------------------------------

    function testCloseRoundSlashesCollateralToKeepPotWhole() public {
        uint256 id = _create();
        _joinAll(id);

        // Round 2: slot 1 already received and skips; the rest pay. Its
        // collateral, not its cash, must cover the missed round.
        for (uint256 i = 1; i < N; ++i) {
            vm.prank(members[i]);
            isusu.contribute(id);
        }

        vm.warp(uint256(isusu.getCircle(id).deadline) + 24 hours + 1);
        isusu.closeRound(id);

        assertEq(isusu.getMember(id, members[1]).received, C * N, "slot2 got the full pot");
        assertEq(isusu.getMember(id, members[0]).credit, C * (N - 1) - C, "slot1 collateral charged once");
        assertFalse(isusu.getMember(id, members[0]).defaulted, "post-payout charge is not a default");
        assertEq(isusu.getCircle(id).active, N, "nobody defaulted");
        _assertSolvent();
    }

    /// @dev Collateral only secures rounds after payout, so a missed payment in
    ///      any earlier round is a default.
    function testPrePayoutMissIsADefault() public {
        uint256 id = _create();
        _joinAll(id);

        for (uint256 i; i < N - 1; ++i) {
            vm.prank(members[i]);
            isusu.contribute(id);
        }
        // Slot 5 (zero collateral) skips round 2.
        vm.warp(uint256(isusu.getCircle(id).deadline) + 24 hours + 1);
        isusu.closeRound(id);

        assertTrue(isusu.getMember(id, members[4]).defaulted, "slot5 defaulted");
        assertEq(isusu.getCircle(id).active, N - 1, "removed from rotation");
        _assertSolvent();
    }

    /// @dev A member who already received their pot can never leave a hole:
    ///      collateral equals exactly the rounds they still owe.
    function testPostPayoutDefaultIsExactlyCovered() public {
        uint256 id = _create();
        _joinAll(id);

        // Slot 1 received the round-1 pot and never contributes again.
        for (uint256 r = 2; r <= N; ++r) {
            for (uint256 i = 1; i < N; ++i) {
                vm.prank(members[i]);
                isusu.contribute(id);
            }
            vm.warp(uint256(isusu.getCircle(id).deadline) + 24 hours + 1);
            isusu.closeRound(id);
        }

        Isusu.Member memory deadbeat = isusu.getMember(id, members[0]);
        assertFalse(deadbeat.defaulted, "collateral covered every charge exactly");
        assertEq(deadbeat.credit, 0, "no collateral left");
        assertEq(isusu.getCircle(id).active, N, "still counted active");

        // Slots 2 to 5 each received a full pot and keep their collateral.
        for (uint256 i = 1; i < N; ++i) {
            uint8 slot = uint8(i + 1);
            assertEq(
                usdt.balanceOf(members[i]),
                1_000_000e18 - C * (N - slot),
                "net balance: paid join + rounds, received one pot"
            );
            assertEq(isusu.getMember(id, members[i]).credit, C * (N - slot), "collateral intact");
        }
        _assertSolvent();
    }

    /// @dev A pre-payout defaulter forfeits their slot. The pot withheld in that
    ///      round compensates the shorted recipient, and the rest is refunded.
    function testPrePayoutDefaultCompensatesShortedRecipient() public {
        uint256 id = _create();
        _joinAll(id);

        // Slot 5 joined with zero collateral and skips round 2.
        for (uint256 i; i < N - 1; ++i) {
            vm.prank(members[i]);
            isusu.contribute(id);
        }

        vm.warp(uint256(isusu.getCircle(id).deadline) + 24 hours + 1);
        isusu.closeRound(id);

        assertTrue(isusu.getMember(id, members[4]).defaulted, "slot5 defaulted");
        assertEq(usdt.balanceOf(members[1]), 1_000_000e18 - C, "slot2 paid one share in and got a short pot");
        assertEq(isusu.getCircle(id).active, N - 1, "one member removed");

        // Rounds 3, 4 and 5 complete normally.
        _contributeAll(id);
        _contributeAll(id);
        _contributeAll(id);
        assertTrue(isusu.getCircle(id).finished);

        // Round 5 (slot 5's slot) was forfeited into the pool and pays the shortfall.
        Isusu.Member memory shorted = isusu.getMember(id, members[1]);
        assertEq(shorted.received, C * (N - 1), "only one short pot");
        assertGe(shorted.credit, C * (N - 1), "no worse than full collateral");
        _assertSolvent();
    }

    // ------------------------------------------------------------------
    // Withdrawals
    // ------------------------------------------------------------------

    function testWithdrawGatesAndRefunds() public {
        uint256 id = _create();
        _joinAll(id);

        vm.prank(members[0]);
        vm.expectRevert(Isusu.NotFinished.selector);
        isusu.withdraw(id);

        for (uint256 r = 2; r <= N; ++r) {
            _contributeAll(id);
        }

        uint256 before = usdt.balanceOf(members[0]);
        vm.prank(members[0]);
        isusu.withdraw(id);
        assertEq(usdt.balanceOf(members[0]) - before, C * (N - 1), "collateral returned");

        vm.prank(members[0]);
        vm.expectRevert(Isusu.NothingToWithdraw.selector);
        isusu.withdraw(id);
    }

    function testContractIsEmptyAfterEveryoneWithdraws() public {
        uint256 id = _create();
        _joinAll(id);
        for (uint256 r = 2; r <= N; ++r) {
            _contributeAll(id);
        }
        for (uint256 i; i < N; ++i) {
            if (isusu.getMember(id, members[i]).credit == 0) continue;
            vm.prank(members[i]);
            isusu.withdraw(id);
        }
        assertEq(usdt.balanceOf(address(isusu)), 0, "no funds stranded");
        _assertSolvent();
    }

    // ------------------------------------------------------------------
    // Failed payout transfers
    // ------------------------------------------------------------------

    /// @dev A recipient whose wallet cannot accept USDT must not block the
    ///      round. The pot becomes a withdrawable balance instead.
    function testPayoutTransferFailureIsCredited() public {
        uint256 id = _create();

        // Four seats join. Slot 1 joins first, then its token account is frozen.
        for (uint256 i; i < N - 1; ++i) {
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }
        usdt.setFrozen(members[0], true);

        // The last join fills the circle and settles round 1.
        vm.prank(members[4]);
        isusu.join(id, 5);

        Isusu.CircleView memory c = isusu.getCircle(id);
        Isusu.Member memory seat1 = isusu.getMember(id, members[0]);

        assertEq(c.round, 2, "settlement advanced the round");
        assertEq(seat1.received, 0, "nothing transferred");
        assertEq(seat1.owed, C * N, "pot credited to the withdrawable balance");
        assertEq(usdt.balanceOf(address(isusu)), 15 * C, "pot stays in the contract");
        _assertSolvent();

        // The deferred pot is available while the circle is still running.
        usdt.setFrozen(members[0], false);
        uint256 before = usdt.balanceOf(members[0]);
        vm.prank(members[0]);
        isusu.withdraw(id);
        assertEq(usdt.balanceOf(members[0]) - before, C * N, "deferred pot withdrawn");
        assertEq(isusu.getMember(id, members[0]).owed, 0, "balance cleared");
        _assertSolvent();
    }

    function testFinalPayoutTransferFailureIsWithdrawable() public {
        uint256 id = _create();
        _joinAll(id);

        // Rounds 2 to 4 pay normally.
        for (uint256 r = 2; r < N; ++r) {
            _contributeAll(id);
        }

        // Round 5: slot 5 pays, then is frozen just before the last payment.
        vm.prank(members[0]);
        isusu.contribute(id);
        vm.prank(members[1]);
        isusu.contribute(id);
        vm.prank(members[2]);
        isusu.contribute(id);
        vm.prank(members[4]);
        isusu.contribute(id);
        usdt.setFrozen(members[4], true);
        vm.prank(members[3]);
        isusu.contribute(id);

        Isusu.CircleView memory c = isusu.getCircle(id);
        Isusu.Member memory seat5 = isusu.getMember(id, members[4]);
        assertTrue(c.finished, "circle finished");
        assertEq(seat5.received, 0, "nothing transferred");
        assertEq(seat5.owed, C * N, "final pot deferred");
        _assertSolvent();

        usdt.setFrozen(members[4], false);
        uint256 before = usdt.balanceOf(members[4]);
        vm.prank(members[4]);
        isusu.withdraw(id);
        assertEq(usdt.balanceOf(members[4]) - before, C * N, "deferred final pot withdrawn");

        // Everyone else takes their remaining credit; nothing is stranded.
        for (uint256 i; i < N - 1; ++i) {
            vm.prank(members[i]);
            isusu.withdraw(id);
        }
        assertEq(usdt.balanceOf(address(isusu)), 0, "no funds stranded");
        _assertSolvent();
    }

    // ------------------------------------------------------------------
    // Avatars
    // ------------------------------------------------------------------

    function testAvatarDefaultsToZero() public {
        assertEq(isusu.avatarOf(members[0]), 0);
        assertEq(isusu.avatarOf(makeAddr("nobody")), 0);
    }

    function testSetAvatarStoresAllSixteenIds() public {
        for (uint8 id; id < 16; ++id) {
            vm.prank(members[0]);
            isusu.setAvatar(id);
            assertEq(isusu.avatarOf(members[0]), id);
        }
    }

    function testSetAvatarEmitsEvent() public {
        vm.expectEmit(true, false, false, true, address(isusu));
        emit Isusu.AvatarSet(members[3], 9);
        vm.prank(members[3]);
        isusu.setAvatar(9);
    }

    function testSetAvatarRejectsBadId() public {
        vm.prank(members[0]);
        vm.expectRevert(Isusu.BadAvatar.selector);
        isusu.setAvatar(16);
    }

    function testFuzz_AvatarRange(uint8 id) public {
        if (id > 15) {
            vm.expectRevert(Isusu.BadAvatar.selector);
        }
        vm.prank(members[0]);
        isusu.setAvatar(id);
        if (id <= 15) assertEq(isusu.avatarOf(members[0]), id);
    }

    // ------------------------------------------------------------------
    // Fuzz
    // ------------------------------------------------------------------

    function testFuzz_CollateralMatchesFormula(uint8 slotSeed, bool twoUsdt) public {
        uint8 slot = uint8(bound(slotSeed, 1, N));
        uint128 contribution = twoUsdt ? isusu.TWO_USDT() : isusu.ONE_USDT();

        uint256 id = _createWith(contribution, DUR, WINDOW);

        vm.prank(members[0]);
        isusu.join(id, slot);

        assertEq(isusu.getMember(id, members[0]).credit, contribution * (N - slot));
        assertEq(usdt.balanceOf(address(isusu)), contribution * (N - slot + 1));
        _assertSolvent();
    }

    /// @dev Random payment/default patterns: no USDT is ever created or lost.
    ///      Every member's net balance change plus whatever is left in the
    ///      contract must sum to zero.
    function testFuzz_ConservationOfFunds(bool twoUsdt, uint256 mask) public {
        uint128 contribution = twoUsdt ? isusu.TWO_USDT() : isusu.ONE_USDT();

        uint256[] memory start = new uint256[](N);
        for (uint256 i; i < N; ++i) {
            start[i] = usdt.balanceOf(members[i]);
        }

        uint256 id = _createWith(contribution, DUR, WINDOW);
        _joinAll(id);

        for (uint256 r = 2; r <= N; ++r) {
            Isusu.CircleView memory c = isusu.getCircle(id);
            if (c.finished) break;

            uint256 paid;
            for (uint256 i; i < N; ++i) {
                if (isusu.getMember(id, members[i]).defaulted) continue;
                if ((mask >> (i * 16 + r)) & 1 == 0) continue;
                vm.prank(members[i]);
                isusu.contribute(id);
                paid++;
            }

            c = isusu.getCircle(id);
            if (c.finished) break;
            if (paid < c.active) {
                vm.warp(uint256(c.deadline) + 24 hours + 1);
                isusu.closeRound(id);
            }
        }

        // Drain what is still owed.
        for (uint256 i; i < N; ++i) {
            if (isusu.getMember(id, members[i]).credit > 0) {
                vm.prank(members[i]);
                isusu.withdraw(id);
            }
        }

        int256 net;
        for (uint256 i; i < N; ++i) {
            net += int256(usdt.balanceOf(members[i])) - int256(start[i]);
        }
        net += int256(usdt.balanceOf(address(isusu)));
        assertEq(net, 0, "USDT created or destroyed");
        _assertSolvent();
    }

    function testFuzz_AllowedParameters(uint8 cSeed, uint8 rSeed, uint8 jSeed) public {
        uint128[2] memory contributions = [uint128(1e18), uint128(2e18)];
        uint64[3] memory periods = [uint64(1 days), uint64(3 days), uint64(7 days)];

        uint128 contribution = contributions[bound(cSeed, 0, 1)];
        uint64 roundDuration = periods[bound(rSeed, 0, 2)];
        uint64 joinWindow = periods[bound(jSeed, 0, 2)];

        uint256 id = _createWith(contribution, roundDuration, joinWindow);
        Isusu.CircleView memory c = isusu.getCircle(id);
        assertEq(c.contribution, contribution);
        assertEq(c.roundDuration, roundDuration);
        assertEq(c.joinDeadline, uint64(block.timestamp) + joinWindow);
        assertEq(c.slots, N);
    }
}
