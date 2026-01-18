import { z } from 'zod';

/**
 * Type of reading passage matching JLPT N1 format.
 */
export const ReadingPassageType = z.enum([
  'short',      // 短文 - Short passages (~200-400 characters)
  'medium',     // 中文 - Medium passages (~400-800 characters)
  'long',       // 長文 - Long passages (~800-1200 characters)
  'comparison', // 比較読解 - Comparison reading (multiple texts)
  'information', // 情報検索 - Information retrieval (charts, schedules)
]);
export type ReadingPassageType = z.infer<typeof ReadingPassageType>;

/**
 * A question within a reading passage.
 */
export const ReadingQuestion = z.object({
  id: z.string(),
  questionText: z.string(),
  questionTextJp: z.string().optional(),
  options: z.array(z.string()),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string(),
  targetLine: z.number().int().optional(), // Line number the question refers to
});
export type ReadingQuestion = z.infer<typeof ReadingQuestion>;

/**
 * A JLPT N1 reading passage with comprehension questions.
 */
export const ReadingPassage = z.object({
  id: z.string(),
  passageType: ReadingPassageType,
  title: z.string().optional(),
  author: z.string().optional(),
  source: z.string().optional(),
  content: z.string(),
  contentHtml: z.string().optional(), // For formatted display
  wordCount: z.number().int(),
  characterCount: z.number().int(),
  questions: z.array(ReadingQuestion),
  keyVocabulary: z.array(z.object({
    word: z.string(),
    reading: z.string(),
    meaning: z.string(),
  })).default([]),
  keyGrammar: z.array(z.string()).default([]),
  topic: z.string().optional(),
  level: z.string().default('N1'),
  contentType: z.literal('reading').default('reading'),
  estimatedMinutes: z.number().default(5),
});
export type ReadingPassage = z.infer<typeof ReadingPassage>;

/**
 * Request to generate a reading passage.
 */
export const ReadingGenerateRequest = z.object({
  passageType: ReadingPassageType.default('short'),
  topic: z.string().optional(),
  genre: z.enum(['essay', 'article', 'letter', 'advertisement', 'story', 'opinion']).optional(),
  questionCount: z.number().int().min(1).max(6).default(3),
  includeVocabulary: z.boolean().default(true),
  includeGrammar: z.boolean().default(true),
});
export type ReadingGenerateRequest = z.infer<typeof ReadingGenerateRequest>;
