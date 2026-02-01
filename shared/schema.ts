import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
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
// Grammar Points - 200 JLPT N1 patterns (Frontend)
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
// User Grammar Progress - SM-2 spaced repetition data (Frontend)
// ============================================================================

export const userGrammarProgress = pgTable("user_grammar_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  grammarId: varchar("grammar_id").notNull().references(() => grammarPoints.id, { onDelete: "cascade" }),

  // SM-2 Algorithm fields
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewDate: timestamp("next_review_date"),
  lastReviewDate: timestamp("last_review_date"),

  // Study statistics
  timesStudied: integer("times_studied").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  lastScore: real("last_score"),
  masteryLevel: integer("mastery_level").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserGrammarProgressSchema = createInsertSchema(userGrammarProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserGrammarProgress = z.infer<typeof insertUserGrammarProgressSchema>;
export type UserGrammarProgress = typeof userGrammarProgress.$inferSelect;

// ============================================================================
// Study Sessions - Track individual study sessions (Frontend)
// ============================================================================

export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  grammarIds: jsonb("grammar_ids").$type<string[]>().notNull(),

  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),

  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),

  sessionType: text("session_type").default("study"),
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
// Quizzes - Store generated quizzes (Frontend)
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
// Quiz Answers - Store user answers (Frontend)
// ============================================================================

export const quizAnswers = pgTable("quiz_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  score: real("score").notNull(),

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
// User Profiles - Extended user info for pod matching
// ============================================================================

export const jlptLevels = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JLPTLevel = (typeof jlptLevels)[number];

export const studyTimePreferences = ["morning", "evening", "flexible"] as const;
export type StudyTimePreference = (typeof studyTimePreferences)[number];

export const studyCommitments = ["30min", "1hr", "2hr+"] as const;
export type StudyCommitment = (typeof studyCommitments)[number];

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),

  // Display info
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").default("UTC"),

  // JLPT goals
  targetLevel: text("target_level").$type<JLPTLevel>(),
  targetExam: timestamp("target_exam"),

  // Study preferences (for pod matching)
  dailyCommitment: text("daily_commitment").$type<StudyCommitment>(),
  studyTimePreference: text("study_time_preference").$type<StudyTimePreference>(),
  studyTools: jsonb("study_tools").$type<string[]>().default([]),

  // Onboarding status
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingStep: integer("onboarding_step").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// ============================================================================
// Pods - Study accountability groups
// ============================================================================

export const podJoinTypes = ["open", "request"] as const;
export type PodJoinType = (typeof podJoinTypes)[number];

