# Video Assets Directory

This directory contains static assets for video rendering.

## Directory Structure

```
assets/
├── backgrounds/         # Background images (1080x1920 PNG)
│   ├── classroom.png   # Japanese classroom setting
│   ├── cafe.png        # Cafe/coffee shop setting
│   ├── nature.png      # Outdoor/garden setting
│   ├── abstract.png    # Gradient/minimalist background
│   └── manga.png       # Manga/comic style background
│
├── characters/          # Character images (512x512 PNG with transparency)
│   ├── anime_female.png
│   ├── anime_male.png
│   ├── realistic_female.png
│   ├── realistic_male.png
│   ├── chibi.png
│   └── mascot.png
│
└── fonts/              # Fonts for subtitle rendering
    └── NotoSansJP-Regular.otf
```

## Image Requirements

### Backgrounds
- Resolution: 1080x1920 (9:16 vertical aspect ratio)
- Format: PNG
- Content: Clean, uncluttered backgrounds suitable for text overlays
- No text or watermarks

### Characters
- Resolution: 512x512 or higher
- Format: PNG with transparency
- Content: Upper body portrait, friendly expression
- Background: Transparent

## Generating Placeholders

If you don't have custom assets, the system will automatically generate:
- Gradient backgrounds using FFmpeg
- Skip character overlay if image not found

## Fonts

For Japanese text rendering, install Noto Sans JP:
- macOS: `brew install --cask font-noto-sans-cjk-jp`
- Linux: `apt-get install fonts-noto-cjk`
- Or download from: https://fonts.google.com/noto/specimen/Noto+Sans+JP

The font file should be placed at `fonts/NotoSansJP-Regular.otf`
