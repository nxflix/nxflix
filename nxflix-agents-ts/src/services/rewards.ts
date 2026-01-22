/**
 * Rewards Service - Manages creator points, rewards, and daily engagement rewards.
 *
 * Creator Rewards Flow:
 * 1. Weekly epoch ends
 * 2. Aggregate content_epoch_stats
 * 3. Calculate points per creator
 * 4. Insert into creator_points + creator_rewards (pending)
 * 5. Product owner reviews pending rewards
 * 6. Owner sets token_amount for approved rewards
 * 7. (Future) Mint/transfer JLPT tokens
 *
 * Daily Rewards Flow:
 * 1. User completes qualifying task
 * 2. Check if they've earned today's reward
 * 3. Generate random reward based on rarity
 * 4. User claims reward
 */

import { v4 as uuid } from 'uuid';
import {
  creatorPointsRepository,
  creatorRewardsRepository,
  dailyRewardsRepository,
  contentEpochStatsRepository,
  type PointsTier,
  type RewardRarity,
} from '../db/repositories/index.js';
import { epochService } from './epoch.js';
import { EVENT_WEIGHTS } from './analytics.js';
import type {
  CreatorPoint,
  NewCreatorPoint,
  CreatorReward,
  NewCreatorReward,
  DailyReward,
  NewDailyReward,
} from '../db/schema.js';

// Points thresholds for tiers
export const TIER_THRESHOLDS: Record<PointsTier, { min: number; max: number }> = {
  bronze: { min: 10, max: 50 },
  silver: { min: 51, max: 200 },
  gold: { min: 201, max: 500 },
  platinum: { min: 501, max: Infinity },
};

// Daily reward pool with rarities and weights
export const DAILY_REWARD_POOL: Array<{
  rarity: RewardRarity;
  weight: number;
  type: string;
  value: string;
  description: string;
}> = [
  // Common (60%)
  { rarity: 'common', weight: 20, type: 'bonus_xp', value: '5', description: '5 bonus XP' },
  { rarity: 'common', weight: 20, type: 'encouragement', value: 'keep_going', description: 'Fun encouragement message' },
  { rarity: 'common', weight: 20, type: 'streak_freeze', value: '1', description: 'Streak freeze token' },

  // Uncommon (30%)
  { rarity: 'uncommon', weight: 10, type: 'discount', value: '10', description: '10% discount (24hr expiry)' },
  { rarity: 'uncommon', weight: 10, type: 'premium_trial', value: '1_day', description: 'Unlock premium for 1 day' },
  { rarity: 'uncommon', weight: 10, type: 'avatar_frame', value: 'special_1', description: 'Custom avatar frame' },

  // Rare (9%)
  { rarity: 'rare', weight: 3, type: 'discount', value: '25', description: '25% discount code' },
  { rarity: 'rare', weight: 3, type: 'premium_trial', value: '1_week', description: '1 week premium trial' },
  { rarity: 'rare', weight: 3, type: 'badge', value: 'special_achievement', description: 'Special achievement badge' },

  // Legendary (1%)
  { rarity: 'legendary', weight: 0.5, type: 'premium', value: '1_month', description: '1 month free premium' },
  { rarity: 'legendary', weight: 0.3, type: 'badge', value: 'lifetime', description: 'Lifetime badge' },
  { rarity: 'legendary', weight: 0.2, type: 'featured', value: 'homepage', description: 'Feature your content on homepage' },
];

export interface ProcessEpochResult {
  epochId: string;
  creatorsProcessed: number;
  pointsRecords: CreatorPoint[];
  rewardsRecords: CreatorReward[];
}

export interface DailyRewardResult {
  reward: DailyReward;
  isNewReward: boolean;
}

export class RewardsService {
  /**
   * Calculate tier based on points earned
   */
  calculateTier(points: number): PointsTier | null {
    if (points >= TIER_THRESHOLDS.platinum.min) return 'platinum';
    if (points >= TIER_THRESHOLDS.gold.min) return 'gold';
    if (points >= TIER_THRESHOLDS.silver.min) return 'silver';
    if (points >= TIER_THRESHOLDS.bronze.min) return 'bronze';
    return null;
  }

