## TODO
- [x] project boilerplate
    - [x] ts lint
    - [x] solidity lint
    - [x] mock contract
    - [x] mock test
    - [x] hardhat.config.js
    - [x] package.json
    - [x] secrets
- [x] send estimation
- [x] base implementation
    - [x] contract receives eth and mints an erc20
    - [x] user asks for a burn and
        - [x] their erc20 is burned
        - [x] a share of the eth is returned
    - [x] contract receives eth from Team Address and doesn't mint erc20
        - [x] user receives their share of the rewards
- [ ] figure out if ^ is good enough
- [ ] tests:
    - [x] Example 1
    - [x] Example 2
    - [x] Edge case: reward without previous mint
    - [x] Edge case: first mint
    - [x] Edge case: burns get the totalsupply down to zero
- [ ] configure testnet deploy
- [ ] configure hardhat task to
    - [ ] send rewards?
    - [ ] get eth balance and other stats
- [ ] configure etherscan verification
- [ ] check that I actually included natspec and research a cool presentation for it
- [ ] QWIMGWSOTMBIAVTTATITOWTK: Questions Where I Might Get Wildly Sidetracked Or They Might Be Interesting And Valuable, Trying To Answer Them Is The Only Way To Know
    - [ ] Am I introducing some constraint that would make some sort of upgradeability pattern difficult?
    - [ ] Am I opening some vulnerability when transferring eth in a burn, especially if the caller is a contract and not an EOA?
    - [ ] would front-running be an issue? research passing a min amount of expected erc20/eth

## Assumptions
- Team address cant mint tokens, only deposit rewards: just for simplicity
- The deployer is set as the 'team address', and this cannot be changed: just for simplicity

## Technical notes
While I'm pretty happy with how the project boilerplate turned out, linting with `tsserver` yields lots of errors because it doesn't recognize the matchers injected into chai by waffle or the ethers instance injected into hardhat, among other things.

The `hardhat-typechain` plugin says that typechain bindings for contracts are updated automatically but that's not the case.

## Docs
Shares of the ETH pool are represented by an ERC20 token. Initially, they map
1:1 to eth, but once rewards are deposited, they'll start to map to more than 1
eth per 1 share (POOL token)

### setup

- have node v12 installed
- copy `.env.example` to `.env` and fill out the fields defined within it
- run `npm install`
- generate the typechain bindings with `npm run typechain`, you'll have to re-run this if you modify the contracts' API
- you can now run the tests witn `npm run test`. It's also configured as a git pre-push hook as a poor man's CI
- you can now lint the codebase with the tests witn `npm run lint:ts` / `npm run lint:sol`. It's also configured as a git pre-commit hook as a poor man's CI

## Original spec:

### 1) Setup a project and create a contract

#### Summary

ETHPool provides a service where people can deposit ETH and they will receive weekly rewards. Users must be able to take out their deposits along with their portion of rewards at any time. New rewards are deposited manually into the pool by the ETHPool team each week using a contract function.

#### Requirements

- Only the team can deposit rewards.
- Deposited rewards go to the pool of users, not to individual users.
- Users should be able to withdraw their deposits along with their share of rewards considering the time when they deposited.

Example:

> Let say we have user **A** and **B** and team **T**.
>
> **A** deposits 100, and **B** deposits 300 for a total of 400 in the pool. Now **A** has 25% of the pool and **B** has 75%. When **T** deposits 200 rewards, **A** should be able to withdraw 150 and **B** 450.
>
> What if the following happens? **A** deposits then **T** deposits then **B** deposits then **A** withdraws and finally **B** withdraws.
> **A** should get their deposit + all the rewards.
> **B** should only get their deposit because rewards were sent to the pool before they participated.

#### Goal

Design and code a contract for ETHPool, take all the assumptions you need to move forward.

You can use any development tools you prefer: Hardhat, Truffle, Brownie, Solidity, Vyper.

Useful resources:

- Solidity Docs: https://docs.soliditylang.org/en/v0.8.4
- Educational Resource: https://github.com/austintgriffith/scaffold-eth
- Project Starter: https://github.com/abarmat/solidity-starter

### 2) Deploy your contract

Deploy the contract to any Ethereum testnet of your preference. Keep record of the deployed address.

Bonus:

- Verify the contract in Etherscan

### 3) Interact with the contract

Create a script (or a Hardhat task) to query the total amount of ETH held in the contract.

_You can use any library you prefer: Ethers.js, Web3.js, Web3.py, eth-brownie_
