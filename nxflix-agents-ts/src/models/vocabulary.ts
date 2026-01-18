import { z } from 'zod';

/**
 * Part of speech for vocabulary items.
 */
export const PartOfSpeech = z.enum([
  'noun',
  'verb',
  'adjective_i',
  'adjective_na',
  'adverb',
  'particle',
  'conjunction',
  'expression',
]);
export type PartOfSpeech = z.infer<typeof PartOfSpeech>;

/**
 * An example sentence for a vocabulary item.
 */
export const VocabularyExample = z.object({
  sentence: z.string(),
  translation: z.string(),
});
export type VocabularyExample = z.infer<typeof VocabularyExample>;

/**
 * A JLPT N1 vocabulary item with readings, meanings, and examples.
 */
export const VocabularyItem = z.object({
  id: z.string(),
  word: z.string(),
  reading: z.string(),
  meanings: z.array(z.string()),
  partOfSpeech: PartOfSpeech,
  examples: z.array(VocabularyExample).default([]),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  level: z.string().default('N1'),
  contentType: z.literal('vocabulary').default('vocabulary'),
  audioUrl: z.string().nullish(),
  notes: z.string().nullish(),
});
export type VocabularyItem = z.infer<typeof VocabularyItem>;

/**
 * Request to generate a set of vocabulary items.
 */
export const VocabularyGenerateRequest = z.object({
  topic: z.string().optional(),
  partOfSpeech: PartOfSpeech.optional(),
  count: z.number().int().min(1).max(50).default(10),
  includeExamples: z.boolean().default(true),
  includeAudio: z.boolean().default(false),
});
export type VocabularyGenerateRequest = z.infer<typeof VocabularyGenerateRequest>;
