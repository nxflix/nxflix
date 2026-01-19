import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, http, custom, formatEther } from 'viem';
import { sepolia, baseSepolia } from 'viem/chains';
import { SUBSCRIPTION_ABI } from './abi';
import { CONTRACT_ADDRESSES, CHAIN_INFO } from './config';

// Types
export interface Plan {
  id: number;
  name: string;
  price: bigint;
  priceFormatted: string;
  duration: number;
  durationDays: number;
  active: boolean;
}

export interface UserSubscription {
  planId: number;
  startTime: Date;
  endTime: Date;
  autoRenew: boolean;
  isActive: boolean;
  timeRemaining: number;
  timeRemainingFormatted: string;
}

// Supported chains
export const SUPPORTED_CHAINS = {
  11155111: { chain: sepolia, name: 'Sepolia' },
  84532: { chain: baseSepolia, name: 'Base Sepolia' },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

// Format time remaining
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Get public client for a chain
function getPublicClient(chainId: SupportedChainId) {
  const chainConfig = SUPPORTED_CHAINS[chainId];
  return createPublicClient({
    chain: chainConfig.chain,
    transport: http(CHAIN_INFO[chainId].rpcUrl),
  });
}

// Hook: Chain selector
export function useChainSelector() {
  const [chainId, setChainId] = useState<SupportedChainId>(84532); // Default to Base Sepolia

  const chainInfo = useMemo(() => ({
    ...SUPPORTED_CHAINS[chainId],
    contractAddress: CONTRACT_ADDRESSES[chainId]?.subscription,
    explorer: CHAIN_INFO[chainId].explorer,
  }), [chainId]);

  return { chainId, setChainId, chainInfo, availableChains: SUPPORTED_CHAINS };
}

// Hook: Get subscription plans
export function useSubscriptionPlans(chainId: SupportedChainId = 84532) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.subscription;

  useEffect(() => {
    async function fetchPlans() {
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        setError(new Error('Contract not deployed on this chain'));
        setLoading(false);
        return;
      }

      try {
        const publicClient = getPublicClient(chainId);
        const data = await publicClient.readContract({
          address: contractAddress,
          abi: SUBSCRIPTION_ABI,
          functionName: 'getPlans',
        });

        const formattedPlans: Plan[] = (data as any[]).map((plan, index) => ({
          id: index,
          name: plan.name,
          price: plan.price,
          priceFormatted: formatEther(plan.price),
          duration: Number(plan.duration),
          durationDays: Math.floor(Number(plan.duration) / 86400),
          active: plan.active,
        }));

        setPlans(formattedPlans);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchPlans();
  }, [chainId, contractAddress]);

  return { plans, loading, error };
}

// Hook: Get user's subscription status
export function useUserSubscription(address?: string, chainId: SupportedChainId = 84532) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.subscription;

  const refetch = useCallback(async () => {
    if (!address || !contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const publicClient = getPublicClient(chainId);

      const [subData, isActive, timeRemaining] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: SUBSCRIPTION_ABI,
          functionName: 'getSubscription',
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: SUBSCRIPTION_ABI,
          functionName: 'isActive',
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: SUBSCRIPTION_ABI,
          functionName: 'timeRemaining',
          args: [address as `0x${string}`],
        }),
      ]);

      const sub = subData as any;
      const remaining = Number(timeRemaining);

      if (Number(sub.endTime) === 0) {
        setSubscription(null);
      } else {
        setSubscription({
          planId: Number(sub.planId),
          startTime: new Date(Number(sub.startTime) * 1000),
          endTime: new Date(Number(sub.endTime) * 1000),
          autoRenew: sub.autoRenew,
          isActive: isActive as boolean,
          timeRemaining: remaining,
          timeRemainingFormatted: formatTimeRemaining(remaining),
        });
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
    } finally {
      setLoading(false);
    }
  }, [address, chainId, contractAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { subscription, loading, error, refetch };
}

// Hook: Subscribe to a plan
export function useSubscribe(chainId: SupportedChainId = 84532) {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.subscription;
  const chainConfig = SUPPORTED_CHAINS[chainId];

  const subscribe = async (planId: number, price: bigint, autoRenew: boolean = false) => {
    const wallet = wallets[0];
    if (!wallet || !contractAddress) {
      throw new Error('No wallet connected');
    }

    setLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = createWalletClient({
        chain: chainConfig.chain,
        transport: custom(provider),
      });

      const [address] = await walletClient.getAddresses();

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: SUBSCRIPTION_ABI,
        functionName: 'subscribe',
        args: [BigInt(planId), autoRenew],
        value: price,
        account: address,
      });

      const publicClient = getPublicClient(chainId);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return receipt;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error };
}

// Hook: Renew subscription
export function useRenewSubscription(chainId: SupportedChainId = 84532) {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.subscription;
  const chainConfig = SUPPORTED_CHAINS[chainId];

  const renew = async (price: bigint) => {
    const wallet = wallets[0];
    if (!wallet || !contractAddress) {
      throw new Error('No wallet connected');
    }

    setLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = createWalletClient({
        chain: chainConfig.chain,
        transport: custom(provider),
      });

      const [address] = await walletClient.getAddresses();

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: SUBSCRIPTION_ABI,
        functionName: 'renew',
        args: [],
        value: price,
        account: address,
      });

      const publicClient = getPublicClient(chainId);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Renewal failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { renew, loading, error };
}

// Hook: Toggle auto-renew
export function useToggleAutoRenew(chainId: SupportedChainId = 84532) {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.subscription;
  const chainConfig = SUPPORTED_CHAINS[chainId];

  const toggleAutoRenew = async (enable: boolean) => {
    const wallet = wallets[0];
    if (!wallet || !contractAddress) {
      throw new Error('No wallet connected');
    }

    setLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = createWalletClient({
        chain: chainConfig.chain,
        transport: custom(provider),
      });

      const [address] = await walletClient.getAddresses();

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: SUBSCRIPTION_ABI,
        functionName: 'setAutoRenew',
        args: [enable],
        account: address,
      });

      const publicClient = getPublicClient(chainId);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle auto-renew');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { toggleAutoRenew, loading, error };
}
