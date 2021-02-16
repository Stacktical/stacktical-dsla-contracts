import { AbiItem } from 'web3-utils/types';

export const PeriodRegistryABI: AbiItem[] = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'enum PeriodRegistry.PeriodType',
        name: 'periodType',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'periodsAdded',
        type: 'uint256',
      },
      { indexed: false, internalType: 'uint256', name: 'apy', type: 'uint256' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'yearlyPeriods',
        type: 'uint256',
      },
    ],
    name: 'PeriodInitialized',
    type: 'event',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '',
        type: 'uint8',
      },
    ],
    name: 'periodDefinitions',
    outputs: [
      { internalType: 'uint256', name: 'yearlyPeriods', type: 'uint256' },
      { internalType: 'bool', name: 'initialized', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'uint256[]', name: '_periodStarts', type: 'uint256[]' },
      { internalType: 'uint256[]', name: '_periodEnds', type: 'uint256[]' },
      { internalType: 'uint256', name: '_yearlyPeriods', type: 'uint256' },
    ],
    name: 'initializePeriod',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'uint256[]', name: '_periodStarts', type: 'uint256[]' },
      { internalType: 'uint256[]', name: '_periodEnds', type: 'uint256[]' },
    ],
    name: 'addPeriodsToPeriodType',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'uint256', name: '_periodId', type: 'uint256' },
    ],
    name: 'getPeriodStartAndEnd',
    outputs: [
      { internalType: 'uint256', name: 'start', type: 'uint256' },
      { internalType: 'uint256', name: 'end', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'uint256', name: '_periodId', type: 'uint256' },
    ],
    name: 'isValidPeriod',
    outputs: [{ internalType: 'bool', name: 'valid', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'uint256', name: '_periodId', type: 'uint256' },
    ],
    name: 'periodIsFinished',
    outputs: [{ internalType: 'bool', name: 'finished', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];
