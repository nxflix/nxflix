import type { VideoProject } from '../../../models/video.js';

/**
 * Video generation provider interface.
 * All video providers must implement this interface.
 */

/**
 * Video rendering options.
 */
export interface VideoRenderOptions {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  format?: 'mp4' | 'webm';
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
}

/**
 * Video rendering result.
 */
export interface VideoRenderResult {
  videoUrl: string;
  videoPath?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  durationSeconds: number;
  fileSizeBytes?: number;
}

/**
 * Video provider interface.
 */
export interface IVideoProvider {
  /**
   * Get the provider name.
   */
  getProviderName(): string;

  /**
   * Check if the provider is available.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Render a video from a project.
   */
  render(project: VideoProject, options?: VideoRenderOptions): Promise<VideoRenderResult>;

  /**
   * Get the estimated render time for a project.
   */
  estimateRenderTime(project: VideoProject): number;
}
