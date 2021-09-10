//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../ETHPool.sol";

contract ReentrantCaller {
    ETHPool public pool;
    uint256 public amount;
    uint256 public callCount;
    constructor(ETHPool _pool, uint256 _amount) {
        pool = _pool;
        amount = _amount;
        callCount = 0;
    }
    function mint() public payable {
        pool.mint{value: msg.value}();
    }

    function reentrantBurn() public {
        pool.burn(amount);
    }
    
    receive() external payable {
        callCount++;
        if (callCount < 2){
            pool.burn(amount);
        }
    }
}
