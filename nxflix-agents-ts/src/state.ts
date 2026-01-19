/**
 * Shared in-memory state for the application.
 * In production, this would be replaced with database persistence.
 */

import type { UserProgress } from './models/progress.js';
import type { GrammarPoint, GrammarCategory } from './models/grammar.js';
import type { ContentType } from './models/content-type.js';
import type { SubscriptionShift, ShiftStatus } from './models/sideshift.js';
import { GrammarService } from './services/grammar.js';
import { SM2Service } from './services/spaced-repetition.js';

// Shared user progress storage
// Structure: userId -> `${contentType}:${itemId}` -> UserProgress
export const userProgress: Record<string, Record<string, UserProgress>> = {};

/**
 * Create a composite key for progress storage.
 */
export function makeProgressKey(contentType: ContentType, itemId: string): string {
  return `${contentType}:${itemId}`;
}

/**
 * Parse a composite key back to contentType and itemId.
 */
export function parseProgressKey(key: string): { contentType: ContentType; itemId: string } {
  const [contentType, ...rest] = key.split(':');
  return { contentType: contentType as ContentType, itemId: rest.join(':') };
}

// Singleton services shared across all routers
export const grammarService = new GrammarService();
export const sm2Service = new SM2Service();

// Seed grammar data on startup (subset of 200 N1 patterns)
const seedGrammarData: GrammarPoint[] = [
  {
    id: 'n1-001',
    pattern: '～あっての',
    meaning: 'only because of; owing to',
    meaningJp: '～があるからこそ',
    example: '家族あっての幸せだ。',
    exampleTranslation: 'Happiness exists only because of family.',
    category: 'formal' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-002'],
  },
  {
    id: 'n1-002',
    pattern: '～いかんで/いかんによっては',
    meaning: 'depending on',
    meaningJp: '～次第で',
    example: '結果いかんで、対応を決める。',
    exampleTranslation: 'We will decide the response depending on the results.',
    category: 'conditional' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-001'],
  },
  {
    id: 'n1-003',
    pattern: '～いかんにかかわらず',
    meaning: 'regardless of',
    meaningJp: '～に関係なく',
    example: '理由いかんにかかわらず、遅刻は許されない。',
    exampleTranslation: 'Regardless of the reason, being late is not permitted.',
    category: 'formal' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-002'],
  },
  {
    id: 'n1-004',
    pattern: '～う/ようが～まいが',
    meaning: 'whether... or not',
    meaningJp: '～ても～なくても',
    example: '雨が降ろうが降るまいが、出かける。',
    exampleTranslation: "Whether it rains or not, I'm going out.",
    category: 'conditional' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-005'],
  },
  {
    id: 'n1-005',
    pattern: '～う/ようと(も)',
    meaning: 'even if; no matter how',
    meaningJp: 'たとえ～ても',
    example: '何があろうと、諦めない。',
    exampleTranslation: "No matter what happens, I won't give up.",
    category: 'conditional' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-004'],
  },
  {
    id: 'n1-006',
    pattern: '～かぎりだ',
    meaning: 'extremely; to the utmost degree',
    meaningJp: '非常に～だ',
    example: '嬉しいかぎりだ。',
    exampleTranslation: 'I am extremely happy.',
    category: 'emphasis' as GrammarCategory,
    level: 'N1',
    relatedPatterns: [],
  },
  {
    id: 'n1-007',
    pattern: '～がてら',
    meaning: 'while; on the occasion of',
    meaningJp: '～のついでに',
    example: '散歩がてら、買い物に行く。',
    exampleTranslation: "I'll go shopping while taking a walk.",
    category: 'conjunctive' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-008'],
  },
  {
    id: 'n1-008',
    pattern: '～かたがた',
    meaning: 'at the same time; while also',
    meaningJp: '～を兼ねて',
    example: 'お礼かたがた、お伺いします。',
    exampleTranslation: 'I will visit while also expressing my thanks.',
    category: 'formal' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-007'],
  },
  {
    id: 'n1-009',
    pattern: '～かたわら',
    meaning: 'while; alongside',
    meaningJp: '～一方で',
    example: '働くかたわら、学校に通っている。',
    exampleTranslation: "While working, I'm also attending school.",
    category: 'conjunctive' as GrammarCategory,
    level: 'N1',
    relatedPatterns: [],
  },
  {
    id: 'n1-010',
    pattern: '～が早いか',
    meaning: 'as soon as; the moment',
    meaningJp: '～とすぐに',
    example: 'ベルが鳴るが早いか、生徒たちは教室を飛び出した。',
    exampleTranslation: 'The moment the bell rang, the students rushed out of the classroom.',
    category: 'temporal' as GrammarCategory,
    level: 'N1',
    relatedPatterns: ['n1-011', 'n1-012'],
  },
];

