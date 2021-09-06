import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ETHPool } from '../typechain'

describe('ETHPool', function () {
  let ethpool: ETHPool
  before(async () => {
    const ETHPoolFactory = await ethers.getContractFactory('ETHPool')
    ethpool = (await ETHPoolFactory.deploy()) as ETHPool
    await ethpool.deployed()
  })

  it('has name, symbol and decimals', async function () {
    expect(await ethpool.name()).to.equal('ETHPOOL rewards distribution token')
    expect(await ethpool.symbol()).to.equal('POOL')
    expect(await ethpool.decimals()).to.equal(18)
  })

  it('rejects plain transfers', async function () {
    const signer = (await ethers.getSigners())[0]
    // 100 wei, amount doesnt really matter
    await expect(signer.sendTransaction({ to: ethpool.address, value: 100 })).to.be.revertedWith('no fallback')
  })
})
