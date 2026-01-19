import { eq, and, desc, sql } from 'drizzle-orm';
import { db, contentEpochStats, type ContentEpochStat, type NewContentEpochStat } from '../index.js';

export class ContentEpochStatsRepository {
  async findAll(): Promise<ContentEpochStat[]> {
    return db.select().from(contentEpochStats).orderBy(desc(contentEpochStats.createdAt));
  }

  async findById(id: string): Promise<ContentEpochStat | undefined> {
    const results = await db.select().from(contentEpochStats).where(eq(contentEpochStats.id, id)).limit(1);
    return results[0];
  }

  async findByEpochId(epochId: string): Promise<ContentEpochStat[]> {
    return db
      .select()
      .from(contentEpochStats)
      .where(eq(contentEpochStats.epochId, epochId))
      .orderBy(desc(contentEpochStats.viewCount));
  }

  async findByContentId(contentId: string): Promise<ContentEpochStat[]> {
    return db
      .select()
      .from(contentEpochStats)
      .where(eq(contentEpochStats.contentId, contentId))
      .orderBy(desc(contentEpochStats.createdAt));
  }

  async findByCreatorId(creatorId: string): Promise<ContentEpochStat[]> {
    return db
      .select()
      .from(contentEpochStats)
      .where(eq(contentEpochStats.creatorId, creatorId))
      .orderBy(desc(contentEpochStats.createdAt));
  }

  async findByEpochIdAndContentId(epochId: string, contentId: string): Promise<ContentEpochStat | undefined> {
    const results = await db
      .select()
      .from(contentEpochStats)
      .where(
        and(
          eq(contentEpochStats.epochId, epochId),
          eq(contentEpochStats.contentId, contentId)
        )
      )
      .limit(1);
    return results[0];
  }

  async findTopContentByEpoch(epochId: string, limit: number = 10): Promise<ContentEpochStat[]> {
    return db
      .select()
      .from(contentEpochStats)
      .where(eq(contentEpochStats.epochId, epochId))
      .orderBy(
        desc(sql`${contentEpochStats.viewCount} + ${contentEpochStats.studyCount} * 3 + ${contentEpochStats.completionCount} * 5`)
      )
      .limit(limit);
  }

  async findByCreatorIdAndEpochId(creatorId: string, epochId: string): Promise<ContentEpochStat[]> {
    return db
      .select()
      .from(contentEpochStats)
      .where(
        and(
          eq(contentEpochStats.creatorId, creatorId),
          eq(contentEpochStats.epochId, epochId)
        )
      );
  }

  async create(data: NewContentEpochStat): Promise<ContentEpochStat> {
    const results = await db.insert(contentEpochStats).values(data).returning();
    return results[0];
  }

  async createMany(items: NewContentEpochStat[]): Promise<ContentEpochStat[]> {
    if (items.length === 0) return [];
    return db.insert(contentEpochStats).values(items).returning();
  }

  async update(id: string, data: Partial<NewContentEpochStat>): Promise<ContentEpochStat | undefined> {
    const results = await db
      .update(contentEpochStats)
      .set(data)
      .where(eq(contentEpochStats.id, id))
      .returning();
    return results[0];
  }

  async incrementCounts(
    id: string,
    increments: {
      viewCount?: number;
      studyCount?: number;
      completionCount?: number;
      saveCount?: number;
      shareCount?: number;
    }
  ): Promise<ContentEpochStat | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    return this.update(id, {
      viewCount: existing.viewCount + (increments.viewCount ?? 0),
      studyCount: existing.studyCount + (increments.studyCount ?? 0),
      completionCount: existing.completionCount + (increments.completionCount ?? 0),
      saveCount: existing.saveCount + (increments.saveCount ?? 0),
      shareCount: existing.shareCount + (increments.shareCount ?? 0),
    });
  }

  async upsert(data: NewContentEpochStat): Promise<ContentEpochStat> {
    const existing = await this.findByEpochIdAndContentId(data.epochId, data.contentId);
    if (existing) {
      return (await this.update(existing.id, data))!;
    }
    return this.create(data);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(contentEpochStats).where(eq(contentEpochStats.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByEpochId(epochId: string): Promise<number> {
    const result = await db.delete(contentEpochStats).where(eq(contentEpochStats.epochId, epochId));
    return result.rowCount ?? 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(contentEpochStats);
    return results.length;
  }
}

export const contentEpochStatsRepository = new ContentEpochStatsRepository();
