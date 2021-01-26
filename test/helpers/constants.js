import { generatePeriods } from './index';

const { toWei, fromAscii } = web3.utils;

export const slaConstructor = {
  _SLONames: [
    '0x7374616b696e675f656666696369656e63790000000000000000000000000000',
  ],
  _SLOs: ['0x7f0A3d2BC5DcCE0936153eF5C592D5d5fF3c4551'],
  _stake: toWei('0'),
  _ipfsHash: 'QmWngSpudqbLSPxd5VhN5maSKRmjZvTjapfFYig5qqkwTS',
  _sla_period_starts: generatePeriods(10)[0],
  _sla_period_ends: generatePeriods(10)[1],
};

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

export const networkNamesBytes32 = [
  'ONE',
  'DOT',
  'ATOM',
  'BAND',
].map(fromAscii);
