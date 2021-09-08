import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ETHPool } from '../typechain'
import { Signer, BigNumber, ContractTransaction } from 'ethers'

describe('ETHPool', function () {
  let ethpool: ETHPool
  let signers: Array<Signer>
  let deployer: Signer
  let aliceAddress: string
  let bobAddress: string
  let deployerAddress: string
  const { AddressZero, WeiPerEther } = ethers.constants
  const { getBalance } = ethers.provider
  let alice: Signer
  let bob: Signer
  beforeEach(async () => {
    const ETHPoolFactory = await ethers.getContractFactory('ETHPool')
    ethpool = (await ETHPoolFactory.deploy()) as ETHPool
    await ethpool.deployed()
    signers = await ethers.getSigners()
    ;[deployer, alice, bob] = signers
    ;[deployerAddress, aliceAddress, bobAddress] = await Promise.all([
      deployer.getAddress(),
      alice.getAddress(),
      bob.getAddress(),
    ])
  })

  it('has name, symbol, decimals and teamAddress', async function () {
    expect(await ethpool.name()).to.equal('ETHPOOL rewards distribution token')
    expect(await ethpool.symbol()).to.equal('POOL')
    expect(await ethpool.decimals()).to.equal(18)
    expect(await ethpool.teamAddress()).to.equal(deployerAddress)
  })

  it('has tokenPrice 1 initially', async function () {
    expect(await ethpool.tokenPrice()).to.equal(WeiPerEther)
  })

  it('only team address can deposit rewards', async function () {
    const bobPool = ethpool.connect(bob)
    await (await bobPool.mint({ value: 100 })).wait()
    await expect(bobPool.depositRewards({ value: 100 })).to.be.revertedWith('only team address can deposit')
  })

  it('rejects plain transfers', async function () {
    // 100 wei, amount doesnt really matter
    await expect(alice.sendTransaction({ to: ethpool.address, value: 100 })).to.be.revertedWith('no fallback')
    await expect(deployer.sendTransaction({ to: ethpool.address, value: 100 })).to.be.revertedWith('no fallback')
  })

  describe('rewards: single mint, single reward', () => {
    it('team address cant mint', async function () {
      await expect(ethpool.mint({ value: 100 })).to.be.revertedWith('team address cant mint')
    })

    it('rewards cant be deposited before a mint', async function () {
      await expect(ethpool.depositRewards({ value: 100 })).to.be.revertedWith('mint first')
    })

    describe('WHEN alice mints 10 tokens AND 1 eth is added as a reward', () => {
      let tx: ContractTransaction
      beforeEach(async () => {
        ethpool = ethpool.connect(alice)
        await (await ethpool.mint({ value: WeiPerEther.mul(10) })).wait()
        ethpool = ethpool.connect(deployer)
        tx = await ethpool.depositRewards({ value: WeiPerEther })
        await tx.wait()
      })
      it('THEN token price is 1.1', async function () {
        expect(await ethpool.tokenPrice()).to.equal(WeiPerEther.mul(11).div(10))
      })
      it('AND a RewardsDeposited event is emmitted', async function () {
        await expect(tx).to.emit(ethpool, 'RewardsDeposited').withArgs(WeiPerEther, WeiPerEther.mul(11).div(10))
      })

      describe('AND WHEN alice burns', () => {
        let aliceEthBalanceBeforeBurn: BigNumber
        beforeEach(async () => {
          aliceEthBalanceBeforeBurn = await getBalance(aliceAddress)
          ethpool = ethpool.connect(alice)
          tx = await ethpool.burn(WeiPerEther.mul(10))
          await tx.wait()
        })
        it('THEN alices token balance is zero', async () => {
          expect(await ethpool.balanceOf(aliceAddress)).to.eq(0)
        })
        it('AND alice received rewards', async () => {
          const balanceDifference = (await getBalance(aliceAddress)).sub(aliceEthBalanceBeforeBurn)
          // assume not more than 0.02 eth spent on gas
          expect(balanceDifference).to.be.gt(WeiPerEther.mul(11).sub(WeiPerEther.mul(2).div(100)))
        })
        it('AND the burn was of only 10 tokens', async () => {
          await expect(tx).to.emit(ethpool, 'Transfer').withArgs(aliceAddress, AddressZero, WeiPerEther.mul(10))
        })
        it('AND a Burn event is emmitted showing the rewards', async () => {
          await expect(tx).to.emit(ethpool, 'Burn').withArgs(aliceAddress, WeiPerEther.mul(10), WeiPerEther.mul(11))
        })
        // This is because there aren't either pool or rewards
        it('AND token price is 1 again', async function () {
          expect(await ethpool.tokenPrice()).to.equal(WeiPerEther)
        })
      })
    })
  })

  describe('rewards: mint after reward deposit', () => {
    describe('GIVEN alice mints 10 tokens with 10 eth AND 1 eth is added as a reward', () => {
      let tx: ContractTransaction
      beforeEach(async () => {
        ethpool = ethpool.connect(alice)
        await (await ethpool.mint({ value: WeiPerEther.mul(10) })).wait()
        ethpool = ethpool.connect(deployer)
        tx = await ethpool.depositRewards({ value: WeiPerEther })
        await tx.wait()
      })
      describe('WHEN alice mints with 11 ETH', () => {
        beforeEach(async () => {
          ethpool = ethpool.connect(alice)
          tx = await ethpool.mint({ value: WeiPerEther.mul(11) })
          await tx.wait()
        })
        it('THEN alices token balance is twenty (tokens are more expensive now)', async () => {
          expect(await ethpool.balanceOf(aliceAddress)).to.eq(WeiPerEther.mul(20))
        })
        it('AND a Mint event is emmitted showing the higher price', async () => {
          await expect(tx).to.emit(ethpool, 'Mint').withArgs(aliceAddress, WeiPerEther.mul(10), WeiPerEther.mul(11))
        })
        // This is because there aren't either pool or rewards
        it('AND token price is 1.1 again', async function () {
          expect(await ethpool.tokenPrice()).to.equal(WeiPerEther.mul(11).div(10))
        })
      })
    })
  })

  describe('minting after a burn moved balance to zero', () => {
    describe('GIVEN alice minted, AND rewards were deposited AND alice burned', () => {
      beforeEach(async () => {
        ethpool = ethpool.connect(alice)
        await (await ethpool.mint({ value: WeiPerEther.mul(10) })).wait()
        ethpool = ethpool.connect(deployer)
        await (await ethpool.depositRewards({ value: WeiPerEther })).wait()
        ethpool = ethpool.connect(alice)
        await (await ethpool.burn(WeiPerEther.mul(10))).wait()
      })
      describe('WHEN bob tries to mint with 10 eth', () => {
        let tx: ContractTransaction
        beforeEach(async () => {
          ethpool = ethpool.connect(bob)
          tx = await ethpool.mint({ value: WeiPerEther.mul(10) })
          await tx.wait()
        })
        it('THEN bobs token balance is increased to 10 tokens', async () => {
          expect(await ethpool.balanceOf(bobAddress)).to.eq(WeiPerEther.mul(10))
        })
      })
    })
  })

  describe('minting', () => {
    describe('WHEN alice mints', () => {
      const value: BigNumber = WeiPerEther.mul(10)
      let aliceEthBalanceBeforeMint: BigNumber
      let tx: ContractTransaction
      beforeEach(async () => {
        aliceEthBalanceBeforeMint = await getBalance(aliceAddress)
        ethpool = ethpool.connect(alice)
        tx = await ethpool.mint({ value })
        await tx.wait()
      })
      it('THEN alices token balance is increased', async () => {
        expect(await ethpool.balanceOf(aliceAddress)).to.eq(value)
      })
      it('AND a Mint event is emmitted', async () => {
        // token price is 1, so token and eth values are the same
        await expect(tx).to.emit(ethpool, 'Mint').withArgs(aliceAddress, value, value)
      })
      it('AND alices eth balance is decreased', async () => {
        expect(await getBalance(aliceAddress)).to.be.lt(aliceEthBalanceBeforeMint.sub(value))
      })
      it('AND token price is 1', async function () {
        expect(await ethpool.tokenPrice()).to.equal(WeiPerEther)
      })
      describe('AND WHEN alice burns', () => {
        const value: BigNumber = WeiPerEther.mul(3)
        let aliceEthBalanceBeforeBurn: BigNumber
        beforeEach(async () => {
          aliceEthBalanceBeforeBurn = await getBalance(aliceAddress)
          tx = await ethpool.burn(value)
          await tx.wait()
        })
        it('THEN alices token balance is decreased', async () => {
          expect(await ethpool.balanceOf(aliceAddress)).to.eq(WeiPerEther.mul(7))
        })
        it('AND a Burn event is emmitted', async () => {
          // token price is 1, so token and eth values are the same
          await expect(tx).to.emit(ethpool, 'Burn').withArgs(aliceAddress, value, value)
        })
        it('AND alices eth balance is increased', async () => {
          expect(await getBalance(aliceAddress)).to.be.lt(aliceEthBalanceBeforeMint)
          expect(await getBalance(aliceAddress)).to.be.gt(aliceEthBalanceBeforeBurn)
        })
      })
    })
  })

  describe('proposed example 2', () => {
    describe('GIVEN alice mints with 100 eth AND 100 in rewards is deposited AND bob mints with  200 eth', () => {
      beforeEach(async () => {
        ethpool = ethpool.connect(alice)
        await (await ethpool.mint({ value: WeiPerEther.mul(100) })).wait()
        ethpool = ethpool.connect(deployer)
        await (await ethpool.depositRewards({ value: WeiPerEther.mul(100) })).wait()
        ethpool = ethpool.connect(bob)
        await (await ethpool.mint({ value: WeiPerEther.mul(200) })).wait()
      })

      describe('WHEN alice and bob burn their tokens', async () => {
        let aliceTx: ContractTransaction
        let bobTx: ContractTransaction
        beforeEach(async () => {
          ethpool = ethpool.connect(alice)
          aliceTx = await ethpool.burn(WeiPerEther.mul(100))
          await aliceTx.wait()
          ethpool = ethpool.connect(bob)
          // tokenPrice should be 2, and bob should then have 100 tokens
          bobTx = await ethpool.burn(WeiPerEther.mul(100))
          await bobTx.wait()
        })
        it('THEN alice receives 100 eth they deposited + 100 eth from the rewards', async () => {
          await expect(aliceTx)
            .to.emit(ethpool, 'Burn')
            .withArgs(aliceAddress, WeiPerEther.mul(100), WeiPerEther.mul(200))
        })
        it('THEN bob receives the 200 eth they deposited', async () => {
          await expect(bobTx).to.emit(ethpool, 'Burn').withArgs(bobAddress, WeiPerEther.mul(100), WeiPerEther.mul(200))
        })
      })
    })
  })

  describe('proposed example 1', () => {
    describe('GIVEN alice mints 100 AND bob mints 300 AND 200 in rewards is deposited', () => {
      beforeEach(async () => {
        ethpool = ethpool.connect(alice)
        await (await ethpool.mint({ value: WeiPerEther.mul(100) })).wait()
        ethpool = ethpool.connect(bob)
        await (await ethpool.mint({ value: WeiPerEther.mul(300) })).wait()
        ethpool = ethpool.connect(deployer)
        await (await ethpool.depositRewards({ value: WeiPerEther.mul(200) })).wait()
      })

      describe('WHEN alice and bob burn their tokens', async () => {
        let aliceTx: ContractTransaction
        let bobTx: ContractTransaction
        beforeEach(async () => {
          ethpool = ethpool.connect(alice)
          aliceTx = await ethpool.burn(WeiPerEther.mul(100))
          await aliceTx.wait()
          ethpool = ethpool.connect(bob)
          bobTx = await ethpool.burn(WeiPerEther.mul(300))
          await bobTx.wait()
        })
        it('THEN alice receives 150 eth', async () => {
          await expect(aliceTx)
            .to.emit(ethpool, 'Burn')
            .withArgs(aliceAddress, WeiPerEther.mul(100), WeiPerEther.mul(150))
        })
        it('THEN bob receives 450 eth', async () => {
          await expect(bobTx).to.emit(ethpool, 'Burn').withArgs(bobAddress, WeiPerEther.mul(300), WeiPerEther.mul(450))
        })
      })
    })
  })

  describe('burning more than the users balance', () => {
    describe('GIVEN alice mints 10 AND bob mints 10', () => {
      const value: BigNumber = WeiPerEther.mul(10)
      beforeEach(async () => {
        ethpool = ethpool.connect(bob)
        await ethpool.mint({ value })
        ethpool = ethpool.connect(alice)
        const tx = await ethpool.mint({ value })
        await tx.wait()
      })
      it('WHEN alice tries to burn 15, THEN it reverts', async () => {
        await expect(ethpool.burn(WeiPerEther.mul(15))).to.be.revertedWith('burn amount exceeds balance')
      })
    })
  })
})
