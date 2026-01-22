import { settings } from '../config.js';

// Correct base URL from official Hedra API starter
const HEDRA_API_BASE = 'https://api.hedra.com/web-app/public';

/**
 * Aspect ratio options for video generation.
 */
export type AspectRatio = '1:1' | '16:9' | '9:16';

/**
 * Video resolution options.
 */
export type VideoResolution = '540p' | '720p';

/**
 * Generation status.
 */
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Asset type for uploads.
 */
export type AssetType = 'audio' | 'image';

/**
 * Model info from Hedra API.
 */
export interface HedraModel {
  id: string;
  name: string;
  description?: string;
}

/**
 * Asset metadata returned from Hedra API.
 */
export interface HedraAsset {
  id: string;
  name: string;
  type: AssetType;
  url?: string;
}

/**
 * Generation job metadata.
 */
export interface HedraGeneration {
  id: string;
  status: string;
  videoUrl?: string;
  error?: string;
}

/**
 * Options for generating a talking head video.
 */
export interface GenerateTalkingVideoOptions {
  /** Portrait image as base64 or file path */
  image: string;
  /** Audio as base64 or file path */
  audio: string;
  /** Aspect ratio (default: 9:16 for portrait) */
  aspectRatio?: AspectRatio;
  /** Video resolution */
  resolution?: VideoResolution;
  /** Whether the image is base64 encoded */
  imageIsBase64?: boolean;
  /** Whether the audio is base64 encoded */
  audioIsBase64?: boolean;
  /** Text prompt for the generation */
  textPrompt?: string;
}

/**
 * Result from video generation.
 */
export interface GenerateTalkingVideoResult {
  jobId: string;
  status: GenerationStatus;
  videoUrl?: string;
  error?: string;
}

/**
 * Hedra API Service for generating talking head videos.
 * Based on official hedra-labs/hedra-api-starter implementation.
 */
export class HedraService {
  private apiKey: string;

  constructor() {
    this.apiKey = settings.hedraApiKey;
    if (!this.apiKey) {
      console.warn('[Hedra] API key not configured. Set HEDRA_API_KEY in environment.');
    }
  }

  /**
   * Check if the service is configured.
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make an authenticated request to the Hedra API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Hedra API key not configured');
    }

    const url = `${HEDRA_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add Content-Type for JSON requests if body is present and is a string (JSON)
    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    console.log(`[Hedra] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Hedra] API error: ${response.status} - ${errorText}`);
      throw new Error(`Hedra API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Upload a file (multipart form data) to the Hedra API.
   */
  private async uploadFile(
    endpoint: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Hedra API key not configured');
    }

    const url = `${HEDRA_API_BASE}${endpoint}`;

