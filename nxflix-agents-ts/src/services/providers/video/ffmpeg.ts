import type { IVideoProvider, VideoRenderOptions, VideoRenderResult } from './interface.js';
import type { VideoProject } from '../../../models/video.js';
import { FFmpegRendererService } from '../../ffmpeg-renderer.js';

/**
 * FFmpeg video provider.
 * Uses local FFmpeg to compose videos from images, audio, and subtitles.
 * Fast, reliable, and free (no API costs).
 */
export class FFmpegVideoProvider implements IVideoProvider {
  private renderer: FFmpegRendererService;

  constructor(options?: {
    tempDir?: string;
    outputDir?: string;
    assetsDir?: string;
  }) {
    this.renderer = new FFmpegRendererService(options);
  }

  getProviderName(): string {
    return 'FFmpeg';
  }

  async isAvailable(): Promise<boolean> {
    return this.renderer.checkFFmpegAvailable();
  }

  async render(
    project: VideoProject,
    options?: VideoRenderOptions
  ): Promise<VideoRenderResult> {
    const result = await this.renderer.render(project, {
      width: options?.width ?? 1080,
      height: options?.height ?? 1920,
      fps: options?.fps ?? 30,
      codec: options?.codec ?? 'h264',
      outputFormat: options?.format ?? 'mp4',
    });

    return {
      videoUrl: result.videoUrl,
      videoPath: result.videoPath,
      thumbnailUrl: result.thumbnailUrl,
      thumbnailPath: result.thumbnailPath,
      durationSeconds: result.durationSeconds,
      fileSizeBytes: result.fileSizeBytes,
    };
  }

  estimateRenderTime(project: VideoProject): number {
    // FFmpeg is fast - estimate ~5 seconds plus duration
    return 5 + project.script.totalDurationSeconds * 0.5;
  }
}
