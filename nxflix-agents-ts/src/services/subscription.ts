/**
 * Subscription Contract Service
 * Handles interactions with the subscription smart contract
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type Address,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, baseSepolia } from 'viem/chains';
import { settings } from '../config.js';

// Subscription Contract ABI (only the functions we need)
const SUBSCRIPTION_ABI = [
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
    name: 'grantSubscription',
    inputs: [
      { name: 'subscriber', type: 'address' },
      { name: 'planId', type: 'uint256' },
      { name: 'duration', type: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'treasury',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

// Supported chains configuration
const CHAIN_CONFIG = {
  11155111: {
    chain: sepolia,
    rpcUrl: settings.sepoliaRpcUrl,
    contractAddress: settings.sepoliaSubscriptionContract as Address,
    name: 'Sepolia',
    settleCoin: 'ETH',
    settleNetwork: 'sepolia',
  },
  84532: {
    chain: baseSepolia,
    rpcUrl: settings.baseSepoliaRpcUrl,
    contractAddress: settings.baseSepoliaSubscriptionContract as Address,
    name: 'Base Sepolia',
    settleCoin: 'ETH',
    settleNetwork: 'base',
  },
} as const;

export type SupportedChainId = keyof typeof CHAIN_CONFIG;

export interface Plan {
  id: number;
  name: string;
  price: bigint;
  priceFormatted: string;
  duration: number;
  durationDays: number;
  active: boolean;
}

export class SubscriptionService {
  /**
   * Get public client for a chain
   */
  private getPublicClient(chainId: SupportedChainId) {
    const config = CHAIN_CONFIG[chainId];
    return createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Get wallet client for signing transactions
   */
  private getWalletClient(chainId: SupportedChainId) {
    if (!settings.treasuryPrivateKey) {
      throw new Error('Treasury private key not configured');
    }

    const config = CHAIN_CONFIG[chainId];
    const account = privateKeyToAccount(settings.treasuryPrivateKey as `0x${string}`);

    return createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Get chain configuration
   */
  getChainConfig(chainId: SupportedChainId) {
    const config = CHAIN_CONFIG[chainId];
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return config;
  }

  /**
   * Get all supported chains
   */
  getSupportedChains() {
    return Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
      chainId: Number(id),
      name: config.name,
      contractAddress: config.contractAddress,
      settleCoin: config.settleCoin,
      settleNetwork: config.settleNetwork,
    }));
  }

  /**
   * Get subscription plans from a chain
   */
  async getPlans(chainId: SupportedChainId): Promise<Plan[]> {
    const config = CHAIN_CONFIG[chainId];
    const publicClient = this.getPublicClient(chainId);

    const data = await publicClient.readContract({
      address: config.contractAddress,
      abi: SUBSCRIPTION_ABI,
      functionName: 'getPlans',
    });

    return (data as any[]).map((plan, index) => ({
      id: index,
      name: plan.name,
      price: plan.price,
      priceFormatted: formatEther(plan.price),
      duration: Number(plan.duration),
      durationDays: Math.floor(Number(plan.duration) / 86400),
      active: plan.active,
    }));
  }

  /**
   * Get a specific plan
   */
  async getPlan(chainId: SupportedChainId, planId: number): Promise<Plan> {
    const config = CHAIN_CONFIG[chainId];
    const publicClient = this.getPublicClient(chainId);

    const data = await publicClient.readContract({
      address: config.contractAddress,
      abi: SUBSCRIPTION_ABI,
      functionName: 'getPlan',
      args: [BigInt(planId)],
    });

    const plan = data as any;
    return {
      id: planId,
      name: plan.name,
      price: plan.price,
      priceFormatted: formatEther(plan.price),
      duration: Number(plan.duration),
      durationDays: Math.floor(Number(plan.duration) / 86400),
      active: plan.active,
    };
  }

  /**
   * Get treasury address (settlement address for SideShift)
   */
  async getTreasuryAddress(chainId: SupportedChainId): Promise<Address> {
    const config = CHAIN_CONFIG[chainId];
    const publicClient = this.getPublicClient(chainId);

    const treasury = await publicClient.readContract({
      address: config.contractAddress,
      abi: SUBSCRIPTION_ABI,
      functionName: 'treasury',
    });

    return treasury as Address;
  }

  /**
   * Grant subscription to a user (called when SideShift payment settles)
   */
  async grantSubscription(
    chainId: SupportedChainId,
    subscriber: Address,
    planId: number,
    customDuration?: number
  ): Promise<Hash> {
    const config = CHAIN_CONFIG[chainId];
    const walletClient = this.getWalletClient(chainId);
    const publicClient = this.getPublicClient(chainId);

    // Verify the wallet is the contract owner
    const owner = await publicClient.readContract({
      address: config.contractAddress,
      abi: SUBSCRIPTION_ABI,
      functionName: 'owner',
    });

    if (walletClient.account.address.toLowerCase() !== (owner as Address).toLowerCase()) {
      throw new Error('Wallet is not the contract owner');
    }

    // Grant subscription
    const hash = await walletClient.writeContract({
      address: config.contractAddress,
      abi: SUBSCRIPTION_ABI,
      functionName: 'grantSubscription',
      args: [subscriber, BigInt(planId), customDuration ? customDuration : 0],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    console.log(`Granted subscription to ${subscriber} on chain ${chainId}, tx: ${hash}`);
    return hash;
  }

  /**
   * Verify if a chain is supported
   */
  isChainSupported(chainId: number): chainId is SupportedChainId {
    return chainId in CHAIN_CONFIG;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
