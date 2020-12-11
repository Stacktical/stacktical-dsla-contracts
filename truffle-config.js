require("babel-register");
require("babel-polyfill");
require("dotenv").config();
const HDWalletProvider = require("truffle-hdwallet-provider");

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;
const mnemonic = process.env.DSLA_MNEMONIC;
const test_mnemonic = process.env.TEST_MNEMONIC;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    testing: {
      provider: function () {
        return new HDWalletProvider(test_mnemonic, "http://192.168.0.5:7545");
      },
      network_id: "1337",
    },
    mainnet: {
      provider: function () {
        return new HDWalletProvider(
          mnemonic,
          "https://mainnet.infura.io/v3/" + infura_project_id
        );
      },
      network_id: "1",
      gas: 4612388,
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(
          mnemonic,
          "https://rinkeby.infura.io/v3/" + infura_project_id
        );
      },
      network_id: "4",
      gas: 4612388,
    },
    kovan: {
      provider: function () {
        return new HDWalletProvider(
          mnemonic,
          "https://kovan.infura.io/v3/" + infura_project_id
        );
      },
      network_id: "42",
      gas: 12000000,
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          `https://ropsten.infura.io/v3/` + infura_project_id
        ),
      network_id: 3,
      gas: 5500000,
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
      version: "^0.6.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 100,
        },
      },
    },
  },
};
