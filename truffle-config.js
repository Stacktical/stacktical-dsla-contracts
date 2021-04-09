require('babel-polyfill');
require('babel-register');

require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
const { TruffleProvider } = require('@harmony-js/core');
const { networkNames } = require('./environments');

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;
const mnemonic = process.env.DSLA_MNEMONIC;
const test_mnemonic = process.env.TEST_MNEMONIC;
const kovan_project_id = process.env.KOVAN_PROJECT_ID;
const kovan_mnemonic = process.env.KOVAN_MNEMONIC;
const harmony_testnet_mnemonic = process.env.HARMONY_TESTNET_MNEMONIC;
const harmony_testnet_private_key_1 = process.env.HARMONY_TESTNET_PRIVATE_KEY_1;
const harmony_testnet_private_key_2 = process.env.HARMONY_TESTNET_PRIVATE_KEY_2;

module.exports = {
  networks: {
    [networkNames.DEVELOP]: {
      provider() {
        return new HDWalletProvider(
          test_mnemonic,
          'http://localhost:8545',
          0,
          10,
        );
      },
      network_id: '1337',
      gas: 12000000,
    },
    [networkNames.MAINNET]: {
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
    [networkNames.KOVAN]: {
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
    [networkNames.HARMONYTESTNET]: {
      network_id: '2', // Any network (default: none)
      provider: () => {
        // const truffleProvider = new TruffleProvider(
        //   'https://api.s0.b.hmny.io',
        //   { memonic: harmony_testnet_mnemonic, addressCount: 2 },
        //   { shardID: 0, chainId: 2 },
        //   { gasLimit: 12000000, gasPrice: 1000000000 },
        // );
        const truffleProvider = new TruffleProvider('https://api.s0.b.hmny.io', harmony_testnet_mnemonic);
        const newAcc = truffleProvider.addByPrivateKey(harmony_testnet_private_key_1);
        truffleProvider.addByPrivateKey(harmony_testnet_private_key_2);
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
