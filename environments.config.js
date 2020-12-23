require("dotenv").config();
const { CHAINLINK_TEST_IP, CHAINLINK_TEST_PORT } = process.env;

// Chainlink addresses here: https://docs.chain.link/docs/decentralized-oracles-ethereum-mainnet
const environments = {
  mainnet: {
    web3WebsocketProviderUrl: null,
    chainlinkOracleAddress: null,
    chainlinkTokenAddress: null,
    chainlinkJobId: null,
  },
  kovan: {
    web3WebsocketProviderUrl:
      "wss://kovan.infura.io/ws/v3/" + process.env.DSLA_INFURA_PROJECT_ID,
    chainlinkOracleAddress: "0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e",
    chainlinkTokenAddress: "0xa36085F69e2889c224210F603D836748e7dC0088",
    chainlinkJobId: "0x" + "29fa9aa13bf1468788b7cc4a500a45b8",
  },
  rinkeby: {
    web3WebsocketProviderUrl:
      "wss://rinkeby.infura.io/ws/v3/" + process.env.DSLA_INFURA_PROJECT_ID,
    chainlinkOracleAddress: null,
    chainlinkTokenAddress: null,
    chainlinkJobId: null,
  },
  local: {
    web3WebsocketProviderUrl: "ws://localhost:8545",
    chainlinkOracleAddress: "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B",
    chainlinkTokenAddress: "0xCfEB869F69431e42cdB54A4F4f105C19C080A601",
    chainlinkJobId: "0x" + "38010d84c5124b778de646ddc3e809aa",
  },
};

const getNetworkName = (network) => {
  if (/local/i.test(network)) return "local";
  if (/kovan/i.test(network)) return "kovan";
  if (/rinkeby/i.test(network)) return "rinkeby";
  if (/ropsten/i.test(network)) return "ropsten";
  if (/live/i.test(network)) return "mainnet";
  throw new Error(`Network not recognized: ${network}`);
};

export const getDeploymentEnv = (network) => {
  const networkName = getNetworkName(network);
  return environments[networkName];
};

export const testEnv = environments[process.env.TEST_ENV];
