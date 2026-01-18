import { z } from 'zod';
import { ContentType } from './content-type.js';

/**
 * Question types for all JLPT N1 content.
 */
export const QuestionType = z.enum([
  // General types
  'multiple_choice',
  'fill_in_blank',
  'translation',
  'sentence_construction',
  'error_correction',
  // Kanji-specific types
  'kanji_reading',      // Read the kanji (select correct reading)
  'kanji_meaning',      // Select the meaning of kanji
  'kanji_compound',     // Complete compound word with kanji
  'kanji_write',        // Write the kanji from reading
  // Vocabulary-specific types
  'vocab_meaning',      // Select meaning from word
  'vocab_reading',      // Select reading from word
  'vocab_usage',        // Select correct usage in context
  'vocab_synonym',      // Select synonymous word
  // Listening-specific types
  'listening_comprehension', // Answer from audio
  'listening_task',          // Complete task from audio
  'listening_detail',        // Answer detail question
  // Reading-specific types
  'reading_comprehension',   // Standard MC from passage
  'reading_inference',       // Infer meaning/intent
  'reading_vocabulary',      // Vocabulary question in context
]);
export type QuestionType = z.infer<typeof QuestionType>;

export const QuizQuestion = z.object({
  id: z.string(),
  itemId: z.string(),
  contentType: ContentType.default('grammar'),
  questionType: QuestionType,
  questionText: z.string(),
  questionTextJp: z.string().nullish(),
  options: z.array(z.string()).nullish(),
  correctAnswer: z.string(),
  correctOptionIndex: z.number().int().min(0).max(3).nullish(),
  explanation: z.string(),
  difficulty: z.number().int().min(1).max(5).default(3),
  hints: z.array(z.string()).default([]),
  // For listening questions
  audioUrl: z.string().nullish(),
  // For reading questions
  passageId: z.string().nullish(),
});
export type QuizQuestion = z.infer<typeof QuizQuestion>;

export const Quiz = z.object({
  id: z.string(),
  userId: z.string(),
  itemIds: z.array(z.string()),
  contentTypes: z.array(ContentType).default([]),
  questions: z.array(QuizQuestion),
  difficulty: z.number().int().min(1).max(5).default(3),
  timeLimitSeconds: z.number().int().nullish(),
  createdAt: z.string().datetime().optional(),
});
export type Quiz = z.infer<typeof Quiz>;

export const QuizAnswer = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
  timeTakenSeconds: z.number().nullish(),
});
export type QuizAnswer = z.infer<typeof QuizAnswer>;

export const GradedAnswer = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(1),
  feedback: z.string(),
  grammarExplanation: z.string().nullish(),
});
export type GradedAnswer = z.infer<typeof GradedAnswer>;

export const QuizSubmission = z.object({
  quizId: z.string(),
  answers: z.array(QuizAnswer),
  totalTimeSeconds: z.number().nullish(),
});
export type QuizSubmission = z.infer<typeof QuizSubmission>;
