import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// Users
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============================================================================
// Grammar Points - 200 JLPT N1 patterns
// ============================================================================

export const grammarCategories = [
  "formal",
  "classical",
  "conjunctive",
  "conditional",
  "comparative",
  "emphasis",
  "negative",
  "temporal",
  "causative",
  "other",
] as const;

export const grammarPoints = pgTable("grammar_points", {
  id: varchar("id").primaryKey(),
  pattern: text("pattern").notNull(),
  meaning: text("meaning").notNull(),
  meaningJp: text("meaning_jp"),
  example: text("example").notNull(),
  exampleTranslation: text("example_translation").notNull(),
  category: text("category").notNull().$type<(typeof grammarCategories)[number]>(),
  level: text("level").notNull().default("N1"),
  notes: text("notes"),
  relatedPatterns: jsonb("related_patterns").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGrammarPointSchema = createInsertSchema(grammarPoints).omit({
  createdAt: true,
});

export type InsertGrammarPoint = z.infer<typeof insertGrammarPointSchema>;
export type GrammarPoint = typeof grammarPoints.$inferSelect;

// ============================================================================
// User Grammar Progress - SM-2 spaced repetition data
// ============================================================================

export const userGrammarProgress = pgTable("user_grammar_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  grammarId: varchar("grammar_id").notNull().references(() => grammarPoints.id, { onDelete: "cascade" }),

  // SM-2 Algorithm fields
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0), // Days until next review
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewDate: timestamp("next_review_date"),
  lastReviewDate: timestamp("last_review_date"),

  // Study statistics
  timesStudied: integer("times_studied").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  lastScore: real("last_score"),
  masteryLevel: integer("mastery_level").notNull().default(0), // 0-5 scale

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userGrammarProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserGrammarProgress = typeof userGrammarProgress.$inferSelect;

// ============================================================================
// Study Sessions - Track individual study sessions
// ============================================================================

export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  grammarIds: jsonb("grammar_ids").$type<string[]>().notNull(),

  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),

  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),

  // Session metadata
  sessionType: text("session_type").default("study"), // study, review, quiz
  difficulty: integer("difficulty").default(3),
  results: jsonb("results").$type<Array<{
    grammarId: string;
    questionsAsked: number;
    correctAnswers: number;
    score: number;
  }>>().default([]),
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  startedAt: true,
});

export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

// ============================================================================
// Quizzes - Store generated quizzes
// ============================================================================

export const questionTypes = [
  "multiple_choice",
  "fill_in_blank",
  "translation",
  "sentence_construction",
  "error_correction",
] as const;

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  grammarIds: jsonb("grammar_ids").$type<string[]>().notNull(),

  questions: jsonb("questions").$type<Array<{
    id: string;
    grammarId: string;
    questionType: (typeof questionTypes)[number];
    questionText: string;
    questionTextJp?: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: number;
    hints: string[];
  }>>().notNull(),

  difficulty: integer("difficulty").notNull().default(3),
  timeLimitSeconds: integer("time_limit_seconds"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// ============================================================================
// Quiz Answers - Store user answers
// ============================================================================

export const quizAnswers = pgTable("quiz_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  score: real("score").notNull(), // 0-1 for partial credit

  feedback: text("feedback"),
  grammarExplanation: text("grammar_explanation"),
  timeTakenSeconds: real("time_taken_seconds"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({
  id: true,
  createdAt: true,
});

export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
export type QuizAnswer = typeof quizAnswers.$inferSelect;

// ============================================================================
// User Streaks - Gamification
// ============================================================================

export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),

  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: timestamp("last_study_date"),

  // Weekly stats
  weeklyMinutes: integer("weekly_minutes").notNull().default(0),
  weeklyQuestionsAnswered: integer("weekly_questions_answered").notNull().default(0),
  weeklyCorrectAnswers: integer("weekly_correct_answers").notNull().default(0),
  weekStart: timestamp("week_start"),

  // Monthly stats
  totalMinutes: integer("total_minutes").notNull().default(0),
  totalQuestionsAnswered: integer("total_questions_answered").notNull().default(0),
  totalCorrectAnswers: integer("total_correct_answers").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserStreakSchema = createInsertSchema(userStreaks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;
export type UserStreak = typeof userStreaks.$inferSelect;
