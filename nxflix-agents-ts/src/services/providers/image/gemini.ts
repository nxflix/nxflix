import type { IImageProvider, ImageOptions, ImageResult } from './interface.js';
import { settings } from '../../../config.js';

/**
 * Google Gemini Imagen image generation provider.
 */
export class GeminiImageProvider implements IImageProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.googleApiKey;
  }

  getProviderName(): string {
    return 'Gemini Imagen';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generate(prompt: string, options?: ImageOptions): Promise<ImageResult> {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    // Note: Gemini Imagen API may require special access
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          number_of_images: 1,
          aspect_ratio: this.getAspectRatio(options?.width, options?.height),
          safety_filter_level: 'block_medium_and_above',
          person_generation: 'dont_allow',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Imagen error: ${error}`);
    }

    const data = await response.json() as { generated_images?: Array<{ image: { image_bytes: string } }> };

    if (!data.generated_images || data.generated_images.length === 0) {
      throw new Error('No images generated');
    }

    const imageData = data.generated_images[0];

    return {
      imageBase64: imageData.image.image_bytes,
      width: options?.width ?? 1024,
      height: options?.height ?? 1024,
      format: 'png',
    };
  }

  async generateBackground(
    description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult> {
    const prompt = this.buildBackgroundPrompt(description, style);
    return this.generate(prompt, {
      ...options,
      width: 1080,
      height: 1920,
    });
  }

  async generateCharacter(
    description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult> {
    const prompt = this.buildCharacterPrompt(description, style);
    return this.generate(prompt, {
      ...options,
      width: 1024,
      height: 1024,
    });
  }

  private buildBackgroundPrompt(description: string, style: string): string {
    return `Create a vertical background image for a Japanese language learning video.
Style: ${style}
Scene: ${description}
Requirements:
- Vertical aspect ratio (9:16)
- Clean and uncluttered
- Suitable as a backdrop for text overlays
- No text or writing in the image
- Soft, non-distracting colors`;
  }

  private buildCharacterPrompt(description: string, style: string): string {
    return `Create an illustrated character portrait for educational content.
Style: ${style}
Character: ${description}
Requirements:
- Upper body portrait
- Friendly, approachable expression
- Clean background
- Suitable for education content
- Anime or illustration style, not photorealistic
- No text or writing`;
  }

  private getAspectRatio(width?: number, height?: number): string {
    if (!width || !height) return '1:1';

    const ratio = width / height;

    if (ratio > 1.5) return '16:9';
    if (ratio < 0.67) return '9:16';
    if (ratio > 1.2) return '4:3';
    if (ratio < 0.83) return '3:4';
    return '1:1';
  }
}
