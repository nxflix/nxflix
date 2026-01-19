import { eq, and, desc } from 'drizzle-orm';
import { db, creatorRewards, type CreatorReward, type NewCreatorReward } from '../index.js';

export type RewardStatus = 'pending' | 'approved' | 'distributed' | 'rejected';
export type RewardType = 'badge' | 'feature' | 'tokens_pending';

export class CreatorRewardsRepository {
  async findAll(): Promise<CreatorReward[]> {
    return db.select().from(creatorRewards).orderBy(desc(creatorRewards.createdAt));
  }

  async findById(id: string): Promise<CreatorReward | undefined> {
    const results = await db.select().from(creatorRewards).where(eq(creatorRewards.id, id)).limit(1);
    return results[0];
  }

  async findByCreatorId(creatorId: string): Promise<CreatorReward[]> {
    return db
      .select()
      .from(creatorRewards)
      .where(eq(creatorRewards.creatorId, creatorId))
      .orderBy(desc(creatorRewards.createdAt));
  }

  async findByEpochId(epochId: string): Promise<CreatorReward[]> {
    return db
      .select()
      .from(creatorRewards)
      .where(eq(creatorRewards.epochId, epochId))
      .orderBy(desc(creatorRewards.pointsEarned));
  }

  async findByStatus(status: RewardStatus): Promise<CreatorReward[]> {
    return db
      .select()
      .from(creatorRewards)
      .where(eq(creatorRewards.status, status))
      .orderBy(desc(creatorRewards.createdAt));
  }

  async findPending(): Promise<CreatorReward[]> {
    return this.findByStatus('pending');
  }

  async findByCreatorIdAndEpochId(creatorId: string, epochId: string): Promise<CreatorReward | undefined> {
    const results = await db
      .select()
      .from(creatorRewards)
      .where(
        and(
          eq(creatorRewards.creatorId, creatorId),
          eq(creatorRewards.epochId, epochId)
        )
      )
      .limit(1);
    return results[0];
  }

  async create(data: NewCreatorReward): Promise<CreatorReward> {
    const results = await db.insert(creatorRewards).values(data).returning();
    return results[0];
  }

  async createMany(items: NewCreatorReward[]): Promise<CreatorReward[]> {
    if (items.length === 0) return [];
    return db.insert(creatorRewards).values(items).returning();
  }

  async update(id: string, data: Partial<NewCreatorReward>): Promise<CreatorReward | undefined> {
    const results = await db
      .update(creatorRewards)
      .set(data)
      .where(eq(creatorRewards.id, id))
      .returning();
    return results[0];
  }

  async approve(id: string, reviewedBy: string, tokenAmount?: number): Promise<CreatorReward | undefined> {
    return this.update(id, {
      status: 'approved',
      reviewedBy,
      reviewedAt: new Date(),
      tokenAmount,
    });
  }

  async reject(id: string, reviewedBy: string): Promise<CreatorReward | undefined> {
    return this.update(id, {
      status: 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
    });
  }

  async markDistributed(id: string): Promise<CreatorReward | undefined> {
    return this.update(id, {
      status: 'distributed',
      distributedAt: new Date(),
    });
  }

  async upsert(data: NewCreatorReward): Promise<CreatorReward> {
    const existing = await this.findByCreatorIdAndEpochId(data.creatorId, data.epochId);
    if (existing) {
      return (await this.update(existing.id, data))!;
    }
    return this.create(data);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(creatorRewards).where(eq(creatorRewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(creatorRewards);
    return results.length;
  }

  async countByStatus(status: RewardStatus): Promise<number> {
    const results = await db.select().from(creatorRewards).where(eq(creatorRewards.status, status));
    return results.length;
  }
}

export const creatorRewardsRepository = new CreatorRewardsRepository();
