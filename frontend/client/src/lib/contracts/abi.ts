// Subscription Contract ABI
export const SUBSCRIPTION_ABI = [
  {
    type: 'function',
    name: 'getPlans',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'price', type: 'uint256' },
          { name: 'duration', type: 'uint32' },
          { name: 'active', type: 'bool' },
          { name: 'name', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlan',
    inputs: [{ name: 'planId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'price', type: 'uint256' },
          { name: 'duration', type: 'uint32' },
          { name: 'active', type: 'bool' },
          { name: 'name', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSubscription',
    inputs: [{ name: 'subscriber', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'planId', type: 'uint256' },
          { name: 'startTime', type: 'uint64' },
          { name: 'endTime', type: 'uint64' },
          { name: 'autoRenew', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isActive',
    inputs: [{ name: 'subscriber', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'timeRemaining',
    inputs: [{ name: 'subscriber', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'subscribe',
    inputs: [
      { name: 'planId', type: 'uint256' },
      { name: 'autoRenew', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'renew',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'cancelAutoRenew',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setAutoRenew',
    inputs: [{ name: 'autoRenew', type: 'bool' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'planCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Subscribed',
    inputs: [
      { name: 'subscriber', type: 'address', indexed: true },
      { name: 'planId', type: 'uint256', indexed: true },
      { name: 'startTime', type: 'uint64', indexed: false },
      { name: 'endTime', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SubscriptionRenewed',
    inputs: [
      { name: 'subscriber', type: 'address', indexed: true },
      { name: 'planId', type: 'uint256', indexed: true },
      { name: 'newEndTime', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SubscriptionCancelled',
    inputs: [{ name: 'subscriber', type: 'address', indexed: true }],
  },
  {
    type: 'error',
    name: 'AlreadySubscribed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientPayment',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPlan',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotSubscribed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PlanNotActive',
    inputs: [],
  },
] as const;
