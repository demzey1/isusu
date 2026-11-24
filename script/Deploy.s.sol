// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {IAgentId, Isusu} from "../src/Isusu.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Addresses come from the environment so nothing is hardcoded or guessed.
///      USDT_ADDRESS        BEP-20 USDT on BSC
///      AGENT_ID_ADDRESS    Agent ID ERC-721
///
///      forge script script/Deploy.s.sol:Deploy --rpc-url $BSC_RPC_URL --broadcast
contract Deploy is Script {
    function run() external returns (Isusu isusu) {
        address usdt = vm.envAddress("USDT_ADDRESS");
        address agentId = vm.envAddress("AGENT_ID_ADDRESS");

        vm.startBroadcast();
        isusu = new Isusu(IERC20(usdt), IAgentId(agentId));
        vm.stopBroadcast();

        require(isusu.SLOTS() == 5, "unexpected seat count");
        require(isusu.ONE_USDT() == 1e18 && isusu.TWO_USDT() == 2e18, "unexpected contributions");

        console2.log("Isusu deployed at", address(isusu));
        console2.log("USDT", usdt);
        console2.log("Agent ID", agentId);
        console2.log("Seats", isusu.SLOTS());
        console2.log("Contributions (USDT): 1, 2");
        console2.log("Rounds and join windows: 1, 3 or 7 days");
    }
}
