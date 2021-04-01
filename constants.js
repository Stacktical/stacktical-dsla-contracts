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

// validators values not used for production, only networkNames
export const networks = {
  ONE: { validators: ['P-OPS', 'Chainode', 'Everstake'] },
  DOT: { validators: ['Everstake', 'Figment', 'stakefish'] },
  ATOM: { validators: ['Everstake', 'Figment', 'stakefish'] },
  BAND: { validators: ['Chainode'] },
  eGLD: { },
  XTZ: { },
  AVAX: { },
  ROSE: { },
};

export const networkNames = Object.keys(networks);

export const networkNamesBytes32 = networkNames.map(fromAscii);
