import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  rewardsService,
  featuredContentService,
  epochService,
  analyticsService,
} from '../services/index.js';

const adminRouter = Router();

// Request schemas
const ApproveRewardSchema = z.object({
  reviewedBy: z.string(),
  tokenAmount: z.number().optional(),
});

const RejectRewardSchema = z.object({
  reviewedBy: z.string(),
});

const SetFeaturedSchema = z.object({
  contentId: z.string(),
  contentType: z.string(),
  creatorId: z.string().optional(),
  reason: z.string().optional(),
});

const ProcessEpochSchema = z.object({
  epochId: z.string(),
});

// ============================================================================
// Reward Management
// ============================================================================

// GET /api/admin/rewards/pending - Get pending rewards for review
adminRouter.get('/rewards/pending', async (_req: Request, res: Response) => {
  try {
    const rewards = await rewardsService.getPendingRewards();
    res.json({ rewards, count: rewards.length });
  } catch (error) {
    console.error('Error fetching pending rewards:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/rewards/:rewardId/approve - Approve a creator reward
adminRouter.post('/rewards/:rewardId/approve', async (req: Request<{ rewardId: string }>, res: Response) => {
  try {
    const { reviewedBy, tokenAmount } = ApproveRewardSchema.parse(req.body);
    const reward = await rewardsService.approveReward(req.params.rewardId, reviewedBy, tokenAmount);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    res.json({ success: true, reward });
  } catch (error) {
    console.error('Error approving reward:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/rewards/:rewardId/reject - Reject a creator reward
adminRouter.post('/rewards/:rewardId/reject', async (req: Request<{ rewardId: string }>, res: Response) => {
  try {
    const { reviewedBy } = RejectRewardSchema.parse(req.body);
    const reward = await rewardsService.rejectReward(req.params.rewardId, reviewedBy);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    res.json({ success: true, reward });
  } catch (error) {
    console.error('Error rejecting reward:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/rewards/:rewardId/distribute - Mark reward as distributed
adminRouter.post('/rewards/:rewardId/distribute', async (req: Request<{ rewardId: string }>, res: Response) => {
  try {
    const reward = await rewardsService.markRewardDistributed(req.params.rewardId);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    res.json({ success: true, reward });
  } catch (error) {
    console.error('Error marking reward distributed:', error);
    res.status(500).json({ error: String(error) });
  }
});

// ============================================================================
// Featured Content Management
// ============================================================================

// POST /api/admin/featured/select - Manually select featured content
adminRouter.post('/featured/select', async (req: Request, res: Response) => {
  try {
    const { contentId, contentType, creatorId, reason } = SetFeaturedSchema.parse(req.body);
    const featured = await featuredContentService.setFeaturedContent(
      contentId,
      contentType,
      creatorId,
      reason
    );

    res.json({ success: true, featured });
  } catch (error) {
    console.error('Error setting featured content:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/featured/auto-select - Trigger automatic selection
adminRouter.post('/featured/auto-select', async (_req: Request, res: Response) => {
  try {
    const featured = await featuredContentService.selectTodayFeatured();
    res.json({ success: true, featured });
  } catch (error) {
    console.error('Error auto-selecting featured:', error);
    res.status(500).json({ error: String(error) });
  }
});

// ============================================================================
// Epoch Management
// ============================================================================

// GET /api/admin/epochs - Get all epochs
adminRouter.get('/epochs', async (_req: Request, res: Response) => {
  try {
    const epochs = await epochService.getAllEpochs();
    res.json({ epochs, count: epochs.length });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/epochs/rollover - Trigger epoch rollover check
adminRouter.post('/epochs/rollover', async (_req: Request, res: Response) => {
  try {
    const completed = await epochService.checkAndRolloverEpochs();
    res.json({
      success: true,
      completedEpochs: completed.length,
      epochs: completed,
    });
  } catch (error) {
    console.error('Error during epoch rollover:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/epochs/initialize - Initialize all epoch types
adminRouter.post('/epochs/initialize', async (_req: Request, res: Response) => {
  try {
    await epochService.initializeEpochs();
    const activeEpochs = await epochService.getActiveEpochs();
    res.json({ success: true, epochs: activeEpochs });
  } catch (error) {
    console.error('Error initializing epochs:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/epochs/:epochId/process - Process epoch rewards
adminRouter.post('/epochs/:epochId/process', async (req: Request<{ epochId: string }>, res: Response) => {
  try {
    const result = await rewardsService.processEpochRewards(req.params.epochId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error processing epoch rewards:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/admin/epochs/:epochId/aggregate - Aggregate epoch stats
adminRouter.post('/epochs/:epochId/aggregate', async (req: Request<{ epochId: string }>, res: Response) => {
  try {
    await analyticsService.aggregateEpochStats(req.params.epochId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error aggregating epoch stats:', error);
    res.status(500).json({ error: String(error) });
  }
});

// ============================================================================
// Dashboard Stats
// ============================================================================

// GET /api/admin/stats - Get overall admin dashboard stats
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Get pending rewards count
    const pendingRewards = await rewardsService.getPendingRewards();

    // Get active epochs
    const activeEpochs = await epochService.getActiveEpochs();

    // Get today's featured
    const todayFeatured = await featuredContentService.getTodayFeatured();

    res.json({
      pendingRewardsCount: pendingRewards.length,
      activeEpochs: {
        daily: activeEpochs.daily?.id || null,
        weekly: activeEpochs.weekly?.id || null,
        monthly: activeEpochs.monthly?.id || null,
      },
      hasTodayFeatured: todayFeatured !== null,
      todayFeatured: todayFeatured
        ? {
            id: todayFeatured.id,
            contentId: todayFeatured.contentId,
            contentType: todayFeatured.contentType,
            reason: todayFeatured.featureReason,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: String(error) });
  }
});

export { adminRouter };
