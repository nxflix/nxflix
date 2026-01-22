import type { IVideoProvider, VideoRenderOptions, VideoRenderResult } from './interface.js';
import type { VideoProject } from '../../../models/video.js';
import { settings } from '../../../config.js';

/**
 * Pika Labs video generation provider.
 * Uses Pika's AI model for video generation.
 */
export class PikaVideoProvider implements IVideoProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.pikaApiKey;
  }

  getProviderName(): string {
    return 'Pika Labs';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async render(
    project: VideoProject,
    options?: VideoRenderOptions
  ): Promise<VideoRenderResult> {
    if (!this.apiKey) {
      throw new Error('Pika API key not configured');
    }

    // Build a prompt from the project
    const prompt = this.buildVideoPrompt(project);

    // Note: Pika API structure may vary
    const response = await fetch('https://api.pika.art/v1/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        motion_level: 2, // Low-medium motion for educational content
        guidance_scale: 12,
        negative_prompt:
          'blurry, low quality, text, watermark, nsfw, violent',
        aspect_ratio: '9:16',
        fps: options?.fps ?? 24,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pika error: ${error}`);
    }

    const data = await response.json() as {
      job_id?: string;
      video_url?: string;
    };

    // Pika uses async generation - poll for completion
    if (data.job_id) {
      return this.pollForCompletion(data.job_id);
    }

    return {
      videoUrl: data.video_url ?? '',
      durationSeconds: project.script.totalDurationSeconds,
    };
  }

  estimateRenderTime(project: VideoProject): number {
    // Pika can have queue times - estimate 2-5 minutes
    return 120 + project.script.totalDurationSeconds * 2;
  }

  private buildVideoPrompt(project: VideoProject): string {
    const styleMap: Record<string, string> = {
      classroom: 'Japanese classroom interior, school desks, blackboard, warm sunlight through windows',
      cafe: 'Japanese cafe interior, wooden furniture, coffee cups, cozy lighting',
      nature: 'Japanese garden, cherry blossoms, koi pond, peaceful atmosphere',
      abstract: 'abstract colorful gradient background, soft flowing shapes',
      manga: 'anime style background, cel shaded, vibrant colors',
    };

    const characterMap: Record<string, string> = {
      anime_female: ', anime style female character, friendly expression',
      anime_male: ', anime style male character, friendly expression',
      realistic_female: ', young woman, professional appearance',
      realistic_male: ', young man, professional appearance',
      chibi: ', cute chibi character',
      mascot: ', cute mascot character',
      none: '',
    };

    const backgroundDescription =
      styleMap[project.videoStyle] ?? styleMap.abstract;
    const characterDescription =
      characterMap[project.characterStyle] ?? '';

    return `${backgroundDescription}${characterDescription}, high quality, 4k, professional lighting`;
  }

  private async pollForCompletion(jobId: string): Promise<VideoRenderResult> {
    const maxAttempts = 60;
    const pollInterval = 5000; // 5 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const response = await fetch(`https://api.pika.art/v1/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json() as {
        status?: string;
        video_url?: string;
        thumbnail_url?: string;
        duration?: number;
        error?: string;
      };

      if (data.status === 'completed') {
        return {
          videoUrl: data.video_url ?? '',
          thumbnailUrl: data.thumbnail_url,
          durationSeconds: data.duration || 4,
        };
      }

      if (data.status === 'failed') {
        throw new Error(`Video generation failed: ${data.error}`);
      }
    }

    throw new Error('Video generation timed out');
  }
}
