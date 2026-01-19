import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  rewardsService,
  featuredContentService,
  TIER_THRESHOLDS,
  DAILY_REWARD_POOL,
  FEATURE_REASONS,
} from '../services/index.js';

const rewardsRouter = Router();

// Request schemas
const CheckDailyRewardSchema = z.object({
  userId: z.string(),
  qualifyingTaskId: z.string(),
  qualifyingTaskType: z.string(),
});

const ClaimRewardSchema = z.object({
  userId: z.string(),
});

// ============================================================================
// Creator Points & Rewards
// ============================================================================

// GET /api/rewards/creator/:creatorId/points - Get creator's points history
rewardsRouter.get('/creator/:creatorId/points', async (req: Request<{ creatorId: string }>, res: Response) => {
  try {
    const epochId = req.query.epochId as string | undefined;
    const points = await rewardsService.getCreatorPoints(req.params.creatorId, epochId);
    res.json({ points, count: points.length });
  } catch (error) {
    console.error('Error fetching creator points:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/creator/:creatorId/total - Get creator's total points
rewardsRouter.get('/creator/:creatorId/total', async (req: Request<{ creatorId: string }>, res: Response) => {
  try {
    const totalPoints = await rewardsService.getTotalCreatorPoints(req.params.creatorId);
    const tier = rewardsService.calculateTier(totalPoints);
    res.json({ totalPoints, tier });
  } catch (error) {
    console.error('Error fetching total points:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/creator/:creatorId/rewards - Get creator's rewards history
rewardsRouter.get('/creator/:creatorId/rewards', async (req: Request<{ creatorId: string }>, res: Response) => {
  try {
    const rewards = await rewardsService.getCreatorRewards(req.params.creatorId);
    res.json({ rewards, count: rewards.length });
  } catch (error) {
    console.error('Error fetching creator rewards:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/leaderboard - Get points leaderboard
rewardsRouter.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const epochId = req.query.epochId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await rewardsService.getPointsLeaderboard(epochId, limit);
    res.json({ leaderboard, count: leaderboard.length });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/tiers - Get tier thresholds
rewardsRouter.get('/tiers', (_req: Request, res: Response) => {
  res.json({ tiers: TIER_THRESHOLDS });
});

// ============================================================================
// Daily Engagement Rewards
// ============================================================================

// POST /api/rewards/daily/check - Check if user has earned today's reward
rewardsRouter.post('/daily/check', async (req: Request, res: Response) => {
  try {
    const request = CheckDailyRewardSchema.parse(req.body);
    const result = await rewardsService.checkAndGenerateDailyReward(
      request.userId,
      request.qualifyingTaskId,
      request.qualifyingTaskType
    );

    res.json({
      success: true,
      reward: result.reward,
      isNewReward: result.isNewReward,
    });
  } catch (error) {
    console.error('Error checking daily reward:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/daily/:userId/today - Get user's today reward status
rewardsRouter.get('/daily/:userId/today', async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const hasReward = await rewardsService.hasEarnedTodayReward(req.params.userId);

    if (!hasReward) {
      res.json({ hasReward: false, reward: null });
      return;
    }

    // Get the reward details
    const rewards = await rewardsService.getUserDailyRewards(req.params.userId);
    const todayReward = rewards.find((r) => {
      const rewardDate = new Date(r.rewardDate);
      const today = new Date();
      return (
        rewardDate.getFullYear() === today.getFullYear() &&
        rewardDate.getMonth() === today.getMonth() &&
        rewardDate.getDate() === today.getDate()
      );
    });

    res.json({ hasReward: true, reward: todayReward });
  } catch (error) {
    console.error('Error checking today reward:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/rewards/daily/:rewardId/claim - Claim a daily reward
rewardsRouter.post('/daily/:rewardId/claim', async (req: Request<{ rewardId: string }>, res: Response) => {
  try {
    const { userId } = ClaimRewardSchema.parse(req.body);
    const reward = await rewardsService.claimDailyReward(req.params.rewardId, userId);

    res.json({ success: true, reward });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/rewards/daily/:userId/history - Get user's daily rewards history
rewardsRouter.get('/daily/:userId/history', async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const rewards = await rewardsService.getUserDailyRewards(req.params.userId);
    res.json({ rewards, count: rewards.length });
  } catch (error) {
    console.error('Error fetching daily rewards history:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/daily/:userId/unclaimed - Get user's unclaimed rewards
rewardsRouter.get('/daily/:userId/unclaimed', async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const rewards = await rewardsService.getUnclaimedRewards(req.params.userId);
    res.json({ rewards, count: rewards.length });
  } catch (error) {
    console.error('Error fetching unclaimed rewards:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/daily/:userId/streak - Get user's current streak
rewardsRouter.get('/daily/:userId/streak', async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const streak = await rewardsService.getUserStreak(req.params.userId);
    res.json({ streak });
  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/daily/pool - Get daily reward pool info
rewardsRouter.get('/daily/pool', (_req: Request, res: Response) => {
  // Return pool info without internal weights
  const poolInfo = DAILY_REWARD_POOL.map(({ rarity, type, description }) => ({
    rarity,
    type,
    description,
  }));

  const rarityDistribution = {
    common: '60%',
    uncommon: '30%',
    rare: '9%',
    legendary: '1%',
  };

  res.json({ pool: poolInfo, distribution: rarityDistribution });
});

// ============================================================================
// Featured Content
// ============================================================================

// GET /api/rewards/featured/today - Get today's featured content
rewardsRouter.get('/featured/today', async (_req: Request, res: Response) => {
  try {
    const featured = await featuredContentService.getTodayFeatured();
    res.json({ featured });
  } catch (error) {
    console.error('Error fetching featured content:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/featured/recent - Get recent featured content
rewardsRouter.get('/featured/recent', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const featured = await featuredContentService.getRecentFeatured(days);
    res.json({ featured, count: featured.length });
  } catch (error) {
    console.error('Error fetching recent featured:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/featured/candidates - Get candidates for featuring
rewardsRouter.get('/featured/candidates', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const candidates = await featuredContentService.getCandidates(limit);
    res.json({ candidates, count: candidates.length });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/rewards/featured/:featuredId/impression - Record impression
rewardsRouter.post('/featured/:featuredId/impression', async (req: Request<{ featuredId: string }>, res: Response) => {
  try {
    await featuredContentService.recordImpression(req.params.featuredId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/rewards/featured/:featuredId/click - Record click
rewardsRouter.post('/featured/:featuredId/click', async (req: Request<{ featuredId: string }>, res: Response) => {
  try {
    await featuredContentService.recordClick(req.params.featuredId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/featured/:featuredId/stats - Get featured content stats
rewardsRouter.get('/featured/:featuredId/stats', async (req: Request<{ featuredId: string }>, res: Response) => {
  try {
    const stats = await featuredContentService.getFeaturedStats(req.params.featuredId);
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching featured stats:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/rewards/featured/reasons - Get feature reasons
rewardsRouter.get('/featured/reasons', (_req: Request, res: Response) => {
  res.json({ reasons: FEATURE_REASONS });
});

export { rewardsRouter };
