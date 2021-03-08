import { AbiItem } from 'web3-utils/types';

export const DetailsABI: AbiItem[] = [
  {
    inputs: [{ internalType: 'address', name: '_slaAddress', type: 'address' }],
    name: 'getSLADetails',
    outputs: [
      { internalType: 'address', name: 'slaOwner', type: 'address' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: 'periodType',
        type: 'uint8',
      },
      { internalType: 'bool', name: 'breachedContract', type: 'bool' },
      { internalType: 'contract SLO', name: 'slo', type: 'address' },
      { internalType: 'uint256', name: 'creationBlockNumber', type: 'uint256' },
      { internalType: 'uint256', name: 'stakersCount', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'nextVerifiablePeriod',
        type: 'uint256',
      },
      { internalType: 'uint256', name: 'slaId', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'cumulatedDevaluation',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'cumulatedDevaluationPrecision',
        type: 'uint256',
      },
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [{ internalType: 'address', name: '_slaAddress', type: 'address' }],
    name: 'getSLADetailsArrays',
    outputs: [
      { internalType: 'string[]', name: 'dpTokensAddresses', type: 'string[]' },
      { internalType: 'string[]', name: 'duTokensAddresses', type: 'string[]' },
      { internalType: 'uint256[]', name: 'periodIDs', type: 'uint256[]' },
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
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];
