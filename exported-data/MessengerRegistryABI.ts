import { AbiItem } from 'web3-utils/types';

export const MessengerRegistryABI: AbiItem[] = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'messengerOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'messengerAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'messengerBaseURL',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'messengerOwnershipURL',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'messengerSpecificationURL',
        type: 'string',
      },
    ],
    name: 'MessengerModified',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'messengerOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'messengerAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'messengerBaseURL',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'messengerOwnershipURL',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'messengerSpecificationURL',
        type: 'string',
      },
    ],
    name: 'MessengerRegistered',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'messengers',
    outputs: [
      { internalType: 'address', name: 'messengerOwner', type: 'address' },
      { internalType: 'address', name: 'messengerAddress', type: 'address' },
      { internalType: 'string', name: 'messengerBaseURL', type: 'string' },
      { internalType: 'string', name: 'messengerOwnershipURL', type: 'string' },
      {
        internalType: 'string',
        name: 'messengerSpecificationURL',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'ownerMessengers',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'registeredMessengers',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'slaRegistry',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'setSLARegistry',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_messengerAddress', type: 'address' },
      { internalType: 'string', name: '_messengerBaseURL', type: 'string' },
      {
        internalType: 'string',
        name: '_messengerOwnershipURL',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_messengerSpecificationURL',
        type: 'string',
      },
    ],
    name: 'registerMessenger',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: '_messengerBaseURL', type: 'string' },
      {
        internalType: 'string',
        name: '_messengerOwnershipURL',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_messengerSpecificationURL',
        type: 'string',
      },
      { internalType: 'uint256', name: 'messengerId', type: 'uint256' },
    ],
    name: 'modifyMessenger',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
