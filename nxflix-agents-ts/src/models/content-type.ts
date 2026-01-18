import { z } from 'zod';

/**
 * Content types for JLPT N1 study materials.
 */
export const ContentType = z.enum([
  'grammar',
  'vocabulary',
  'kanji',
  'reading',
  'listening',
]);
export type ContentType = z.infer<typeof ContentType>;

/**
 * Helper to check if a string is a valid content type.
 */
export function isValidContentType(value: string): value is ContentType {
  return ContentType.safeParse(value).success;
}
