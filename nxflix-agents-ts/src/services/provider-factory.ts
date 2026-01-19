import type { TTSProviderType, ImageProvider, VideoProvider } from '../models/pipeline-config.js';
import type { ProvidersResponse, ProviderStatus, VoiceOption } from '../models/pipeline-config.js';

// TTS Providers
import type { ITTSProvider } from './providers/tts/interface.js';
import { ElevenLabsTTSProvider } from './providers/tts/elevenlabs.js';
import { OpenAITTSProvider } from './providers/tts/openai.js';
import { GoogleTTSProvider } from './providers/tts/google.js';
import { AzureTTSProvider } from './providers/tts/azure.js';

// Image Providers
import type { IImageProvider } from './providers/image/interface.js';
import { DALLEImageProvider } from './providers/image/dalle.js';
import { GeminiImageProvider } from './providers/image/gemini.js';
import { StableDiffusionImageProvider } from './providers/image/stable-diffusion.js';
import { StaticImageProvider } from './providers/image/static.js';

// Video Providers
import type { IVideoProvider } from './providers/video/interface.js';
import { FFmpegVideoProvider } from './providers/video/ffmpeg.js';
import { GeminiVeoVideoProvider } from './providers/video/gemini-veo.js';
import { RunwayVideoProvider } from './providers/video/runway.js';
import { PikaVideoProvider } from './providers/video/pika.js';

/**
 * Create a TTS provider instance.
 */
export function createTTSProvider(provider: TTSProviderType): ITTSProvider {
  switch (provider) {
    case 'elevenlabs':
      return new ElevenLabsTTSProvider();
    case 'openai':
      return new OpenAITTSProvider();
    case 'google':
      return new GoogleTTSProvider();
    case 'azure':
      return new AzureTTSProvider();
    default:
      return new OpenAITTSProvider();
  }
}

/**
 * Create an image provider instance.
 */
export function createImageProvider(provider: ImageProvider): IImageProvider {
  switch (provider) {
    case 'dalle':
      return new DALLEImageProvider();
    case 'gemini':
      return new GeminiImageProvider();
    case 'stable_diffusion':
      return new StableDiffusionImageProvider();
    case 'static':
      return new StaticImageProvider();
    default:
      return new StaticImageProvider();
  }
}

/**
 * Create a video provider instance.
 */
export function createVideoProvider(provider: VideoProvider): IVideoProvider {
  switch (provider) {
    case 'ffmpeg':
      return new FFmpegVideoProvider();
    case 'gemini_veo':
      return new GeminiVeoVideoProvider();
    case 'runway':
      return new RunwayVideoProvider();
    case 'pika':
      return new PikaVideoProvider();
    default:
      return new FFmpegVideoProvider();
  }
}

/**
 * Get all available providers and their status.
 */
export async function getProvidersStatus(): Promise<ProvidersResponse> {
  // Script providers (LLM)
  const scriptProviders: ProviderStatus[] = [
    { id: 'claude', name: 'Claude', available: true },
    { id: 'openai', name: 'OpenAI GPT-4', available: true },
    { id: 'gemini', name: 'Gemini', available: true },
  ];

  // TTS providers
  const ttsProviders: Array<ProviderStatus & { voices?: VoiceOption[] }> = [];

  const ttsTypes: TTSProviderType[] = ['elevenlabs', 'openai', 'google', 'azure'];
  for (const type of ttsTypes) {
    const provider = createTTSProvider(type);
    const available = await provider.isAvailable();
    const voices = available
      ? (await provider.getVoices()).map((v) => ({
          ...v,
          provider: type,
          language: v.language || 'ja-JP',
        }))
      : undefined;

    ttsProviders.push({
      id: type,
      name: provider.getProviderName(),
      available,
      voices,
      reason: available ? undefined : 'API key not configured',
    });
  }

  // Image providers
  const imageProviders: ProviderStatus[] = [];

  const imageTypes: ImageProvider[] = ['static', 'dalle', 'gemini', 'stable_diffusion'];
  for (const type of imageTypes) {
    const provider = createImageProvider(type);
    const available = await provider.isAvailable();

    imageProviders.push({
      id: type,
      name: provider.getProviderName(),
      available,
      reason: available ? undefined : 'API key not configured',
    });
  }

  // Video providers
  const videoProviders: ProviderStatus[] = [];

  const videoTypes: VideoProvider[] = ['ffmpeg', 'gemini_veo', 'runway', 'pika'];
  for (const type of videoTypes) {
    const provider = createVideoProvider(type);
    const available = await provider.isAvailable();

    videoProviders.push({
      id: type,
      name: provider.getProviderName(),
      available,
      reason: available ? undefined : type === 'ffmpeg' ? 'FFmpeg not installed' : 'API key not configured',
    });
  }

  return {
    script: scriptProviders,
    tts: ttsProviders,
    image: imageProviders,
    video: videoProviders,
  };
}

/**
 * Render video with fallback support.
 * Tries providers in order until one succeeds.
 */
export async function renderWithFallback(
  project: import('../models/video.js').VideoProject,
  preferredProvider: VideoProvider,
  fallbackOrder: VideoProvider[] = ['ffmpeg']
): Promise<import('./providers/video/interface.js').VideoRenderResult> {
  const providers = [preferredProvider, ...fallbackOrder.filter((p) => p !== preferredProvider)];

  for (const providerType of providers) {
    try {
      const provider = createVideoProvider(providerType);
      const available = await provider.isAvailable();

      if (!available) {
        console.log(`Provider ${providerType} not available, trying next...`);
        continue;
      }

      console.log(`Rendering with ${providerType}...`);
      return await provider.render(project);
    } catch (error) {
      console.error(`Provider ${providerType} failed:`, error);
      continue;
    }
  }

  throw new Error('All video providers failed');
}
