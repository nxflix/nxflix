import { eq, ilike, or } from 'drizzle-orm';
import { db, reading, type Reading, type NewReading } from '../index.js';

export class ReadingRepository {
  async findAll(): Promise<Reading[]> {
    return db.select().from(reading).orderBy(reading.createdAt);
  }

  async findById(id: string): Promise<Reading | undefined> {
    const results = await db.select().from(reading).where(eq(reading.id, id)).limit(1);
    return results[0];
  }

  async findByPassageType(passageType: string): Promise<Reading[]> {
    return db.select().from(reading).where(eq(reading.passageType, passageType));
  }

  async search(query: string): Promise<Reading[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(reading).where(
      or(
        ilike(reading.title, searchPattern),
        ilike(reading.content, searchPattern)
      )
    );
  }

  async create(data: NewReading): Promise<Reading> {
    const results = await db.insert(reading).values(data).returning();
    return results[0];
  }

  async createMany(items: NewReading[]): Promise<Reading[]> {
    if (items.length === 0) return [];
    return db.insert(reading).values(items).returning();
  }

  async update(id: string, data: Partial<NewReading>): Promise<Reading | undefined> {
    const results = await db
      .update(reading)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reading.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(reading).where(eq(reading.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(reading);
    return results.length;
  }

  async upsert(data: NewReading): Promise<Reading> {
    const existing = await this.findById(data.id);
    if (existing) {
      return (await this.update(data.id, data))!;
    }
    return this.create(data);
  }
}

export const readingRepository = new ReadingRepository();
