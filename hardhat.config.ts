import 'hardhat-deploy'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import * as dotenv from 'dotenv'
dotenv.config()

const assert = require('assert')

const infuraKey = process.env.INFURA_KEY
let mnemonic = process.env.MNEMONIC
let etherscanKey = process.env.ETHERSCANKEY
assert(infuraKey && mnemonic && etherscanKey, 'configure your .env correctly')
const accounts = { mnemonic }

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    kovan: {
      accounts,
      url: `https://kovan.infura.io/v3/${infuraKey}`,
    },
    ganache: {
      accounts,
      url: 'http://127.0.0.1:8545',
    },
  },
  etherscan: {
    apiKey: etherscanKey,
  },
  solidity: {
    version: '0.8.0',
    settings: {
      optimizer: {
        enabled: true,
        runs: 20000,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  namedAccounts: {
    deployer: 0,
  },
}
