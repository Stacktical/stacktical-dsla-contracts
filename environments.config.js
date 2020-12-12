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
  chainlink: {
    web3WebsocketProviderUrl: null,
    chainlinkOracleAddress: null,
    chainlinkTokenAddress: null,
    chainlinkJobId: null,
  },
  local: {
    web3WebsocketProviderUrl: "ws://192.168.0.5:7545",
    chainlinkOracleAddress: "0x3742b0B04C16c2CC2a2a0D7A662AA324fEcc731E",
    chainlinkTokenAddress: "0x464d88b68dF1fC6A451f5E66832eabE9f71A4485",
    chainlinkJobId: "0x" + "813fd1b013cf4b1785d32a3bad7d3738",
  },
};

const getNetworkName = (network) => {
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
