import { createContext, useContext, ReactNode } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';

// Get Privy App ID from environment
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

// Auth context for app-wide user state
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  userWallet: string | null;
  userDisplayName: string | null;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Internal provider that uses Privy hooks
function AuthContextProvider({ children }: { children: ReactNode }) {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
  } = usePrivy();

  const { wallets } = useWallets();
  const primaryWallet = wallets[0];

  // Derive user info from Privy user object
  const userId = user?.id || null;
  const userEmail = user?.email?.address || null;
  const userWallet = primaryWallet?.address || user?.wallet?.address || null;

  // Display name priority: email > wallet (shortened) > user id
  const userDisplayName = userEmail
    || (userWallet ? `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}` : null)
    || userId;

  const value: AuthContextType = {
    isAuthenticated: authenticated,
    isLoading: !ready,
    userId,
    userEmail,
    userWallet,
    userDisplayName,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Main Auth Provider with Privy configuration
export function AuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    console.warn('VITE_PRIVY_APP_ID not set. Auth will be disabled.');
    // Provide a mock context when Privy is not configured
    return (
      <AuthContext.Provider value={{
        isAuthenticated: false,
        isLoading: false,
        userId: 'demo-user',
        userEmail: null,
        userWallet: null,
        userDisplayName: 'Demo User',
        login: () => console.warn('Privy not configured'),
        logout: async () => console.warn('Privy not configured'),
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Appearance
        appearance: {
          theme: 'dark',
          accentColor: '#7c3aed', // Purple to match the app theme
          logo: undefined, // Add your logo URL here
          showWalletLoginFirst: false,
        },
        // Login methods
        loginMethods: [
          'email',
          'google',
          'twitter',
          'discord',
          'wallet',
        ],
        // Embedded wallets - create wallet for users who login via social
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Supported chains (optional - for Web3 functionality)
        // supportedChains: [mainnet, polygon, arbitrum],
        // defaultChain: mainnet,
      }}
    >
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </PrivyProvider>
  );
}

// Export Privy hooks for direct access when needed
export { usePrivy, useWallets } from '@privy-io/react-auth';
