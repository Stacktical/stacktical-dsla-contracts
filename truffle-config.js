require('babel-polyfill');
require('babel-register');

require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
const { TruffleProvider } = require('@harmony-js/core');

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;
const mnemonic = process.env.DSLA_MNEMONIC;
const test_mnemonic = process.env.TEST_MNEMONIC;
const kovan_project_id = process.env.KOVAN_PROJECT_ID;
const kovan_mnemonic = process.env.KOVAN_MNEMONIC;
const harmony_testnet_mnemonic = process.env.HARMONY_TESTNET_MNEMONIC;
const harmony_testnet_private_key = process.env.HARMONY_TESTNET_PRIVATE_KEY;

module.exports = {
  networks: {
    develop: {
      provider() {
        return new HDWalletProvider(
          test_mnemonic,
          'http://localhost:8545',
          0,
          10,
        );
      },
      network_id: '1337',
    },
    mainnet: {
      provider() {
        return new HDWalletProvider(
          mnemonic,
          `https://mainnet.infura.io/v3/${infura_project_id}`,
        );
      },
      network_id: '1',
      networkCheckTimeout: '99999',
      gas: 12000000,
      gasPrice: 250000000000,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    kovan: {
      provider() {
        return new HDWalletProvider(
          kovan_mnemonic,
          `https://kovan.infura.io/v3/${kovan_project_id}`,
          0,
          10,
        );
      },
      network_id: '42',
      networkCheckTimeout: '99999',
      gas: 12000000,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    harmonytestnet: {
      network_id: '2', // Any network (default: none)
      provider: () => {
        const truffleProvider = new TruffleProvider(
          'https://api.s0.b.hmny.io',
          { memonic: harmony_testnet_mnemonic },
          { shardID: 0, chainId: 2 },
          { gasLimit: 12000000, gasPrice: 1000000000 },
        );
        const newAcc = truffleProvider.addByPrivateKey(harmony_testnet_private_key);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
      skipDryRun: true,
    },
  },

  mocha: {
    timeout: 1000000,
  },

  compilers: {
    solc: {
      version: '0.6.6',
      settings: {
        optimizer: {
          enabled: true,
          runs: 100,
        },
      },
    },
  },
};
