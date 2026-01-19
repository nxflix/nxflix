import type { ITTSProvider, TTSOptions, TTSResult, Voice } from './interface.js';
import { settings } from '../../../config.js';

/**
 * OpenAI TTS voices.
 * These voices work well with Japanese text.
 */
const OPENAI_VOICES: Voice[] = [
  {
    id: 'shimmer',
    name: 'Shimmer',
    gender: 'female',
    language: 'multilingual',
    description: 'Clear, expressive female voice',
  },
  {
    id: 'alloy',
    name: 'Alloy',
    gender: 'neutral',
    language: 'multilingual',
    description: 'Neutral, balanced voice',
  },
  {
    id: 'echo',
    name: 'Echo',
    gender: 'male',
    language: 'multilingual',
    description: 'Natural male voice',
  },
  {
    id: 'fable',
    name: 'Fable',
    gender: 'male',
    language: 'multilingual',
    description: 'Warm, storytelling voice',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    gender: 'male',
    language: 'multilingual',
    description: 'Deep, authoritative voice',
  },
  {
    id: 'nova',
    name: 'Nova',
    gender: 'female',
    language: 'multilingual',
    description: 'Friendly, warm female voice',
  },
];

/**
 * OpenAI TTS provider implementation.
 * Reliable provider with good multilingual support.
 */
export class OpenAITTSProvider implements ITTSProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.openaiApiKey;
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const voice = options?.voice ?? this.getDefaultVoice();
    const speed = Math.min(Math.max(options?.speed ?? 1.0, 0.25), 4.0);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS error: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

    // Estimate duration based on text length and speed
    const estimatedDuration = (text.length * 0.12) / speed;

    return {
      audioBase64,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  async getVoices(): Promise<Voice[]> {
    return OPENAI_VOICES;
  }

  getDefaultVoice(): string {
    return 'shimmer';
  }
}
