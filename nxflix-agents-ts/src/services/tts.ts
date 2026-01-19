import { z } from 'zod';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { settings } from '../config.js';

/**
 * TTS provider type.
 */
export const TTSProvider = z.enum(['google', 'openai', 'elevenlabs']);
export type TTSProvider = z.infer<typeof TTSProvider>;

/**
 * Voice info type.
 */
export interface VoiceInfo {
  name: string;
  gender: string;
  description: string;
}

/**
 * Available Japanese voices by provider (static voices for Google/OpenAI).
 */
export const JapaneseVoices: Record<string, Record<string, VoiceInfo>> = {
  google: {
    'ja-JP-Neural2-B': { name: 'ja-JP-Neural2-B', gender: 'female', description: 'Natural female voice' },
    'ja-JP-Neural2-C': { name: 'ja-JP-Neural2-C', gender: 'male', description: 'Natural male voice' },
    'ja-JP-Neural2-D': { name: 'ja-JP-Neural2-D', gender: 'male', description: 'Natural male voice 2' },
    'ja-JP-Wavenet-A': { name: 'ja-JP-Wavenet-A', gender: 'female', description: 'Wavenet female' },
    'ja-JP-Wavenet-B': { name: 'ja-JP-Wavenet-B', gender: 'female', description: 'Wavenet female 2' },
  },
  openai: {
    shimmer: { name: 'shimmer', gender: 'female', description: 'Clear female voice' },
    alloy: { name: 'alloy', gender: 'neutral', description: 'Neutral expressive voice' },
    echo: { name: 'echo', gender: 'male', description: 'Male voice' },
    fable: { name: 'fable', gender: 'male', description: 'British male voice' },
    onyx: { name: 'onyx', gender: 'male', description: 'Deep male voice' },
    nova: { name: 'nova', gender: 'female', description: 'Friendly female voice' },
  },
  elevenlabs: {}, // Populated dynamically from API
};

/**
 * TTS synthesis options.
 */
export const TTSSynthesizeOptions = z.object({
  voice: z.string().optional(),
  speed: z.number().min(0.25).max(4.0).default(1.0),
  pitch: z.number().min(-20).max(20).optional(),
  provider: TTSProvider.optional(),
});
export type TTSSynthesizeOptions = z.infer<typeof TTSSynthesizeOptions>;

/**
 * TTS synthesis result.
 */
export interface TTSSynthesizeResult {
  audioBase64: string;
  audioUrl?: string;
  durationSeconds: number;
  format: string;
}

/**
 * Dialogue line for multi-speaker synthesis.
 */
export interface DialogueLine {
  speaker: string;
  text: string;
}

/**
 * Text-to-Speech Service for generating audio from Japanese text.
 */
export class TTSService {
  private provider: TTSProvider;
  private googleApiKey?: string;
  private openaiApiKey?: string;
  private elevenLabsApiKey?: string;
  private elevenLabsClient?: ElevenLabsClient;
  private elevenLabsVoicesCache: Record<string, VoiceInfo> | null = null;
  private elevenLabsVoicesCacheTime: number = 0;
  private static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(options?: { provider?: TTSProvider }) {
    this.provider = options?.provider ?? (settings.ttsProvider as TTSProvider) ?? 'openai';
    this.googleApiKey = settings.googleApiKey;
    this.openaiApiKey = settings.openaiApiKey;
    this.elevenLabsApiKey = settings.elevenLabsApiKey;

    // Initialize ElevenLabs client if API key is available
    if (this.elevenLabsApiKey) {
      this.elevenLabsClient = new ElevenLabsClient({
        apiKey: this.elevenLabsApiKey,
      });
    }
  }

  /**
   * Fetch available voices from ElevenLabs API using official SDK.
   */
  async fetchElevenLabsVoices(): Promise<Record<string, VoiceInfo>> {
    if (!this.elevenLabsClient) {
      console.warn('[TTS] ElevenLabs client not initialized (API key not configured)');
      return {};
    }

    // Return cached voices if still valid
    if (this.elevenLabsVoicesCache && Date.now() - this.elevenLabsVoicesCacheTime < TTSService.CACHE_TTL_MS) {
      return this.elevenLabsVoicesCache;
    }

    try {
      console.log('[TTS] Fetching ElevenLabs voices using SDK...');
      const response = await this.elevenLabsClient.voices.search();
      const voices: Record<string, VoiceInfo> = {};

      for (const voice of response.voices || []) {
        voices[voice.voiceId] = {
          name: voice.name || 'Unknown',
          gender: voice.labels?.gender || 'unknown',
          description: voice.labels?.description || voice.description || voice.name || 'Unknown',
        };
      }

      // Cache the voices
      this.elevenLabsVoicesCache = voices;
      this.elevenLabsVoicesCacheTime = Date.now();

      console.log(`[TTS] Found ${Object.keys(voices).length} ElevenLabs voices`);
      return voices;
    } catch (error) {
      console.error('[TTS] Failed to fetch ElevenLabs voices:', error);
      return {};
    }
  }

  /**
   * Get the default ElevenLabs voice ID.
   */
  async getDefaultElevenLabsVoice(): Promise<string | null> {
    const voices = await this.fetchElevenLabsVoices();
    const voiceIds = Object.keys(voices);

    if (voiceIds.length === 0) {
      return null;
    }

    // Try to find a Japanese voice or any multilingual voice
    for (const [voiceId, info] of Object.entries(voices)) {
      const lowerName = info.name.toLowerCase();
      const lowerDesc = info.description.toLowerCase();
      if (lowerName.includes('japanese') || lowerName.includes('multilingual') ||
          lowerDesc.includes('japanese') || lowerDesc.includes('multilingual')) {
        return voiceId;
      }
    }

    // Return the first available voice
    return voiceIds[0];
  }

