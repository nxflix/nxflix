import type { VocabularyItem, PartOfSpeech } from '../models/vocabulary.js';

export class VocabularyService {
  private vocabularyItems: Map<string, VocabularyItem> = new Map();
  private byWord: Map<string, string> = new Map();
  private byPartOfSpeech: Map<PartOfSpeech, string[]> = new Map();

  addVocabularyItem(vocab: VocabularyItem): void {
    this.vocabularyItems.set(vocab.id, vocab);
    this.byWord.set(vocab.word, vocab.id);

    const posList = this.byPartOfSpeech.get(vocab.partOfSpeech) ?? [];
    posList.push(vocab.id);
    this.byPartOfSpeech.set(vocab.partOfSpeech, posList);
  }

  getVocabularyItem(vocabId: string): VocabularyItem | undefined {
    return this.vocabularyItems.get(vocabId);
  }

  getVocabularyByWord(word: string): VocabularyItem | undefined {
    const id = this.byWord.get(word);
    return id ? this.vocabularyItems.get(id) : undefined;
  }

  getAllVocabularyItems(): VocabularyItem[] {
    return Array.from(this.vocabularyItems.values());
  }

  getVocabularyByPartOfSpeech(partOfSpeech: PartOfSpeech): VocabularyItem[] {
    const ids = this.byPartOfSpeech.get(partOfSpeech) ?? [];
    return ids
      .map((id) => this.vocabularyItems.get(id))
      .filter((v): v is VocabularyItem => v !== undefined);
  }

  getVocabularyItemsByIds(ids: string[]): VocabularyItem[] {
    return ids
      .map((id) => this.vocabularyItems.get(id))
      .filter((v): v is VocabularyItem => v !== undefined);
  }

  searchVocabulary(query: string): VocabularyItem[] {
    const lowerQuery = query.toLowerCase();
    const results: VocabularyItem[] = [];

    for (const vocab of this.vocabularyItems.values()) {
      if (
        vocab.word.includes(query) ||
        vocab.reading.includes(query) ||
        vocab.meanings.some((m) => m.toLowerCase().includes(lowerQuery))
      ) {
        results.push(vocab);
      }
    }

    return results;
  }

  get count(): number {
    return this.vocabularyItems.size;
  }

  get partsOfSpeech(): PartOfSpeech[] {
    return Array.from(this.byPartOfSpeech.keys());
  }
}
