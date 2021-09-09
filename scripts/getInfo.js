const hre = require('hardhat')
const assert = require('assert')

async function main({ deployments, ethers }) {
  const { get } = deployments
  const { provider, getContractAt } = ethers
  const ethpoolDeployment = await get('ETHPool')
  assert(ethpoolDeployment, 'contract not deployed!')
  const ethpool = await getContractAt('ETHPool', ethpoolDeployment.address)
  const etherBalance = await provider.getBalance(ethpoolDeployment.address)
  const totalSupply = await ethpool.totalSupply()
  const tokenPrice = await ethpool.tokenPrice()
  console.log(`ETHPool deployed to: ${ethpoolDeployment.address}`)
  console.log(`ETHPool token total supply: ${wadToStringUnsafe(totalSupply)}`)
  console.log(`ETHPool token price: ${wadToStringUnsafe(tokenPrice)}`)
  console.log(`ETHPool contract eth balance: ${wadToStringUnsafe(etherBalance)}`)
}
main(hre)

// no-one is gonna get hurt here, this is only for display purposes
// the proper way to do it would be to use a BN library with support for rational numbers
function wadToStringUnsafe(bn) {
  return `${Number(bn.toString()) / 10 ** 18} (${bn.toString()})`
}
