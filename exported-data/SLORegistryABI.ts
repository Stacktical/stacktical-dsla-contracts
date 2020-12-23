export const SLORegistryABI: Array<object> = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'contract SLO',
        name: 'slo',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'SLOCreated',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_value', type: 'uint256' },
      { internalType: 'enum SLO.SLOTypes', name: '_SLOType', type: 'uint8' },
      { internalType: 'bytes32', name: '_name', type: 'bytes32' },
    ],
    name: 'createSLO',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'userSLOs',
    outputs: [{ internalType: 'contract SLO[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
];
