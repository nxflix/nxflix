import type { ITTSProvider, TTSOptions, TTSResult, Voice } from './interface.js';
import { settings } from '../../../config.js';

/**
 * Google Cloud TTS Japanese voices.
 */
const GOOGLE_JAPANESE_VOICES: Voice[] = [
  {
    id: 'ja-JP-Neural2-B',
    name: 'Neural2-B',
    gender: 'female',
    language: 'ja-JP',
    description: 'Natural female voice (Neural2)',
  },
  {
    id: 'ja-JP-Neural2-C',
    name: 'Neural2-C',
    gender: 'male',
    language: 'ja-JP',
    description: 'Natural male voice (Neural2)',
  },
  {
    id: 'ja-JP-Neural2-D',
    name: 'Neural2-D',
    gender: 'male',
    language: 'ja-JP',
    description: 'Natural male voice 2 (Neural2)',
  },
  {
    id: 'ja-JP-Wavenet-A',
    name: 'Wavenet-A',
    gender: 'female',
    language: 'ja-JP',
    description: 'Female voice (Wavenet)',
  },
  {
    id: 'ja-JP-Wavenet-B',
    name: 'Wavenet-B',
    gender: 'female',
    language: 'ja-JP',
    description: 'Female voice 2 (Wavenet)',
  },
  {
    id: 'ja-JP-Wavenet-C',
    name: 'Wavenet-C',
    gender: 'male',
    language: 'ja-JP',
    description: 'Male voice (Wavenet)',
  },
  {
    id: 'ja-JP-Wavenet-D',
    name: 'Wavenet-D',
    gender: 'male',
    language: 'ja-JP',
    description: 'Male voice 2 (Wavenet)',
  },
];

/**
 * Google Cloud TTS provider implementation.
 * Offers a wide variety of Japanese voices.
 */
export class GoogleTTSProvider implements ITTSProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.googleApiKey;
  }

  getProviderName(): string {
    return 'Google Cloud';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    const voice = options?.voice ?? this.getDefaultVoice();
    const speed = Math.min(Math.max(options?.speed ?? 1.0, 0.25), 4.0);
    const pitch = Math.min(Math.max(options?.pitch ?? 0, -20), 20);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
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
    const estimatedDuration = (text.length * 0.12) / speed;

    return {
      audioBase64: data.audioContent,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  async getVoices(): Promise<Voice[]> {
    return GOOGLE_JAPANESE_VOICES;
  }

  getDefaultVoice(): string {
    return 'ja-JP-Neural2-B';
  }
}
