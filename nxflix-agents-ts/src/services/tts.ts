import { z } from 'zod';
import { settings } from '../config.js';

/**
 * TTS provider type.
 */
export const TTSProvider = z.enum(['google', 'openai', 'elevenlabs']);
export type TTSProvider = z.infer<typeof TTSProvider>;

/**
 * Available Japanese voices by provider.
 */
export const JapaneseVoices = {
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
  elevenlabs: {
    yuki: { name: 'yuki', gender: 'female', description: 'Japanese female' },
  },
} as const;

/**
 * TTS synthesis options.
 */
export const TTSSynthesizeOptions = z.object({
  voice: z.string().optional(),
  speed: z.number().min(0.25).max(4.0).default(1.0),
  pitch: z.number().min(-20).max(20).default(0),
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

  constructor(options?: { provider?: TTSProvider }) {
    this.provider = options?.provider ?? (settings.ttsProvider as TTSProvider) ?? 'openai';
    this.googleApiKey = settings.googleApiKey;
    this.openaiApiKey = settings.openaiApiKey;
    this.elevenLabsApiKey = settings.elevenLabsApiKey;
  }

  /**
   * Synthesize speech from text.
   */
  async synthesize(
    text: string,
    options?: TTSSynthesizeOptions
  ): Promise<TTSSynthesizeResult> {
    const provider = options?.provider ?? this.provider;
    const voice = options?.voice ?? this.getDefaultVoice(provider);
    const speed = options?.speed ?? 1.0;

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
   * Get available voices for a provider.
   */
  getAvailableVoices(provider?: TTSProvider): Record<string, { name: string; gender: string; description: string }> {
    const p = provider ?? this.provider;
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
   * Synthesize with ElevenLabs.
   */
  private async synthesizeWithElevenLabs(
    text: string,
    voice: string,
    speed: number
  ): Promise<TTSSynthesizeResult> {
    if (!this.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // ElevenLabs requires voice ID, this is a placeholder
    const voiceId = voice;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey,
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

    // Estimate duration
    const estimatedDuration = (text.length * 0.15) / speed;

    return {
      audioBase64,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }
}
