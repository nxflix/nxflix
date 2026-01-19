/**
 * SideShift API Client
 * Client for calling the backend SideShift API
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface SupportedAsset {
  coin: string;
  name: string;
  networks: string[];
  tokenDetails?: {
    [network: string]: {
      contractAddress: string;
      decimals: number;
    };
  };
}

export interface SupportedChain {
  chainId: number;
  name: string;
  contractAddress: string;
  settleCoin: string;
  settleNetwork: string;
}

export interface Plan {
  id: number;
  name: string;
  price: bigint;
  priceFormatted: string;
  duration: number;
  durationDays: number;
  active: boolean;
}

export interface PairInfo {
  min: string;
  max: string;
  rate: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
}

export interface CreateSubscriptionShiftParams {
  userAddress: string;
  planId: number;
  chainId: number;
  sourceCoin: string;
  sourceNetwork?: string;
  sourceAmount?: string;
  refundAddress?: string;
}

export interface SubscriptionShift {
  id: string;
  sideshiftOrderId: string;
  userAddress: string;
  planId: number;
  chainId: number;
  sourceAsset: string;
  destAsset: string;
  sourceNetwork: string;
  destNetwork: string;
  sourceAmount?: string;
  destAmount?: string;
  depositAddress: string;
  settleAddress: string;
  shiftType: 'fixed' | 'variable';
  status: string;
  depositTxHash?: string;
  settleTxHash?: string;
  subscriptionTxHash?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt: string;
}

export interface ShiftResponse {
  shift: SubscriptionShift;
  sideshift: {
    orderId: string;
    depositAddress: string;
    depositCoin: string;
    depositNetwork: string;
    depositMin?: string;
    depositMax?: string;
    expiresAt: string;
  };
}

export interface ShiftStatusResponse {
  shift: SubscriptionShift;
  sideshiftData: any;
}

/**
 * SideShift API Client
 */
export const sideshiftAPI = {
  /**
   * Get all supported cryptocurrencies
   */
  async getSupportedAssets(): Promise<{ assets: SupportedAsset[]; lastUpdated: string }> {
    const { data } = await axios.get(`${API_URL}/api/sideshift/supported-assets`);
    return data;
  },

  /**
   * Get supported destination chains
   */
  async getSupportedChains(): Promise<{ chains: SupportedChain[] }> {
    const { data } = await axios.get(`${API_URL}/api/sideshift/chains`);
    return data;
  },

  /**
   * Get subscription plans for a chain
   */
  async getPlans(chainId: number): Promise<{ plans: Plan[] }> {
    const { data } = await axios.get(`${API_URL}/api/sideshift/plans/${chainId}`);
    return data;
  },

  /**
   * Get pair information including min/max deposit amounts
   */
  async getPairInfo(
    depositCoin: string,
    settleCoin: string,
    depositNetwork?: string,
    settleNetwork?: string
  ): Promise<PairInfo> {
    const params = new URLSearchParams();
    if (depositNetwork) params.append('depositNetwork', depositNetwork);
    if (settleNetwork) params.append('settleNetwork', settleNetwork);

    const { data } = await axios.get<PairInfo>(
      `${API_URL}/api/sideshift/pair/${depositCoin}/${settleCoin}${params.toString() ? `?${params.toString()}` : ''}`
    );
    return data;
  },

  /**
   * Create a new subscription shift
   */
  async createSubscriptionShift(params: CreateSubscriptionShiftParams): Promise<ShiftResponse> {
    const { data } = await axios.post<ShiftResponse>(
      `${API_URL}/api/sideshift/create-subscription-shift`,
      params
    );
    return data;
  },

  /**
   * Get shift status by ID
   */
  async getShiftStatus(shiftId: string): Promise<ShiftStatusResponse> {
    const { data } = await axios.get<ShiftStatusResponse>(
      `${API_URL}/api/sideshift/shift-status/${shiftId}`
    );
    return data;
  },

  /**
   * Get all shifts for a user address
   */
  async getUserShifts(address: string): Promise<{ shifts: SubscriptionShift[] }> {
    const { data } = await axios.get(`${API_URL}/api/sideshift/user/${address}`);
    return data;
  },
};

/**
 * Error handler helper
 */
export function handleSideshiftError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status === 404) {
      return 'Resource not found';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
