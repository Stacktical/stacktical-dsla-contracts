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
      { internalType: 'bool', name: '_checkPastPeriod', type: 'bool' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'sla', type: 'address' },
      {
        indexed: true,
        internalType: 'address',
        name: 'caller',
        type: 'address',
      },
    ],
    name: 'ReturnLockedValue',
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'periodId',
        type: 'uint256',
      },
      { indexed: true, internalType: 'address', name: 'sla', type: 'address' },
      {
        indexed: true,
        internalType: 'address',
        name: 'caller',
        type: 'address',
      },
    ],
    name: 'SLIRequested',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'SLAs',
    outputs: [{ internalType: 'contract SLA', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'checkPastPeriod',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'messengerRegistry',
    outputs: [
      { internalType: 'contract MessengerRegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'periodRegistry',
    outputs: [
      { internalType: 'contract PeriodRegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'sloRegistry',
    outputs: [
      { internalType: 'contract SLORegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'stakeRegistry',
    outputs: [
      { internalType: 'contract StakeRegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_sloValue', type: 'uint256' },
      {
        internalType: 'enum SLORegistry.SLOType',
        name: '_sloType',
        type: 'uint8',
      },
      { internalType: 'bool', name: '_whitelisted', type: 'bool' },
      { internalType: 'address', name: '_messengerAddress', type: 'address' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'uint128', name: '_initialPeriodId', type: 'uint128' },
      { internalType: 'uint128', name: '_finalPeriodId', type: 'uint128' },
      { internalType: 'string', name: '_ipfsHash', type: 'string' },
      { internalType: 'bytes32[]', name: '_extraData', type: 'bytes32[]' },
      { internalType: 'uint64', name: '_leverage', type: 'uint64' },
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
      { internalType: 'bool', name: '_ownerApproval', type: 'bool' },
    ],
    name: 'requestSLI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'contract SLA', name: '_sla', type: 'address' }],
    name: 'returnLockedValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_messengerAddress', type: 'address' },
      { internalType: 'string', name: '_specificationUrl', type: 'string' },
    ],
    name: 'registerMessenger',
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
    constant: true,
  },
  {
    inputs: [],
    name: 'allSLAs',
    outputs: [{ internalType: 'contract SLA[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [{ internalType: 'address', name: '_slaAddress', type: 'address' }],
    name: 'isRegisteredSLA',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];
