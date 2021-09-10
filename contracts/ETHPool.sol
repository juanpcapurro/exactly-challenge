//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title ETHPool, a rewards distribution contract
/// @notice this is part of a tech challenge by Exactly Finance
/// @author Capu
contract ETHPool is ERC20, ReentrancyGuard {
    /// @notice the address that can deposit rewards
    address public immutable teamAddress;
    uint256 private constant WAD=10**18;

    /// @param amount The rewards amount
    /// @param newPrice The tokenPrice after the rewards are deposited
    event RewardsDeposited(uint256 amount, uint256 newPrice);

    /// @param user who the tokens are issued to
    /// @param tokenAmount how many tokens are issued
    /// @param ethAmount how much eth is deposited into the pool
    /// @dev Just the Transfer event is not enough, since that doesnt track how much eth was used to mint
    event Mint(address user, uint256 tokenAmount, uint256 ethAmount);

    /// @param user who the tokens are burned from
    /// @param tokenAmount how many tokens are burned
    /// @param ethAmount how much eth is returned to the user
    /// @dev Just the Transfer event is not enough, since that doesnt track how much eth was returned
    event Burn(address user, uint256 tokenAmount, uint256 ethAmount);

    /// @notice Constructor, initializes name and symbols to hard-coded values
    /// @dev The teamAddress is set to the deployer address
    /// @dev Uses the default of 18 decimals
    constructor() ERC20("ETHPOOL rewards distribution token", "POOL") {
        teamAddress = msg.sender;
    }

    /// @notice Deposit ETH into the pool, minting an ERC20 token representing shares of the pool
    /// @notice  msg.value will be the amount of eth to deposit. The amount of tokens issued can be lower
    /// @dev This doesnt change the tokenPrice
    function mint() public payable {
        require(msg.sender != teamAddress, "team address cant mint");
        uint256 tokenAmount = tokenFromMint(msg.value, totalSupply(), address(this).balance - msg.value);
        emit Mint(msg.sender, tokenAmount, msg.value);
        _mint(msg.sender, tokenAmount);
    }

    /// @notice Deposit ETH into the pool, without minting tokens, so it makes the tokens already owned by users more valuable in ETH
    /// @notice msg.value will be the amount of eth to deposit. The amount of tokens issued can be lower
    /// @dev This DOES change the tokenPrice
    function depositRewards() public payable {
        require(totalSupply() > 0, "mint first");
        require(msg.sender == teamAddress, "only team address can deposit");
        emit RewardsDeposited(msg.value, _tokenPrice(totalSupply(), address(this).balance));
    }

    /// @notice Burn your POOL tokens, and get your ETH back plus any rewards
    /// @param amount the amount of tokens to burn
    /// @dev This doesnt change the tokenPrice, except in the case of a burn getting the totalSupply to zero, where the price would go back to 1
    function burn(uint256 amount) public nonReentrant {
        // TODO: okay now I should get serious about reentrancy
        uint256 ethToReturn = ethFromBurn(amount, totalSupply(), address(this).balance);
        emit Burn(msg.sender, amount, ethToReturn);
        _burn(msg.sender, amount);
        // TODO: should I add a reentrancy guard or is doing it in the end enough?
        payable(msg.sender).transfer(ethToReturn);
    }

    /// @notice Current token price, that is, how much a token costs in terms of eth
    /// @dev This is only called from outside the contract
    /// @return The token price with 18 decimals precision
    function tokenPrice() public view returns (uint256){
        return totalSupply() == 0 ? WAD : address(this).balance * WAD / totalSupply();
    }

    /// @notice Token price, that is, how much a token costs in terms of eth, determined by the passed parameters
    /// @dev This is only called from inside the contract, and is necessary to calculate the token price without considering this call's value transfer or changes in supply
    /// @param tokenSupply the token total supply that the price will be computed with
    /// @param ethBalance the contract's eth balance that the price will be computed with
    /// @return The token price with 18 decimals precision
    function _tokenPrice(uint256 tokenSupply, uint256 ethBalance) private pure returns (uint256){
        return tokenSupply == 0 ? WAD : ethBalance * WAD / tokenSupply;
    }

    /// @param tokenSupply the token total supply that the price will be computed with
    /// @param ethBalance the contract's eth balance that the price will be computed with
    /// @return raw ETH amount returned by burning tokens (without any 'precision')
    function ethFromBurn(uint256 amount, uint256 tokenSupply, uint256 ethBalance) public pure returns (uint256){
        return amount*_tokenPrice(tokenSupply, ethBalance)/WAD;
    }

    /// @param tokenSupply the token total supply that the price will be computed with
    /// @param ethBalance the contract's eth balance that the price will be computed with
    /// @return raw token amount returned by depositing ETH (without any 'precision')
    function tokenFromMint(uint256 ethAmount, uint256 tokenSupply, uint256 ethBalance) public pure returns (uint256){
        return ethAmount*WAD/_tokenPrice(tokenSupply, ethBalance);
    }
}
