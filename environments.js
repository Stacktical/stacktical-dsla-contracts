require('dotenv').config();

const infura_project_id = process.env.DSLA_INFURA_PROJECT_ID;

const environments = {
  mainnet: {
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
      payments: [
        String(0.1 * 10 ** 18),
        String(0.1 * 10 ** 18),
        String(0.1 * 10 ** 18),
      ],
    },
    chainlinkTokenAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
    dslaTokenAddress: '0x3affcca64c2a6f4e3b6bd9c64cd2c969efd1ecbe',
    daiTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    usdcTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    checkPastPeriods: true,
  },
  kovan: {
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
      payments: [
        String(0.1 * 10 ** 18),
        String(0.1 * 10 ** 18),
        String(0.1 * 10 ** 18),
      ],
    },
    chainlinkTokenAddress: '0xa36085F69e2889c224210F603D836748e7dC0088',
    checkPastPeriods: false,
  },
  develop: {
    web3WebsocketProviderUrl: 'ws://localhost:8545',
    preCoordinatorConfiguration: {
      oracles: 'obtained on deployment time',
      jobIds: 'obtained on deployment time',
      payments: 'obtained on deployment time',
    },
    chainlinkOracleAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    chainlinkTokenAddress: '0xCfEB869F69431e42cdB54A4F4f105C19C080A601',
    chainlinkNodeUrl: 'http://localhost:6688',
    checkPastPeriods: false,
  },
};

const getNetworkName = (network) => {
  if (/testing/i.test(network)) return 'develop';
  if (/develop/i.test(network)) return 'develop';
  if (/staging/i.test(network)) return 'staging';
  if (/kovan/i.test(network)) return 'kovan';
  if (/mainnet/i.test(network)) return 'mainnet';
  throw new Error(`Network not recognized: ${network}`);
};

export const getEnvFromNetwork = (network) => environments[getNetworkName(network)];

export const envParameters = environments[process.env.NODE_ENV];

export const needsGetJobId = ['develop', 'staging'].includes(
  process.env.NODE_ENV,
);
