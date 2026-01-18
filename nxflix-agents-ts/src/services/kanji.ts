import type { KanjiItem } from '../models/kanji.js';

export class KanjiService {
  private kanjiItems: Map<string, KanjiItem> = new Map();
  private byCharacter: Map<string, string> = new Map();
  private byStrokeCount: Map<number, string[]> = new Map();

  addKanjiItem(kanji: KanjiItem): void {
    this.kanjiItems.set(kanji.id, kanji);
    this.byCharacter.set(kanji.character, kanji.id);

    const strokeList = this.byStrokeCount.get(kanji.strokeCount) ?? [];
    strokeList.push(kanji.id);
    this.byStrokeCount.set(kanji.strokeCount, strokeList);
  }

  getKanjiItem(kanjiId: string): KanjiItem | undefined {
    return this.kanjiItems.get(kanjiId);
  }

  getKanjiByCharacter(character: string): KanjiItem | undefined {
    const id = this.byCharacter.get(character);
    return id ? this.kanjiItems.get(id) : undefined;
  }

  getAllKanjiItems(): KanjiItem[] {
    return Array.from(this.kanjiItems.values());
  }

  getKanjiByStrokeCount(strokeCount: number): KanjiItem[] {
    const ids = this.byStrokeCount.get(strokeCount) ?? [];
    return ids
      .map((id) => this.kanjiItems.get(id))
      .filter((k): k is KanjiItem => k !== undefined);
  }

  getKanjiItemsByIds(ids: string[]): KanjiItem[] {
    return ids
      .map((id) => this.kanjiItems.get(id))
      .filter((k): k is KanjiItem => k !== undefined);
  }

  searchKanji(query: string): KanjiItem[] {
    const lowerQuery = query.toLowerCase();
    const results: KanjiItem[] = [];

    for (const kanji of this.kanjiItems.values()) {
      if (
        kanji.character.includes(query) ||
        kanji.meanings.some((m) => m.toLowerCase().includes(lowerQuery)) ||
        kanji.onyomi.some((r) => r.includes(query)) ||
        kanji.kunyomi.some((r) => r.includes(query))
      ) {
        results.push(kanji);
      }
    }

    return results;
  }

  get count(): number {
    return this.kanjiItems.size;
  }

  get strokeCounts(): number[] {
    return Array.from(this.byStrokeCount.keys()).sort((a, b) => a - b);
  }
}
