/**
 * Text-to-Speech provider interface.
 * All TTS providers must implement this interface.
 */

/**
 * TTS synthesis options.
 */
export interface TTSOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  language?: string;
}

/**
 * TTS synthesis result.
 */
export interface TTSResult {
  audioBase64: string;
  durationSeconds: number;
  format: 'mp3' | 'wav' | 'ogg';
}

/**
 * Voice information.
 */
export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  description?: string;
}

/**
 * TTS provider interface.
 */
export interface ITTSProvider {
  /**
   * Get the provider name.
   */
  getProviderName(): string;

  /**
   * Check if the provider is available (API key configured, etc.).
   */
  isAvailable(): Promise<boolean>;

  /**
   * Synthesize speech from text.
   */
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>;

  /**
   * Get available voices for this provider.
   */
  getVoices(): Promise<Voice[]>;

  /**
   * Get the default voice for this provider.
   */
  getDefaultVoice(): string;
}
