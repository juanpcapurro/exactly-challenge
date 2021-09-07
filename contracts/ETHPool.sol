//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ETHPool is ERC20{
    address public immutable teamAddress;
    uint256 private constant WAD=10**18;

    event RewardsDeposited(uint256 amount, uint256 newPrice);
    event Mint(address user, uint256 tokenAmout, uint256 ethAmount);
    event Burn(address user, uint256 tokenAmout, uint256 ethAmount);

    constructor() ERC20("ETHPOOL rewards distribution token", "POOL") {
        teamAddress = msg.sender;
    }

    function mint() public payable {
        require(msg.sender != teamAddress, "team address cant mint");
        emit Mint(msg.sender, msg.value, msg.value);
        _mint(msg.sender, msg.value);
    }

    function depositRewards() public payable {
        require(totalSupply() > 0, "mint first");
        require(msg.sender == teamAddress, "only team address can deposit");
        emit RewardsDeposited(msg.value, tokenPrice());
    }

    function burn(uint256 amount) public {
        // TODO: okay now I should get serious about reentrancy
        uint256 ethToReturn = ethFromBurn(amount, tokenPrice());
        emit Burn(msg.sender, amount, ethToReturn);
        _burn(msg.sender, amount);
        // TODO: should I add a reentrancy guard or is doing it in the end enough?
        payable(msg.sender).transfer(ethToReturn);
    }

    // returned with precision 18
    function tokenPrice() public view returns (uint256){
        return totalSupply() == 0 ? WAD : address(this).balance * WAD / totalSupply();
    }

    function ethFromBurn(uint256 amount, uint256 price) public pure returns (uint256){
        return amount*price/WAD;
    }
}
