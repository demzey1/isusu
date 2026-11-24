// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {IAgentId, Isusu} from "../src/Isusu.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {MockAgentId} from "./mocks/MockAgentId.sol";
import {MockUSDT} from "./mocks/MockUSDT.sol";

/// @notice "Made whole" check: a member who never defaults must finish with at
///         least the USDT they started with, even when several late slots
///         default.
contract NonDefaulterSolvencyTest is Test {
    Isusu internal isusu;
    MockUSDT internal usdt;
    MockAgentId internal agent;

    uint256 internal constant C = 1e18;
    uint8 internal constant N = 5;
    uint64 internal constant DUR = 1 days;

    address internal creator;
    address[] internal members;

    function setUp() public {
        usdt = new MockUSDT();
        agent = new MockAgentId();
        isusu = new Isusu(IERC20(address(usdt)), IAgentId(address(agent)));
        creator = makeAddr("creator");
        agent.setHolder(creator, true);

        for (uint256 i; i < N; ++i) {
            address m = makeAddr(string.concat("member", vm.toString(i)));
            members.push(m);
            agent.setHolder(m, true);
            usdt.mint(m, 1_000_000e18);
            vm.prank(m);
            usdt.approve(address(isusu), type(uint256).max);
        }
    }

    // ------------------------------------------------------------------
    // Scenario runner
    // ------------------------------------------------------------------

    /// @dev Bit (i * 8 + r) means "member i pays round r"; r is 2..N because
    ///      round 1 is paid at join. Members who stop paying are slashed from
    ///      collateral and default once it runs out.
    function _run(uint256 mask) internal returns (uint256 id, uint256[] memory start) {
        start = new uint256[](N);
        for (uint256 i; i < N; ++i) {
            start[i] = usdt.balanceOf(members[i]);
        }

        vm.prank(creator);
        id = isusu.createCircle(uint128(C), DUR, 7 days);

        for (uint256 i; i < N; ++i) {
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }

        for (uint256 r = 2; r <= N; ++r) {
            Isusu.CircleView memory c = isusu.getCircle(id);
            if (c.finished) break;

            uint256 paid;
            for (uint256 i; i < N; ++i) {
                if (isusu.getMember(id, members[i]).defaulted) continue;
                if ((mask >> (i * 8 + r)) & 1 == 0) continue;
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

        for (uint256 i; i < N; ++i) {
            if (isusu.getMember(id, members[i]).credit > 0) {
                vm.prank(members[i]);
                isusu.withdraw(id);
            }
        }
    }

    // ------------------------------------------------------------------
    // Deterministic late-cluster case
    // ------------------------------------------------------------------

    /// N = 5, slots 4 and 5 stop paying from round 2.
    function test_LateClusterDefaults_AllPayersMadeWhole() public {
        uint256 mask = _mask(3, 2); // members 0..2 pay every round

        (uint256 id, uint256[] memory start) = _run(mask);

        for (uint256 i; i < N; ++i) {
            if (isusu.getMember(id, members[i]).defaulted) continue;
            assertGe(usdt.balanceOf(members[i]), start[i], string.concat("member ", vm.toString(i), " is short"));
        }
        assertEq(usdt.balanceOf(address(isusu)), 0, "contract not empty");
    }

    // ------------------------------------------------------------------
    // Fuzz
    // ------------------------------------------------------------------

    function testFuzz_NonDefaultersMadeWhole(uint256 mask) public {
        (uint256 id, uint256[] memory start) = _run(mask);
        _assertNoOneShort(id, start);
    }

    /// @dev Defaulters forced into the last D slots, each stopping at a random
    ///      round. This targets the multiple-defaulter, late-cluster case.
    function testFuzz_LateClusterDefaults(uint8 d_, uint256 rand) public {
        uint8 d = uint8(bound(d_, 1, N - 1));
        uint8 firstDefaulter = N - d;

        uint256 mask;
        for (uint256 i; i < N; ++i) {
            uint8 stop = N + 1;
            if (i >= firstDefaulter) {
                stop = uint8(bound(uint256(keccak256(abi.encode(rand, i))), 2, N));
            }
            for (uint256 r = 2; r <= N; ++r) {
                if (r < stop) mask |= uint256(1) << (i * 8 + r);
            }
        }

        (uint256 id, uint256[] memory start) = _run(mask);
        _assertNoOneShort(id, start);
    }

    /// @dev Every combination of D defaulters in the last slots and a shared
    ///      stop round, on the fixed five-seat circle.
    function test_LateClusterMatrix() public {
        uint256 cases;
        for (uint8 d = 1; d <= N - 1; ++d) {
            for (uint8 s = 2; s <= N; ++s) {
                uint256 snap = vm.snapshotState();
                (uint256 id, uint256[] memory start) = _run(_mask(N - d, s));
                for (uint256 i; i < N; ++i) {
                    if (isusu.getMember(id, members[i]).defaulted) continue;
                    assertGe(
                        usdt.balanceOf(members[i]),
                        start[i],
                        string.concat(
                            "d=", vm.toString(uint256(d)), " s=", vm.toString(uint256(s)), " member=", vm.toString(i)
                        )
                    );
                }
                vm.revertToState(snap);
                cases++;
            }
        }
        assertGt(cases, 0);
    }

    function _assertNoOneShort(uint256 id, uint256[] memory start) internal view {
        for (uint256 i; i < N; ++i) {
            if (isusu.getMember(id, members[i]).defaulted) continue;
            uint256 end = usdt.balanceOf(members[i]);
            if (end < start[i]) {
                revert(
                    string.concat(
                        "SHORT member=",
                        vm.toString(i),
                        " slot=",
                        vm.toString(uint256(isusu.getMember(id, members[i]).slot)),
                        " paid=",
                        vm.toString(start[i] - end)
                    )
                );
            }
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /// @dev Mask where members [0, payers) pay every round and the rest stop
    ///      from round `stop`, i.e. defaults clustered in the highest slots.
    function _mask(uint8 payers, uint8 stop) internal pure returns (uint256 mask) {
        for (uint256 r = 2; r <= N; ++r) {
            for (uint256 i; i < payers; ++i) {
                if (r < stop) mask |= uint256(1) << (i * 8 + r);
            }
        }
    }
}
