import type { ListeningItem, ListeningType } from '../models/listening.js';

export class ListeningService {
  private listeningItems: Map<string, ListeningItem> = new Map();
  private byType: Map<ListeningType, string[]> = new Map();

  addListeningItem(item: ListeningItem): void {
    this.listeningItems.set(item.id, item);

    const typeList = this.byType.get(item.listeningType) ?? [];
    typeList.push(item.id);
    this.byType.set(item.listeningType, typeList);
  }

  getListeningItem(itemId: string): ListeningItem | undefined {
    return this.listeningItems.get(itemId);
  }

  getAllListeningItems(): ListeningItem[] {
    return Array.from(this.listeningItems.values());
  }

  getListeningByType(listeningType: ListeningType): ListeningItem[] {
    const ids = this.byType.get(listeningType) ?? [];
    return ids
      .map((id) => this.listeningItems.get(id))
      .filter((item): item is ListeningItem => item !== undefined);
  }

  getListeningItemsByIds(ids: string[]): ListeningItem[] {
    return ids
      .map((id) => this.listeningItems.get(id))
      .filter((item): item is ListeningItem => item !== undefined);
  }

  getListeningByDuration(minSeconds: number, maxSeconds: number): ListeningItem[] {
    const results: ListeningItem[] = [];
    for (const item of this.listeningItems.values()) {
      if (item.durationSeconds >= minSeconds && item.durationSeconds <= maxSeconds) {
        results.push(item);
      }
    }
    return results;
  }

  searchListening(query: string): ListeningItem[] {
    const lowerQuery = query.toLowerCase();
    const results: ListeningItem[] = [];

    for (const item of this.listeningItems.values()) {
      if (
        item.transcript.toLowerCase().includes(lowerQuery) ||
        (item.title && item.title.toLowerCase().includes(lowerQuery)) ||
        (item.situationContext && item.situationContext.toLowerCase().includes(lowerQuery))
      ) {
        results.push(item);
      }
    }

    return results;
  }

  get count(): number {
    return this.listeningItems.size;
  }

  get listeningTypes(): ListeningType[] {
    return Array.from(this.byType.keys());
  }
}
