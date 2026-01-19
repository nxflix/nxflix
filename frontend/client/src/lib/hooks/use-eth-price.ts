/**
 * Hook to fetch ETH price from CoinGecko API
 */

import { useState, useEffect } from 'react';

interface PriceData {
  ethPrice: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Cache the price to avoid too many API calls
let cachedPrice: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export function useEthPrice(): PriceData {
  const [ethPrice, setEthPrice] = useState<number | null>(cachedPrice);
  const [loading, setLoading] = useState(!cachedPrice);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    cacheTimestamp ? new Date(cacheTimestamp) : null
  );

  useEffect(() => {
    // Use cached price if still valid
    if (cachedPrice && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setEthPrice(cachedPrice);
      setLoading(false);
      return;
    }

    const fetchPrice = async () => {
      try {
        setLoading(true);

        // Using CoinGecko free API
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch price');
        }

        const data = await response.json();
        const price = data.ethereum?.usd;

        if (price) {
          cachedPrice = price;
          cacheTimestamp = Date.now();
          setEthPrice(price);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ETH price');
        // Keep the cached price if available
        if (cachedPrice) {
          setEthPrice(cachedPrice);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    // Refresh price every minute
    const interval = setInterval(fetchPrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return { ethPrice, loading, error, lastUpdated };
}

/**
 * Convert ETH amount to USD
 */
export function ethToUsd(ethAmount: string | number, ethPrice: number | null): string | null {
  if (!ethPrice) return null;
  const amount = typeof ethAmount === 'string' ? parseFloat(ethAmount) : ethAmount;
  if (isNaN(amount)) return null;
  return (amount * ethPrice).toFixed(2);
}

/**
 * Format USD price for display
 */
export function formatUsd(amount: string | number | null): string {
  if (amount === null) return '---';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}
