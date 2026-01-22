import { settings } from '../config.js';

const DID_API_BASE = 'https://api.d-id.com';

/**
 * D-ID Talk status values.
 */
export type TalkStatus = 'created' | 'started' | 'done' | 'error' | 'rejected';

/**
 * Script type for D-ID talks.
 */
export type ScriptType = 'text' | 'audio';

/**
 * TTS provider options for D-ID.
 */
export type TTSProvider = 'microsoft' | 'elevenlabs' | 'amazon' | 'google';

/**
 * Request to create a talk with text-to-speech.
 */
export interface CreateTalkTextRequest {
  /** URL to the source image (portrait) */
  sourceUrl: string;
  /** Text for the character to speak */
  text: string;
  /** TTS provider to use */
  provider?: TTSProvider;
  /** Voice ID from the provider */
  voiceId?: string;
  /** Optional name for the video */
  name?: string;
  /** Whether to generate subtitles */
  subtitles?: boolean;
}

/**
 * Request to create a talk with pre-generated audio.
 */
export interface CreateTalkAudioRequest {
  /** URL to the source image (portrait) */
  sourceUrl: string;
  /** URL to the audio file */
  audioUrl: string;
  /** Optional name for the video */
  name?: string;
  /** Whether to generate subtitles */
  subtitles?: boolean;
}

/**
 * Response from creating a talk.
 */
export interface CreateTalkResponse {
  id: string;
  object: string;
  createdAt: string;
  status: TalkStatus;
}

/**
 * Response from getting a talk's status.
 */
export interface GetTalkResponse {
  id: string;
  status: TalkStatus;
  resultUrl?: string;
  error?: {
    kind: string;
    description: string;
  };
  createdAt: string;
  startedAt?: string;
  duration?: number;
}

/**
 * Result from video generation.
 */
export interface GenerateVideoResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

/**
 * D-ID API Service for generating talking head videos.
 * Documentation: https://docs.d-id.com/reference/createtalk
 */
export class DIDService {
  private apiKey: string;

  constructor() {
    this.apiKey = settings.didApiKey;
    if (!this.apiKey) {
      console.warn('[D-ID] API key not configured. Set DID_API_KEY in environment.');
    }
  }

