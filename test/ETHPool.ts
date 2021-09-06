import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ETHPool } from '../typechain'
import { Signer, BigNumber } from 'ethers'

describe('ETHPool', function () {
  let ethpool: ETHPool
  let signers: Array<Signer>
  let deployer: Signer
  const provider = ethers.provider
  let alice: Signer
  beforeEach(async () => {
    const ETHPoolFactory = await ethers.getContractFactory('ETHPool')
    ethpool = (await ETHPoolFactory.deploy()) as ETHPool
    await ethpool.deployed()
    signers = await ethers.getSigners()
    ;[deployer, alice] = signers
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
      const value: BigNumber = BigNumber.from(10).mul(ethers.constants.WeiPerEther)
      let previousAliceBalance: BigNumber
      beforeEach(async () => {
        previousAliceBalance = await provider.getBalance(await alice.getAddress())
        ethpool = ethpool.connect(alice)
        const tx = await ethpool.mint({ value })
        await tx.wait()
      })
      it('THEN alices token balance is increased', async () => {
        expect(await ethpool.balanceOf(await alice.getAddress())).to.eq(value)
      })
      it('AND alices eth balance is decreased', async () => {
        expect(await provider.getBalance(await alice.getAddress())).to.be.lt(previousAliceBalance.sub(value))
      })
    })
  })
})
