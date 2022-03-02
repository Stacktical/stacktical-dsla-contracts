import { formatBytes32String } from 'ethers/lib/utils';

// SEMessenger configuration
export enum SENetworks {
  ONE,
  DOT,
  ATOM,
  BAND,
  eGLD,
  XTZ,
  AVAX,
  ROSE,
}

export const SENetworkNames = Object.keys(SENetworks).filter((key: any) =>
  isNaN(key)
);
export const SENetworkNamesBytes32 = SENetworkNames.map(formatBytes32String);

export enum CONTRACT_NAMES {
  dToken = 'dToken',
  DSLA = 'DSLA',
  DAI = 'DAI',
  USDC = 'USDC',
  USDT = 'USDT',
  ONE = 'ONE',
  ERC20 = 'ERC20',
  Details = 'Details',
  IMessenger = 'IMessenger',
  LinkToken = 'LinkToken',
  MessengerRegistry = 'MessengerRegistry',
  Oracle = 'Oracle',
  PeriodRegistry = 'PeriodRegistry',
  SEMessenger = 'SEMessenger',
  SLA = 'SLA',
  SLORegistry = 'SLORegistry',
  SLARegistry = 'SLARegistry',
  StakeRegistry = 'StakeRegistry',
  Staking = 'Staking',
  StringUtils = 'StringUtils',
  PreCoordinator = 'PreCoordinator',
  EthereumERC20 = 'EthereumERC20',
  HarmonyERC20 = 'HarmonyERC20',
  PolygonERC20 = 'PolygonERC20',
  AvalancheERC20 = 'AvalancheERC20',
}

export enum TOKEN_NAMES {
  DSLA = 'DSLA',
  DAI = 'DAI',
  USDC = 'USDC',
  USDT = 'USDT',
}

export enum DEPLOYMENT_TAGS {
  DSLA = 'dsla',
  SLA_REGISTRY_FIXTURE = 'sla_registry_fixture',
}

export enum USE_CASES {
  STAKING_EFFICIENCY = 'staking-efficiency',
}

export enum NETWORKS {
  DEVELOP = 'develop',
  MUMBAI = 'mumbai',
  HARMONYTESTNET = 'harmonytestnet',
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  HARMONY = 'harmony',
  KOVAN = 'kovan',
  FUJI = 'fuji',
}

export enum PERIOD_TYPE {
  HOURLY,
  DAILY,
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
  YEARLY,
}

export enum PERIOD_STATUS {
  NotVerified,
  Respected,
  NotRespected,
}

export enum SLO_TYPE {
  EqualTo,
  NotEqualTo,
  SmallerThan,
  SmallerOrEqualTo,
  GreaterThan,
  GreaterOrEqualTo,
}
