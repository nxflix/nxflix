import { eq, ilike } from 'drizzle-orm';
import { db, kanji, type Kanji, type NewKanji } from '../index.js';

export class KanjiRepository {
  async findAll(): Promise<Kanji[]> {
    return db.select().from(kanji).orderBy(kanji.createdAt);
  }

  async findById(id: string): Promise<Kanji | undefined> {
    const results = await db.select().from(kanji).where(eq(kanji.id, id)).limit(1);
    return results[0];
  }

  async findByCharacter(character: string): Promise<Kanji | undefined> {
    const results = await db.select().from(kanji).where(eq(kanji.character, character)).limit(1);
    return results[0];
  }

  async search(query: string): Promise<Kanji[]> {
    const searchPattern = `%${query}%`;
    // Search in character or check if query matches the character exactly
    if (query.length === 1) {
      const exact = await this.findByCharacter(query);
      if (exact) return [exact];
    }
    return db.select().from(kanji).where(
      ilike(kanji.character, searchPattern)
    );
  }

  async create(data: NewKanji): Promise<Kanji> {
    const results = await db.insert(kanji).values(data).returning();
    return results[0];
  }

  async createMany(items: NewKanji[]): Promise<Kanji[]> {
    if (items.length === 0) return [];
    return db.insert(kanji).values(items).returning();
  }

  async update(id: string, data: Partial<NewKanji>): Promise<Kanji | undefined> {
    const results = await db
      .update(kanji)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(kanji.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(kanji).where(eq(kanji.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(kanji);
    return results.length;
  }

  async upsert(data: NewKanji): Promise<Kanji> {
    const existing = await this.findById(data.id);
    if (existing) {
      return (await this.update(data.id, data))!;
    }
    return this.create(data);
  }
}

export const kanjiRepository = new KanjiRepository();