// Initialize grammar service with seed data
function initializeGrammarData() {
  for (const grammar of seedGrammarData) {
    grammarService.addGrammarPoint(grammar);
  }
  console.log(`Loaded ${seedGrammarData.length} grammar patterns into memory.`);
}

// Initialize on module load
initializeGrammarData();

// Helper to get user progress as array
export function getUserProgressList(userId: string): UserProgress[] {
  return Object.values(userProgress[userId] ?? {});
}

// Helper to get user progress filtered by content type
export function getUserProgressByType(userId: string, contentType: ContentType): UserProgress[] {
  const allProgress = userProgress[userId] ?? {};
  return Object.entries(allProgress)
    .filter(([key]) => key.startsWith(`${contentType}:`))
    .map(([, progress]) => progress);
}

// Helper to update user progress
export function updateUserProgress(
  userId: string,
  itemId: string,
  contentType: ContentType,
  progress: UserProgress
): void {
  if (!userProgress[userId]) {
    userProgress[userId] = {};
  }
  const key = makeProgressKey(contentType, itemId);
  userProgress[userId][key] = progress;
}

// Helper to get single user progress item
export function getUserProgress(userId: string, itemId: string, contentType: ContentType): UserProgress | undefined {
  const key = makeProgressKey(contentType, itemId);
  return userProgress[userId]?.[key];
}

// ============================================
// Subscription Shifts Storage
// ============================================

// Shifts storage: shiftId -> SubscriptionShift
export const subscriptionShifts: Record<string, SubscriptionShift> = {};

// Index: sideshiftOrderId -> shiftId for webhook lookups
const sideshiftOrderIndex: Record<string, string> = {};

// Index: userAddress -> shiftIds for user queries
const userShiftsIndex: Record<string, string[]> = {};

/**
 * Create a new subscription shift record
 */
export function createShift(shift: SubscriptionShift): SubscriptionShift {
  subscriptionShifts[shift.id] = shift;
  sideshiftOrderIndex[shift.sideshiftOrderId] = shift.id;

  if (!userShiftsIndex[shift.userAddress.toLowerCase()]) {
    userShiftsIndex[shift.userAddress.toLowerCase()] = [];
  }
  userShiftsIndex[shift.userAddress.toLowerCase()].push(shift.id);

  return shift;
}

/**
 * Get shift by internal ID
 */
export function getShiftById(id: string): SubscriptionShift | undefined {
  return subscriptionShifts[id];
}

/**
 * Get shift by SideShift order ID (for webhook processing)
 */
export function getShiftBySideshiftOrderId(orderId: string): SubscriptionShift | undefined {
  const shiftId = sideshiftOrderIndex[orderId];
  return shiftId ? subscriptionShifts[shiftId] : undefined;
}

/**
 * Update an existing shift
 */
export function updateShift(id: string, updates: Partial<SubscriptionShift>): SubscriptionShift | undefined {
  const shift = subscriptionShifts[id];
  if (!shift) return undefined;

  const updated = {
    ...shift,
    ...updates,
    updatedAt: new Date(),
  };
  subscriptionShifts[id] = updated;
  return updated;
}

/**
 * Get all shifts for a user
 */
export function getShiftsByUserAddress(userAddress: string): SubscriptionShift[] {
  const shiftIds = userShiftsIndex[userAddress.toLowerCase()] ?? [];
  return shiftIds.map(id => subscriptionShifts[id]).filter(Boolean);
}

/**
 * Get pending shifts (waiting for deposit)
 */
export function getPendingShifts(): SubscriptionShift[] {
  return Object.values(subscriptionShifts).filter(
    s => s.status === 'waiting' || s.status === 'processing'
  );
}
