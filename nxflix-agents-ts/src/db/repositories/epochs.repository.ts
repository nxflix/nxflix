import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db, epochs, type Epoch, type NewEpoch } from '../index.js';

export type EpochType = 'daily' | 'weekly' | 'monthly';
export type EpochStatus = 'active' | 'completed' | 'processing';

export class EpochsRepository {
  async findAll(): Promise<Epoch[]> {
    return db.select().from(epochs).orderBy(desc(epochs.startDate));
  }

  async findById(id: string): Promise<Epoch | undefined> {
    const results = await db.select().from(epochs).where(eq(epochs.id, id)).limit(1);
    return results[0];
  }

  async findByType(epochType: EpochType): Promise<Epoch[]> {
    return db.select().from(epochs).where(eq(epochs.epochType, epochType)).orderBy(desc(epochs.startDate));
  }

  async findByStatus(status: EpochStatus): Promise<Epoch[]> {
    return db.select().from(epochs).where(eq(epochs.status, status)).orderBy(desc(epochs.startDate));
  }

  async findActiveByType(epochType: EpochType): Promise<Epoch | undefined> {
    const results = await db
      .select()
      .from(epochs)
      .where(and(eq(epochs.epochType, epochType), eq(epochs.status, 'active')))
      .orderBy(desc(epochs.startDate))
      .limit(1);
    return results[0];
  }

  async findCurrentEpoch(epochType: EpochType, date: Date = new Date()): Promise<Epoch | undefined> {
    const results = await db
      .select()
      .from(epochs)
      .where(
        and(
          eq(epochs.epochType, epochType),
          lte(epochs.startDate, date),
          gte(epochs.endDate, date)
        )
      )
      .limit(1);
    return results[0];
  }

  async create(data: NewEpoch): Promise<Epoch> {
    const results = await db.insert(epochs).values(data).returning();
    return results[0];
  }

  async updateStatus(id: string, status: EpochStatus): Promise<Epoch | undefined> {
    const results = await db
      .update(epochs)
      .set({ status })
      .where(eq(epochs.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(epochs).where(eq(epochs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(epochs);
    return results.length;
  }
}

export const epochsRepository = new EpochsRepository();
