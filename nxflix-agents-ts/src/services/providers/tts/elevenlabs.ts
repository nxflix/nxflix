import type { ITTSProvider, TTSOptions, TTSResult, Voice } from './interface.js';
import { settings } from '../../../config.js';

/**
 * Japanese voices available on ElevenLabs.
 */
const ELEVENLABS_JAPANESE_VOICES: Voice[] = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Yuki',
    gender: 'female',
    language: 'ja-JP',
    description: 'Natural Japanese female voice',
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Takeshi',
    gender: 'male',
    language: 'ja-JP',
    description: 'Natural Japanese male voice',
  },
];

/**
 * ElevenLabs TTS provider implementation.
 * Known for high-quality, natural-sounding voices.
 */
export class ElevenLabsTTSProvider implements ITTSProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.elevenLabsApiKey;
  }

  getProviderName(): string {
    return 'ElevenLabs';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = options?.voice ?? this.getDefaultVoice();

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs TTS error: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

    // Estimate duration based on text length and speed
    const speed = options?.speed ?? 1.0;
    const estimatedDuration = (text.length * 0.12) / speed;

    return {
      audioBase64,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  async getVoices(): Promise<Voice[]> {
    return ELEVENLABS_JAPANESE_VOICES;
  }

  getDefaultVoice(): string {
    return ELEVENLABS_JAPANESE_VOICES[0].id;
  }
}
