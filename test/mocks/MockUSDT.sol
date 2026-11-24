// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev USDT on BSC has 18 decimals, so the mock uses the ERC20 default.
///      `setFrozen` lets tests exercise a payout transfer that fails.
contract MockUSDT is ERC20 {
    mapping(address => bool) public frozen;

    error Frozen();

    constructor() ERC20("Tether USD", "USDT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setFrozen(address account, bool value) external {
        frozen[account] = value;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (frozen[from] || frozen[to]) revert Frozen();
        super._update(from, to, value);
    }
}
