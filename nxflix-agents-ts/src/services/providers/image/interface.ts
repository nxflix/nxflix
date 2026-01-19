/**
 * Image generation provider interface.
 * All image providers must implement this interface.
 */

/**
 * Image generation options.
 */
export interface ImageOptions {
  width?: number;
  height?: number;
  style?: string;
  quality?: 'standard' | 'hd';
}

/**
 * Image generation result.
 */
export interface ImageResult {
  imageBase64?: string;
  imageUrl?: string;
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'webp';
}

/**
 * Image provider interface.
 */
export interface IImageProvider {
  /**
   * Get the provider name.
   */
  getProviderName(): string;

  /**
   * Check if the provider is available.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Generate an image from a text prompt.
   */
  generate(prompt: string, options?: ImageOptions): Promise<ImageResult>;

  /**
   * Generate a background image for a video.
   */
  generateBackground(
    description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult>;

  /**
   * Generate a character image.
   */
  generateCharacter(
    description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult>;
}
