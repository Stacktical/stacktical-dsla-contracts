import { AbiItem } from 'web3-utils/types';

export const DetailsABI: AbiItem[] = [
  {
    inputs: [{ internalType: 'address', name: '_slaAddress', type: 'address' }],
    name: 'getSLADetails',
    outputs: [
      { internalType: 'address', name: 'slaOwner', type: 'address' },
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
      { internalType: 'contract SLO', name: 'slo', type: 'address' },
      {
        components: [
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'uint256', name: 'sli', type: 'uint256' },
          { internalType: 'enum SLA.Status', name: 'status', type: 'uint8' },
        ],
        internalType: 'struct SLA.PeriodSLI[]',
        name: 'periodSLIs',
        type: 'tuple[]',
      },
      { internalType: 'uint256[]', name: 'periodIDs', type: 'uint256[]' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: 'periodType',
        type: 'uint8',
      },
      { internalType: 'uint256', name: 'stakersCount', type: 'uint256' },
      {
        components: [
          { internalType: 'address', name: 'tokenAddress', type: 'address' },
          { internalType: 'uint256', name: 'totalStake', type: 'uint256' },
          { internalType: 'uint256', name: 'usersPool', type: 'uint256' },
          { internalType: 'uint256', name: 'providerPool', type: 'uint256' },
        ],
        internalType: 'struct Details.TokenStake[]',
        name: 'tokensStake',
        type: 'tuple[]',
      },
      {
        internalType: 'uint256',
        name: 'nextVerifiablePeriod',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];
