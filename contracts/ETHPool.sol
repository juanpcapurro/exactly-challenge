//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "hardhat/console.sol";

contract ETHPool is ERC20{
    constructor() ERC20("ETHPOOL rewards distribution token", "POOL") { }

    function mint() public payable {
        _mint(msg.sender, msg.value);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
        // TODO: should I add a reentrancy guard or is doing it in the end enough?
        payable(msg.sender).transfer(amount);
    }
}
