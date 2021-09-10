//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

contract Selfdesctructable {
    function depositEth() public payable {
    }

    function selfdestructTo(address payable beneficiary) public {
      selfdestruct(beneficiary);
    }
}
