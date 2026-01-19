import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { db, contentEvents, type ContentEvent, type NewContentEvent } from '../index.js';

export type EventType = 'view' | 'study' | 'complete' | 'save' | 'share';

export class ContentEventsRepository {
  async findAll(limit: number = 100): Promise<ContentEvent[]> {
    return db.select().from(contentEvents).orderBy(desc(contentEvents.createdAt)).limit(limit);
  }

  async findById(id: string): Promise<ContentEvent | undefined> {
    const results = await db.select().from(contentEvents).where(eq(contentEvents.id, id)).limit(1);
    return results[0];
  }

  async findByContentId(contentId: string): Promise<ContentEvent[]> {
    return db
      .select()
      .from(contentEvents)
      .where(eq(contentEvents.contentId, contentId))
      .orderBy(desc(contentEvents.createdAt));
  }

  async findByUserId(userId: string): Promise<ContentEvent[]> {
    return db
      .select()
      .from(contentEvents)
      .where(eq(contentEvents.userId, userId))
      .orderBy(desc(contentEvents.createdAt));
  }

  async findByEventType(eventType: EventType): Promise<ContentEvent[]> {
    return db
      .select()
      .from(contentEvents)
      .where(eq(contentEvents.eventType, eventType))
      .orderBy(desc(contentEvents.createdAt));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ContentEvent[]> {
    return db
      .select()
      .from(contentEvents)
      .where(
        and(
          gte(contentEvents.createdAt, startDate),
          lte(contentEvents.createdAt, endDate)
        )
      )
      .orderBy(desc(contentEvents.createdAt));
  }

  async findByContentIdAndDateRange(
    contentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ContentEvent[]> {
    return db
      .select()
      .from(contentEvents)
      .where(
        and(
          eq(contentEvents.contentId, contentId),
          gte(contentEvents.createdAt, startDate),
          lte(contentEvents.createdAt, endDate)
        )
      )
      .orderBy(desc(contentEvents.createdAt));
  }

  async countByContentIdAndEventType(contentId: string, eventType: EventType): Promise<number> {
    const results = await db
      .select({ count: count() })
      .from(contentEvents)
      .where(
        and(
          eq(contentEvents.contentId, contentId),
          eq(contentEvents.eventType, eventType)
        )
      );
    return results[0]?.count ?? 0;
  }

  async countUniqueUsersByContentId(contentId: string): Promise<number> {
    const results = await db
      .select({ count: sql<number>`count(distinct ${contentEvents.userId})` })
      .from(contentEvents)
      .where(eq(contentEvents.contentId, contentId));
    return results[0]?.count ?? 0;
  }

  async create(data: NewContentEvent): Promise<ContentEvent> {
    const results = await db.insert(contentEvents).values(data).returning();
    return results[0];
  }

  async createMany(items: NewContentEvent[]): Promise<ContentEvent[]> {
    if (items.length === 0) return [];
    return db.insert(contentEvents).values(items).returning();
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(contentEvents).where(eq(contentEvents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByContentId(contentId: string): Promise<number> {
    const result = await db.delete(contentEvents).where(eq(contentEvents.contentId, contentId));
    return result.rowCount ?? 0;
  }

  async count(): Promise<number> {
    const results = await db.select({ count: count() }).from(contentEvents);
    return results[0]?.count ?? 0;
  }
}

export const contentEventsRepository = new ContentEventsRepository();
