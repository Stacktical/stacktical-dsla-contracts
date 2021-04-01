import { AbiItem } from 'web3-utils/types';

export const NetworkAnalyticsABI: AbiItem[] = [
  {
    inputs: [
      { internalType: 'address', name: '_chainlinkOracle', type: 'address' },
      { internalType: 'address', name: '_chainlinkToken', type: 'address' },
      { internalType: 'bytes32', name: '_jobId', type: 'bytes32' },
      {
        internalType: 'contract PeriodRegistry',
        name: '_periodRegistry',
        type: 'address',
      },
      {
        internalType: 'contract StakeRegistry',
        name: '_stakeRegistry',
        type: 'address',
      },
      { internalType: 'uint256', name: '_feeMultiplier', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'networkName',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'enum PeriodRegistry.PeriodType',
        name: 'periodType',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'periodId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
    ],
    name: 'AnalyticsReceived',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newValue',
        type: 'uint256',
      },
    ],
    name: 'CallerRewardModified',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'id', type: 'bytes32' },
    ],
    name: 'ChainlinkCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'id', type: 'bytes32' },
    ],
    name: 'ChainlinkFulfilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'id', type: 'bytes32' },
    ],
    name: 'ChainlinkRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'jobId',
        type: 'bytes32',
      },
      { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
    ],
    name: 'JobIdModified',
    type: 'event',
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
    inputs: [],
    name: 'fee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'networkNames',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '',
        type: 'uint8',
      },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'periodAnalytics',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '',
        type: 'uint8',
      },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'periodAnalyticsRequested',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'requestIdToAnalyticsRequest',
    outputs: [
      { internalType: 'bytes32', name: 'networkName', type: 'bytes32' },
      { internalType: 'uint256', name: 'periodId', type: 'uint256' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: 'periodType',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'requests',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
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
      { internalType: 'bytes32', name: '_networkName', type: 'bytes32' },
    ],
    name: 'isValidNetwork',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_networkName', type: 'bytes32' },
    ],
    name: 'addNetwork',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32[]', name: '_networkNames', type: 'bytes32[]' },
    ],
    name: 'addMultipleNetworks',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_periodId', type: 'uint256' },
      {
        internalType: 'enum PeriodRegistry.PeriodType',
        name: '_periodType',
        type: 'uint8',
      },
      { internalType: 'bytes32', name: '_networkName', type: 'bytes32' },
      { internalType: 'bool', name: '_ownerApproval', type: 'bool' },
    ],
    name: 'requestAnalytics',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_requestId', type: 'bytes32' },
      { internalType: 'bytes32', name: '_chainlinkResponse', type: 'bytes32' },
    ],
    name: 'fulFillAnalytics',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_jobId', type: 'bytes32' },
      { internalType: 'uint256', name: '_feeMultiplier', type: 'uint256' },
    ],
    name: 'setChainlinkJobID',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNetworkNames',
    outputs: [
      { internalType: 'bytes32[]', name: 'networks', type: 'bytes32[]' },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];
