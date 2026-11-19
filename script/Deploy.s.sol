// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

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
    }
}
