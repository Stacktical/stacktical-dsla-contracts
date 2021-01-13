require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;
const mnemonic = process.env.DSLA_MNEMONIC;
const test_mnemonic = process.env.TEST_MNEMONIC;
const stagingIP = process.env.STAGING_IP;

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
      gas: 4612388,
    },
    kovan: {
      provider() {
        return new HDWalletProvider(
          mnemonic,
          `https://kovan.infura.io/v3/${infura_project_id}`,
        );
      },
      network_id: '42',
      gas: 12000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  mocha: {
    timeout: 1000000,
  },

  compilers: {
    solc: {
      version: '^0.6.0',
      settings: {
        optimizer: {
          enabled: true,
          runs: 100,
        },
      },
    },
  },
};
