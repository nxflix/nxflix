import { settings } from '../config.js';

const RUNWAY_API_BASE = 'https://api.runwayml.com/v1';

/**
 * Runway task status values.
 */
export type RunwayTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

/**
 * Runway model types.
 */
export type RunwayModel = 'gen3a_turbo';

/**
 * Request to create a text-to-video generation.
 */
export interface TextToVideoRequest {
  /** Text prompt describing the video */
  promptText: string;
  /** Model to use (default: gen3a_turbo) */
  model?: RunwayModel;
  /** Duration in seconds (5 or 10) */
  duration?: 5 | 10;
  /** Aspect ratio */
  ratio?: '16:9' | '9:16' | '1:1';
  /** Seed for reproducibility */
  seed?: number;
  /** Watermark (default: true for free tier) */
  watermark?: boolean;
}

/**
 * Request to create an image-to-video generation.
 */
export interface ImageToVideoRequest {
  /** Text prompt describing the motion */
  promptText: string;
  /** Base64 encoded image or URL */
  promptImage: string;
  /** Whether promptImage is a URL (false = base64) */
  promptImageIsUrl?: boolean;
  /** Model to use */
  model?: RunwayModel;
  /** Duration in seconds (5 or 10) */
  duration?: 5 | 10;
  /** Aspect ratio */
  ratio?: '16:9' | '9:16' | '1:1';
  /** Seed for reproducibility */
  seed?: number;
  /** Watermark */
  watermark?: boolean;
}

/**
 * Response from creating a generation task.
 */
export interface CreateTaskResponse {
  id: string;
}

/**
 * Response from getting a task's status.
 */
export interface GetTaskResponse {
  id: string;
  status: RunwayTaskStatus;
  progress?: number;
  output?: string[];  // Array of video URLs when completed
  failure?: string;
  failureCode?: string;
  createdAt?: string;
}

/**
 * Result from video generation.
 */
export interface GenerateVideoResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  progress?: number;
}

/**
 * Runway ML API Service for generating AI videos.
 * Documentation: https://docs.runwayml.com/
 */
export class RunwayService {
  private apiKey: string;

  constructor() {
    this.apiKey = settings.runwayApiKey;
    if (!this.apiKey) {
      console.warn('[Runway] API key not configured. Set RUNWAY_API_KEY in environment.');
    }
  }

