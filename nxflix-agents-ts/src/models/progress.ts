import { z } from 'zod';

export const SM2Data = z.object({
  easeFactor: z.number().min(1.3).default(2.5),
  interval: z.number().int().min(0).default(0),
  repetitions: z.number().int().min(0).default(0),
  nextReviewDate: z.string().datetime().nullish(),
  lastReviewDate: z.string().datetime().nullish(),
});
export type SM2Data = z.infer<typeof SM2Data>;

export const UserProgress = z.object({
  userId: z.string(),
  grammarId: z.string(),
  sm2Data: SM2Data.default({}),
  timesStudied: z.number().int().default(0),
  timesCorrect: z.number().int().default(0),
  lastScore: z.number().nullish(),
  masteryLevel: z.number().int().min(0).max(5).default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type UserProgress = z.infer<typeof UserProgress>;

export const SessionResult = z.object({
  grammarId: z.string(),
  questionsAsked: z.number().int(),
  correctAnswers: z.number().int(),
  score: z.number().min(0).max(5),
});
export type SessionResult = z.infer<typeof SessionResult>;

export const StudySession = z.object({
  id: z.string(),
  userId: z.string(),
  grammarIds: z.array(z.string()),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().nullish(),
  results: z.array(SessionResult).default([]),
  totalQuestions: z.number().int().default(0),
  totalCorrect: z.number().int().default(0),
});
export type StudySession = z.infer<typeof StudySession>;
