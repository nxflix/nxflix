import type { ReadingPassage, ReadingPassageType } from '../models/reading.js';

export class ReadingService {
  private readingPassages: Map<string, ReadingPassage> = new Map();
  private byType: Map<ReadingPassageType, string[]> = new Map();
  private byTopic: Map<string, string[]> = new Map();

  addReadingPassage(passage: ReadingPassage): void {
    this.readingPassages.set(passage.id, passage);

    const typeList = this.byType.get(passage.passageType) ?? [];
    typeList.push(passage.id);
    this.byType.set(passage.passageType, typeList);

    if (passage.topic) {
      const topicList = this.byTopic.get(passage.topic) ?? [];
      topicList.push(passage.id);
      this.byTopic.set(passage.topic, topicList);
    }
  }

  getReadingPassage(passageId: string): ReadingPassage | undefined {
    return this.readingPassages.get(passageId);
  }

  getAllReadingPassages(): ReadingPassage[] {
    return Array.from(this.readingPassages.values());
  }

  getReadingByType(passageType: ReadingPassageType): ReadingPassage[] {
    const ids = this.byType.get(passageType) ?? [];
    return ids
      .map((id) => this.readingPassages.get(id))
      .filter((p): p is ReadingPassage => p !== undefined);
  }

  getReadingByTopic(topic: string): ReadingPassage[] {
    const ids = this.byTopic.get(topic) ?? [];
    return ids
      .map((id) => this.readingPassages.get(id))
      .filter((p): p is ReadingPassage => p !== undefined);
  }

  getReadingPassagesByIds(ids: string[]): ReadingPassage[] {
    return ids
      .map((id) => this.readingPassages.get(id))
      .filter((p): p is ReadingPassage => p !== undefined);
  }

  getReadingByLength(minChars: number, maxChars: number): ReadingPassage[] {
    const results: ReadingPassage[] = [];
    for (const passage of this.readingPassages.values()) {
      if (passage.characterCount >= minChars && passage.characterCount <= maxChars) {
        results.push(passage);
      }
    }
    return results;
  }

  searchReading(query: string): ReadingPassage[] {
    const lowerQuery = query.toLowerCase();
    const results: ReadingPassage[] = [];

    for (const passage of this.readingPassages.values()) {
      if (
        passage.content.toLowerCase().includes(lowerQuery) ||
        (passage.title && passage.title.toLowerCase().includes(lowerQuery)) ||
        (passage.topic && passage.topic.toLowerCase().includes(lowerQuery))
      ) {
        results.push(passage);
      }
    }

    return results;
  }

  get count(): number {
    return this.readingPassages.size;
  }

  get passageTypes(): ReadingPassageType[] {
    return Array.from(this.byType.keys());
  }

  get topics(): string[] {
    return Array.from(this.byTopic.keys());
  }
}
