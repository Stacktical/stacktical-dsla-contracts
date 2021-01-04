require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;
const mnemonic = process.env.DSLA_MNEMONIC;
const test_mnemonic = process.env.TEST_MNEMONIC;
const chainlink_ip = process.env.CHAINLINK_TEST_IP;
const chainlink_port = process.env.CHAINLINK_TEST_PORT;

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
    },
    local: {
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
    chainlink: {
      provider() {
        return new HDWalletProvider(
          test_mnemonic,
          `http://${chainlink_ip}:${chainlink_port}`,
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
      gas: 4612388,
    },
    rinkeby: {
      provider() {
        return new HDWalletProvider(
          mnemonic,
          `https://rinkeby.infura.io/v3/${infura_project_id}`,
        );
      },
      network_id: '4',
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
