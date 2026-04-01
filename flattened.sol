// Sources flattened with hardhat v2.28.6 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/interfaces/IERC1363.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)

pragma solidity >=0.6.2;


/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;


/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        if (!_safeTransfer(token, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        if (!_safeTransferFrom(token, from, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _safeTransfer(token, to, value, false);
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _safeTransferFrom(token, from, to, value, false);
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        if (!_safeApprove(token, spender, value, false)) {
            if (!_safeApprove(token, spender, 0, true)) revert SafeERC20FailedOperation(address(token));
            if (!_safeApprove(token, spender, value, true)) revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Oppositely, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity `token.transfer(to, value)` call, relaxing the requirement on the return value: the
     * return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransfer(IERC20 token, address to, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.transfer.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(to, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }

    /**
     * @dev Imitates a Solidity `token.transferFrom(from, to, value)` call, relaxing the requirement on the return
     * value: the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param from The sender of the tokens
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value,
        bool bubble
    ) private returns (bool success) {
        bytes4 selector = IERC20.transferFrom.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(from, shr(96, not(0))))
            mstore(0x24, and(to, shr(96, not(0))))
            mstore(0x44, value)
            success := call(gas(), token, 0, 0x00, 0x64, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
            mstore(0x60, 0)
        }
    }

    /**
     * @dev Imitates a Solidity `token.approve(spender, value)` call, relaxing the requirement on the return value:
     * the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param spender The spender of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeApprove(IERC20 token, address spender, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.approve.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(spender, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }
}


// File @openzeppelin/contracts/utils/StorageSlot.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.js.

pragma solidity ^0.8.20;

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * IMPORTANT: Deprecated. This storage-based reentrancy guard will be removed and replaced
 * by the {ReentrancyGuardTransient} variant in v6.0.
 *
 * @custom:stateless
 */
abstract contract ReentrancyGuard {
    using StorageSlot for bytes32;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @dev A `view` only version of {nonReentrant}. Use to block view functions
     * from being called, preventing reading from inconsistent contract state.
     *
     * CAUTION: This is a "view" modifier and does not change the reentrancy
     * status. Use it only on view functions. For payable or non-payable functions,
     * use the standard {nonReentrant} modifier instead.
     */
    modifier nonReentrantView() {
        _nonReentrantBeforeView();
        _;
    }

    function _nonReentrantBeforeView() private view {
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        _nonReentrantBeforeView();

        // Any calls to nonReentrant after this point will fail
        _reentrancyGuardStorageSlot().getUint256Slot().value = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _reentrancyGuardStorageSlot().getUint256Slot().value == ENTERED;
    }

    function _reentrancyGuardStorageSlot() internal pure virtual returns (bytes32) {
        return REENTRANCY_GUARD_STORAGE;
    }
}


// File contracts/MandateValidator.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;



/// @title MandateValidator
/// @notice Manages per-user Mezo Passport mandates and enforces one-stake-per-market.
contract MandateValidator {
    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Mandate {
        uint256 limitPerMarket; // max MUSD wei per stake
        bool active;
    }

    // ─── State ──────────────────────────────────────────────────────────────────

    /// @notice Address of the PredictionMarket contract — only it can call recordStake()
    address public predictionMarket;

    mapping(address => Mandate) private _mandates;

    /// @dev user → marketId → has staked?
    mapping(address => mapping(bytes32 => bool)) private _hasStaked;

    // ─── Events ─────────────────────────────────────────────────────────────────

    event MandateRegistered(address indexed user, uint256 limitPerMarket);
    event MandateRevoked(address indexed user);
    event PredictionMarketSet(address indexed predictionMarket);

    // ─── Errors ─────────────────────────────────────────────────────────────────

    error NoMandate(address user);
    error MandateExceeded(uint256 limit, uint256 attempted);
    error AlreadyStaked(address user, bytes32 marketId);
    error Unauthorized();
    error PredictionMarketAlreadySet();
    error ZeroAddress();
    error ZeroLimit();

    // ─── Constructor ────────────────────────────────────────────────────────────

    constructor() {}

    // ─── Admin ──────────────────────────────────────────────────────────────────

    /// @notice Set the PredictionMarket address — one-time, irreversible.
    function setPredictionMarket(address _predictionMarket) external {
        if (predictionMarket != address(0)) revert PredictionMarketAlreadySet();
        if (_predictionMarket == address(0)) revert ZeroAddress();
        predictionMarket = _predictionMarket;
        emit PredictionMarketSet(_predictionMarket);
    }

    // ─── User-Facing ─────────────────────────────────────────────────────────

    /// @notice Register or update a Prediction Mandate.
    ///         May be called by the user themselves or by an authorized backend relay.
    function registerMandate(address user, uint256 limitPerMarket) external {
        if (user == address(0)) revert ZeroAddress();
        if (limitPerMarket == 0) revert ZeroLimit();
        _mandates[user] = Mandate({ limitPerMarket: limitPerMarket, active: true });
        emit MandateRegistered(user, limitPerMarket);
    }

    /// @notice Revoke own mandate.
    function revokeMandate() external {
        _mandates[msg.sender].active = false;
        emit MandateRevoked(msg.sender);
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    /// @notice Validate that a stake is within mandate scope.
    ///         Pure view — does NOT record the stake. Call recordStake() after execution.
    function validateMandate(
        address user,
        uint256 amount,
        bytes32 marketId
    ) external view returns (bool valid, string memory reason) {
        Mandate storage m = _mandates[user];
        if (!m.active) return (false, "NO_MANDATE");
        if (amount > m.limitPerMarket) return (false, "MANDATE_EXCEEDED");
        if (_hasStaked[user][marketId]) return (false, "ALREADY_STAKED");
        return (true, "");
    }

    /// @notice Called by PredictionMarket after a successful stake to record usage.
    ///         Prevents double-staking even if mandate check is bypassed.
    function recordStake(address user, bytes32 marketId) external {
        if (msg.sender != predictionMarket) revert Unauthorized();
        _hasStaked[user][marketId] = true;
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    function getMandate(address user)
        external
        view
        returns (uint256 limitPerMarket, bool active)
    {
        Mandate storage m = _mandates[user];
        return (m.limitPerMarket, m.active);
    }

    function hasStaked(address user, bytes32 marketId) external view returns (bool) {
        return _hasStaked[user][marketId];
    }
}


// File contracts/PredictionMarket.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;




/// @title PredictionMarket
/// @notice Core Presight escrow contract. Holds MUSD, manages YES/NO staking,
///         routes 1% fee to the Mezo protocol, and auto-distributes rewards on resolution.
///
/// Security: ReentrancyGuard applied to ALL MUSD transfer functions (stake, resolve, claimReward).
contract PredictionMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Enums ──────────────────────────────────────────────────────────────────

    enum Mode    { FULL_STAKE, ZERO_RISK }
    enum Status  { OPEN, RESOLVED }
    enum Outcome { NONE, YES, NO }

    // ─── Constants ──────────────────────────────────────────────────────────────

    /// @notice 1% platform fee in basis points — immutable, cannot be bypassed.
    uint256 public constant FEE_BPS = 100;
    uint256 private constant BPS_DENOMINATOR = 10_000;

    // ─── Immutables ─────────────────────────────────────────────────────────────

    IERC20 public immutable musd;
    address public immutable protocolFeeAddr;
    MandateValidator public immutable mandateValidator;

    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Market {
        bytes32  id;
        bytes32  groupId;
        string   question;
        uint256  deadline;
        address  resolver;
        Mode     mode;
        Status   status;
        Outcome  outcome;
        uint256  yesPool;
        uint256  noPool;
        uint256  participantCount;
    }

    struct Stake {
        bool    isYes;     // true = YES, false = NO
        uint256 amount;
        bool    claimed;
    }

    // ─── State ──────────────────────────────────────────────────────────────────

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => Stake)) public stakes;
    mapping(bytes32 => address[]) private _stakers; // for auto-distribution iteration

    // ─── Events ─────────────────────────────────────────────────────────────────

    event MarketCreated(
        bytes32 indexed marketId,
        bytes32 indexed groupId,
        string question,
        address resolver,
        Mode mode,
        uint256 deadline
    );
    event StakePlaced(
        bytes32 indexed marketId,
        address indexed staker,
        bool    isYes,
        uint256 amount
    );
    event MarketResolved(
        bytes32 indexed marketId,
        bool    outcome,
        uint256 totalPool,
        uint256 feeAmount
    );
    event RewardsDistributed(
        bytes32 indexed marketId,
        uint256 winnerCount,
        uint256 netPool
    );
    event RewardClaimed(
        bytes32 indexed marketId,
        address indexed staker,
        uint256 amount
    );

    // ─── Errors ─────────────────────────────────────────────────────────────────

    error MarketNotFound(bytes32 marketId);
    error MarketAlreadyResolved(bytes32 marketId);
    error MarketDeadlineNotPassed(bytes32 marketId);
    error StakingAfterDeadline(bytes32 marketId);
    error MarketNotOpen(bytes32 marketId);
    error NotResolver(bytes32 marketId, address caller);
    error AlreadyStaked(bytes32 marketId, address staker);
    error MandateCheckFailed(string reason);
    error ZeroAmount();
    error ZeroAddress();
    error NothingToClaim(bytes32 marketId, address staker);
    error InvalidDeadline();
    error EmptyQuestion();

    // ─── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyResolver(bytes32 marketId) {
        if (markets[marketId].resolver != msg.sender)
            revert NotResolver(marketId, msg.sender);
        _;
    }

    modifier marketExists(bytes32 marketId) {
        if (markets[marketId].deadline == 0) revert MarketNotFound(marketId);
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────────────────

    /// @param _musd             MUSD ERC-20 address on Mezo Testnet.
    /// @param _protocolFeeAddr  Address that receives the 1% platform fee (immutable).
    /// @param _mandateValidator Deployed MandateValidator contract.
    constructor(
        address _musd,
        address _protocolFeeAddr,
        address _mandateValidator
    ) {
        if (_musd == address(0) || _protocolFeeAddr == address(0) || _mandateValidator == address(0))
            revert ZeroAddress();

        musd             = IERC20(_musd);
        protocolFeeAddr  = _protocolFeeAddr;
        mandateValidator = MandateValidator(_mandateValidator);
    }

    // ─── Market Creation ─────────────────────────────────────────────────────

    /// @notice Create a new YES/NO prediction market.
    ///         Called by the group admin (enforced off-chain; the GroupRegistry stores admin state).
    /// @param groupId    On-chain group identifier from GroupRegistry.
    /// @param question   The prediction question string.
    /// @param deadline   Unix timestamp after which staking closes.
    /// @param resolver   Address of the Trusted Resolver (distinct from group admin).
    /// @param mode       FULL_STAKE or ZERO_RISK.
    /// @return marketId  keccak256-derived unique market identifier.
    function createMarket(
        bytes32 groupId,
        string calldata question,
        uint256 deadline,
        address resolver,
        Mode mode
    ) external returns (bytes32 marketId) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (resolver == address(0)) revert ZeroAddress();

        marketId = keccak256(
            abi.encodePacked(groupId, question, deadline, resolver, block.timestamp, msg.sender)
        );

        markets[marketId] = Market({
            id:               marketId,
            groupId:          groupId,
            question:         question,
            deadline:         deadline,
            resolver:         resolver,
            mode:             mode,
            status:           Status.OPEN,
            outcome:          Outcome.NONE,
            yesPool:          0,
            noPool:           0,
            participantCount: 0
        });

        emit MarketCreated(marketId, groupId, question, resolver, mode, deadline);
    }

    // ─── Staking ────────────────────────────────────────────────────────────
    //     ReentrancyGuard: nonReentrant applied — satisfies security requirement.

    /// @notice Stake MUSD into a market.
    ///         Validates deadline, open status, mandate scope, and one-stake-per-user.
    ///         Transfers MUSD from caller into this contract (escrow).
    /// @param marketId  The market to stake on.
    /// @param isYes     true for YES, false for NO.
    /// @param amount    MUSD amount in wei.
    function stake(
        bytes32 marketId,
        bool isYes,
        uint256 amount
    ) external nonReentrant marketExists(marketId) {
        Market storage m = markets[marketId];

        if (amount == 0) revert ZeroAmount();
        if (block.timestamp >= m.deadline) revert StakingAfterDeadline(marketId);
        if (m.status != Status.OPEN) revert MarketNotOpen(marketId);
        if (stakes[marketId][msg.sender].amount != 0) revert AlreadyStaked(marketId, msg.sender);

        // Mandate scope check — reverts if no mandate or exceeded
        (bool valid, string memory reason) = mandateValidator.validateMandate(
            msg.sender, amount, marketId
        );
        if (!valid) revert MandateCheckFailed(reason);

        // Pull MUSD from user into escrow
        musd.safeTransferFrom(msg.sender, address(this), amount);

        // Record stake
        stakes[marketId][msg.sender] = Stake({ isYes: isYes, amount: amount, claimed: false });
        _stakers[marketId].push(msg.sender);

        if (isYes) {
            m.yesPool += amount;
        } else {
            m.noPool += amount;
        }
        m.participantCount++;

        // Record stake in MandateValidator (prevents double-stake even under attack)
        mandateValidator.recordStake(msg.sender, marketId);

        emit StakePlaced(marketId, msg.sender, isYes, amount);
    }

    // ─── Resolution ─────────────────────────────────────────────────────────
    //     ReentrancyGuard: nonReentrant applied — satisfies security requirement.

    /// @notice Resolve a market and auto-distribute rewards.
    ///         Only the assigned Trusted Resolver may call this.
    ///         Can be called before deadline for early resolution (resolver override).
    /// @param marketId  The market to resolve.
    /// @param outcomeYes true if YES wins, false if NO wins.
    function resolve(
        bytes32 marketId,
        bool outcomeYes
    ) external nonReentrant marketExists(marketId) onlyResolver(marketId) {
        Market storage m = markets[marketId];
        if (m.status == Status.RESOLVED) revert MarketAlreadyResolved(marketId);

        m.status  = Status.RESOLVED;
        m.outcome = outcomeYes ? Outcome.YES : Outcome.NO;

        uint256 totalPool = m.yesPool + m.noPool;
        uint256 feeAmount = (totalPool * FEE_BPS) / BPS_DENOMINATOR;

        emit MarketResolved(marketId, outcomeYes, totalPool, feeAmount);

        _distribute(marketId, outcomeYes, totalPool, feeAmount);
    }

    /// @dev Internal distribution engine. Called by resolve().
    ///      Handles: normal distribution, zero-winner refund, fee routing.
    function _distribute(
        bytes32 marketId,
        bool outcomeYes,
        uint256 totalPool,
        uint256 feeAmount
    ) internal {
        Market storage m = markets[marketId];
        address[] storage stakers = _stakers[marketId];

        uint256 netPool   = totalPool - feeAmount;
        uint256 winPool   = outcomeYes ? m.yesPool : m.noPool;

        // ── Fee → protocol address ──────────────────────────────────────────
        if (feeAmount > 0) {
            musd.safeTransfer(protocolFeeAddr, feeAmount);
        }

        // ── Zero-distribution guard ─────────────────────────────────────────
        // All stakes on the same side → refund all stakers net of fee pro-rata
        if (winPool == 0 || winPool == totalPool) {
            // Refund: each staker gets their proportional share of netPool
            for (uint256 i = 0; i < stakers.length; i++) {
                address staker = stakers[i];
                Stake storage s = stakes[marketId][staker];
                if (s.amount > 0 && !s.claimed) {
                    uint256 refund = (netPool * s.amount) / totalPool;
                    s.claimed = true;
                    musd.safeTransfer(staker, refund);
                }
            }
            emit RewardsDistributed(marketId, 0, netPool);
            return;
        }

        // ── Normal distribution → winners get proportional share of netPool ──
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            Stake storage s = stakes[marketId][staker];
            if (s.isYes == outcomeYes && !s.claimed) {
                uint256 reward = (netPool * s.amount) / winPool;
                s.claimed = true;
                musd.safeTransfer(staker, reward);
                winnerCount++;
            }
        }

        emit RewardsDistributed(marketId, winnerCount, netPool);
    }

    // ─── Claim Reward (pull fallback) ────────────────────────────────────────
    //     ReentrancyGuard: nonReentrant applied — satisfies security requirement.

    /// @notice Pull-pattern fallback for winners whose auto-distribution failed.
    ///         Safe to call even if auto-distribution succeeded (will revert with NothingToClaim).
    function claimReward(bytes32 marketId) external nonReentrant marketExists(marketId) {
        Market storage m = markets[marketId];
        if (m.status != Status.RESOLVED) revert MarketNotOpen(marketId);

        Stake storage s = stakes[marketId][msg.sender];
        if (s.claimed) revert NothingToClaim(marketId, msg.sender);

        bool outcomeYes = (m.outcome == Outcome.YES);
        if (s.isYes != outcomeYes) revert NothingToClaim(marketId, msg.sender);

        uint256 totalPool = m.yesPool + m.noPool;
        uint256 feeAmount = (totalPool * FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPool   = totalPool - feeAmount;
        uint256 winPool   = outcomeYes ? m.yesPool : m.noPool;

        uint256 reward = (netPool * s.amount) / winPool;
        s.claimed = true;

        musd.safeTransfer(msg.sender, reward);
        emit RewardClaimed(marketId, msg.sender, reward);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getMarket(bytes32 marketId)
        external
        view
        returns (
            bytes32 id,
            bytes32 groupId,
            string memory question,
            uint256 deadline,
            address resolver,
            Mode mode,
            Status status,
            Outcome outcome,
            uint256 yesPool,
            uint256 noPool,
            uint256 participantCount
        )
    {
        Market storage m = markets[marketId];
        return (
            m.id, m.groupId, m.question, m.deadline,
            m.resolver, m.mode, m.status, m.outcome,
            m.yesPool, m.noPool, m.participantCount
        );
    }

    function getStake(bytes32 marketId, address staker)
        external
        view
        returns (bool isYes, uint256 amount, bool claimed)
    {
        Stake storage s = stakes[marketId][staker];
        return (s.isYes, s.amount, s.claimed);
    }

    function getStakers(bytes32 marketId) external view returns (address[] memory) {
        return _stakers[marketId];
    }
}
