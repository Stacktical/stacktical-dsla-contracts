import { fromAscii } from 'web3-utils';

export const sloTypes = [
  'EqualTo',
  'NotEqualTo',
  'SmallerThan',
  'SmallerOrEqualTo',
  'GreaterThan',
  'GreaterOrEqualTo',
];

export const sloTypesNames = {
  EqualTo: sloTypes[0],
  NotEqualTo: sloTypes[1],
  SmallerThan: sloTypes[2],
  SmallerOrEqualTo: sloTypes[3],
  GreaterThan: sloTypes[4],
  GreaterOrEqualTo: sloTypes[5],
};

// SEMessenger configuration
export const SENetworks = {
  ONE: 'ONE',
  DOT: 'DOT',
  ATOM: 'ATOM',
  BAND: 'BAND',
  eGLD: 'eGLD',
  XTZ: 'XTZ',
  AVAX: 'AVAX',
  ROSE: 'ROSE',
};

export const SENetworkNames = Object.keys(SENetworks);

export const SENetworkNamesBytes32 = SENetworkNames.map(fromAscii);
