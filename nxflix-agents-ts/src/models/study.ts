import { z } from 'zod';

export const StudyRecommendation = z.object({
  grammarIds: z.array(z.string()),
  reason: z.string(),
  priority: z.number().int().min(1).max(5).default(1),
  estimatedTimeMinutes: z.number().int().default(15),
  focusAreas: z.array(z.string()).default([]),
  suggestedQuestionTypes: z.array(z.string()).default([]),
});
export type StudyRecommendation = z.infer<typeof StudyRecommendation>;

export const RecommendationRequest = z.object({
  userId: z.string(),
  availableGrammarIds: z.array(z.string()).default([]),
  maxItems: z.number().int().min(1).max(20).default(5),
  focusWeakAreas: z.boolean().default(true),
  includeNew: z.boolean().default(true),
  timeAvailableMinutes: z.number().int().nullish(),
});
export type RecommendationRequest = z.infer<typeof RecommendationRequest>;

export const SessionRequest = z.object({
  userId: z.string(),
  grammarIds: z.array(z.string()),
  questionCount: z.number().int().min(1).max(50).default(10),
  questionTypes: z.array(z.string()).default([]),
  difficulty: z.number().int().min(1).max(5).nullish(),
});
export type SessionRequest = z.infer<typeof SessionRequest>;

export const SessionCompleteRequest = z.object({
  sessionId: z.string(),
  results: z.array(z.record(z.unknown())),
});
export type SessionCompleteRequest = z.infer<typeof SessionCompleteRequest>;
