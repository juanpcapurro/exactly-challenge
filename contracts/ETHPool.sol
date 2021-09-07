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
        uint256 tokenAmout = tokenFromMint(msg.value, totalSupply(), address(this).balance - msg.value);
        emit Mint(msg.sender, tokenAmout, msg.value);
        _mint(msg.sender, tokenAmout);
    }

    function depositRewards() public payable {
        require(totalSupply() > 0, "mint first");
        require(msg.sender == teamAddress, "only team address can deposit");
        emit RewardsDeposited(msg.value, _tokenPrice(totalSupply(), address(this).balance));
    }

    function burn(uint256 amount) public {
        // TODO: okay now I should get serious about reentrancy
        uint256 ethToReturn = ethFromBurn(amount, totalSupply(), address(this).balance);
        emit Burn(msg.sender, amount, ethToReturn);
        _burn(msg.sender, amount);
        // TODO: should I add a reentrancy guard or is doing it in the end enough?
        payable(msg.sender).transfer(ethToReturn);
    }

    // returned with precision 18
    function tokenPrice() public view returns (uint256){
        return totalSupply() == 0 ? WAD : address(this).balance * WAD / totalSupply();
    }

    function _tokenPrice(uint256 tokenSupply, uint256 ethBalance) private pure returns (uint256){
        return tokenSupply == 0 ? WAD : ethBalance * WAD / tokenSupply;
    }

    function ethFromBurn(uint256 amount, uint256 tokenSupply, uint256 ethBalance) public pure returns (uint256){
        return amount*_tokenPrice(tokenSupply, ethBalance)/WAD;
    }

    function tokenFromMint(uint256 ethAmount, uint256 tokenSupply, uint256 ethBalance) public pure returns (uint256){
        return ethAmount*WAD/_tokenPrice(tokenSupply, ethBalance);
    }
}
