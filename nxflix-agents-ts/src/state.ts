/**
 * Shared in-memory state for the application.
 * In production, this would be replaced with database persistence.
 */

import type { UserProgress } from './models/progress.js';
import type { GrammarPoint, GrammarCategory } from './models/grammar.js';
import { GrammarService } from './services/grammar.js';
import { SM2Service } from './services/spaced-repetition.js';

// Shared user progress storage
// Structure: userId -> grammarId -> UserProgress
export const userProgress: Record<string, Record<string, UserProgress>> = {};

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

// Helper to update user progress
export function updateUserProgress(userId: string, grammarId: string, progress: UserProgress): void {
  if (!userProgress[userId]) {
    userProgress[userId] = {};
  }
  userProgress[userId][grammarId] = progress;
}
