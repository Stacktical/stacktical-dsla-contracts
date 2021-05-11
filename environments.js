require('dotenv').config();

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;

export const networkNames = {
  DEVELOP: 'develop',
  KOVAN: 'kovan',
  MAINNET: 'mainnet',
  HARMONYTESTNET: 'harmonytestnet',
  MUMBAI: 'mumbai',
  POLYGON: 'polygon',
};

const environments = {
  [networkNames.MAINNET]: {
    web3WebsocketProviderUrl: `wss://mainnet.infura.io/ws/v3/${infura_project_id}`,
    // Paris, New York, Berlin
    preCoordinatorConfiguration: {
      oracles: [
        '0x972614782a893ad3139418Ef00e17fE95896A7c6',
        '0x972614782a893ad3139418Ef00e17fE95896A7c6',
        '0x972614782a893ad3139418Ef00e17fE95896A7c6',
      ],
      jobIds: [
        '0x329f60c5b0bf429597433e617544c71e',
        '0x9f4ff7c86eb94a11b5a45b9b020fc481',
        '0x5a08e037f50d4c73823b34b2e3a03eae',
      ],
      payments: [String(0.1 * 10 ** 18), String(0.1 * 10 ** 18), String(0.1 * 10 ** 18)],
    },
    chainlinkTokenAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
    dslaTokenAddress: '0x3affcca64c2a6f4e3b6bd9c64cd2c969efd1ecbe',
    daiTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    usdcTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    checkPastPeriods: true,
    localChainlinkNode: null,
  },
  [networkNames.POLYGON]: {
    web3WebsocketProviderUrl: process.env.POLYGON_WS_URI,
    // Paris, New York, Berlin
    preCoordinatorConfiguration: {
      oracles: [
        '0x972614782a893ad3139418Ef00e17fE95896A7c6',
        '0x972614782a893ad3139418Ef00e17fE95896A7c6',
        '0x972614782a893ad3139418Ef00e17fE95896A7c6',
      ],
      jobIds: [
        '0x329f60c5b0bf429597433e617544c71e',
        '0x9f4ff7c86eb94a11b5a45b9b020fc481',
        '0x5a08e037f50d4c73823b34b2e3a03eae',
      ],
      payments: [String(0.1 * 10 ** 18), String(0.1 * 10 ** 18), String(0.1 * 10 ** 18)],
    },
    chainlinkTokenAddress: '0xb0897686c545045afc77cf20ec7a532e3120e0f1',
    dslaTokenAddress: '0xa0E390e9ceA0D0e8cd40048ced9fA9EA10D71639',
    daiTokenAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    usdcTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    checkPastPeriods: true,
    localChainlinkNode: null,
  },
  [networkNames.KOVAN]: {
    web3WebsocketProviderUrl: `wss://kovan.infura.io/ws/v3/${infura_project_id}`,
    preCoordinatorConfiguration: {
      oracles: [
        '0x182DCdA18Da4aB8E7eC8dC6B0F7cE517805c3779',
        '0x182DCdA18Da4aB8E7eC8dC6B0F7cE517805c3779',
        '0x182DCdA18Da4aB8E7eC8dC6B0F7cE517805c3779',
      ],
      jobIds: [
        '0x27a07a356eb74913ac1da081846954c4',
        '0xc1b73e42706a464090884bf9928007f3',
        '0xdfaa2ce3b5284634ad8c010fe848870b',
      ],
      payments: [String(0.1 * 10 ** 18), String(0.1 * 10 ** 18), String(0.1 * 10 ** 18)],
    },
    chainlinkTokenAddress: '0xa36085F69e2889c224210F603D836748e7dC0088',
    dslaTokenAddress: null,
    daiTokenAddress: null,
    usdcTokenAddress: null,
    checkPastPeriods: false,
    localChainlinkNode: null,
  },
  [networkNames.MUMBAI]: {
    web3WebsocketProviderUrl: process.env.MUMBAI_WS_URI,
    preCoordinatorConfiguration: null,
    chainlinkTokenAddress: '0xC148f7eAd02656c94d3d2a5faB459d246D1501c0',
    dslaTokenAddress: null,
    daiTokenAddress: null,
    usdcTokenAddress: null,
    checkPastPeriods: false,
    localChainlinkNode: {
      chainlinkOracleAddress: '0xB79f56BEF7d5706eD665F0F32d5A0d4955bF43ad',
    },
  },
  [networkNames.HARMONYTESTNET]: {
    web3WebsocketProviderUrl: 'wss://ws.s0.b.hmny.io',
    preCoordinatorConfiguration: {
      preCoordinatorConfiguration: null,
      payments: [String(0.1 * 10 ** 18), String(0.1 * 10 ** 18), String(0.1 * 10 ** 18)],
    },
    chainlinkTokenAddress: '0x0290FB167208Af455bB137780163b7B7a9a10C16',
    dslaTokenAddress: null,
    daiTokenAddress: null,
    usdcTokenAddress: null,
    checkPastPeriods: false,
    localChainlinkNode: {
      chainlinkOracleAddress: '0x9b1f7F645351AF3631a656421eD2e40f2802E6c0',
    },
  },
  [networkNames.DEVELOP]: {
    web3WebsocketProviderUrl: 'ws://localhost:8545',
    preCoordinatorConfiguration: null,
    chainlinkTokenAddress: '0x7231ECd1355a60251eE56Bf81f987969fc9bAe29',
    dslaTokenAddress: null,
    daiTokenAddress: null,
    usdcTokenAddress: null,
    checkPastPeriods: false,
    localChainlinkNode: {
      chainlinkOracleAddress: '0x3acc15dE35aaB8A94B7D2426E27c887541e4DE6c',
    },
  },
};

export const getEnvFromNetwork = (network) => environments[network];

export const getEnvFromNodeEnv = () => environments[process.env.NODE_ENV];
