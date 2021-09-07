//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ETHPool is ERC20{
    address public immutable teamAddress;
    uint256 private constant WAD=10**18;

    constructor() ERC20("ETHPOOL rewards distribution token", "POOL") {
        teamAddress = msg.sender;
    }

    function mint() public payable {
        require(msg.sender != teamAddress, "team address cant mint");
        _mint(msg.sender, msg.value);
    }

    function depositRewards() public payable {
        require(totalSupply() > 0, "mint first");
        require(msg.sender == teamAddress, "only team address can deposit");
    }

    function burn(uint256 amount) public {
        // TODO: okay now I should get serious about reentrancy
        uint256 ethToReturn = ethFromBurn(amount, tokenPrice());
        _burn(msg.sender, amount);
        // TODO: should I add a reentrancy guard or is doing it in the end enough?
        payable(msg.sender).transfer(ethToReturn);
    }

    // returned with precision 18
    function tokenPrice() public view returns (uint256){
        return address(this).balance * WAD / totalSupply();
    }

    function ethFromBurn(uint256 amount, uint256 price) public pure returns (uint256){
        return amount*price/WAD;
    }
}
