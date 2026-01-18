import type { GrammarPoint, GrammarCategory } from '../models/grammar.js';

export class GrammarService {
  private grammarPoints: Map<string, GrammarPoint> = new Map();
  private byCategory: Map<GrammarCategory, string[]> = new Map();

  addGrammarPoint(grammar: GrammarPoint): void {
    this.grammarPoints.set(grammar.id, grammar);

    const categoryList = this.byCategory.get(grammar.category) ?? [];
    categoryList.push(grammar.id);
    this.byCategory.set(grammar.category, categoryList);
  }

  getGrammarPoint(grammarId: string): GrammarPoint | undefined {
    return this.grammarPoints.get(grammarId);
  }

  getAllGrammarPoints(): GrammarPoint[] {
    return Array.from(this.grammarPoints.values());
  }

  getGrammarByCategory(category: GrammarCategory): GrammarPoint[] {
    const ids = this.byCategory.get(category) ?? [];
    return ids
      .map((id) => this.grammarPoints.get(id))
      .filter((g): g is GrammarPoint => g !== undefined);
  }

  getGrammarPointsByIds(ids: string[]): GrammarPoint[] {
    return ids
      .map((id) => this.grammarPoints.get(id))
      .filter((g): g is GrammarPoint => g !== undefined);
  }

  searchGrammar(query: string): GrammarPoint[] {
    const lowerQuery = query.toLowerCase();
    const results: GrammarPoint[] = [];

    for (const grammar of this.grammarPoints.values()) {
      if (
        grammar.pattern.toLowerCase().includes(lowerQuery) ||
        grammar.meaning.toLowerCase().includes(lowerQuery) ||
        (grammar.meaningJp && grammar.meaningJp.includes(lowerQuery))
      ) {
        results.push(grammar);
      }
    }

    return results;
  }

  getRelatedGrammar(grammarId: string): GrammarPoint[] {
    const grammar = this.getGrammarPoint(grammarId);
    if (!grammar) return [];

    return grammar.relatedPatterns
      .map((id) => this.grammarPoints.get(id))
      .filter((g): g is GrammarPoint => g !== undefined);
  }

  get count(): number {
    return this.grammarPoints.size;
  }

  get categories(): GrammarCategory[] {
    return Array.from(this.byCategory.keys());
  }
}
