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

    uint256 internal constant C = 100e18;
    uint8 internal constant N = 4;
    uint64 internal constant DUR = 1 days;
    uint64 internal constant JOIN_WINDOW = 7 days;

    address internal creator;
    address[] internal members;

    function setUp() public {
        usdt = new MockUSDT();
        agent = new MockAgentId();
        isusu = new Isusu(IERC20(address(usdt)), IAgentId(address(agent)));

        creator = makeAddr("creator");
        agent.setHolder(creator, true);

        for (uint256 i; i < 20; ++i) {
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
        vm.prank(creator);
        id = isusu.createCircle(uint128(C), N, DUR, _joinDeadline());
    }

    function _joinDeadline() internal view returns (uint64) {
        return uint64(block.timestamp + JOIN_WINDOW);
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

    function testCreateRequiresAgentId() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(Isusu.NotAgentHolder.selector);
        isusu.createCircle(uint128(C), N, DUR, _joinDeadline());
    }

    function testCreateRejectsBadParams() public {
        uint64 joinBy = _joinDeadline();
        vm.startPrank(creator);

        vm.expectRevert(Isusu.ZeroContribution.selector);
        isusu.createCircle(0, N, DUR, joinBy);

        vm.expectRevert(Isusu.BadSlotCount.selector);
        isusu.createCircle(uint128(C), 1, DUR, joinBy);

        vm.expectRevert(Isusu.BadSlotCount.selector);
        isusu.createCircle(uint128(C), 21, DUR, joinBy);

        vm.expectRevert(Isusu.BadRoundDuration.selector);
        isusu.createCircle(uint128(C), N, 30 minutes, joinBy);

        vm.expectRevert(Isusu.BadJoinDeadline.selector);
        isusu.createCircle(uint128(C), N, DUR, uint64(block.timestamp + 1 days - 1));

        vm.expectRevert(Isusu.BadJoinDeadline.selector);
        isusu.createCircle(uint128(C), N, DUR, uint64(block.timestamp + 14 days + 1));

        vm.stopPrank();
    }

    function testJoinDeadlineBounds() public {
        vm.startPrank(creator);
        uint256 id = isusu.createCircle(uint128(C), N, DUR, uint64(block.timestamp + 1 days));
        assertEq(isusu.getCircle(id).joinDeadline, uint64(block.timestamp + 1 days));
        vm.stopPrank();
    }

    // ------------------------------------------------------------------
    // Joining
    // ------------------------------------------------------------------

    function testJoinPullsCollateralPlusRoundOne() public {
        uint256 id = _create();

        uint256 before = usdt.balanceOf(members[0]);
        vm.prank(members[0]);
        isusu.join(id, 1);

        // slot 1: collateral (N - 1) * C, plus round 1.
        assertEq(before - usdt.balanceOf(members[0]), C * N, "slot1 pays N * C");
        assertEq(isusu.getMember(id, members[0]).credit, C * (N - 1), "slot1 collateral");

        before = usdt.balanceOf(members[3]);
        vm.prank(members[3]);
        isusu.join(id, 4);

        // slot N: zero collateral, only the round-1 contribution.
        assertEq(before - usdt.balanceOf(members[3]), C, "slotN pays no collateral");
        assertEq(isusu.getMember(id, members[3]).credit, 0, "slotN credit");
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

        vm.prank(members[1]);
        isusu.join(id, 2);
        vm.prank(members[2]);
        isusu.join(id, 3);
        vm.prank(members[3]);
        isusu.join(id, 4);

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
            uint256 owed = C + C * (N - (i + 1));
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

    function testFuzz_CancelledCircleDrainsToZero(uint8 n_, uint8 joined_) public {
        uint8 n = uint8(bound(n_, 2, 10));
        uint8 joined = uint8(bound(joined_, 0, n - 1));

        vm.prank(creator);
        uint256 id = isusu.createCircle(uint128(C), n, DUR, uint64(block.timestamp + 7 days));

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

    // ------------------------------------------------------------------
    // Defaults and slashing
    // ------------------------------------------------------------------

    function testCloseRoundSlashesCollateralToKeepPotWhole() public {
        uint256 id = _create();
        _joinAll(id);

        // Round 2: slot 1 already received and skips; the rest pay. Its
        // collateral, not its cash, must cover the missed round.
        vm.prank(members[1]);
        isusu.contribute(id);
        vm.prank(members[2]);
        isusu.contribute(id);
        vm.prank(members[3]);
        isusu.contribute(id);

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
        // Slot N (zero collateral) skips round 2.
        vm.warp(uint256(isusu.getCircle(id).deadline) + 24 hours + 1);
        isusu.closeRound(id);

        assertTrue(isusu.getMember(id, members[3]).defaulted, "slotN defaulted");
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

        // Slots 2 to 4 each received a full pot and keep their collateral.
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

        // Slot 4 joined with zero collateral and skips round 2.
        for (uint256 i; i < N - 1; ++i) {
            vm.prank(members[i]);
            isusu.contribute(id);
        }

        vm.warp(uint256(isusu.getCircle(id).deadline) + 24 hours + 1);
        isusu.closeRound(id);

        assertTrue(isusu.getMember(id, members[3]).defaulted, "slot4 defaulted");
        assertEq(usdt.balanceOf(members[1]), 1_000_000e18 - C * N + C * (N - 1), "slot2 short by one share");
        assertEq(isusu.getCircle(id).active, N - 1, "one member removed");

        // Rounds 3 and 4 complete normally.
        _contributeAll(id);
        _contributeAll(id);
        assertTrue(isusu.getCircle(id).finished);

        // Round 4 (slot 4's slot) was forfeited into the pool and pays the shortfall.
        Isusu.Member memory shorted = isusu.getMember(id, members[1]);
        assertEq(shorted.received, C * (N - 1), "only one short pot");
        assertGe(shorted.credit, C * (N - 1), "compensated above its collateral");
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
    // Fuzz
    // ------------------------------------------------------------------

    function testFuzz_CollateralMatchesFormula(uint8 slots, uint8 slot) public {
        slots = uint8(bound(slots, 2, 20));
        slot = uint8(bound(slot, 1, slots));

        vm.prank(creator);
        uint256 id = isusu.createCircle(uint128(C), slots, DUR, _joinDeadline());

        vm.prank(members[0]);
        isusu.join(id, slot);

        assertEq(isusu.getMember(id, members[0]).credit, C * (slots - slot));
        assertEq(usdt.balanceOf(address(isusu)), C * (slots - slot) + C);
        _assertSolvent();
    }

    /// @dev Random payment/default patterns: no USDT is ever created or lost.
    ///      Every member's net balance change plus whatever is left in the
    ///      contract must sum to zero.
    function testFuzz_ConservationOfFunds(uint8 slots, uint256 mask) public {
        slots = uint8(bound(slots, 2, 5));

        uint256[] memory start = new uint256[](slots);
        for (uint256 i; i < slots; ++i) {
            start[i] = usdt.balanceOf(members[i]);
        }

        vm.prank(creator);
        uint256 id = isusu.createCircle(uint128(C), slots, DUR, _joinDeadline());

        for (uint256 i; i < slots; ++i) {
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }

        for (uint256 r; r < slots; ++r) {
            Isusu.CircleView memory c = isusu.getCircle(id);
            if (c.finished) break;

            uint256 paid;
            for (uint256 i; i < slots; ++i) {
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
        for (uint256 i; i < slots; ++i) {
            if (isusu.getMember(id, members[i]).credit > 0) {
                vm.prank(members[i]);
                isusu.withdraw(id);
            }
        }

        int256 net;
        for (uint256 i; i < slots; ++i) {
            net += int256(usdt.balanceOf(members[i])) - int256(start[i]);
        }
        net += int256(usdt.balanceOf(address(isusu)));
        assertEq(net, 0, "USDT created or destroyed");
        _assertSolvent();
    }
}
