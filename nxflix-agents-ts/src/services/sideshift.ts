/**
 * SideShift API Service
 * Handles all interactions with SideShift API for crypto payments
 */

import axios, { AxiosInstance } from 'axios';
import { settings } from '../config.js';
import {
  SideshiftAsset,
  SideshiftQuote,
  SideshiftOrder,
  SideshiftPairInfo,
  CreateQuoteRequest,
  CreateFixedShiftRequest,
  CreateVariableShiftRequest,
  ShiftType,
} from '../models/sideshift.js';

export class SideshiftService {
  private client: AxiosInstance;
  private baseHeaders: Record<string, string>;

  constructor() {
    this.baseHeaders = {
      'Content-Type': 'application/json',
    };

    // Add secret header if configured
    if (settings.sideshiftSecret) {
      this.baseHeaders['x-sideshift-secret'] = settings.sideshiftSecret;
    }

    this.client = axios.create({
      baseURL: settings.sideshiftApiUrl,
      headers: this.baseHeaders,
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new Error(
            `SideShift API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
          );
        } else if (error.request) {
          throw new Error('SideShift API: No response received');
        } else {
          throw new Error(`SideShift API error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Get headers with user IP (required by SideShift)
   */
  private getHeaders(userIp?: string): Record<string, string> {
    const headers = { ...this.baseHeaders };
    headers['x-user-ip'] = userIp || '127.0.0.1';
    return headers;
  }

  /**
   * Get all supported coins/assets
   */
  async getCoins(userIp?: string): Promise<SideshiftAsset[]> {
    const response = await this.client.get<SideshiftAsset[]>('/coins', {
      headers: this.getHeaders(userIp),
    });
    return response.data;
  }

  /**
   * Get pair information (exchange rates and limits)
   */
  async getPair(
    depositCoin: string,
    settleCoin: string,
    depositNetwork?: string,
    settleNetwork?: string,
    userIp?: string
  ): Promise<SideshiftPairInfo> {
    const depositPair = depositNetwork
      ? `${depositCoin.toLowerCase()}-${depositNetwork.toLowerCase()}`
      : depositCoin.toLowerCase();

    const settlePair = settleNetwork
      ? `${settleCoin.toLowerCase()}-${settleNetwork.toLowerCase()}`
      : settleCoin.toLowerCase();

    const url = `/pair/${depositPair}/${settlePair}`;
    const response = await this.client.get<SideshiftPairInfo>(url, {
      headers: this.getHeaders(userIp),
    });
    return response.data;
  }

  /**
   * Create a fixed-rate quote (Step 1 for fixed shifts)
   */
  async createQuote(params: CreateQuoteRequest, userIp?: string): Promise<SideshiftQuote> {
    const payload = {
      ...params,
      affiliateId: params.affiliateId || settings.sideshiftAffiliateId || undefined,
    };

    const response = await this.client.post<SideshiftQuote>('/quotes', payload, {
      headers: this.getHeaders(userIp),
    });
    return response.data;
  }

  /**
   * Create a fixed-rate shift (Step 2 for fixed shifts)
   */
  async createFixedShift(params: CreateFixedShiftRequest, userIp?: string): Promise<SideshiftOrder> {
    const payload = {
      quoteId: params.quoteId,
      settleAddress: params.settleAddress,
      affiliateId: params.affiliateId || settings.sideshiftAffiliateId || undefined,
      ...(params.settleMemo ? { settleMemo: params.settleMemo } : {}),
      ...(params.refundAddress ? { refundAddress: params.refundAddress } : {}),
      ...(params.refundMemo ? { refundMemo: params.refundMemo } : {}),
      ...(params.externalId ? { externalId: params.externalId } : {}),
    };

    const response = await this.client.post<SideshiftOrder>('/shifts/fixed', payload, {
      headers: this.getHeaders(userIp),
    });
    return response.data;
  }

  /**
   * Create a variable-rate shift
   */
  async createVariableShift(params: CreateVariableShiftRequest, userIp?: string): Promise<SideshiftOrder> {
    const payload = {
      ...params,
      affiliateId: params.affiliateId || settings.sideshiftAffiliateId || undefined,
    };

    const response = await this.client.post<SideshiftOrder>('/shifts/variable', payload, {
      headers: this.getHeaders(userIp),
    });
    return response.data;
  }

  /**
   * Get shift status by order ID
   */
  async getShift(orderId: string, userIp?: string): Promise<SideshiftOrder> {
    const response = await this.client.get<SideshiftOrder>(`/shifts/${orderId}`, {
      headers: this.getHeaders(userIp),
    });
    return response.data;
  }

  /**
   * Create a shift (fixed or variable)
   * For fixed shifts, handles the two-step process automatically
   */
  async createShift(
    type: ShiftType,
    params: {
      settleAddress: string;
      depositCoin: string;
      settleCoin: string;
      depositNetwork?: string;
      settleNetwork?: string;
      depositAmount?: string;
      refundAddress?: string;
      affiliateId?: string;
    },
    userIp?: string
  ): Promise<SideshiftOrder> {
    if (type === 'fixed') {
      if (!params.depositAmount) {
        throw new Error('depositAmount is required for fixed-rate shifts');
      }

      // Step 1: Create quote
      const quote = await this.createQuote({
        depositCoin: params.depositCoin,
        settleCoin: params.settleCoin,
        depositNetwork: params.depositNetwork,
        settleNetwork: params.settleNetwork,
        depositAmount: params.depositAmount,
        affiliateId: params.affiliateId,
      }, userIp);

      // Step 2: Create fixed shift
      return this.createFixedShift({
        quoteId: quote.id,
        settleAddress: params.settleAddress,
        refundAddress: params.refundAddress,
        affiliateId: params.affiliateId,
      }, userIp);
    } else {
      // Variable shifts can be created directly
      return this.createVariableShift({
        settleAddress: params.settleAddress,
        depositCoin: params.depositCoin,
        settleCoin: params.settleCoin,
        depositNetwork: params.depositNetwork,
        settleNetwork: params.settleNetwork,
        refundAddress: params.refundAddress,
        affiliateId: params.affiliateId,
      }, userIp);
    }
  }

  /**
   * Get recommended networks for a coin
   */
  async getNetworksForCoin(coin: string, userIp?: string): Promise<string[]> {
    const coins = await this.getCoins(userIp);
    const coinData = coins.find((c) => c.coin.toLowerCase() === coin.toLowerCase());
    if (!coinData) {
      throw new Error(`Coin not found: ${coin}`);
    }
    return coinData.networks;
  }
}

// Export singleton instance
export const sideshiftService = new SideshiftService();
