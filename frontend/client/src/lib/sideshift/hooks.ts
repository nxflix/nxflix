/**
 * React hooks for SideShift integration
 */

import { useState, useEffect, useCallback } from 'react';
import {
  sideshiftAPI,
  handleSideshiftError,
  type SupportedAsset,
  type SupportedChain,
  type CreateSubscriptionShiftParams,
  type ShiftResponse,
  type SubscriptionShift,
} from './api';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for creating and managing subscription shifts
 */
export function useSideshift() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscriptionShift = useCallback(
    async (params: CreateSubscriptionShiftParams): Promise<ShiftResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await sideshiftAPI.createSubscriptionShift(params);

        toast({
          title: 'Payment Started',
          description: `Send ${result.sideshift.depositCoin} to the deposit address`,
        });

        return result;
      } catch (err) {
        const errorMessage = handleSideshiftError(err);
        setError(errorMessage);

        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });

        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const getShiftStatus = useCallback(async (shiftId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sideshiftAPI.getShiftStatus(shiftId);
      return result;
    } catch (err) {
      const errorMessage = handleSideshiftError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createSubscriptionShift,
    getShiftStatus,
    loading,
    error,
  };
}

/**
 * Hook for getting supported assets
 */
export function useSupportedAssets() {
  const [assets, setAssets] = useState<SupportedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAssets = async () => {
      try {
        const data = await sideshiftAPI.getSupportedAssets();
        if (mounted) {
          setAssets(data.assets);
        }
      } catch (err) {
        if (mounted) {
          setError(handleSideshiftError(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAssets();

    return () => {
      mounted = false;
    };
  }, []);

  return { assets, loading, error };
}

/**
 * Hook for getting supported chains
 */
export function useSupportedChains() {
  const [chains, setChains] = useState<SupportedChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchChains = async () => {
      try {
        const data = await sideshiftAPI.getSupportedChains();
        if (mounted) {
          setChains(data.chains);
        }
      } catch (err) {
        if (mounted) {
          setError(handleSideshiftError(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchChains();

    return () => {
      mounted = false;
    };
  }, []);

  return { chains, loading, error };
}

/**
 * Hook for getting pair info (exchange rates and limits)
 */
export function usePairInfo(
  depositCoin: string | null,
  settleCoin: string | null,
  depositNetwork?: string,
  settleNetwork?: string
) {
  const [pairInfo, setPairInfo] = useState<{
    min: string;
    max: string;
    rate: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!depositCoin || !settleCoin) {
      setPairInfo(null);
      return;
    }

    let mounted = true;

    const fetchPairInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await sideshiftAPI.getPairInfo(
          depositCoin,
          settleCoin,
          depositNetwork,
          settleNetwork
        );
        if (mounted) {
          setPairInfo({
            min: data.min,
            max: data.max,
            rate: data.rate,
          });
        }
      } catch (err) {
        if (mounted) {
          setError(handleSideshiftError(err));
          setPairInfo(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPairInfo();

    return () => {
      mounted = false;
    };
  }, [depositCoin, settleCoin, depositNetwork, settleNetwork]);

  return { pairInfo, loading, error };
}

/**
 * Hook for monitoring shift status with polling
 */
export function useShiftMonitor(shiftId: string | null, intervalMs: number = 5000) {
  const [status, setStatus] = useState<string | null>(null);
  const [shiftData, setShiftData] = useState<SubscriptionShift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shiftId) return;

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkStatus = async () => {
      if (!mounted) return;

      setLoading(true);
      try {
        const result = await sideshiftAPI.getShiftStatus(shiftId);
        if (mounted) {
          setStatus(result.shift.status);
          setShiftData(result.shift);
          setError(null);

          // Continue polling if not in final state
          const finalStates = ['settled', 'refunded', 'expired'];
          if (!finalStates.includes(result.shift.status)) {
            timeoutId = setTimeout(checkStatus, intervalMs);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(handleSideshiftError(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkStatus();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [shiftId, intervalMs]);

  return { status, shiftData, loading, error };
}

/**
 * Hook for getting user's shift history
 */
export function useUserShifts(address: string | undefined) {
  const [shifts, setShifts] = useState<SubscriptionShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sideshiftAPI.getUserShifts(address);
      setShifts(result.shifts);
    } catch (err) {
      setError(handleSideshiftError(err));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { shifts, loading, error, refresh };
}

// Popular coins to show at top of selector
export const POPULAR_COINS = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB'];

/**
 * Sort assets with popular ones first
 */
export function sortAssets(assets: SupportedAsset[]): SupportedAsset[] {
  return [...assets].sort((a, b) => {
    const aPopular = POPULAR_COINS.indexOf(a.coin);
    const bPopular = POPULAR_COINS.indexOf(b.coin);

    if (aPopular !== -1 && bPopular !== -1) {
      return aPopular - bPopular;
    }
    if (aPopular !== -1) return -1;
    if (bPopular !== -1) return 1;

    return a.name.localeCompare(b.name);
  });
}
