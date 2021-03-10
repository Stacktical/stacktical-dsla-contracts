import { AbiItem } from 'web3-utils/types';

export const StakeRegistryABI: AbiItem[] = [
  {
    inputs: [
      { internalType: 'address', name: '_dslaTokenAddress', type: 'address' },
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
        indexed: false,
        internalType: 'uint256',
        name: 'DSLAburnRate',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'dslaDepositByPeriod',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'dslaPlatformReward',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'dslaUserReward',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'dslaBurnedByVerification',
        type: 'uint256',
      },
    ],
    name: 'StakingParametersModified',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'sla', type: 'address' },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'userReward',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'platformReward',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'burnedDSLA',
        type: 'uint256',
      },
    ],
    name: 'VerificationRewardDistributed',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DSLATokenAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'allowedTokens',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'slaLockedValue',
    outputs: [
      { internalType: 'uint256', name: 'lockedValue', type: 'uint256' },
      { internalType: 'uint256', name: 'slaPeriodIdsLength', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaDepositByPeriod', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaPlatformReward', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaUserReward', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'dslaBurnedByVerification',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'slaRegistry',
    outputs: [
      { internalType: 'contract SLARegistry', name: '', type: 'address' },
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
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'userStakedSlas',
    outputs: [{ internalType: 'contract SLA', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
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
      { internalType: 'address', name: '_tokenAddress', type: 'address' },
    ],
    name: 'addAllowedTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_tokenAddress', type: 'address' },
    ],
    name: 'isAllowedToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_user', type: 'address' },
      { internalType: 'address', name: '_sla', type: 'address' },
    ],
    name: 'slaWasStakedByUser',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'registerStakedSla',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'string', name: '_symbol', type: 'string' },
    ],
    name: 'createDToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_slaOwner', type: 'address' },
      { internalType: 'address', name: '_sla', type: 'address' },
      { internalType: 'uint256', name: '_periodIdsLength', type: 'uint256' },
    ],
    name: 'lockDSLAValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_sla', type: 'address' },
      {
        internalType: 'address',
        name: '_verificationRewardReceiver',
        type: 'address',
      },
      { internalType: 'uint256', name: '_periodId', type: 'uint256' },
    ],
    name: 'distributeVerificationRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_sla', type: 'address' }],
    name: 'returnLockedValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_slaOwner', type: 'address' }],
    name: 'getActivePool',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'SLAAddress', type: 'address' },
          { internalType: 'uint256', name: 'stake', type: 'uint256' },
          { internalType: 'string', name: 'assetName', type: 'string' },
          { internalType: 'address', name: 'assetAddress', type: 'address' },
        ],
        internalType: 'struct StakeRegistry.ActivePool[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'DSLAburnRate', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaDepositByPeriod', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaPlatformReward', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaUserReward', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'dslaBurnedByVerification',
        type: 'uint256',
      },
    ],
    name: 'setStakingParameters',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getStakingParameters',
    outputs: [
      { internalType: 'uint256', name: 'DSLAburnRate', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaDepositByPeriod', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaPlatformReward', type: 'uint256' },
      { internalType: 'uint256', name: 'dslaUserReward', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'dslaBurnedByVerification',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_sla', type: 'address' },
      { internalType: 'uint256', name: '_periodId', type: 'uint256' },
    ],
    name: 'periodIsVerified',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];