    // Create form data with the file
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, filename);

    console.log(`[Hedra] Uploading file to ${endpoint} (${fileBuffer.length} bytes)`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Hedra] Upload error: ${response.status} - ${errorText}`);
      throw new Error(`Hedra upload error: ${response.status} - ${errorText}`);
    }

    console.log(`[Hedra] File uploaded successfully`);
  }

  /**
   * Get available models from Hedra.
   */
  async getModels(): Promise<HedraModel[]> {
    const response = await this.request<HedraModel[]>('/models', {
      method: 'GET',
    });
    return response;
  }

  /**
   * Create an asset record and upload the file.
   */
  async uploadAsset(
    data: Buffer | string,
    type: AssetType,
    filename: string
  ): Promise<string> {
    console.log(`[Hedra] Creating ${type} asset: ${filename}`);

    // Step 1: Create asset record
    const assetResponse = await this.request<{ id: string }>('/assets', {
      method: 'POST',
      body: JSON.stringify({
        name: filename,
        type: type,
      }),
    });

    const assetId = assetResponse.id;
    console.log(`[Hedra] Asset created with ID: ${assetId}`);

    // Step 2: Upload the actual file
    const buffer = typeof data === 'string' ? Buffer.from(data, 'base64') : data;
    const mimeType = type === 'image' ? 'image/png' : 'audio/mp3';

    await this.uploadFile(`/assets/${assetId}/upload`, buffer, filename, mimeType);

    return assetId;
  }

  /**
   * Upload a portrait image.
   */
  async uploadPortrait(imageBase64: string): Promise<string> {
    return this.uploadAsset(imageBase64, 'image', `portrait-${Date.now()}.png`);
  }

  /**
   * Upload audio.
   */
  async uploadAudio(audioBase64: string): Promise<string> {
    return this.uploadAsset(audioBase64, 'audio', `audio-${Date.now()}.mp3`);
  }

  /**
   * Initialize character video generation.
   */
  async generateTalkingVideo(
    options: GenerateTalkingVideoOptions
  ): Promise<GenerateTalkingVideoResult> {
    if (!this.isConfigured()) {
      throw new Error('Hedra API key not configured. Set HEDRA_API_KEY in environment.');
    }

    const {
      image,
      audio,
      aspectRatio = '9:16',
      resolution = '540p',
      imageIsBase64 = true,
      audioIsBase64 = true,
      textPrompt = 'A person talking naturally at the camera',
    } = options;

    console.log(`[Hedra] Starting talking video generation (aspect ratio: ${aspectRatio})...`);

    try {
      // Get available models
      const models = await this.getModels();
      const modelId = models[0]?.id;

      if (!modelId) {
        throw new Error('No Hedra models available');
      }
      console.log(`[Hedra] Using model: ${modelId}`);

      // Upload image and audio
      let imageId: string;
      let audioId: string;

      if (imageIsBase64) {
        imageId = await this.uploadPortrait(image);
      } else {
        // Assume it's already an asset ID
        imageId = image;
      }

      if (audioIsBase64) {
        audioId = await this.uploadAudio(audio);
      } else {
        // Assume it's already an asset ID
        audioId = audio;
      }

      console.log(`[Hedra] Image asset: ${imageId}, Audio asset: ${audioId}`);

      // Start generation
      const generationResponse = await this.request<{ id: string }>('/generations', {
        method: 'POST',
        body: JSON.stringify({
          model: modelId,
          keyframe_id: imageId,
          audio_id: audioId,
          aspect_ratio: aspectRatio,
          resolution: resolution,
          text_prompt: textPrompt,
        }),
      });

      const generationId = generationResponse.id;
      console.log(`[Hedra] Generation job started: ${generationId}`);

      return {
        jobId: generationId,
        status: 'processing',
      };
    } catch (error) {
      console.error('[Hedra] Generation failed:', error);
      return {
        jobId: '',
        status: 'failed',
        error: String(error),
      };
    }
  }

  /**
   * Get the status of a generation job.
   */
  async getGenerationStatus(jobId: string): Promise<GenerateTalkingVideoResult> {
    console.log(`[Hedra] Checking status for job: ${jobId}`);

    try {
      const response = await this.request<{
        status: string;
        url?: string;
        error?: string;
      }>(`/generations/${jobId}/status`, {
        method: 'GET',
      });

      // Map Hedra status to our status
      let status: GenerationStatus = 'processing';
      if (response.status === 'complete' || response.status === 'completed') {
        status = 'completed';
      } else if (response.status === 'failed' || response.status === 'error') {
        status = 'failed';
      } else if (response.status === 'pending' || response.status === 'queued') {
        status = 'pending';
      }

      console.log(`[Hedra] Job ${jobId} status: ${status}${response.url ? ` (video ready)` : ''}`);

      return {
        jobId,
        status,
        videoUrl: response.url,
        error: response.error,
      };
    } catch (error) {
      console.error(`[Hedra] Failed to get status for job ${jobId}:`, error);
      return {
        jobId,
        status: 'failed',
        error: String(error),
      };
    }
  }

  /**
   * Poll for generation completion.
   */
  async waitForCompletion(
    jobId: string,
    options?: {
      /** Maximum time to wait in ms (default: 5 minutes) */
      timeout?: number;
      /** Poll interval in ms (default: 5 seconds) */
      interval?: number;
      /** Callback for progress updates */
      onProgress?: (status: GenerateTalkingVideoResult) => void;
    }
  ): Promise<GenerateTalkingVideoResult> {
    const { timeout = 5 * 60 * 1000, interval = 5000, onProgress } = options || {};
    const startTime = Date.now();

    console.log(`[Hedra] Waiting for job ${jobId} to complete (timeout: ${timeout}ms)...`);

    while (Date.now() - startTime < timeout) {
      const status = await this.getGenerationStatus(jobId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Timeout reached
    return {
      jobId,
      status: 'failed',
      error: 'Generation timed out',
    };
  }

  /**
   * Generate a talking video and wait for completion.
   * This is a convenience method that combines generation and polling.
   */
  async generateAndWait(
    options: GenerateTalkingVideoOptions & {
      /** Maximum time to wait in ms (default: 5 minutes) */
      timeout?: number;
      /** Callback for progress updates */
      onProgress?: (status: GenerateTalkingVideoResult) => void;
    }
  ): Promise<GenerateTalkingVideoResult> {
    const { timeout, onProgress, ...generateOptions } = options;

    // Start generation
    const startResult = await this.generateTalkingVideo(generateOptions);

    if (startResult.status === 'failed') {
      return startResult;
    }

    // Wait for completion
    return this.waitForCompletion(startResult.jobId, { timeout, onProgress });
  }

  /**
   * Get available credits/balance.
   */
  async getCredits(): Promise<{ credits: number }> {
    return this.request<{ credits: number }>('/billing/credits', {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const hedraService = new HedraService();
