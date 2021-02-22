import { AbiItem } from 'web3-utils/types';

export const SLARegistryABI: AbiItem[] = [
  {
    inputs: [
      {
        internalType: 'contract SLORegistry',
        name: '_sloRegistry',
        type: 'address',
      },
      {
        internalType: 'contract PeriodRegistry',
        name: '_periodRegistry',
        type: 'address',
      },
      {
        internalType: 'contract MessengerRegistry',
        name: '_messengerRegistry',
        type: 'address',
      },
      {
        internalType: 'contract StakeRegistry',
        name: '_stakeRegistry',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
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
        indexed: true,
        internalType: 'contract SLA',
        name: 'sla',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'SLACreated',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'SLAs',
    outputs: [{ internalType: 'contract SLA', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'messengerRegistry',
    outputs: [
      { internalType: 'contract MessengerRegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'periodRegistry',
    outputs: [
      { internalType: 'contract PeriodRegistry', name: '', type: 'address' },
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
    inputs: [],
    name: 'sloRegistry',
    outputs: [
      { internalType: 'contract SLORegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'stakeRegistry',
    outputs: [
      { internalType: 'contract StakeRegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
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
      { internalType: 'contract SLO', name: '_SLO', type: 'address' },
      { internalType: 'string', name: '_ipfsHash', type: 'string' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'uint256[]', name: '_periodIds', type: 'uint256[]' },
      { internalType: 'address', name: '_messengerAddress', type: 'address' },
      { internalType: 'bool', name: '_whitelisted', type: 'bool' },
      { internalType: 'bytes32[]', name: '_extraData', type: 'bytes32[]' },
    ],
    name: 'createSLA',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_periodId', type: 'uint256' },
      { internalType: 'contract SLA', name: '_sla', type: 'address' },
    ],
    name: 'requestSLI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_messengerAddress', type: 'address' },
    ],
    name: 'setMessengerSLARegistryAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'userSLAs',
    outputs: [{ internalType: 'contract SLA[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'userSLACount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'allSLAs',
    outputs: [{ internalType: 'contract SLA[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'SLACount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_slaAddress', type: 'address' }],
    name: 'isRegisteredSLA',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];
