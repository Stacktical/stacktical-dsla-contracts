require('babel-polyfill');
require('babel-register');

require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;
const mnemonic = process.env.DSLA_MNEMONIC;
const test_mnemonic = process.env.TEST_MNEMONIC;
const stagingIP = process.env.STAGING_IP;
const kovan_project_id = process.env.KOVAN_PROJECT_ID;
const kovan_mnemonic = process.env.KOVAN_MNEMONIC;

module.exports = {
  networks: {
    testing: {
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
    staging: {
      provider() {
        return new HDWalletProvider(
          test_mnemonic,
          `http://${stagingIP}:8545`,
          0,
          10,
        );
      },
      network_id: '1336',
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
