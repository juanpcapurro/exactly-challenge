import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ETHPool } from '../typechain'
import { Signer, BigNumber } from 'ethers'

describe('ETHPool', function () {
  let ethpool: ETHPool
  let signers: Array<Signer>
  let deployer: Signer
  let aliceAddress: string
  const { getBalance } = ethers.provider
  let alice: Signer
  let bob: Signer
  beforeEach(async () => {
    const ETHPoolFactory = await ethers.getContractFactory('ETHPool')
    ethpool = (await ETHPoolFactory.deploy()) as ETHPool
    await ethpool.deployed()
    signers = await ethers.getSigners()
    ;[deployer, alice, bob] = signers
    aliceAddress = await alice.getAddress()
  })

  it('has name, symbol and decimals', async function () {
    expect(await ethpool.name()).to.equal('ETHPOOL rewards distribution token')
    expect(await ethpool.symbol()).to.equal('POOL')
    expect(await ethpool.decimals()).to.equal(18)
  })

  it('rejects plain transfers', async function () {
    // 100 wei, amount doesnt really matter
    await expect(alice.sendTransaction({ to: ethpool.address, value: 100 })).to.be.revertedWith('no fallback')
    await expect(deployer.sendTransaction({ to: ethpool.address, value: 100 })).to.be.revertedWith('no fallback')
  })
  describe('minting', () => {
    describe('WHEN alice mints', () => {
      const value: BigNumber = ethers.constants.WeiPerEther.mul(10)
      let aliceEthBalanceBeforeMint: BigNumber
      beforeEach(async () => {
        aliceEthBalanceBeforeMint = await getBalance(aliceAddress)
        ethpool = ethpool.connect(alice)
        const tx = await ethpool.mint({ value })
        await tx.wait()
      })
      it('THEN alices token balance is increased', async () => {
        expect(await ethpool.balanceOf(aliceAddress)).to.eq(value)
      })
      it('AND alices eth balance is decreased', async () => {
        expect(await getBalance(aliceAddress)).to.be.lt(aliceEthBalanceBeforeMint.sub(value))
      })
      describe('AND WHEN alice burns', () => {
        const value: BigNumber = ethers.constants.WeiPerEther.mul(3)
        let aliceEthBalanceBeforeBurn: BigNumber
        beforeEach(async () => {
          aliceEthBalanceBeforeBurn = await getBalance(aliceAddress)
          const tx = await ethpool.burn(value)
          await tx.wait()
        })
        it('THEN alices token balance is decreased', async () => {
          expect(await ethpool.balanceOf(aliceAddress)).to.eq(ethers.constants.WeiPerEther.mul(7))
        })
        it('AND alices eth balance is increased', async () => {
          expect(await getBalance(aliceAddress)).to.be.lt(aliceEthBalanceBeforeMint)
          expect(await getBalance(aliceAddress)).to.be.gt(aliceEthBalanceBeforeBurn)
        })
      })
    })
  })

  describe('burning more than the users balance', () => {
    describe('GIVEN alice mints 10 AND bob mints 10', () => {
      const value: BigNumber = ethers.constants.WeiPerEther.mul(10)
      beforeEach(async () => {
        ethpool = ethpool.connect(bob)
        await ethpool.mint({ value })
        ethpool = ethpool.connect(alice)
        const tx = await ethpool.mint({ value })
        await tx.wait()
      })
      it('WHEN alice tries to burn 15, THEN it reverts', async () => {
        await expect(ethpool.burn(ethers.constants.WeiPerEther.mul(15))).to.be.revertedWith(
          'burn amount exceeds balance'
        )
      })
    })
  })
})
