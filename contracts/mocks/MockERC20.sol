// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Simple mintable ERC-20 for Hardhat tests. NOT for production.
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply)
        ERC20(name, symbol)
    {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Allow anyone to mint in tests.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
