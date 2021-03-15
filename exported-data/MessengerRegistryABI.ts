import { AbiItem } from 'web3-utils/types';

export const MessengerRegistryABI: AbiItem[] = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'messenger',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'MessengerRegistered',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'messengerOwners',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'messengers',
    outputs: [
      { internalType: 'string', name: 'messengerBaseURL', type: 'string' },
      { internalType: 'string', name: 'messengerOwnershipURL', type: 'string' },
      {
        internalType: 'string',
        name: 'messengerSpecificationURL',
        type: 'string',
      },
      { internalType: 'address', name: 'messengerOwner', type: 'address' },
      { internalType: 'address', name: 'messengerAddress', type: 'address' },
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
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
      { internalType: 'address', name: '_ownerAddress', type: 'address' },
    ],
    name: 'registerMessenger',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_messengerAddress', type: 'address' },
    ],
    name: 'isRegisteredMessenger',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];