  /**
   * Calculate points from content stats
   */
  calculatePoints(stats: {
    viewCount: number;
    studyCount: number;
    completionCount: number;
    saveCount: number;
    shareCount: number;
  }): number {
    return (
      stats.viewCount * EVENT_WEIGHTS.view +
      stats.studyCount * EVENT_WEIGHTS.study +
      stats.completionCount * EVENT_WEIGHTS.complete +
      stats.saveCount * EVENT_WEIGHTS.save +
      stats.shareCount * EVENT_WEIGHTS.share
    );
  }

  /**
   * Process an epoch and calculate creator rewards
   */
  async processEpochRewards(epochId: string): Promise<ProcessEpochResult> {
    // Get all stats for this epoch
    const epochStats = await contentEpochStatsRepository.findByEpochId(epochId);

    // Group by creator
    const creatorStats = new Map<string, {
      viewCount: number;
      studyCount: number;
      completionCount: number;
      saveCount: number;
      shareCount: number;
    }>();

    for (const stat of epochStats) {
      if (!stat.creatorId) continue;

      if (!creatorStats.has(stat.creatorId)) {
        creatorStats.set(stat.creatorId, {
          viewCount: 0,
          studyCount: 0,
          completionCount: 0,
          saveCount: 0,
          shareCount: 0,
        });
      }

      const current = creatorStats.get(stat.creatorId)!;
      current.viewCount += stat.viewCount;
      current.studyCount += stat.studyCount;
      current.completionCount += stat.completionCount;
      current.saveCount += stat.saveCount;
      current.shareCount += stat.shareCount;
    }

    const pointsRecords: CreatorPoint[] = [];
    const rewardsRecords: CreatorReward[] = [];

    // Calculate points and create rewards for each creator
    for (const [creatorId, stats] of creatorStats) {
      const points = this.calculatePoints(stats);
      const tier = this.calculateTier(points);

      // Skip creators with no meaningful points
      if (points < TIER_THRESHOLDS.bronze.min) continue;

      // Create points record
      const pointsRecord: NewCreatorPoint = {
        id: uuid(),
        creatorId,
        epochId,
        pointsEarned: points,
        tier,
      };
      const savedPoints = await creatorPointsRepository.upsert(pointsRecord);
      pointsRecords.push(savedPoints);

      // Determine reward type based on tier
      let rewardType: string;
      let rewardValue: string;

      switch (tier) {
        case 'platinum':
          rewardType = 'tokens_pending';
          rewardValue = 'Eligible for JLPT token allocation';
          break;
        case 'gold':
          rewardType = 'feature';
          rewardValue = '2 weeks featured + priority support';
          break;
        case 'silver':
          rewardType = 'feature';
          rewardValue = '1 week featured';
          break;
        case 'bronze':
        default:
          rewardType = 'badge';
          rewardValue = 'Bronze creator badge';
          break;
      }

      // Create rewards record (pending review)
      const rewardRecord: NewCreatorReward = {
        id: uuid(),
        creatorId,
        epochId,
        pointsEarned: points,
        tier,
        rewardType,
        rewardValue,
        status: 'pending',
      };
      const savedReward = await creatorRewardsRepository.upsert(rewardRecord);
      rewardsRecords.push(savedReward);
    }

    return {
      epochId,
      creatorsProcessed: creatorStats.size,
      pointsRecords,
      rewardsRecords,
    };
  }

  /**
   * Get creator points for an epoch
   */
  async getCreatorPoints(creatorId: string, epochId?: string): Promise<CreatorPoint[]> {
    if (epochId) {
      const points = await creatorPointsRepository.findByCreatorIdAndEpochId(creatorId, epochId);
      return points ? [points] : [];
    }
    return creatorPointsRepository.findByCreatorId(creatorId);
  }

  /**
   * Get total points for a creator across all epochs
   */
  async getTotalCreatorPoints(creatorId: string): Promise<number> {
    return creatorPointsRepository.getTotalPointsByCreator(creatorId);
  }

