import { eq, and, desc, sql } from 'drizzle-orm';
import { db, creatorPoints, type CreatorPoint, type NewCreatorPoint } from '../index.js';

export type PointsTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export class CreatorPointsRepository {
  async findAll(): Promise<CreatorPoint[]> {
    return db.select().from(creatorPoints).orderBy(desc(creatorPoints.createdAt));
  }

  async findById(id: string): Promise<CreatorPoint | undefined> {
    const results = await db.select().from(creatorPoints).where(eq(creatorPoints.id, id)).limit(1);
    return results[0];
  }

  async findByCreatorId(creatorId: string): Promise<CreatorPoint[]> {
    return db
      .select()
      .from(creatorPoints)
      .where(eq(creatorPoints.creatorId, creatorId))
      .orderBy(desc(creatorPoints.createdAt));
  }

  async findByEpochId(epochId: string): Promise<CreatorPoint[]> {
    return db
      .select()
      .from(creatorPoints)
      .where(eq(creatorPoints.epochId, epochId))
      .orderBy(desc(creatorPoints.pointsEarned));
  }

  async findByCreatorIdAndEpochId(creatorId: string, epochId: string): Promise<CreatorPoint | undefined> {
    const results = await db
      .select()
      .from(creatorPoints)
      .where(
        and(
          eq(creatorPoints.creatorId, creatorId),
          eq(creatorPoints.epochId, epochId)
        )
      )
      .limit(1);
    return results[0];
  }

  async findByTier(tier: PointsTier): Promise<CreatorPoint[]> {
    return db
      .select()
      .from(creatorPoints)
      .where(eq(creatorPoints.tier, tier))
      .orderBy(desc(creatorPoints.pointsEarned));
  }

  async getLeaderboard(epochId: string, limit: number = 10): Promise<CreatorPoint[]> {
    return db
      .select()
      .from(creatorPoints)
      .where(eq(creatorPoints.epochId, epochId))
      .orderBy(desc(creatorPoints.pointsEarned))
      .limit(limit);
  }

  async getTotalPointsByCreator(creatorId: string): Promise<number> {
    const results = await db
      .select({ total: sql<number>`sum(${creatorPoints.pointsEarned})` })
      .from(creatorPoints)
      .where(eq(creatorPoints.creatorId, creatorId));
    return results[0]?.total ?? 0;
  }

  async create(data: NewCreatorPoint): Promise<CreatorPoint> {
    const results = await db.insert(creatorPoints).values(data).returning();
    return results[0];
  }

  async createMany(items: NewCreatorPoint[]): Promise<CreatorPoint[]> {
    if (items.length === 0) return [];
    return db.insert(creatorPoints).values(items).returning();
  }

  async update(id: string, data: Partial<NewCreatorPoint>): Promise<CreatorPoint | undefined> {
    const results = await db
      .update(creatorPoints)
      .set(data)
      .where(eq(creatorPoints.id, id))
      .returning();
    return results[0];
  }

  async upsert(data: NewCreatorPoint): Promise<CreatorPoint> {
    const existing = await this.findByCreatorIdAndEpochId(data.creatorId, data.epochId);
    if (existing) {
      return (await this.update(existing.id, data))!;
    }
    return this.create(data);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(creatorPoints).where(eq(creatorPoints.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(creatorPoints);
    return results.length;
  }
}

export const creatorPointsRepository = new CreatorPointsRepository();
