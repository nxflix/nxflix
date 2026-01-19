/**
 * SideShift API Types
 * Based on https://sideshift.ai/api
 */

import { z } from 'zod';

export type ShiftType = 'fixed' | 'variable';

export const ShiftStatus = z.enum([
  'waiting',     // Waiting for deposit
  'processing',  // Processing the shift
  'settling',    // Settling the transaction
  'settled',     // Completed successfully
  'refund',      // Refund in progress
  'refunded',    // Refund completed
  'expired',     // Shift expired
]);
export type ShiftStatus = z.infer<typeof ShiftStatus>;

export interface SideshiftAsset {
  coin: string;           // e.g., "BTC", "ETH"
  name: string;           // Full name
  networks: string[];     // Available networks
  hasMemo: boolean;       // Whether the asset requires a memo
  fixedOnly: string[];    // Networks that only support fixed-rate shifts
  variableOnly: string[]; // Networks that only support variable-rate shifts
  tokenDetails?: {        // Token contract details per network
    [network: string]: {
      contractAddress: string;
      decimals: number;
    };
  };
  networksWithMemo?: string[];
  depositOffline?: boolean;
  settleOffline?: boolean;
}

export interface SideshiftQuote {
  id: string;
  createdAt: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  expiresAt: string;
  depositAmount: string;
  settleAmount: string;
  rate: string;
  affiliateId?: string;
}

export interface SideshiftPairInfo {
  min: string;
  max: string;
  rate: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
}

export interface SideshiftOrder {
  id: string;
  createdAt: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  depositAddress: string;
  settleAddress: string;
  depositMin?: string;
  depositMax?: string;
  type: ShiftType;
  quoteId?: string;
  depositAmount?: string;
  settleAmount?: string;
  expiresAt: string;
  status: ShiftStatus;
  averageShiftSeconds?: string;
}

export interface CreateQuoteRequest {
  depositCoin: string;
  settleCoin: string;
  depositNetwork?: string;
  settleNetwork?: string;
  depositAmount?: string;
  settleAmount?: string;
  affiliateId?: string;
}

export interface CreateFixedShiftRequest {
  quoteId: string;
  settleAddress: string;
  affiliateId?: string;
  settleMemo?: string;
  refundAddress?: string;
  refundMemo?: string;
  externalId?: string;
}

export interface CreateVariableShiftRequest {
  settleAddress: string;
  affiliateId?: string;
  settleNetwork?: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork?: string;
  refundAddress?: string;
  refundNetwork?: string;
}

export interface SideshiftWebhookPayload {
  id: string;
  orderId: string;
  createdAt: string;
  type: 'shift' | 'quote';
  status: ShiftStatus;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  depositAddress: string;
  settleAddress: string;
  depositAmount?: string;
  settleAmount?: string;
  depositReceived?: string;
  settleReceived?: string;
  depositHash?: string;
  settleHash?: string;
}

// Subscription-specific shift record
export const SubscriptionShift = z.object({
  id: z.string(),
  sideshiftOrderId: z.string(),
  userAddress: z.string(),
  planId: z.number(),
  chainId: z.number(),
  sourceAsset: z.string(),
  destAsset: z.string(),
  sourceNetwork: z.string(),
  destNetwork: z.string(),
  sourceAmount: z.string().optional(),
  destAmount: z.string().optional(),
  depositAddress: z.string(),
  settleAddress: z.string(),
  shiftType: z.enum(['fixed', 'variable']),
  status: ShiftStatus,
  depositTxHash: z.string().optional(),
  settleTxHash: z.string().optional(),
  subscriptionTxHash: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  expiresAt: z.date(),
});
export type SubscriptionShift = z.infer<typeof SubscriptionShift>;

// Request schemas for validation
export const CreateSubscriptionShiftRequest = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  planId: z.number().int().min(0),
  chainId: z.number().int(),
  sourceCoin: z.string(),
  sourceNetwork: z.string().optional(),
  sourceAmount: z.string().optional(),
  refundAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});
export type CreateSubscriptionShiftRequest = z.infer<typeof CreateSubscriptionShiftRequest>;

export const WebhookPayloadSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  createdAt: z.string(),
  type: z.enum(['shift', 'quote']),
  status: ShiftStatus,
  depositCoin: z.string(),
  settleCoin: z.string(),
  depositNetwork: z.string(),
  settleNetwork: z.string(),
  depositAddress: z.string(),
  settleAddress: z.string(),
  depositAmount: z.string().optional(),
  settleAmount: z.string().optional(),
  depositReceived: z.string().optional(),
  settleReceived: z.string().optional(),
  depositHash: z.string().optional(),
  settleHash: z.string().optional(),
});
