import { AbiItem } from 'web3-utils/types';

export const SLOABI: AbiItem[] = [
  {
    inputs: [
      { internalType: 'uint256', name: '_value', type: 'uint256' },
      { internalType: 'enum SLO.SLOTypes', name: '_SLOType', type: 'uint8' },
      { internalType: 'bytes32', name: '_name', type: 'bytes32' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: '_value',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'enum SLO.SLOTypes',
        name: '_SLOType',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: '_name',
        type: 'bytes32',
      },
    ],
    name: 'SLORegistered',
    type: 'event',
  },
  {
    inputs: [],
    name: 'SLOType',
    outputs: [{ internalType: 'enum SLO.SLOTypes', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'value',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_value', type: 'uint256' }],
    name: 'isSLOHonored',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDetails',
    outputs: [
      { internalType: 'bytes32', name: '_name', type: 'bytes32' },
      { internalType: 'uint256', name: '_value', type: 'uint256' },
      { internalType: 'enum SLO.SLOTypes', name: '_SLOType', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