  /**
   * Get leaderboard for an epoch
   */
  async getPointsLeaderboard(epochId?: string, limit: number = 10): Promise<CreatorPoint[]> {
    let targetEpochId = epochId;

    if (!targetEpochId) {
      const currentEpoch = await epochService.getCurrentEpoch('weekly');
      targetEpochId = currentEpoch.id;
    }

    return creatorPointsRepository.getLeaderboard(targetEpochId, limit);
  }

  /**
   * Get pending rewards for admin review
   */
  async getPendingRewards(): Promise<CreatorReward[]> {
    return creatorRewardsRepository.findPending();
  }

  /**
   * Approve a creator reward
   */
  async approveReward(
    rewardId: string,
    reviewedBy: string,
    tokenAmount?: number
  ): Promise<CreatorReward | undefined> {
    return creatorRewardsRepository.approve(rewardId, reviewedBy, tokenAmount);
  }

  /**
   * Reject a creator reward
   */
  async rejectReward(rewardId: string, reviewedBy: string): Promise<CreatorReward | undefined> {
    return creatorRewardsRepository.reject(rewardId, reviewedBy);
  }

  /**
   * Mark a reward as distributed
   */
  async markRewardDistributed(rewardId: string): Promise<CreatorReward | undefined> {
    return creatorRewardsRepository.markDistributed(rewardId);
  }

  /**
   * Get all rewards for a creator
   */
  async getCreatorRewards(creatorId: string): Promise<CreatorReward[]> {
    return creatorRewardsRepository.findByCreatorId(creatorId);
  }

  // ============================================================================
  // Daily Engagement Rewards
  // ============================================================================

  /**
   * Check if user has earned today's reward and generate if eligible
   */
  async checkAndGenerateDailyReward(
    userId: string,
    qualifyingTaskId: string,
    qualifyingTaskType: string
  ): Promise<DailyRewardResult> {
    // Check if user already has a reward for today
    const existingReward = await dailyRewardsRepository.findTodayReward(userId);

    if (existingReward) {
      return { reward: existingReward, isNewReward: false };
    }

    // Generate a new random reward
    const reward = this.generateRandomReward();

    const newReward: NewDailyReward = {
      id: uuid(),
      userId,
      rewardDate: new Date(),
      qualifyingTaskId,
      qualifyingTaskType,
      rewardRarity: reward.rarity,
      rewardType: reward.type,
      rewardValue: JSON.stringify({
        value: reward.value,
        description: reward.description,
      }),
      claimed: false,
    };

    const savedReward = await dailyRewardsRepository.create(newReward);
    return { reward: savedReward, isNewReward: true };
  }

  /**
   * Generate a random reward based on weighted probabilities
   */
  private generateRandomReward(): (typeof DAILY_REWARD_POOL)[0] {
    const totalWeight = DAILY_REWARD_POOL.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;

    for (const reward of DAILY_REWARD_POOL) {
      random -= reward.weight;
      if (random <= 0) {
        return reward;
      }
    }

    // Fallback to first reward
    return DAILY_REWARD_POOL[0];
  }

  /**
   * Claim a daily reward
   */
  async claimDailyReward(rewardId: string, userId: string): Promise<DailyReward | undefined> {
    const reward = await dailyRewardsRepository.findById(rewardId);

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.userId !== userId) {
      throw new Error('Reward does not belong to this user');
    }

    if (reward.claimed) {
      throw new Error('Reward has already been claimed');
    }

    return dailyRewardsRepository.claim(rewardId);
  }

  /**
   * Get user's daily rewards history
   */
  async getUserDailyRewards(userId: string): Promise<DailyReward[]> {
    return dailyRewardsRepository.findByUserId(userId);
  }

  /**
   * Get user's unclaimed rewards
   */
  async getUnclaimedRewards(userId: string): Promise<DailyReward[]> {
    return dailyRewardsRepository.findUnclaimedByUserId(userId);
  }

  /**
   * Get user's current streak
   */
  async getUserStreak(userId: string): Promise<number> {
    return dailyRewardsRepository.getStreakCount(userId);
  }

  /**
   * Check if user has already earned today's reward
   */
  async hasEarnedTodayReward(userId: string): Promise<boolean> {
    return dailyRewardsRepository.hasEarnedTodayReward(userId);
  }
}

export const rewardsService = new RewardsService();
