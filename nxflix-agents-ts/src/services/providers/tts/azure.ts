import type { ITTSProvider, TTSOptions, TTSResult, Voice } from './interface.js';
import { settings } from '../../../config.js';

/**
 * Azure Cognitive Services TTS Japanese voices.
 */
const AZURE_JAPANESE_VOICES: Voice[] = [
  {
    id: 'ja-JP-NanamiNeural',
    name: 'Nanami',
    gender: 'female',
    language: 'ja-JP',
    description: 'Neural female voice',
  },
  {
    id: 'ja-JP-KeitaNeural',
    name: 'Keita',
    gender: 'male',
    language: 'ja-JP',
    description: 'Neural male voice',
  },
  {
    id: 'ja-JP-AoiNeural',
    name: 'Aoi',
    gender: 'female',
    language: 'ja-JP',
    description: 'Neural female voice 2',
  },
  {
    id: 'ja-JP-DaichiNeural',
    name: 'Daichi',
    gender: 'male',
    language: 'ja-JP',
    description: 'Neural male voice 2',
  },
  {
    id: 'ja-JP-MayuNeural',
    name: 'Mayu',
    gender: 'female',
    language: 'ja-JP',
    description: 'Neural female voice 3',
  },
  {
    id: 'ja-JP-NaokiNeural',
    name: 'Naoki',
    gender: 'male',
    language: 'ja-JP',
    description: 'Neural male voice 3',
  },
  {
    id: 'ja-JP-ShioriNeural',
    name: 'Shiori',
    gender: 'female',
    language: 'ja-JP',
    description: 'Neural female voice 4',
  },
];

/**
 * Azure Cognitive Services TTS provider implementation.
 * High-quality neural voices with good Japanese support.
 */
export class AzureTTSProvider implements ITTSProvider {
  private speechKey: string | undefined;
  private speechRegion: string | undefined;

  constructor() {
    this.speechKey = settings.azureSpeechKey;
    this.speechRegion = settings.azureSpeechRegion ?? 'eastus';
  }

  getProviderName(): string {
    return 'Azure Cognitive Services';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.speechKey;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    if (!this.speechKey) {
      throw new Error('Azure Speech API key not configured');
    }

    const voice = options?.voice ?? this.getDefaultVoice();
    const rate = this.formatRate(options?.speed ?? 1.0);
    const pitch = this.formatPitch(options?.pitch ?? 0);

    // Build SSML
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">
        <voice name="${voice}">
          <prosody rate="${rate}" pitch="${pitch}">
            ${this.escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `.trim();

    const endpoint = `https://${this.speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure TTS error: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

    // Estimate duration
    const speed = options?.speed ?? 1.0;
    const estimatedDuration = (text.length * 0.12) / speed;

    return {
      audioBase64,
      durationSeconds: estimatedDuration,
      format: 'mp3',
    };
  }

  async getVoices(): Promise<Voice[]> {
    return AZURE_JAPANESE_VOICES;
  }

  getDefaultVoice(): string {
    return 'ja-JP-NanamiNeural';
  }

  /**
   * Format speed for SSML rate attribute.
   */
  private formatRate(speed: number): string {
    if (speed === 1.0) return 'default';
    const percentage = Math.round((speed - 1.0) * 100);
    return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
  }

  /**
   * Format pitch for SSML pitch attribute.
   */
  private formatPitch(pitch: number): string {
    if (pitch === 0) return 'default';
    const hz = Math.round(pitch * 5);
    return hz >= 0 ? `+${hz}Hz` : `${hz}Hz`;
  }

  /**
   * Escape special XML characters.
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
