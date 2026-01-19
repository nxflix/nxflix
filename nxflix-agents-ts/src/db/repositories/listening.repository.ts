import { eq, ilike, or } from 'drizzle-orm';
import { db, listening, type Listening, type NewListening } from '../index.js';

export class ListeningRepository {
  async findAll(): Promise<Listening[]> {
    return db.select().from(listening).orderBy(listening.createdAt);
  }

  async findById(id: string): Promise<Listening | undefined> {
    const results = await db.select().from(listening).where(eq(listening.id, id)).limit(1);
    return results[0];
  }

  async findByListeningType(listeningType: string): Promise<Listening[]> {
    return db.select().from(listening).where(eq(listening.listeningType, listeningType));
  }

  async search(query: string): Promise<Listening[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(listening).where(
      or(
        ilike(listening.title, searchPattern),
        ilike(listening.transcript, searchPattern),
        ilike(listening.situationContext, searchPattern)
      )
    );
  }

  async create(data: NewListening): Promise<Listening> {
    const results = await db.insert(listening).values(data).returning();
    return results[0];
  }

  async createMany(items: NewListening[]): Promise<Listening[]> {
    if (items.length === 0) return [];
    return db.insert(listening).values(items).returning();
  }

  async update(id: string, data: Partial<NewListening>): Promise<Listening | undefined> {
    const results = await db
      .update(listening)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(listening.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(listening).where(eq(listening.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(listening);
    return results.length;
  }

  async upsert(data: NewListening): Promise<Listening> {
    const existing = await this.findById(data.id);
    if (existing) {
      return (await this.update(data.id, data))!;
    }
    return this.create(data);
  }
}

export const listeningRepository = new ListeningRepository();
