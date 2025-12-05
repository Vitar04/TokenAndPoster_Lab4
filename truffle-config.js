require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const { MNEMONIC, RPC_URL, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", port: 8545, network_id: "*"
    },
    sepolia: {
      provider: () => new HDWalletProvider({
        mnemonic: { phrase: MNEMONIC },
        providerOrUrl: RPC_URL
      }),
      network_id: 11155111,
      chainId: 11155111,
      confirmations: 2,
      timeoutBlocks: 500,
      networkCheckTimeout: 300000,
      skipDryRun: true
    }
  },

  // Компилятор — важен для верификации: версия и optimizer должны совпадать
  compilers: {
    solc: {
      version: "0.8.20",   
      settings: {
        optimizer: { enabled: true, runs: 200 }
      }
    }
  },

  plugins: ['truffle-plugin-verify'],

  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  }
};
