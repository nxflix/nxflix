import { z } from 'zod';

/**
 * A compound word containing a kanji character.
 */
export const CompoundWord = z.object({
  word: z.string(),
  reading: z.string(),
  meaning: z.string(),
});
export type CompoundWord = z.infer<typeof CompoundWord>;

/**
 * A JLPT N1 kanji item with readings, meanings, and related compounds.
 */
export const KanjiItem = z.object({
  id: z.string(),
  character: z.string().length(1),
  strokeCount: z.number().int().min(1),
  onyomi: z.array(z.string()).default([]),
  kunyomi: z.array(z.string()).default([]),
  meanings: z.array(z.string()),
  radicals: z.array(z.string()).default([]),
  compoundWords: z.array(CompoundWord).default([]),
  mnemonics: z.string().nullish(),
  level: z.string().default('N1'),
  contentType: z.literal('kanji').default('kanji'),
});
export type KanjiItem = z.infer<typeof KanjiItem>;

/**
 * Request to generate a set of kanji items.
 */
export const KanjiGenerateRequest = z.object({
  characters: z.array(z.string()).optional(),
  count: z.number().int().min(1).max(50).default(10),
  topic: z.string().optional(),
  includeCompounds: z.boolean().default(true),
});
export type KanjiGenerateRequest = z.infer<typeof KanjiGenerateRequest>;
