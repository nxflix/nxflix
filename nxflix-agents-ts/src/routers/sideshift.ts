/**
 * SideShift API Routes
 * Handles crypto payment shifts for subscriptions
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { settings } from '../config.js';
import { sideshiftService } from '../services/sideshift.js';
import { subscriptionService } from '../services/subscription.js';
import {
  CreateSubscriptionShiftRequest,
  WebhookPayloadSchema,
  SubscriptionShift,
} from '../models/sideshift.js';
import {
  createShift,
  getShiftById,
  getShiftBySideshiftOrderId,
  updateShift,
  getShiftsByUserAddress,
} from '../state.js';

const router = Router();

/**
 * Middleware to extract user IP for SideShift API
 */
function getUserIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * GET /api/sideshift/supported-assets
 * Get list of supported cryptocurrencies
 */
router.get('/supported-assets', async (req: Request, res: Response) => {
  try {
    const userIp = getUserIp(req);
    const assets = await sideshiftService.getCoins(userIp);

    res.json({
      assets: assets.map((asset) => ({
        coin: asset.coin,
        name: asset.name,
        networks: asset.networks,
        tokenDetails: asset.tokenDetails,
      })),
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Failed to get supported assets:', error);
    res.status(500).json({ error: 'Failed to fetch supported assets' });
  }
});

/**
 * GET /api/sideshift/chains
 * Get supported destination chains for subscriptions
 */
router.get('/chains', async (_req: Request, res: Response) => {
  try {
    const chains = subscriptionService.getSupportedChains();
    res.json({ chains });
  } catch (error) {
    console.error('Failed to get supported chains:', error);
    res.status(500).json({ error: 'Failed to fetch supported chains' });
  }
});

/**
 * GET /api/sideshift/plans/:chainId
 * Get subscription plans for a chain
 */
router.get('/plans/:chainId', async (req: Request, res: Response) => {
  try {
    const chainId = Number(req.params.chainId);
    if (!subscriptionService.isChainSupported(chainId)) {
      return res.status(400).json({ error: 'Unsupported chain' });
    }

    const plans = await subscriptionService.getPlans(chainId);
    res.json({ plans });
  } catch (error) {
    console.error('Failed to get plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

/**
 * GET /api/sideshift/pair/:depositCoin/:settleCoin
 * Get pair information including min/max deposit amounts
 */
router.get('/pair/:depositCoin/:settleCoin', async (req: Request, res: Response) => {
  try {
    const { depositCoin, settleCoin } = req.params;
    const { depositNetwork, settleNetwork } = req.query;
    const userIp = getUserIp(req);

    const pairInfo = await sideshiftService.getPair(
      depositCoin,
      settleCoin,
      depositNetwork as string | undefined,
      settleNetwork as string | undefined,
      userIp
    );

    res.json({
      min: pairInfo.min,
      max: pairInfo.max,
      rate: pairInfo.rate,
      depositCoin: pairInfo.depositCoin,
      settleCoin: pairInfo.settleCoin,
      depositNetwork: pairInfo.depositNetwork,
      settleNetwork: pairInfo.settleNetwork,
    });
  } catch (error) {
    console.error('Failed to get pair info:', error);
    res.status(500).json({ error: 'Failed to fetch pair information' });
  }
});

/**
 * POST /api/sideshift/create-subscription-shift
 * Create a new shift for subscription payment
 */
router.post('/create-subscription-shift', async (req: Request, res: Response) => {
  try {
    const userIp = getUserIp(req);

    // Validate request
    const parseResult = CreateSubscriptionShiftRequest.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid request', details: parseResult.error.errors });
    }

    const data = parseResult.data;

    // Validate chain
    if (!subscriptionService.isChainSupported(data.chainId)) {
      return res.status(400).json({ error: 'Unsupported chain' });
    }

    // Get plan details
    const plan = await subscriptionService.getPlan(data.chainId, data.planId);
    if (!plan.active) {
      return res.status(400).json({ error: 'Plan is not active' });
    }

    // Get chain configuration
    const chainConfig = subscriptionService.getChainConfig(data.chainId);

    // Get treasury address as settlement address
    const settleAddress = await subscriptionService.getTreasuryAddress(data.chainId);

    // Determine shift type (fixed if amount provided, variable otherwise)
    const shiftType = data.sourceAmount ? 'fixed' : 'variable';

    // Get source network if not provided
    let sourceNetwork = data.sourceNetwork;
    if (!sourceNetwork) {
      const networks = await sideshiftService.getNetworksForCoin(data.sourceCoin, userIp);
      sourceNetwork = networks[0];
    }

    // Validate amount if provided (for fixed shifts)
    if (shiftType === 'fixed' && data.sourceAmount) {
      try {
        const pairInfo = await sideshiftService.getPair(
          data.sourceCoin,
          chainConfig.settleCoin,
          sourceNetwork,
          chainConfig.settleNetwork,
          userIp
        );

        const requestedAmount = parseFloat(data.sourceAmount);
        const minAmount = parseFloat(pairInfo.min);
        const maxAmount = parseFloat(pairInfo.max);

        if (requestedAmount < minAmount) {
          return res.status(400).json({
            error: `Amount too low. Minimum deposit: ${pairInfo.min} ${data.sourceCoin}`,
            details: { requestedAmount: data.sourceAmount, minimumAmount: pairInfo.min, maximumAmount: pairInfo.max },
          });
        }

        if (requestedAmount > maxAmount) {
          return res.status(400).json({
            error: `Amount too high. Maximum deposit: ${pairInfo.max} ${data.sourceCoin}`,
            details: { requestedAmount: data.sourceAmount, minimumAmount: pairInfo.min, maximumAmount: pairInfo.max },
          });
        }
      } catch (error) {
        console.warn('Could not validate amount limits, proceeding anyway');
      }
    }

    // Create SideShift order
    const sideshiftOrder = await sideshiftService.createShift(
      shiftType,
      {
        settleAddress,
        depositCoin: data.sourceCoin,
        settleCoin: chainConfig.settleCoin,
        depositNetwork: sourceNetwork,
        settleNetwork: chainConfig.settleNetwork,
        depositAmount: data.sourceAmount,
        refundAddress: data.refundAddress,
      },
      userIp
    );

    // Create shift record
    const shiftId = uuidv4();
    const now = new Date();

    const shift: SubscriptionShift = {
      id: shiftId,
      sideshiftOrderId: sideshiftOrder.id,
      userAddress: data.userAddress,
      planId: data.planId,
      chainId: data.chainId,
      sourceAsset: data.sourceCoin,
      destAsset: chainConfig.settleCoin,
      sourceNetwork: sourceNetwork,
      destNetwork: chainConfig.settleNetwork,
      sourceAmount: data.sourceAmount,
      depositAddress: sideshiftOrder.depositAddress,
      settleAddress: sideshiftOrder.settleAddress,
      shiftType: sideshiftOrder.type,
      status: sideshiftOrder.status,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(sideshiftOrder.expiresAt),
    };

    createShift(shift);

    console.log(`Subscription shift created: ${shiftId} for user ${data.userAddress}, plan ${data.planId}`);

    res.status(201).json({
      shift,
      sideshift: {
        orderId: sideshiftOrder.id,
        depositAddress: sideshiftOrder.depositAddress,
        depositCoin: sideshiftOrder.depositCoin,
        depositNetwork: sideshiftOrder.depositNetwork,
        depositMin: sideshiftOrder.depositMin,
        depositMax: sideshiftOrder.depositMax,
        expiresAt: sideshiftOrder.expiresAt,
      },
    });
  } catch (error) {
    console.error('Failed to create shift:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/sideshift/shift-status/:id
 * Get shift status
 */
router.get('/shift-status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userIp = getUserIp(req);

    // Get from our storage
    const storedShift = getShiftById(id);
    if (!storedShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Get latest status from SideShift
    const sideshiftData = await sideshiftService.getShift(storedShift.sideshiftOrderId, userIp);

    // Update our storage if status changed
    if (sideshiftData.status !== storedShift.status) {
      updateShift(id, { status: sideshiftData.status });
    }

    res.json({
      shift: { ...storedShift, status: sideshiftData.status },
      sideshiftData,
    });
  } catch (error) {
    console.error('Failed to get shift status:', error);
    res.status(500).json({ error: 'Failed to get shift status' });
  }
});

/**
 * GET /api/sideshift/user/:address
 * Get all shifts for a user
 */
router.get('/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const shifts = getShiftsByUserAddress(address);
    res.json({ shifts });
  } catch (error) {
    console.error('Failed to get user shifts:', error);
    res.status(500).json({ error: 'Failed to get user shifts' });
  }
});

/**
 * POST /api/sideshift/webhook
 * Webhook endpoint for SideShift callbacks
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature if secret is configured
    if (settings.sideshiftWebhookSecret) {
      const signature = req.headers['x-sideshift-signature'] as string;
      if (!signature) {
        console.warn('Webhook received without signature');
        return res.status(401).json({ error: 'Missing signature' });
      }

      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', settings.sideshiftWebhookSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Validate payload
    const parseResult = WebhookPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.warn('Invalid webhook payload:', parseResult.error);
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const payload = parseResult.data;
    console.log(`Webhook received: orderId=${payload.orderId}, status=${payload.status}`);

    // Find shift in our storage
    const shift = getShiftBySideshiftOrderId(payload.orderId);
    if (!shift) {
      console.warn('Webhook for unknown shift:', payload.orderId);
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Update shift status
    updateShift(shift.id, {
      status: payload.status,
      depositTxHash: payload.depositHash,
      settleTxHash: payload.settleHash,
      destAmount: payload.settleAmount,
      ...(payload.status === 'settled' ? { completedAt: new Date() } : {}),
    });

    // Handle settled shifts - grant subscription
    if (payload.status === 'settled') {
      console.log(`Shift ${shift.id} settled. Granting subscription to ${shift.userAddress}`);

      try {
        // Grant subscription via smart contract
        const txHash = await subscriptionService.grantSubscription(
          shift.chainId as any,
          shift.userAddress as `0x${string}`,
          shift.planId
        );

        // Update shift with subscription transaction hash
        updateShift(shift.id, {
          subscriptionTxHash: txHash,
        });

        console.log(`Subscription granted! TX: ${txHash}`);
      } catch (error) {
        console.error('Failed to grant subscription:', error);
        // Don't fail the webhook - shift is still settled
        // We can retry granting later or handle manually
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
export { router as sideshiftRouter };
