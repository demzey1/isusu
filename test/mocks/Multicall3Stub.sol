// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Minimal Multicall3 for plain-anvil local development. The app batches
///      reads through Multicall3 at its canonical address; a BNB Chain fork has
///      the real one, a blank chain does not. Only `aggregate3` is needed.
contract Multicall3Stub {
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }

    struct Result3 {
        bool success;
        bytes returnData;
    }

    function aggregate3(Call3[] calldata calls) external payable returns (Result3[] memory results) {
        results = new Result3[](calls.length);
        for (uint256 i; i < calls.length; ++i) {
            (bool success, bytes memory returnData) = calls[i].target.call(calls[i].callData);
            if (!success && !calls[i].allowFailure) {
                assembly {
                    revert(add(returnData, 32), mload(returnData))
                }
            }
            results[i] = Result3(success, returnData);
        }
    }
}
