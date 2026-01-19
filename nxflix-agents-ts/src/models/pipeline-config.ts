import { z } from 'zod';

/**
 * Script generation provider options.
 */
export const ScriptProvider = z.enum(['claude', 'openai', 'gemini']);
export type ScriptProvider = z.infer<typeof ScriptProvider>;

/**
 * Text-to-speech provider options.
 */
export const TTSProviderType = z.enum(['elevenlabs', 'openai', 'google', 'azure']);
export type TTSProviderType = z.infer<typeof TTSProviderType>;

/**
 * Image generation provider options.
 */
export const ImageProvider = z.enum(['dalle', 'gemini', 'stable_diffusion', 'static']);
export type ImageProvider = z.infer<typeof ImageProvider>;

/**
 * Video composition provider options.
 */
export const VideoProvider = z.enum(['ffmpeg', 'gemini_veo', 'runway', 'pika']);
export type VideoProvider = z.infer<typeof VideoProvider>;

/**
 * Video resolution options.
 */
export const VideoResolution = z.enum(['720p', '1080p', '4k']);
export type VideoResolution = z.infer<typeof VideoResolution>;

/**
 * Video output format options.
 */
export const VideoFormat = z.enum(['mp4', 'webm']);
export type VideoFormat = z.infer<typeof VideoFormat>;

/**
 * TTS provider-specific settings.
 */
export const TTSSettings = z.object({
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(-20).max(20).default(0),
});
export type TTSSettings = z.infer<typeof TTSSettings>;

/**
 * Image provider-specific settings.
 */
export const ImageSettings = z.object({
  style: z.string().optional(),
  generateBackground: z.boolean().default(false),
  generateCharacter: z.boolean().default(false),
});
export type ImageSettings = z.infer<typeof ImageSettings>;

/**
 * Video composition settings.
 */
export const VideoSettings = z.object({
  resolution: VideoResolution.default('1080p'),
  fps: z.number().int().min(15).max(60).default(30),
  format: VideoFormat.default('mp4'),
  codec: z.enum(['h264', 'h265', 'vp8', 'vp9']).default('h264'),
});
export type VideoSettings = z.infer<typeof VideoSettings>;

/**
 * Complete pipeline configuration for video generation.
 * Allows users to select which AI provider to use for each step.
 */
export const PipelineConfig = z.object({
  scriptProvider: ScriptProvider.default('claude'),
  ttsProvider: TTSProviderType.default('openai'),
  imageProvider: ImageProvider.default('static'),
  videoProvider: VideoProvider.default('ffmpeg'),
  ttsSettings: TTSSettings.default({}),
  imageSettings: ImageSettings.default({}),
  videoSettings: VideoSettings.default({}),
});
export type PipelineConfig = z.infer<typeof PipelineConfig>;

/**
 * Provider availability status.
 */
export const ProviderStatus = z.object({
  id: z.string(),
  name: z.string(),
  available: z.boolean(),
  reason: z.string().optional(),
});
export type ProviderStatus = z.infer<typeof ProviderStatus>;

/**
 * Voice option for TTS.
 */
export const VoiceOption = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.string(),
  language: z.string().default('ja-JP'),
  provider: TTSProviderType,
  description: z.string().optional(),
});
export type VoiceOption = z.infer<typeof VoiceOption>;

/**
 * Response containing all available providers and their status.
 */
export const ProvidersResponse = z.object({
  script: z.array(ProviderStatus),
  tts: z.array(
    ProviderStatus.extend({
      voices: z.array(VoiceOption).optional(),
    })
  ),
  image: z.array(ProviderStatus),
  video: z.array(ProviderStatus),
});
export type ProvidersResponse = z.infer<typeof ProvidersResponse>;

/**
 * Default pipeline configuration.
 * Uses the most reliable providers with reasonable defaults.
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  scriptProvider: 'claude',
  ttsProvider: 'openai',
  imageProvider: 'static',
  videoProvider: 'ffmpeg',
  ttsSettings: {
    speed: 1.0,
    pitch: 0,
  },
  imageSettings: {
    generateBackground: false,
    generateCharacter: false,
  },
  videoSettings: {
    resolution: '1080p',
    fps: 30,
    format: 'mp4',
    codec: 'h264',
  },
};

/**
 * Video provider fallback order.
 * If the primary provider fails, try the next one.
 */
export const VIDEO_PROVIDER_FALLBACK_ORDER: VideoProvider[] = [
  'gemini_veo',
  'runway',
  'pika',
  'ffmpeg',
];
