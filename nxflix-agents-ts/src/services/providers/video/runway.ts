import type { IVideoProvider, VideoRenderOptions, VideoRenderResult } from './interface.js';
import type { VideoProject } from '../../../models/video.js';
import { settings } from '../../../config.js';

/**
 * Runway ML video generation provider.
 * Uses Runway's Gen-2/Gen-3 models for AI video generation.
 */
export class RunwayVideoProvider implements IVideoProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.runwayApiKey;
  }

  getProviderName(): string {
    return 'Runway ML';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async render(
    project: VideoProject,
    options?: VideoRenderOptions
  ): Promise<VideoRenderResult> {
    if (!this.apiKey) {
      throw new Error('Runway API key not configured');
    }

    // Build a prompt from the project
    const prompt = this.buildVideoPrompt(project);

    // Note: Runway API structure may vary
    const response = await fetch('https://api.runwayml.com/v1/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        prompt: prompt,
        duration: Math.min(project.script.totalDurationSeconds, 10), // Runway limits duration
        ratio: '9:16',
        watermark: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Runway error: ${error}`);
    }

    const data = await response.json();

    // Runway uses async generation - poll for completion
    if (data.id) {
      return this.pollForCompletion(data.id);
    }

    return {
      videoUrl: data.output[0],
      durationSeconds: project.script.totalDurationSeconds,
    };
  }

  estimateRenderTime(project: VideoProject): number {
    // Runway Gen-3 is relatively fast - estimate 1-3 minutes
    return 60 + project.script.totalDurationSeconds * 3;
  }

  private buildVideoPrompt(project: VideoProject): string {
    const styleMap: Record<string, string> = {
      classroom: 'interior of a Japanese classroom, warm lighting, educational setting',
      cafe: 'cozy Japanese cafe interior, warm atmosphere',
      nature: 'serene Japanese garden, natural lighting',
      abstract: 'minimalist background with soft gradient colors',
      manga: 'manga style visuals, dynamic composition',
    };

    const backgroundDescription =
      styleMap[project.videoStyle] ?? styleMap.abstract;

    return `${backgroundDescription}. Japanese language learning video, clean and professional, educational content, no text overlays`;
  }

  private async pollForCompletion(generationId: string): Promise<VideoRenderResult> {
    const maxAttempts = 60;
    const pollInterval = 5000; // 5 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const response = await fetch(
        `https://api.runwayml.com/v1/generations/${generationId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (data.status === 'SUCCEEDED') {
        return {
          videoUrl: data.output[0],
          durationSeconds: data.duration || 10,
        };
      }

      if (data.status === 'FAILED') {
        throw new Error(`Video generation failed: ${data.failure}`);
      }
    }

    throw new Error('Video generation timed out');
  }
}
