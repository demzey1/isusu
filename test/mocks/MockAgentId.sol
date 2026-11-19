// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Stand-in for the Agent ID ERC-721. Isusu only ever reads balanceOf.
contract MockAgentId {
    mapping(address owner => uint256) public balanceOf;

    function setHolder(address owner, bool holding) external {
        balanceOf[owner] = holding ? 1 : 0;
    }
}