  /**
   * Synthesize speech from text.
   */
  async synthesize(
    text: string,
    options?: TTSSynthesizeOptions
  ): Promise<TTSSynthesizeResult> {
    const provider = options?.provider ?? this.provider;
    let voice = options?.voice;
    const speed = options?.speed ?? 1.0;

    // Resolve voice for ElevenLabs if not specified or if it's an invalid ID
    if (provider === 'elevenlabs') {
      if (!voice) {
        voice = await this.getDefaultElevenLabsVoice() ?? undefined;
      } else {
        // Check if the voice ID is valid
        const voices = await this.fetchElevenLabsVoices();
        if (!voices[voice]) {
          console.warn(`[TTS] ElevenLabs voice "${voice}" not found, using default`);
          voice = await this.getDefaultElevenLabsVoice() ?? undefined;
        }
      }
      if (!voice) {
        throw new Error('No ElevenLabs voices available. Please check your API key and account.');
      }
    } else {
      voice = voice ?? this.getDefaultVoice(provider);
    }

    switch (provider) {
      case 'openai':
        return this.synthesizeWithOpenAI(text, voice, speed);
      case 'google':
        return this.synthesizeWithGoogle(text, voice, speed, options?.pitch ?? 0);
      case 'elevenlabs':
        return this.synthesizeWithElevenLabs(text, voice, speed);
      default:
        throw new Error(`Unsupported TTS provider: ${provider}`);
    }
  }

  /**
   * Synthesize dialogue with multiple speakers.
   */
  async synthesizeDialogue(
    dialogue: DialogueLine[],
    voiceMap: Record<string, string>,
    options?: { provider?: TTSProvider; speed?: number }
  ): Promise<TTSSynthesizeResult> {
    // For simplicity, concatenate all dialogue into one audio
    // In production, you'd want to splice individual audio files
    const combinedText = dialogue.map((line) => line.text).join('。');

    return this.synthesize(combinedText, {
      voice: Object.values(voiceMap)[0],
      speed: options?.speed ?? 1.0,
      provider: options?.provider,
      pitch: 0,
    });
  }

  /**
   * Get available voices for a provider (sync version for Google/OpenAI).
   */
  getAvailableVoices(provider?: TTSProvider): Record<string, VoiceInfo> {
    const p = provider ?? this.provider;
    if (p === 'elevenlabs') {
      // Return cached voices or empty if not fetched yet
      return this.elevenLabsVoicesCache ?? {};
    }
    return JapaneseVoices[p] ?? {};
  }

  /**
   * Get available voices for a provider (async version, fetches ElevenLabs voices).
   */
  async getAvailableVoicesAsync(provider?: TTSProvider): Promise<Record<string, VoiceInfo>> {
    const p = provider ?? this.provider;
    if (p === 'elevenlabs') {
      return this.fetchElevenLabsVoices();
    }
    return JapaneseVoices[p] ?? {};
  }

  /**
   * Get the default voice for a provider.
   */
  private getDefaultVoice(provider: TTSProvider): string {
    switch (provider) {
      case 'google':
        return 'ja-JP-Neural2-B';
      case 'openai':
        return 'shimmer';
      case 'elevenlabs':
        return 'yuki';
      default:
        return 'shimmer';
    }
  }

  /**
   * Synthesize with OpenAI TTS.
   */
  private async synthesizeWithOpenAI(
    text: string,
    voice: string,
    speed: number
  ): Promise<TTSSynthesizeResult> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`[TTS] Synthesizing ${text.length} characters with OpenAI (voice: ${voice}, speed: ${speed})`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[TTS] OpenAI TTS error: ${error}`);
      throw new Error(`OpenAI TTS error: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

    // Estimate duration (rough estimate based on text length and speed)
    const estimatedDuration = (text.length * 0.15) / speed;

    console.log(`[TTS] Successfully generated ${audioBase64.length} bytes of audio`);

    return {
      audioBase64,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  /**
   * Synthesize with Google Cloud TTS.
   */
  private async synthesizeWithGoogle(
    text: string,
    voice: string,
    speed: number,
    pitch: number
  ): Promise<TTSSynthesizeResult> {
    if (!this.googleApiKey) {
      throw new Error('Google API key not configured');
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'ja-JP',
            name: voice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speed,
            pitch: pitch,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google TTS error: ${error}`);
    }

    const data = await response.json();

    // Estimate duration
    const estimatedDuration = (text.length * 0.15) / speed;

    return {
      audioBase64: data.audioContent,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  /**
   * Synthesize with ElevenLabs using official SDK.
   */
  private async synthesizeWithElevenLabs(
    text: string,
    voice: string,
    speed: number
  ): Promise<TTSSynthesizeResult> {
    if (!this.elevenLabsClient) {
      throw new Error('ElevenLabs client not initialized (API key not configured)');
    }

    console.log(`[TTS] Synthesizing ${text.length} characters with ElevenLabs (voice: ${voice})`);

    const audio = await this.elevenLabsClient.textToSpeech.convert(voice, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    // Convert the ReadableStream to a Buffer
    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString('base64');

    // Estimate duration
    const estimatedDuration = (text.length * 0.15) / speed;

    console.log(`[TTS] Successfully generated ${audioBuffer.length} bytes of ElevenLabs audio`);

    return {
      audioBase64,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }
}
