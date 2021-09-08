const func = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  const ethpool = await deploy('ETHPool', { from: deployer })
  console.log(`ETHPool deployed to: ${ethpool.address} by ${deployer}`)
}

module.exports = func
module.exports.tags = ['ETHPool']
