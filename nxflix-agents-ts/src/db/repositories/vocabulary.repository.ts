import { eq, ilike, or } from 'drizzle-orm';
import { db, vocabulary, type Vocabulary, type NewVocabulary } from '../index.js';

export class VocabularyRepository {
  async findAll(): Promise<Vocabulary[]> {
    return db.select().from(vocabulary).orderBy(vocabulary.createdAt);
  }

  async findById(id: string): Promise<Vocabulary | undefined> {
    const results = await db.select().from(vocabulary).where(eq(vocabulary.id, id)).limit(1);
    return results[0];
  }

  async findByPartOfSpeech(partOfSpeech: string): Promise<Vocabulary[]> {
    return db.select().from(vocabulary).where(eq(vocabulary.partOfSpeech, partOfSpeech));
  }

  async search(query: string): Promise<Vocabulary[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(vocabulary).where(
      or(
        ilike(vocabulary.word, searchPattern),
        ilike(vocabulary.reading, searchPattern)
      )
    );
  }

  async create(data: NewVocabulary): Promise<Vocabulary> {
    const results = await db.insert(vocabulary).values(data).returning();
    return results[0];
  }

  async createMany(items: NewVocabulary[]): Promise<Vocabulary[]> {
    if (items.length === 0) return [];
    return db.insert(vocabulary).values(items).returning();
  }

  async update(id: string, data: Partial<NewVocabulary>): Promise<Vocabulary | undefined> {
    const results = await db
      .update(vocabulary)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vocabulary.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(vocabulary).where(eq(vocabulary.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(vocabulary);
    return results.length;
  }

  async upsert(data: NewVocabulary): Promise<Vocabulary> {
    const existing = await this.findById(data.id);
    if (existing) {
      return (await this.update(data.id, data))!;
    }
    return this.create(data);
  }
}

export const vocabularyRepository = new VocabularyRepository();
