import type { IVideoProvider, VideoRenderOptions, VideoRenderResult } from './interface.js';
import type { VideoProject } from '../../../models/video.js';
import { settings } from '../../../config.js';

/**
 * Gemini Veo AI video generation provider.
 * Uses Google's Veo model to generate videos from prompts.
 * Note: This API may require waitlist access.
 */
export class GeminiVeoVideoProvider implements IVideoProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.googleApiKey;
  }

  getProviderName(): string {
    return 'Gemini Veo';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async render(
    project: VideoProject,
    _options?: VideoRenderOptions
  ): Promise<VideoRenderResult> {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    // Build a prompt from the project
    const prompt = this.buildVideoPrompt(project);

    // Note: The actual Veo API endpoint and parameters may differ
    // This is a placeholder based on expected API structure
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo:generateVideo?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          duration_seconds: Math.min(project.script.totalDurationSeconds, 60),
          aspect_ratio: '9:16', // Vertical for mobile
          audio_prompt: 'Japanese speech, educational tone',
          // Include audio if available
          audio_data: project.audioBase64
            ? {
                base64: project.audioBase64,
                mime_type: 'audio/mpeg',
              }
            : undefined,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Veo error: ${error}`);
    }

    const data = await response.json() as {
      operation_id?: string;
      video_url?: string;
      thumbnail_url?: string;
    };

    // Handle async generation (polling for completion)
    if (data.operation_id) {
      return this.pollForCompletion(data.operation_id);
    }

    return {
      videoUrl: data.video_url ?? '',
      thumbnailUrl: data.thumbnail_url,
      durationSeconds: project.script.totalDurationSeconds,
    };
  }

  estimateRenderTime(project: VideoProject): number {
    // AI video generation is slower - estimate 2-5 minutes
    return 120 + project.script.totalDurationSeconds * 2;
  }

  private buildVideoPrompt(project: VideoProject): string {
    const subtitleTexts = project.script.subtitles
      .map((s) => s.translation || s.text)
      .join('. ');

    return `Create a Japanese language learning video.
Title: ${project.script.title}
Style: ${project.videoStyle} setting
Character: ${project.characterStyle !== 'none' ? `Include a ${project.characterStyle} character` : 'No character, focus on text'}
Content: ${subtitleTexts}
Requirements:
- Educational tone
- Clear text overlays for Japanese text
- Engaging visuals matching the content
- Vertical format (9:16) for mobile viewing`;
  }

  private async pollForCompletion(operationId: string): Promise<VideoRenderResult> {
    const maxAttempts = 60;
    const pollInterval = 10000; // 10 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/operations/${operationId}?key=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json() as {
        done?: boolean;
        error?: { message: string };
        response?: { video_url: string; thumbnail_url?: string; duration_seconds?: number };
      };

      if (data.done) {
        if (data.error) {
          throw new Error(`Video generation failed: ${data.error.message}`);
        }

        return {
          videoUrl: data.response?.video_url ?? '',
          thumbnailUrl: data.response?.thumbnail_url,
          durationSeconds: data.response?.duration_seconds || 60,
        };
      }
    }

    throw new Error('Video generation timed out');
  }
}
