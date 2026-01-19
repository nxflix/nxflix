import { z } from 'zod';

/**
 * Character/Avatar style selection for videos.
 */
export const CharacterStyle = z.enum([
  'anime_female',
  'anime_male',
  'realistic_female',
  'realistic_male',
  'chibi',
  'mascot',
  'none', // Subtitles only, no character
]);
export type CharacterStyle = z.infer<typeof CharacterStyle>;

/**
 * Video visual style/background.
 */
export const VideoStyle = z.enum([
  'classroom', // Traditional learning setting
  'cafe', // Casual conversation setting
  'nature', // Outdoor/scenic backgrounds
  'abstract', // Minimalist/gradient backgrounds
  'manga', // Comic panel style
]);
export type VideoStyle = z.infer<typeof VideoStyle>;

/**
 * Video project status.
 */
export const VideoStatus = z.enum([
  'draft',
  'generating',
  'ready',
  'failed',
]);
export type VideoStatus = z.infer<typeof VideoStatus>;

/**
 * Furigana reading annotation for a word.
 */
export const FuriganaAnnotation = z.object({
  word: z.string(), // Original word (kanji)
  reading: z.string(), // Hiragana reading
  startIndex: z.number().int(), // Position in text
});
export type FuriganaAnnotation = z.infer<typeof FuriganaAnnotation>;

/**
 * Subtitle with furigana support.
 */
export const VideoSubtitle = z.object({
  id: z.string(),
  startTime: z.number(), // Seconds from start
  endTime: z.number(),
  text: z.string(), // Japanese text
  reading: z.string().optional(), // Full reading for TTS
  furigana: z.array(FuriganaAnnotation).default([]),
  translation: z.string().optional(), // English translation
});
export type VideoSubtitle = z.infer<typeof VideoSubtitle>;

/**
 * Video script with timing and metadata.
 */
export const VideoScript = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  subtitles: z.array(VideoSubtitle),
  totalDurationSeconds: z.number(),
  targetVocabulary: z.array(z.string()).default([]),
  grammarPoints: z.array(z.string()).default([]),
});
export type VideoScript = z.infer<typeof VideoScript>;

/**
 * Video project with all assets.
 */
export const VideoProject = z.object({
  id: z.string(),
  userId: z.string(),
  prompt: z.string(), // Original user prompt
  script: VideoScript,
  characterStyle: CharacterStyle,
  videoStyle: VideoStyle,
  voice: z.string(), // TTS voice ID
  status: VideoStatus,
  audioUrl: z.string().optional(),
  audioBase64: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  errorMessage: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
});
export type VideoProject = z.infer<typeof VideoProject>;

/**
 * Request to create a new video project.
 */
export const VideoCreateRequest = z.object({
  prompt: z.string().min(1).max(500),
  userId: z.string().min(1),
  characterStyle: CharacterStyle.default('anime_female'),
  videoStyle: VideoStyle.default('classroom'),
  voice: z.string().optional(),
  maxDurationSeconds: z.number().int().min(15).max(60).default(60),
});
export type VideoCreateRequest = z.infer<typeof VideoCreateRequest>;

/**
 * Request to generate just a script.
 */
export const ScriptGenerateRequest = z.object({
  prompt: z.string().min(1).max(500),
  maxDurationSeconds: z.number().int().min(15).max(60).default(60),
});
export type ScriptGenerateRequest = z.infer<typeof ScriptGenerateRequest>;

/**
 * Available TTS voice info.
 */
export const TTSVoice = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.string(),
  description: z.string(),
  provider: z.string(),
});
export type TTSVoice = z.infer<typeof TTSVoice>;

/**
 * Available style options response.
 */
export const VideoStylesResponse = z.object({
  characters: z.array(
    z.object({
      id: CharacterStyle,
      name: z.string(),
      description: z.string(),
    })
  ),
  backgrounds: z.array(
    z.object({
      id: VideoStyle,
      name: z.string(),
      description: z.string(),
    })
  ),
});
export type VideoStylesResponse = z.infer<typeof VideoStylesResponse>;
