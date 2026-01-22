import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db, dailyRewards, type DailyReward, type NewDailyReward } from '../index.js';

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export class DailyRewardsRepository {
  async findAll(): Promise<DailyReward[]> {
    return db.select().from(dailyRewards).orderBy(desc(dailyRewards.rewardDate));
  }

  async findById(id: string): Promise<DailyReward | undefined> {
    const results = await db.select().from(dailyRewards).where(eq(dailyRewards.id, id)).limit(1);
    return results[0];
  }

  async findByUserId(userId: string): Promise<DailyReward[]> {
    return db
      .select()
      .from(dailyRewards)
      .where(eq(dailyRewards.userId, userId))
      .orderBy(desc(dailyRewards.rewardDate));
  }

  async findByUserIdAndDate(userId: string, date: Date): Promise<DailyReward | undefined> {
    // Normalize to start of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await db
      .select()
      .from(dailyRewards)
      .where(
        and(
          eq(dailyRewards.userId, userId),
          gte(dailyRewards.rewardDate, startOfDay),
          lte(dailyRewards.rewardDate, endOfDay)
        )
      )
      .limit(1);
    return results[0];
  }

  async findTodayReward(userId: string): Promise<DailyReward | undefined> {
    return this.findByUserIdAndDate(userId, new Date());
  }

  async findUnclaimedByUserId(userId: string): Promise<DailyReward[]> {
    return db
      .select()
      .from(dailyRewards)
      .where(
        and(
          eq(dailyRewards.userId, userId),
          eq(dailyRewards.claimed, false)
        )
      )
      .orderBy(desc(dailyRewards.rewardDate));
  }

  async findByRarity(rarity: RewardRarity): Promise<DailyReward[]> {
    return db
      .select()
      .from(dailyRewards)
      .where(eq(dailyRewards.rewardRarity, rarity))
      .orderBy(desc(dailyRewards.rewardDate));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<DailyReward[]> {
    return db
      .select()
      .from(dailyRewards)
      .where(
        and(
          gte(dailyRewards.rewardDate, startDate),
          lte(dailyRewards.rewardDate, endDate)
        )
      )
      .orderBy(desc(dailyRewards.rewardDate));
  }

  async hasEarnedTodayReward(userId: string): Promise<boolean> {
    const reward = await this.findTodayReward(userId);
    return reward !== undefined;
  }

  async create(data: NewDailyReward): Promise<DailyReward> {
    const results = await db.insert(dailyRewards).values(data).returning();
    return results[0];
  }

  async update(id: string, data: Partial<NewDailyReward>): Promise<DailyReward | undefined> {
    const results = await db
      .update(dailyRewards)
      .set(data)
      .where(eq(dailyRewards.id, id))
      .returning();
    return results[0];
  }

  async claim(id: string): Promise<DailyReward | undefined> {
    return this.update(id, {
      claimed: true,
      claimedAt: new Date(),
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(dailyRewards).where(eq(dailyRewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(dailyRewards);
    return results.length;
  }

  async countByUserId(userId: string): Promise<number> {
    const results = await db.select().from(dailyRewards).where(eq(dailyRewards.userId, userId));
    return results.length;
  }

  async getStreakCount(userId: string): Promise<number> {
    // Get all rewards ordered by date descending
    const rewards = await db
      .select()
      .from(dailyRewards)
      .where(eq(dailyRewards.userId, userId))
      .orderBy(desc(dailyRewards.rewardDate));

    if (rewards.length === 0) return 0;

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (const reward of rewards) {
      const rewardDate = new Date(reward.rewardDate);
      rewardDate.setHours(0, 0, 0, 0);

      if (rewardDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (rewardDate.getTime() < expectedDate.getTime()) {
        // Check if we missed a day
        const daysDiff = Math.floor((expectedDate.getTime() - rewardDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 1) {
          break; // Streak broken
        }
        streak++;
        expectedDate = new Date(rewardDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
    }

    return streak;
  }
}

export const dailyRewardsRepository = new DailyRewardsRepository();