export const pods = pgTable("pods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),

  // Target settings
  jlptLevel: text("jlpt_level").notNull().$type<JLPTLevel>(),
  targetExam: timestamp("target_exam").notNull(),
  dailyCommitment: text("daily_commitment").notNull().$type<StudyCommitment>(),

  // Pod configuration
  maxMembers: integer("max_members").notNull().default(8),
  joinType: text("join_type").notNull().$type<PodJoinType>().default("request"),
  leaderId: varchar("leader_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Pod rules
  rules: jsonb("rules").$type<{
    requireDailyCheckIn: boolean;
    requireProof: boolean;
    minStudyMinutes: number;
    autoRemoveInactiveDays: number | null;
    weeklyReviewDay: number;
  }>().default({
    requireDailyCheckIn: true,
    requireProof: false,
    minStudyMinutes: 0,
    autoRemoveInactiveDays: null,
    weeklyReviewDay: 0,
  }),

  // Stats (denormalized)
  memberCount: integer("member_count").notNull().default(1),
  averageStreak: real("average_streak").notNull().default(0),
  checkInRate: real("check_in_rate").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPodSchema = createInsertSchema(pods).omit({
  id: true,
  memberCount: true,
  averageStreak: true,
  checkInRate: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPod = z.infer<typeof insertPodSchema>;
export type Pod = typeof pods.$inferSelect;

// ============================================================================
// Pod Members
// ============================================================================

export const podMemberRoles = ["leader", "member"] as const;
export type PodMemberRole = (typeof podMemberRoles)[number];

export const podMemberStatuses = ["active", "pending", "inactive", "removed"] as const;
export type PodMemberStatus = (typeof podMemberStatuses)[number];

export const podMembers = pgTable("pod_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  podId: varchar("pod_id").notNull().references(() => pods.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  role: text("role").notNull().$type<PodMemberRole>().default("member"),
  status: text("status").notNull().$type<PodMemberStatus>().default("active"),

  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalCheckIns: integer("total_check_ins").notNull().default(0),
  totalStudyMinutes: integer("total_study_minutes").notNull().default(0),

  introMessage: text("intro_message"),

  joinedAt: timestamp("joined_at").defaultNow(),
  lastCheckInDate: timestamp("last_check_in_date"),
});

export const insertPodMemberSchema = createInsertSchema(podMembers).omit({
  id: true,
  currentStreak: true,
  longestStreak: true,
  totalCheckIns: true,
  totalStudyMinutes: true,
  joinedAt: true,
  lastCheckInDate: true,
});

export type InsertPodMember = z.infer<typeof insertPodMemberSchema>;
export type PodMember = typeof podMembers.$inferSelect;

// ============================================================================
// Check-Ins - Daily study logs
// ============================================================================

export const moodTypes = ["struggling", "okay", "great"] as const;
export type MoodType = (typeof moodTypes)[number];

export const studyTags = ["grammar", "kanji", "vocab", "listening", "reading", "speaking"] as const;
export type StudyTag = (typeof studyTags)[number];

export const proofTypes = ["screenshot", "link", "note"] as const;
export type ProofType = (typeof proofTypes)[number];

export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  podId: varchar("pod_id").notNull().references(() => pods.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  date: timestamp("date").notNull(),
  studyMinutes: integer("study_minutes").notNull(),
  mood: text("mood").notNull().$type<MoodType>(),

  studyTags: jsonb("study_tags").$type<StudyTag[]>().default([]),
  proofType: text("proof_type").$type<ProofType>(),
  proofContent: text("proof_content"),
  reflection: text("reflection"),

  streakDay: integer("streak_day").notNull().default(1),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
});

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

// ============================================================================
// Weekly Reviews
// ============================================================================

export const weeklyReviews = pgTable("weekly_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  podId: varchar("pod_id").notNull().references(() => pods.id, { onDelete: "cascade" }),

  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),

  daysCheckedIn: integer("days_checked_in").notNull().default(0),
  totalMinutes: integer("total_minutes").notNull().default(0),
  studyTagBreakdown: jsonb("study_tag_breakdown").$type<Record<StudyTag, number>>().default({}),
  moodBreakdown: jsonb("mood_breakdown").$type<Record<MoodType, number>>().default({}),

  goalDays: integer("goal_days").notNull().default(7),
  goalMinutes: integer("goal_minutes").notNull().default(420),

  aiInsights: jsonb("ai_insights").$type<Array<{
    type: "pattern" | "suggestion" | "warning" | "focus";
    icon: string;
    title: string;
    body: string;
    actionLabel?: string;
    actionType?: string;
  }>>().default([]),

  userReflection: text("user_reflection"),

  minutesChange: integer("minutes_change").default(0),
  daysChange: integer("days_change").default(0),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWeeklyReviewSchema = createInsertSchema(weeklyReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertWeeklyReview = z.infer<typeof insertWeeklyReviewSchema>;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;

// ============================================================================
// Pod Invites
// ============================================================================

export const podInvites = pgTable("pod_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  podId: varchar("pod_id").notNull().references(() => pods.id, { onDelete: "cascade" }),
  invitedBy: varchar("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),

  inviteCode: varchar("invite_code").unique(),
  invitedEmail: text("invited_email"),

  maxUses: integer("max_uses").default(1),
  useCount: integer("use_count").notNull().default(0),

  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPodInviteSchema = createInsertSchema(podInvites).omit({
  id: true,
  useCount: true,
  createdAt: true,
});

export type InsertPodInvite = z.infer<typeof insertPodInviteSchema>;
export type PodInvite = typeof podInvites.$inferSelect;

// ============================================================================
// User Streaks - Gamification
// ============================================================================

export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),

  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: timestamp("last_study_date"),

  weeklyMinutes: integer("weekly_minutes").notNull().default(0),
  weeklyQuestionsAnswered: integer("weekly_questions_answered").notNull().default(0),
  weeklyCorrectAnswers: integer("weekly_correct_answers").notNull().default(0),
  weekStart: timestamp("week_start"),

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

// ============================================================================
// Grammar Table (Agent Service)
// ============================================================================

export const grammar = pgTable("grammar", {
  id: varchar("id", { length: 100 }).primaryKey(),
  pattern: text("pattern").notNull(),
  meaning: text("meaning").notNull(),
  meaningJp: text("meaning_jp"),
  example: text("example").notNull(),
  exampleTranslation: text("example_translation"),
  explanation: text("explanation"),
  formationRules: jsonb("formation_rules").$type<string[]>(),
  usageNotes: text("usage_notes"),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  level: varchar("level", { length: 10 }).notNull().default("N1"),
  relatedPatterns: jsonb("related_patterns").$type<string[]>().default([]),
  contentType: varchar("content_type", { length: 20 }).notNull().default("grammar"),
  isPublic: boolean("is_public").notNull().default(false),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Grammar = typeof grammar.$inferSelect;
export type NewGrammar = typeof grammar.$inferInsert;

// ============================================================================
// Vocabulary Table (Agent Service)
// ============================================================================

export const vocabulary = pgTable("vocabulary", {
  id: varchar("id", { length: 100 }).primaryKey(),
  word: text("word").notNull(),
  reading: text("reading").notNull(),
  meanings: jsonb("meanings").$type<string[]>().notNull(),
  partOfSpeech: varchar("part_of_speech", { length: 50 }).notNull(),
  examples: jsonb("examples").$type<{ sentence: string; translation: string }[]>().default([]),
  synonyms: jsonb("synonyms").$type<string[]>().default([]),
  level: varchar("level", { length: 10 }).notNull().default("N1"),
  contentType: varchar("content_type", { length: 20 }).notNull().default("vocabulary"),
  audioUrl: text("audio_url"),
  isPublic: boolean("is_public").notNull().default(false),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Vocabulary = typeof vocabulary.$inferSelect;
export type NewVocabulary = typeof vocabulary.$inferInsert;

// ============================================================================
// Kanji Table (Agent Service)
// ============================================================================

export const kanji = pgTable("kanji", {
  id: varchar("id", { length: 100 }).primaryKey(),
  character: varchar("character", { length: 10 }).notNull(),
  strokeCount: integer("stroke_count").notNull(),
  onyomi: jsonb("onyomi").$type<string[]>().notNull(),
  kunyomi: jsonb("kunyomi").$type<string[]>().notNull(),
  meanings: jsonb("meanings").$type<string[]>().notNull(),
  radicals: jsonb("radicals").$type<string[]>().default([]),
  compoundWords: jsonb("compound_words").$type<{ word: string; reading: string; meaning: string }[]>().default([]),
  mnemonics: text("mnemonics"),
  level: varchar("level", { length: 10 }).notNull().default("N1"),
  contentType: varchar("content_type", { length: 20 }).notNull().default("kanji"),
  isPublic: boolean("is_public").notNull().default(false),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Kanji = typeof kanji.$inferSelect;
export type NewKanji = typeof kanji.$inferInsert;

// ============================================================================
// Reading Table (Agent Service)
// ============================================================================

export const reading = pgTable("reading", {
  id: varchar("id", { length: 100 }).primaryKey(),
  passageType: varchar("passage_type", { length: 20 }).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  questions: jsonb("questions").$type<{
    id: string;
    questionText: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }[]>().notNull(),
  keyVocabulary: jsonb("key_vocabulary").$type<string[] | { word: string; reading: string; meaning: string }[]>().default([]),
  level: varchar("level", { length: 10 }).notNull().default("N1"),
  contentType: varchar("content_type", { length: 20 }).notNull().default("reading"),
  estimatedMinutes: integer("estimated_minutes").default(5),
  isPublic: boolean("is_public").notNull().default(false),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Reading = typeof reading.$inferSelect;
export type NewReading = typeof reading.$inferInsert;

// ============================================================================
// Listening Table (Agent Service)
// ============================================================================

export const listening = pgTable("listening", {
  id: varchar("id", { length: 100 }).primaryKey(),
  listeningType: varchar("listening_type", { length: 30 }).notNull(),
  title: text("title"),
  description: text("description"),
  audioUrl: text("audio_url"),
  audioBase64: text("audio_base64"),
  transcript: text("transcript").notNull(),
  dialogue: jsonb("dialogue").$type<{
    speakerId: string;
    text: string;
    startTime?: number;
    endTime?: number;
  }[]>().default([]),
  speakers: jsonb("speakers").$type<{
    id: string;
    name: string;
    gender: string;
    voice?: string;
  }[]>().default([]),
  durationSeconds: integer("duration_seconds").notNull(),
  questions: jsonb("questions").$type<{
    id: string;
    questionText: string;
    questionTextJp?: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }[]>().notNull(),
  situationContext: text("situation_context"),
  level: varchar("level", { length: 10 }).notNull().default("N1"),
  contentType: varchar("content_type", { length: 20 }).notNull().default("listening"),
  isPublic: boolean("is_public").notNull().default(false),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Listening = typeof listening.$inferSelect;
export type NewListening = typeof listening.$inferInsert;

// ============================================================================
// User Progress Table (Agent Service)
// ============================================================================

export const userProgress = pgTable("user_progress", {
  id: varchar("id", { length: 200 }).primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  itemId: varchar("item_id", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1),
  repetitions: integer("repetitions").notNull().default(0),
  timesStudied: integer("times_studied").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  lastScore: real("last_score"),
  masteryLevel: integer("mastery_level").notNull().default(0),
  nextReviewAt: timestamp("next_review_at"),
  lastStudiedAt: timestamp("last_studied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;

// ============================================================================
// Focus Sessions Table (Agent Service)
// ============================================================================

export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  contentId: varchar("content_id", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull(),
  itemId: varchar("item_id", { length: 100 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  revealed: boolean("revealed").default(false),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FocusSession = typeof focusSessions.$inferSelect;
export type NewFocusSession = typeof focusSessions.$inferInsert;

// ============================================================================
// Video Projects Table (Agent Service)
// ============================================================================

export const videoProjects = pgTable("video_projects", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  prompt: text("prompt").notNull(),
  script: jsonb("script").$type<{
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
  characterStyle: varchar("character_style", { length: 50 }),
  videoStyle: varchar("video_style", { length: 50 }),
  voice: varchar("voice", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  audioUrl: text("audio_url"),
  audioBase64: text("audio_base64"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  errorMessage: text("error_message"),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VideoProject = typeof videoProjects.$inferSelect;
export type NewVideoProject = typeof videoProjects.$inferInsert;

// ============================================================================
// Epochs Table (Agent Service)
// ============================================================================

export const epochs = pgTable("epochs", {
  id: varchar("id", { length: 100 }).primaryKey(),
  epochType: varchar("epoch_type", { length: 20 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Epoch = typeof epochs.$inferSelect;
export type NewEpoch = typeof epochs.$inferInsert;

// ============================================================================
// Content Events Table (Agent Service)
// ============================================================================

export const contentEvents = pgTable("content_events", {
  id: varchar("id", { length: 100 }).primaryKey(),
  contentId: varchar("content_id", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull(),
  userId: varchar("user_id", { length: 100 }),
  eventType: varchar("event_type", { length: 30 }).notNull(),
  eventData: jsonb("event_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContentEvent = typeof contentEvents.$inferSelect;
export type NewContentEvent = typeof contentEvents.$inferInsert;

// ============================================================================
// Content Epoch Stats Table (Agent Service)
// ============================================================================

export const contentEpochStats = pgTable("content_epoch_stats", {
  id: varchar("id", { length: 100 }).primaryKey(),
  epochId: varchar("epoch_id", { length: 100 }).notNull(),
  contentId: varchar("content_id", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull(),
  creatorId: varchar("creator_id", { length: 100 }),
  viewCount: integer("view_count").notNull().default(0),
  studyCount: integer("study_count").notNull().default(0),
  completionCount: integer("completion_count").notNull().default(0),
  saveCount: integer("save_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  uniqueUsers: integer("unique_users").notNull().default(0),
  averageRating: real("average_rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContentEpochStat = typeof contentEpochStats.$inferSelect;
export type NewContentEpochStat = typeof contentEpochStats.$inferInsert;

// ============================================================================
// Creator Points Table (Agent Service)
// ============================================================================

export const creatorPoints = pgTable("creator_points", {
  id: varchar("id", { length: 100 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 100 }).notNull(),
  epochId: varchar("epoch_id", { length: 100 }).notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  tier: varchar("tier", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CreatorPoint = typeof creatorPoints.$inferSelect;
export type NewCreatorPoint = typeof creatorPoints.$inferInsert;

// ============================================================================
// Creator Rewards Table (Agent Service)
// ============================================================================

export const creatorRewards = pgTable("creator_rewards", {
  id: varchar("id", { length: 100 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 100 }).notNull(),
  epochId: varchar("epoch_id", { length: 100 }).notNull(),
  pointsEarned: integer("points_earned").notNull(),
  tier: varchar("tier", { length: 20 }),
  rewardType: varchar("reward_type", { length: 50 }),
  rewardValue: text("reward_value"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  reviewedBy: varchar("reviewed_by", { length: 100 }),
  reviewedAt: timestamp("reviewed_at"),
  tokenAmount: real("token_amount"),
  distributedAt: timestamp("distributed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CreatorReward = typeof creatorRewards.$inferSelect;
export type NewCreatorReward = typeof creatorRewards.$inferInsert;

// ============================================================================
// Daily Rewards Table (Agent Service)
// ============================================================================

export const dailyRewards = pgTable("daily_rewards", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  rewardDate: timestamp("reward_date").notNull(),
  qualifyingTaskId: varchar("qualifying_task_id", { length: 100 }),
  qualifyingTaskType: varchar("qualifying_task_type", { length: 50 }),
  rewardRarity: varchar("reward_rarity", { length: 20 }).notNull(),
  rewardType: varchar("reward_type", { length: 50 }).notNull(),
  rewardValue: text("reward_value"),
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DailyReward = typeof dailyRewards.$inferSelect;
export type NewDailyReward = typeof dailyRewards.$inferInsert;

// ============================================================================
// Featured Content Table (Agent Service)
// ============================================================================

export const featuredContent = pgTable("featured_content", {
  id: varchar("id", { length: 100 }).primaryKey(),
  contentId: varchar("content_id", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull(),
  creatorId: varchar("creator_id", { length: 100 }),
  featureDate: timestamp("feature_date").notNull(),
  featureReason: text("feature_reason"),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FeaturedContent = typeof featuredContent.$inferSelect;
export type NewFeaturedContent = typeof featuredContent.$inferInsert;
