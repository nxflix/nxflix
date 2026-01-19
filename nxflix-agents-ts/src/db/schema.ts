import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  primaryKey,
} from 'drizzle-orm/pg-core';

// ============================================================================
// Grammar Table
// ============================================================================
export const grammar = pgTable('grammar', {
  id: varchar('id', { length: 100 }).primaryKey(),
  pattern: text('pattern').notNull(),
  meaning: text('meaning').notNull(),
  meaningJp: text('meaning_jp'),
  example: text('example').notNull(),
  exampleTranslation: text('example_translation'),
  explanation: text('explanation'),
  formationRules: jsonb('formation_rules').$type<string[]>(),
  usageNotes: text('usage_notes'),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  level: varchar('level', { length: 10 }).notNull().default('N1'),
  relatedPatterns: jsonb('related_patterns').$type<string[]>().default([]),
  contentType: varchar('content_type', { length: 20 }).notNull().default('grammar'),
  // Sharing fields
  isPublic: boolean('is_public').notNull().default(false),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Vocabulary Table
// ============================================================================
export const vocabulary = pgTable('vocabulary', {
  id: varchar('id', { length: 100 }).primaryKey(),
  word: text('word').notNull(),
  reading: text('reading').notNull(),
  meanings: jsonb('meanings').$type<string[]>().notNull(),
  partOfSpeech: varchar('part_of_speech', { length: 50 }).notNull(),
  examples: jsonb('examples').$type<{ sentence: string; translation: string }[]>().default([]),
  synonyms: jsonb('synonyms').$type<string[]>().default([]),
  level: varchar('level', { length: 10 }).notNull().default('N1'),
  contentType: varchar('content_type', { length: 20 }).notNull().default('vocabulary'),
  audioUrl: text('audio_url'),
  // Sharing fields
  isPublic: boolean('is_public').notNull().default(false),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Kanji Table
// ============================================================================
export const kanji = pgTable('kanji', {
  id: varchar('id', { length: 100 }).primaryKey(),
  character: varchar('character', { length: 10 }).notNull(),
  strokeCount: integer('stroke_count').notNull(),
  onyomi: jsonb('onyomi').$type<string[]>().notNull(),
  kunyomi: jsonb('kunyomi').$type<string[]>().notNull(),
  meanings: jsonb('meanings').$type<string[]>().notNull(),
  radicals: jsonb('radicals').$type<string[]>().default([]),
  compoundWords: jsonb('compound_words').$type<{ word: string; reading: string; meaning: string }[]>().default([]),
  mnemonics: text('mnemonics'),
  level: varchar('level', { length: 10 }).notNull().default('N1'),
  contentType: varchar('content_type', { length: 20 }).notNull().default('kanji'),
  // Sharing fields
  isPublic: boolean('is_public').notNull().default(false),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Reading Table
// ============================================================================
export const reading = pgTable('reading', {
  id: varchar('id', { length: 100 }).primaryKey(),
  passageType: varchar('passage_type', { length: 20 }).notNull(),
  title: text('title'),
  content: text('content').notNull(),
  wordCount: integer('word_count').notNull(),
  questions: jsonb('questions').$type<{
    id: string;
    questionText: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }[]>().notNull(),
  keyVocabulary: jsonb('key_vocabulary').$type<string[] | { word: string; reading: string; meaning: string }[]>().default([]),
  level: varchar('level', { length: 10 }).notNull().default('N1'),
  contentType: varchar('content_type', { length: 20 }).notNull().default('reading'),
  estimatedMinutes: integer('estimated_minutes').default(5),
  // Sharing fields
  isPublic: boolean('is_public').notNull().default(false),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Listening Table
// ============================================================================
export const listening = pgTable('listening', {
  id: varchar('id', { length: 100 }).primaryKey(),
  listeningType: varchar('listening_type', { length: 30 }).notNull(),
  title: text('title'),
  description: text('description'),
  audioUrl: text('audio_url'),
  audioBase64: text('audio_base64'),
  transcript: text('transcript').notNull(),
  dialogue: jsonb('dialogue').$type<{
    speakerId: string;
    text: string;
    startTime?: number;
    endTime?: number;
  }[]>().default([]),
  speakers: jsonb('speakers').$type<{
    id: string;
    name: string;
    gender: string;
    voice?: string;
  }[]>().default([]),
  durationSeconds: integer('duration_seconds').notNull(),
  questions: jsonb('questions').$type<{
    id: string;
    questionText: string;
    questionTextJp?: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }[]>().notNull(),
  situationContext: text('situation_context'),
  level: varchar('level', { length: 10 }).notNull().default('N1'),
  contentType: varchar('content_type', { length: 20 }).notNull().default('listening'),
  // Sharing fields
  isPublic: boolean('is_public').notNull().default(false),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// User Progress Table
// ============================================================================
export const userProgress = pgTable('user_progress', {
  id: varchar('id', { length: 200 }).primaryKey(), // composite: {userId}:{contentType}:{itemId}
  userId: varchar('user_id', { length: 100 }).notNull(),
  itemId: varchar('item_id', { length: 100 }).notNull(),
  contentType: varchar('content_type', { length: 20 }).notNull(),
  // SM2 spaced repetition data
  easeFactor: real('ease_factor').notNull().default(2.5),
  interval: integer('interval').notNull().default(1),
  repetitions: integer('repetitions').notNull().default(0),
  // Study stats
  timesStudied: integer('times_studied').notNull().default(0),
  timesCorrect: integer('times_correct').notNull().default(0),
  lastScore: real('last_score'),
  masteryLevel: integer('mastery_level').notNull().default(0),
  nextReviewAt: timestamp('next_review_at'),
  lastStudiedAt: timestamp('last_studied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Focus Sessions Table
// ============================================================================
export const focusSessions = pgTable('focus_sessions', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  contentId: varchar('content_id', { length: 100 }).notNull(),
  contentType: varchar('content_type', { length: 20 }).notNull(),
  itemId: varchar('item_id', { length: 100 }).notNull(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  revealed: boolean('revealed').default(false),
  timeSpentSeconds: integer('time_spent_seconds'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Video Projects Table
// ============================================================================
export const videoProjects = pgTable('video_projects', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  prompt: text('prompt').notNull(),
  script: jsonb('script').$type<{
    id: string;
    title: string;
    description?: string;
    subtitles: {
      id: string;
      startTime: number;
      endTime: number;
      text: string;
      reading?: string;
      furigana: { word: string; reading: string; startIndex: number }[];
      translation?: string;
    }[];
    totalDurationSeconds: number;
    targetVocabulary: string[];
    grammarPoints: string[];
  }>(),
  characterStyle: varchar('character_style', { length: 50 }),
  videoStyle: varchar('video_style', { length: 50 }),
  voice: varchar('voice', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  audioUrl: text('audio_url'),
  audioBase64: text('audio_base64'),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  errorMessage: text('error_message'),
  progress: integer('progress').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for use in application code
export type Grammar = typeof grammar.$inferSelect;
export type NewGrammar = typeof grammar.$inferInsert;

export type Vocabulary = typeof vocabulary.$inferSelect;
export type NewVocabulary = typeof vocabulary.$inferInsert;

export type Kanji = typeof kanji.$inferSelect;
export type NewKanji = typeof kanji.$inferInsert;

export type Reading = typeof reading.$inferSelect;
export type NewReading = typeof reading.$inferInsert;

export type Listening = typeof listening.$inferSelect;
export type NewListening = typeof listening.$inferInsert;

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;

export type FocusSession = typeof focusSessions.$inferSelect;
export type NewFocusSession = typeof focusSessions.$inferInsert;

export type VideoProject = typeof videoProjects.$inferSelect;
export type NewVideoProject = typeof videoProjects.$inferInsert;
