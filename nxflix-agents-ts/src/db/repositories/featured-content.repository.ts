import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db, featuredContent, type FeaturedContent, type NewFeaturedContent } from '../index.js';

export class FeaturedContentRepository {
  async findAll(): Promise<FeaturedContent[]> {
    return db.select().from(featuredContent).orderBy(desc(featuredContent.featureDate));
  }

  async findById(id: string): Promise<FeaturedContent | undefined> {
    const results = await db.select().from(featuredContent).where(eq(featuredContent.id, id)).limit(1);
    return results[0];
  }

  async findByContentId(contentId: string): Promise<FeaturedContent[]> {
    return db
      .select()
      .from(featuredContent)
      .where(eq(featuredContent.contentId, contentId))
      .orderBy(desc(featuredContent.featureDate));
  }

  async findByCreatorId(creatorId: string): Promise<FeaturedContent[]> {
    return db
      .select()
      .from(featuredContent)
      .where(eq(featuredContent.creatorId, creatorId))
      .orderBy(desc(featuredContent.featureDate));
  }

  async findByDate(date: Date): Promise<FeaturedContent | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await db
      .select()
      .from(featuredContent)
      .where(
        and(
          gte(featuredContent.featureDate, startOfDay),
          lte(featuredContent.featureDate, endOfDay)
        )
      )
      .limit(1);
    return results[0];
  }

  async findToday(): Promise<FeaturedContent | undefined> {
    return this.findByDate(new Date());
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<FeaturedContent[]> {
    return db
      .select()
      .from(featuredContent)
      .where(
        and(
          gte(featuredContent.featureDate, startDate),
          lte(featuredContent.featureDate, endDate)
        )
      )
      .orderBy(desc(featuredContent.featureDate));
  }

  async findByContentType(contentType: string): Promise<FeaturedContent[]> {
    return db
      .select()
      .from(featuredContent)
      .where(eq(featuredContent.contentType, contentType))
      .orderBy(desc(featuredContent.featureDate));
  }

  async findRecent(limit: number = 7): Promise<FeaturedContent[]> {
    return db
      .select()
      .from(featuredContent)
      .orderBy(desc(featuredContent.featureDate))
      .limit(limit);
  }

  async create(data: NewFeaturedContent): Promise<FeaturedContent> {
    const results = await db.insert(featuredContent).values(data).returning();
    return results[0];
  }

  async update(id: string, data: Partial<NewFeaturedContent>): Promise<FeaturedContent | undefined> {
    const results = await db
      .update(featuredContent)
      .set(data)
      .where(eq(featuredContent.id, id))
      .returning();
    return results[0];
  }

  async incrementImpressions(id: string): Promise<FeaturedContent | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    return this.update(id, {
      impressions: existing.impressions + 1,
    });
  }

  async incrementClicks(id: string): Promise<FeaturedContent | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    return this.update(id, {
      clicks: existing.clicks + 1,
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(featuredContent).where(eq(featuredContent.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(featuredContent);
    return results.length;
  }

  async hasContentBeenFeatured(contentId: string): Promise<boolean> {
    const results = await this.findByContentId(contentId);
    return results.length > 0;
  }

  async getCreatorFeaturedCount(creatorId: string): Promise<number> {
    const results = await this.findByCreatorId(creatorId);
    return results.length;
  }
}

export const featuredContentRepository = new FeaturedContentRepository();
