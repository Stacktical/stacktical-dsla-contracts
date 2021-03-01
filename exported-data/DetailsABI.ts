import { AbiItem } from 'web3-utils/types';

export const DetailsABI: AbiItem[] = [
  {
    inputs: [{ internalType: 'address', name: '_slaAddress', type: 'address' }],
    name: 'getSLADetails',
    outputs: [
      { internalType: 'address', name: '_slaOwner', type: 'address' },
      { internalType: 'string', name: '_ipfsHash', type: 'string' },
      { internalType: 'contract SLO', name: '_SLO', type: 'address' },
      {
        components: [
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'uint256', name: 'sli', type: 'uint256' },
          { internalType: 'enum SLA.Status', name: 'status', type: 'uint8' },
        ],
        internalType: 'struct SLA.SLAPeriod[]',
        name: '_SLAPeriods',
        type: 'tuple[]',
      },
      { internalType: 'uint256', name: '_stakersCount', type: 'uint256' },
      {
        components: [
          { internalType: 'address', name: 'tokenAddress', type: 'address' },
          { internalType: 'uint256', name: 'totalStake', type: 'uint256' },
          { internalType: 'uint256', name: 'usersPool', type: 'uint256' },
          { internalType: 'uint256', name: 'providerPool', type: 'uint256' },
        ],
        internalType: 'struct Details.TokenStake[]',
        name: '_tokensStake',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];
