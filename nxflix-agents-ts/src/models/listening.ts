import { z } from 'zod';

/**
 * Type of listening exercise matching JLPT N1 format.
 */
export const ListeningType = z.enum([
  'task_based',          // 課題理解 - Task-based comprehension
  'point_comprehension', // ポイント理解 - Key point comprehension
  'quick_response',      // 即時応答 - Quick response
  'general_comprehension', // 概要理解 - General comprehension
  'integrated',          // 統合理解 - Integrated comprehension
]);
export type ListeningType = z.infer<typeof ListeningType>;

/**
 * A question within a listening exercise.
 */
export const ListeningQuestion = z.object({
  id: z.string(),
  questionText: z.string(),
  questionTextJp: z.string().optional(),
  options: z.array(z.string()),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string(),
});
export type ListeningQuestion = z.infer<typeof ListeningQuestion>;

/**
 * A speaker in a dialogue.
 */
export const Speaker = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.enum(['male', 'female', 'neutral']).default('neutral'),
  voice: z.string().optional(),
});
export type Speaker = z.infer<typeof Speaker>;

/**
 * A line of dialogue in a listening exercise.
 */
export const DialogueLine = z.object({
  speakerId: z.string(),
  text: z.string(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
});
export type DialogueLine = z.infer<typeof DialogueLine>;

/**
 * A JLPT N1 listening item with audio, transcript, and questions.
 */
export const ListeningItem = z.object({
  id: z.string(),
  listeningType: ListeningType,
  title: z.string().optional(),
  description: z.string().optional(),
  audioUrl: z.string().optional(),
  audioBase64: z.string().optional(),
  transcript: z.string(),
  dialogue: z.array(DialogueLine).default([]),
  speakers: z.array(Speaker).default([]),
  durationSeconds: z.number(),
  questions: z.array(ListeningQuestion),
  situationContext: z.string().optional(),
  level: z.string().default('N1'),
  contentType: z.literal('listening').default('listening'),
});
export type ListeningItem = z.infer<typeof ListeningItem>;

/**
 * Request to generate a listening exercise.
 */
export const ListeningGenerateRequest = z.object({
  listeningType: ListeningType.default('task_based'),
  topic: z.string().optional(),
  durationSeconds: z.number().int().min(30).max(300).default(60),
  questionCount: z.number().int().min(1).max(5).default(2),
  speakerCount: z.number().int().min(1).max(3).default(2),
  generateAudio: z.boolean().default(true),
});
export type ListeningGenerateRequest = z.infer<typeof ListeningGenerateRequest>;
