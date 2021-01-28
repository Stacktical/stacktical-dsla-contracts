import { toWei } from 'web3-utils';
import { generatePeriods } from './index';

const slaConstructor = {
  _SLONames: [
    '0x7374616b696e675f656666696369656e63790000000000000000000000000000',
  ],
  _SLOs: ['0x7f0A3d2BC5DcCE0936153eF5C592D5d5fF3c4551'],
  _stake: toWei('0'),
  _ipfsHash: 'QmWngSpudqbLSPxd5VhN5maSKRmjZvTjapfFYig5qqkwTS',
  _sla_period_starts: generatePeriods(10)[0],
  _sla_period_ends: generatePeriods(10)[1],
};

export default slaConstructor;