  /**
   * Check if the service is configured.
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make an authenticated request to the D-ID API.
   * D-ID uses Basic Auth with the API key as the username and empty password.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('D-ID API key not configured');
    }

    const url = `${DID_API_BASE}${endpoint}`;

    // D-ID uses Basic Auth: base64(apiKey:)
    const authToken = Buffer.from(`${this.apiKey}:`).toString('base64');

    const headers: Record<string, string> = {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    console.log(`[D-ID] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[D-ID] API error: ${response.status} - ${errorText}`);
      throw new Error(`D-ID API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Create a talk using text-to-speech.
   */
  async createTalkWithText(request: CreateTalkTextRequest): Promise<CreateTalkResponse> {
    console.log(`[D-ID] Creating talk with text: "${request.text.substring(0, 50)}..."`);

    const body: Record<string, unknown> = {
      source_url: request.sourceUrl,
      script: {
        type: 'text',
        input: request.text,
        provider: {
          type: request.provider || 'microsoft',
          voice_id: request.voiceId || 'ja-JP-NanamiNeural', // Default Japanese female voice
        },
        subtitles: request.subtitles ?? false,
      },
    };

    if (request.name) {
      body.name = request.name;
    }

    const response = await this.request<{
      id: string;
      object: string;
      created_at: string;
      status: TalkStatus;
    }>('/talks', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    console.log(`[D-ID] Talk created with ID: ${response.id}`);

    return {
      id: response.id,
      object: response.object,
      createdAt: response.created_at,
      status: response.status,
    };
  }

  /**
   * Create a talk using pre-generated audio.
   */
  async createTalkWithAudio(request: CreateTalkAudioRequest): Promise<CreateTalkResponse> {
    console.log(`[D-ID] Creating talk with audio URL: ${request.audioUrl.substring(0, 50)}...`);

    const body: Record<string, unknown> = {
      source_url: request.sourceUrl,
      script: {
        type: 'audio',
        audio_url: request.audioUrl,
        subtitles: request.subtitles ?? false,
      },
    };

    if (request.name) {
      body.name = request.name;
    }

    const response = await this.request<{
      id: string;
      object: string;
      created_at: string;
      status: TalkStatus;
    }>('/talks', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    console.log(`[D-ID] Talk created with ID: ${response.id}`);

    return {
      id: response.id,
      object: response.object,
      createdAt: response.created_at,
      status: response.status,
    };
  }

  /**
   * Get the status and result of a talk.
   */
  async getTalk(talkId: string): Promise<GetTalkResponse> {
    console.log(`[D-ID] Getting talk status: ${talkId}`);

    const response = await this.request<{
      id: string;
      status: TalkStatus;
      result_url?: string;
      error?: { kind: string; description: string };
      created_at: string;
      started_at?: string;
      duration?: number;
    }>(`/talks/${talkId}`, {
      method: 'GET',
    });

    console.log(`[D-ID] Talk ${talkId} status: ${response.status}`);

    return {
      id: response.id,
      status: response.status,
      resultUrl: response.result_url,
      error: response.error,
      createdAt: response.created_at,
      startedAt: response.started_at,
      duration: response.duration,
    };
  }

  /**
   * Poll for talk completion.
   */
  async waitForCompletion(
    talkId: string,
    options?: {
      timeout?: number;
      interval?: number;
      onProgress?: (status: GetTalkResponse) => void;
    }
  ): Promise<GenerateVideoResult> {
    const { timeout = 5 * 60 * 1000, interval = 3000, onProgress } = options || {};
    const startTime = Date.now();

    console.log(`[D-ID] Waiting for talk ${talkId} to complete...`);

    while (Date.now() - startTime < timeout) {
      const talk = await this.getTalk(talkId);

      if (onProgress) {
        onProgress(talk);
      }

      if (talk.status === 'done') {
        console.log(`[D-ID] Talk completed! Video URL: ${talk.resultUrl}`);
        return {
          jobId: talkId,
          status: 'completed',
          videoUrl: talk.resultUrl,
        };
      }

      if (talk.status === 'error' || talk.status === 'rejected') {
        const errorMsg = talk.error?.description || 'Unknown error';
        console.error(`[D-ID] Talk failed: ${errorMsg}`);
        return {
          jobId: talkId,
          status: 'failed',
          error: errorMsg,
        };
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return {
      jobId: talkId,
      status: 'failed',
      error: 'Generation timed out',
    };
  }

  /**
   * Generate a talking video from image and text.
   * This uploads the image to a temporary host and creates the talk.
   */
  async generateTalkingVideo(options: {
    /** Base64-encoded image or image URL */
    image: string;
    /** Whether image is base64 (if false, treated as URL) */
    imageIsBase64?: boolean;
    /** Text for the character to speak */
    text: string;
    /** Voice ID to use */
    voiceId?: string;
    /** TTS provider */
    provider?: TTSProvider;
    /** Whether to wait for completion */
    waitForCompletion?: boolean;
    /** Timeout in ms */
    timeout?: number;
  }): Promise<GenerateVideoResult> {
    if (!this.isConfigured()) {
      throw new Error('D-ID API key not configured. Set DID_API_KEY in environment.');
    }

    const {
      image,
      imageIsBase64 = true,
      text,
      voiceId,
      provider = 'microsoft',
      waitForCompletion: shouldWait = false,
      timeout = 5 * 60 * 1000,
    } = options;

    console.log(`[D-ID] Starting talking video generation...`);

    try {
      // Get image URL
      let sourceUrl: string;

      if (imageIsBase64) {
        // For base64 images, we need to upload to a temporary host or use data URI
        // D-ID accepts data URIs for images
        const mimeType = image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        sourceUrl = `data:${mimeType};base64,${image}`;
        console.log(`[D-ID] Using data URI for image (${image.length} chars)`);
      } else {
        sourceUrl = image;
        console.log(`[D-ID] Using image URL: ${sourceUrl}`);
      }

      // Create the talk
      const talk = await this.createTalkWithText({
        sourceUrl,
        text,
        voiceId,
        provider,
      });

      if (shouldWait) {
        return this.waitForCompletion(talk.id, { timeout });
      }

      return {
        jobId: talk.id,
        status: 'processing',
      };
    } catch (error) {
      console.error('[D-ID] Generation failed:', error);
      return {
        jobId: '',
        status: 'failed',
        error: String(error),
      };
    }
  }

  /**
   * Get available credits.
   */
  async getCredits(): Promise<{ credits: number; remaining: number }> {
    try {
      const response = await this.request<{
        remaining: number;
        total: number;
      }>('/credits', {
        method: 'GET',
      });

      return {
        credits: response.total,
        remaining: response.remaining,
      };
    } catch (error) {
      console.error('[D-ID] Failed to get credits:', error);
      return { credits: 0, remaining: 0 };
    }
  }

  /**
   * Get available voices for a provider.
   */
  async getVoices(provider: TTSProvider = 'microsoft'): Promise<Array<{ id: string; name: string; language: string }>> {
    // D-ID doesn't have a voices endpoint, so we return common Japanese voices
    const voices: Record<TTSProvider, Array<{ id: string; name: string; language: string }>> = {
      microsoft: [
        { id: 'ja-JP-NanamiNeural', name: 'Nanami (Female)', language: 'ja-JP' },
        { id: 'ja-JP-KeitaNeural', name: 'Keita (Male)', language: 'ja-JP' },
        { id: 'ja-JP-AoiNeural', name: 'Aoi (Female)', language: 'ja-JP' },
        { id: 'ja-JP-DaichiNeural', name: 'Daichi (Male)', language: 'ja-JP' },
        { id: 'ja-JP-MayuNeural', name: 'Mayu (Female)', language: 'ja-JP' },
        { id: 'ja-JP-NaokiNeural', name: 'Naoki (Male)', language: 'ja-JP' },
        { id: 'ja-JP-ShioriNeural', name: 'Shiori (Female)', language: 'ja-JP' },
      ],
      elevenlabs: [
        { id: 'japanese_female_1', name: 'Yuki (Female)', language: 'ja' },
        { id: 'japanese_male_1', name: 'Takeshi (Male)', language: 'ja' },
      ],
      amazon: [
        { id: 'Mizuki', name: 'Mizuki (Female)', language: 'ja-JP' },
        { id: 'Takumi', name: 'Takumi (Male)', language: 'ja-JP' },
      ],
      google: [
        { id: 'ja-JP-Neural2-B', name: 'Neural2-B (Female)', language: 'ja-JP' },
        { id: 'ja-JP-Neural2-C', name: 'Neural2-C (Male)', language: 'ja-JP' },
        { id: 'ja-JP-Neural2-D', name: 'Neural2-D (Male)', language: 'ja-JP' },
      ],
    };

    return voices[provider] || voices.microsoft;
  }
}

// Export singleton instance
export const didService = new DIDService();
