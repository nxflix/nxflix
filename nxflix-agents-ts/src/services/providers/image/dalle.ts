import type { IImageProvider, ImageOptions, ImageResult } from './interface.js';
import { settings } from '../../../config.js';

/**
 * DALL-E 3 image generation provider.
 * High-quality AI-generated images via OpenAI.
 */
export class DALLEImageProvider implements IImageProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.openaiApiKey;
  }

  getProviderName(): string {
    return 'DALL-E 3';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generate(prompt: string, options?: ImageOptions): Promise<ImageResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // DALL-E 3 sizes: 1024x1024, 1792x1024, 1024x1792
    const size = this.getSizeString(options?.width, options?.height);
    const quality = options?.quality ?? 'standard';

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DALL-E error: ${error}`);
    }

    const data = await response.json();
    const imageData = data.data[0];

    const dimensions = this.parseSizeString(size);

    return {
      imageBase64: imageData.b64_json,
      width: dimensions.width,
      height: dimensions.height,
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
    return `Create a character portrait for a Japanese language learning video.
Style: ${style}
Character: ${description}
Requirements:
- Upper body portrait
- Friendly, approachable expression
- Clean background (will be removed)
- Suitable for education content
- No text or writing`;
  }

  private getSizeString(width?: number, height?: number): string {
    // DALL-E 3 only supports specific sizes
    if (height && height > 1024) {
      return '1024x1792'; // Vertical
    }
    if (width && width > 1024) {
      return '1792x1024'; // Horizontal
    }
    return '1024x1024'; // Square
  }

  private parseSizeString(size: string): { width: number; height: number } {
    const [w, h] = size.split('x').map(Number);
    return { width: w, height: h };
  }
}
