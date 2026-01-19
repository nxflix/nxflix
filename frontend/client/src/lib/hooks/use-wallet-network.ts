/**
 * Hook to get the current network from connected wallet
 */

import { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';

interface NetworkInfo {
  chainId: number | null;
  name: string;
  isSupported: boolean;
}

// Known chain names
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  11155111: 'Sepolia',
  8453: 'Base',
  84532: 'Base Sepolia',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
};

// Chains supported by the app
const SUPPORTED_CHAINS = [11155111, 84532, 1, 8453];

export function useWalletNetwork(): NetworkInfo & { switchNetwork: (chainId: number) => Promise<void> } {
  const { wallets } = useWallets();
  const [chainId, setChainId] = useState<number | null>(null);

  const primaryWallet = wallets[0];

  useEffect(() => {
    if (!primaryWallet) {
      setChainId(null);
      return;
    }

    // Get initial chain ID
    const getChainId = async () => {
      try {
        const provider = await primaryWallet.getEthereumProvider();
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex as string, 16));
      } catch (err) {
        console.error('Failed to get chain ID:', err);
      }
    };

    getChainId();

    // Listen for chain changes
    const handleChainChanged = (newChainIdHex: string) => {
      setChainId(parseInt(newChainIdHex, 16));
    };

    primaryWallet.getEthereumProvider().then((provider) => {
      provider.on('chainChanged', handleChainChanged);
    });

    return () => {
      primaryWallet.getEthereumProvider().then((provider) => {
        provider.removeListener('chainChanged', handleChainChanged);
      });
    };
  }, [primaryWallet]);

  const switchNetwork = async (targetChainId: number) => {
    if (!primaryWallet) return;

    try {
      const provider = await primaryWallet.getEthereumProvider();
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err: any) {
      // If chain not added, try to add it
      if (err.code === 4902) {
        console.error('Chain not added to wallet');
      }
      throw err;
    }
  };

  return {
    chainId,
    name: chainId ? (CHAIN_NAMES[chainId] || `Chain ${chainId}`) : 'Not Connected',
    isSupported: chainId ? SUPPORTED_CHAINS.includes(chainId) : false,
    switchNetwork,
  };
}

export { CHAIN_NAMES, SUPPORTED_CHAINS };
