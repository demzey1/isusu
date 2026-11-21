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

    uint256 internal constant C = 100e18;
    uint64 internal constant DUR = 1 days;

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
    // Scenario runner
    // ------------------------------------------------------------------

    /// @dev Bit (i * 8 + r) means "member i pays round r"; r is 2..N because
    ///      round 1 is paid at join. Members who stop paying are slashed from
    ///      collateral and default once it runs out.
    function _run(uint8 n, uint256 mask) internal returns (uint256 id, uint256[] memory start) {
        start = new uint256[](n);
        for (uint256 i; i < n; ++i) {
            start[i] = usdt.balanceOf(members[i]);
        }

        vm.prank(creator);
        id = isusu.createCircle(uint128(C), n, DUR, uint64(block.timestamp + 7 days));

        for (uint256 i; i < n; ++i) {
            vm.prank(members[i]);
            isusu.join(id, uint8(i + 1));
        }

        for (uint256 r = 2; r <= n; ++r) {
            Isusu.CircleView memory c = isusu.getCircle(id);
            if (c.finished) break;

            uint256 paid;
            for (uint256 i; i < n; ++i) {
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

        for (uint256 i; i < n; ++i) {
            if (isusu.getMember(id, members[i]).credit > 0) {
                vm.prank(members[i]);
                isusu.withdraw(id);
            }
        }
    }

    // ------------------------------------------------------------------
    // Deterministic late-cluster case
    // ------------------------------------------------------------------

    /// N = 6, slots 4, 5 and 6 stop paying from round 2.
    function test_LateClusterDefaults_AllPayersMadeWhole() public {
        uint8 n = 6;
        uint256 mask = _mask(n, 3, 2); // members 0..2 pay every round

        (uint256 id, uint256[] memory start) = _run(n, mask);

        for (uint256 i; i < n; ++i) {
            if (isusu.getMember(id, members[i]).defaulted) continue;
            assertGe(usdt.balanceOf(members[i]), start[i], string.concat("member ", vm.toString(i), " is short"));
        }
        assertEq(usdt.balanceOf(address(isusu)), 0, "contract not empty");
    }

    // ------------------------------------------------------------------
    // Fuzz
    // ------------------------------------------------------------------

    function testFuzz_NonDefaultersMadeWhole(uint8 n_, uint256 mask) public {
        uint8 n = uint8(bound(n_, 2, 10));

        (uint256 id, uint256[] memory start) = _run(n, mask);

        _assertNoOneShort(id, start, n);
    }

    /// @dev Defaulters forced into the last D slots, each stopping at a random
    ///      round. This targets the multiple-defaulter, late-cluster case.
    function testFuzz_LateClusterDefaults(uint8 n_, uint8 d_, uint256 rand) public {
        uint8 n = uint8(bound(n_, 3, 10));
        uint8 d = uint8(bound(d_, 1, n - 1));
        uint8 firstDefaulter = n - d;

        uint256 mask;
        for (uint256 i; i < n; ++i) {
            uint8 stop = n + 1;
            if (i >= firstDefaulter) {
                stop = uint8(bound(uint256(keccak256(abi.encode(rand, i))), 2, n));
            }
            for (uint256 r = 2; r <= n; ++r) {
                if (r < stop) mask |= uint256(1) << (i * 8 + r);
            }
        }

        (uint256 id, uint256[] memory start) = _run(n, mask);
        _assertNoOneShort(id, start, n);
    }

    /// @dev Every combination of N = 3..8, D defaulters in the last slots and a
    ///      shared stop round.
    function test_LateClusterMatrix() public {
        uint256 cases;
        for (uint8 n = 3; n <= 8; ++n) {
            for (uint8 d = 1; d <= n - 1; ++d) {
                for (uint8 s = 2; s <= n; ++s) {
                    uint256 snap = vm.snapshotState();
                    (uint256 id, uint256[] memory start) = _run(n, _mask(n, n - d, s));
                    for (uint256 i; i < n; ++i) {
                        if (isusu.getMember(id, members[i]).defaulted) continue;
                        assertGe(
                            usdt.balanceOf(members[i]),
                            start[i],
                            string.concat(
                                "n=",
                                vm.toString(uint256(n)),
                                " d=",
                                vm.toString(uint256(d)),
                                " s=",
                                vm.toString(uint256(s)),
                                " member=",
                                vm.toString(i)
                            )
                        );
                    }
                    vm.revertToState(snap);
                    cases++;
                }
            }
        }
        assertGt(cases, 0);
    }

    function _assertNoOneShort(uint256 id, uint256[] memory start, uint8 n) internal view {
        for (uint256 i; i < n; ++i) {
            if (isusu.getMember(id, members[i]).defaulted) continue;
            uint256 end = usdt.balanceOf(members[i]);
            if (end < start[i]) {
                revert(
                    string.concat(
                        "SHORT member=",
                        vm.toString(i),
                        " slot=",
                        vm.toString(uint256(isusu.getMember(id, members[i]).slot)),
                        " n=",
                        vm.toString(uint256(n)),
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
    function _mask(uint8 n, uint8 payers, uint8 stop) internal pure returns (uint256 mask) {
        for (uint256 r = 2; r <= n; ++r) {
            for (uint256 i; i < payers; ++i) {
                if (r < stop) mask |= uint256(1) << (i * 8 + r);
            }
        }
    }
}
