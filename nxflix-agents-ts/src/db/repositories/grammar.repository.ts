import { eq, ilike, or } from 'drizzle-orm';
import { db, grammar, type Grammar, type NewGrammar } from '../index.js';

export class GrammarRepository {
  async findAll(): Promise<Grammar[]> {
    return db.select().from(grammar).orderBy(grammar.createdAt);
  }

  async findById(id: string): Promise<Grammar | undefined> {
    const results = await db.select().from(grammar).where(eq(grammar.id, id)).limit(1);
    return results[0];
  }

  async findByCategory(category: string): Promise<Grammar[]> {
    return db.select().from(grammar).where(eq(grammar.category, category));
  }

  async search(query: string): Promise<Grammar[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(grammar).where(
      or(
        ilike(grammar.pattern, searchPattern),
        ilike(grammar.meaning, searchPattern),
        ilike(grammar.example, searchPattern)
      )
    );
  }

  async create(data: NewGrammar): Promise<Grammar> {
    const results = await db.insert(grammar).values(data).returning();
    return results[0];
  }

  async createMany(items: NewGrammar[]): Promise<Grammar[]> {
    if (items.length === 0) return [];
    return db.insert(grammar).values(items).returning();
  }

  async update(id: string, data: Partial<NewGrammar>): Promise<Grammar | undefined> {
    const results = await db
      .update(grammar)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(grammar.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(grammar).where(eq(grammar.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const results = await db.select().from(grammar);
    return results.length;
  }

  async upsert(data: NewGrammar): Promise<Grammar> {
    const existing = await this.findById(data.id);
    if (existing) {
      return (await this.update(data.id, data))!;
    }
    return this.create(data);
  }
}

export const grammarRepository = new GrammarRepository();