  /**
   * Check if the service is configured.
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make an authenticated request to the Runway API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Runway API key not configured');
    }

    const url = `${RUNWAY_API_BASE}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
      ...((options.headers as Record<string, string>) || {}),
    };

    console.log(`[Runway] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Runway] API error: ${response.status} - ${errorText}`);
      throw new Error(`Runway API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Create a text-to-video generation task.
   */
  async createTextToVideo(request: TextToVideoRequest): Promise<CreateTaskResponse> {
    console.log(`[Runway] Creating text-to-video: "${request.promptText.substring(0, 50)}..."`);

    const body = {
      promptText: request.promptText,
      model: request.model || 'gen3a_turbo',
      duration: request.duration || 5,
      ratio: request.ratio || '16:9',
      seed: request.seed,
      watermark: request.watermark ?? true,
    };

    const response = await this.request<CreateTaskResponse>('/text_to_video', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    console.log(`[Runway] Task created with ID: ${response.id}`);
    return response;
  }

  /**
   * Create an image-to-video generation task.
   */
  async createImageToVideo(request: ImageToVideoRequest): Promise<CreateTaskResponse> {
    console.log(`[Runway] Creating image-to-video: "${request.promptText.substring(0, 50)}..."`);

    // Handle image - if base64, convert to data URI
    let promptImage = request.promptImage;
    if (!request.promptImageIsUrl && !promptImage.startsWith('data:') && !promptImage.startsWith('http')) {
      // Assume it's base64, detect format
      const mimeType = promptImage.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
      promptImage = `data:${mimeType};base64,${promptImage}`;
    }

    const body = {
      promptText: request.promptText,
      promptImage: promptImage,
      model: request.model || 'gen3a_turbo',
      duration: request.duration || 5,
      ratio: request.ratio || '16:9',
      seed: request.seed,
      watermark: request.watermark ?? true,
    };

    const response = await this.request<CreateTaskResponse>('/image_to_video', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    console.log(`[Runway] Task created with ID: ${response.id}`);
    return response;
  }

  /**
   * Get the status of a generation task.
   */
  async getTask(taskId: string): Promise<GetTaskResponse> {
    console.log(`[Runway] Getting task status: ${taskId}`);

    const response = await this.request<GetTaskResponse>(`/tasks/${taskId}`, {
      method: 'GET',
    });

    console.log(`[Runway] Task ${taskId} status: ${response.status}`);
    return response;
  }

  /**
   * Poll for task completion.
   */
  async waitForCompletion(
    taskId: string,
    options?: {
      timeout?: number;
      interval?: number;
      onProgress?: (status: GetTaskResponse) => void;
    }
  ): Promise<GenerateVideoResult> {
    const { timeout = 10 * 60 * 1000, interval = 5000, onProgress } = options || {};
    const startTime = Date.now();

    console.log(`[Runway] Waiting for task ${taskId} to complete...`);

    while (Date.now() - startTime < timeout) {
      const task = await this.getTask(taskId);

      if (onProgress) {
        onProgress(task);
      }

      if (task.status === 'SUCCEEDED') {
        const videoUrl = task.output?.[0];
        console.log(`[Runway] Task completed! Video URL: ${videoUrl}`);
        return {
          jobId: taskId,
          status: 'completed',
          videoUrl,
        };
      }

      if (task.status === 'FAILED' || task.status === 'CANCELLED') {
        const errorMsg = task.failure || task.failureCode || 'Unknown error';
        console.error(`[Runway] Task failed: ${errorMsg}`);
        return {
          jobId: taskId,
          status: 'failed',
          error: errorMsg,
        };
      }

      // Map status
      const mappedStatus = task.status === 'RUNNING' ? 'processing' : 'pending';

      if (onProgress) {
        onProgress(task);
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return {
      jobId: taskId,
      status: 'failed',
      error: 'Generation timed out',
    };
  }

  /**
   * Generate a video from text prompt.
   */
  async generateFromText(options: {
    prompt: string;
    duration?: 5 | 10;
    ratio?: '16:9' | '9:16' | '1:1';
    waitForCompletion?: boolean;
    timeout?: number;
  }): Promise<GenerateVideoResult> {
    if (!this.isConfigured()) {
      throw new Error('Runway API key not configured. Set RUNWAY_API_KEY in environment.');
    }

    const {
      prompt,
      duration = 5,
      ratio = '16:9',
      waitForCompletion: shouldWait = false,
      timeout = 10 * 60 * 1000,
    } = options;

    console.log(`[Runway] Starting text-to-video generation...`);

    try {
      const task = await this.createTextToVideo({
        promptText: prompt,
        duration,
        ratio,
      });

      if (shouldWait) {
        return this.waitForCompletion(task.id, { timeout });
      }

      return {
        jobId: task.id,
        status: 'processing',
      };
    } catch (error) {
      console.error('[Runway] Generation failed:', error);
      return {
        jobId: '',
        status: 'failed',
        error: String(error),
      };
    }
  }

  /**
   * Generate a video from image and text prompt.
   */
  async generateFromImage(options: {
    prompt: string;
    image: string;
    imageIsUrl?: boolean;
    duration?: 5 | 10;
    ratio?: '16:9' | '9:16' | '1:1';
    waitForCompletion?: boolean;
    timeout?: number;
  }): Promise<GenerateVideoResult> {
    if (!this.isConfigured()) {
      throw new Error('Runway API key not configured. Set RUNWAY_API_KEY in environment.');
    }

    const {
      prompt,
      image,
      imageIsUrl = false,
      duration = 5,
      ratio = '16:9',
      waitForCompletion: shouldWait = false,
      timeout = 10 * 60 * 1000,
    } = options;

    console.log(`[Runway] Starting image-to-video generation...`);

    try {
      const task = await this.createImageToVideo({
        promptText: prompt,
        promptImage: image,
        promptImageIsUrl: imageIsUrl,
        duration,
        ratio,
      });

      if (shouldWait) {
        return this.waitForCompletion(task.id, { timeout });
      }

      return {
        jobId: task.id,
        status: 'processing',
      };
    } catch (error) {
      console.error('[Runway] Generation failed:', error);
      return {
        jobId: '',
        status: 'failed',
        error: String(error),
      };
    }
  }
}

// Export singleton instance
export const runwayService = new RunwayService();
