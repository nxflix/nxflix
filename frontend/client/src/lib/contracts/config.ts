// Contract addresses by chain ID
export const CONTRACT_ADDRESSES: Record<number, { subscription: `0x${string}` }> = {
  // Sepolia Testnet
  11155111: {
    subscription: '0x789A4C17d01551BAF6152F8F842B174ab61ace9A',
  },
  // Base Sepolia
  84532: {
    subscription: '0xDA4EF957c402522Fa0b837cb047dd416ba783798',
  },
  // Ethereum Mainnet (to be deployed)
  1: {
    subscription: '0x0000000000000000000000000000000000000000',
  },
  // Base Mainnet (to be deployed)
  8453: {
    subscription: '0x0000000000000000000000000000000000000000',
  },
};

// Supported chain IDs
export const SUPPORTED_CHAIN_IDS = [11155111, 84532, 1, 8453] as const;

// Default chain for the app
export const DEFAULT_CHAIN_ID = 11155111; // Sepolia for testing

// Chain metadata
export const CHAIN_INFO: Record<number, { name: string; explorer: string; rpcUrl: string }> = {
  11155111: {
    name: 'Sepolia',
    explorer: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  84532: {
    name: 'Base Sepolia',
    explorer: 'https://sepolia.basescan.org',
    rpcUrl: 'https://sepolia.base.org',
  },
  1: {
    name: 'Ethereum',
    explorer: 'https://etherscan.io',
    rpcUrl: 'https://eth.llamarpc.com',
  },
  8453: {
    name: 'Base',
    explorer: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
  },
};

// Get contract address for current chain
export function getContractAddress(chainId: number): `0x${string}` | null {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses || addresses.subscription === '0x0000000000000000000000000000000000000000') {
    return null;
  }
  return addresses.subscription;
}
