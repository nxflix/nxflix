import { z } from 'zod';

export const GrammarCategory = z.enum([
  'formal',
  'classical',
  'conjunctive',
  'conditional',
  'comparative',
  'emphasis',
  'negative',
  'temporal',
  'causative',
  'other',
]);
export type GrammarCategory = z.infer<typeof GrammarCategory>;

export const GrammarPoint = z.object({
  id: z.string(),
  pattern: z.string(),
  meaning: z.string(),
  meaningJp: z.string().nullish(),
  example: z.string(),
  exampleTranslation: z.string(),
  category: GrammarCategory,
  level: z.string().default('N1'),
  notes: z.string().nullish(),
  relatedPatterns: z.array(z.string()).default([]),
});
export type GrammarPoint = z.infer<typeof GrammarPoint>;
