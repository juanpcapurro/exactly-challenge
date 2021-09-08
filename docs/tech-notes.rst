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

Reentrancy
==========

TODO
