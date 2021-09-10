===============
Technical notes
===============

Assumptions
===========
- Team address cant mint tokens, only deposit rewards: just for simplicity
- The deployer is set as the 'team address', and this cannot be changed: just for simplicity

Developer Experience
====================
While I'm pretty happy with how the project boilerplate turned out, linting with ``tsserver`` yields lots of errors because it doesn't recognize the matchers injected into chai by waffle or the ethers instance injected into hardhat, among other things.

The ``hardhat-typechain`` plugin says that typechain bindings for contracts are updated automatically but that's not the case.

Front running
=============
I've decided to not implement any front-running mitigation, because the only case where something front-running-like might happen looks like this:

- Alice wants to mint shares (deposit into the pool), but only at the current rate, if tokenPrice goes up then it's not worth it for them anymore
- Between when Alice sees the tokenPrice and their mint transaction is mined, a depositRewards transaction is mined, raising the tokenPrice
- Alice now has less shares than expected

However:

- Alice can immediately burn their shares for a the same amount of ether they sent, or more if more rewards are deposited. There's no downside for Alice outside paying for gas costs
- Only the team address can cause this scenario, and they can actually only lose money (the reward amount) by doing this.

ETH transfers to the contract
=============================
There are a few cases that I could think of of value being transferred to the contract where it could be problematic

- By just sending eth to the contract: I made the fallback function non-payable and added a test for it.
- At construction time: forbidden since the constructor is not payable. Since it's enforced in the ABI I didn't make a test for it.
- By a selfdestructing contract: In this case no code of the ETHPool contract is run, so this isn't really handleable. I went for the easiest option: write some tests to ensure this doesn't break the contract (eg, by causing a division by zero) and consider them as rewards. 
  An alternative which would enforce only the teamAddress being able to deposit rewards is to track the eth sent on the ``depositRewards`` method, use that instead of the contract's balance to compute the token price, and make the difference withdrawable or marked as permanently lost, but I judged that to be unnecessarily complicated.

Reentrancy
==========

TODO
