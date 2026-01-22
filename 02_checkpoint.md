# NXFlix - Checkpoint 2 Submission

## Project Overview

**NXFlix** is an AI-powered Japanese language learning platform for JLPT preparation. Since Checkpoint 1, we've added comprehensive content creation tools including text-to-speech, talking head video generation, and a video studio for creating educational content.

**Repository:** nxflix/nxflix

---

## What's New Since Checkpoint 1

### 1. Multi-Provider Text-to-Speech

A unified TTS service supporting multiple providers for generating natural Japanese audio.

#### Supported Providers
| Provider | Quality | Features | Cost |
|----------|---------|----------|------|
| ElevenLabs | Premium | Most natural, multilingual | $$$$ |
| Microsoft Azure | High | Neural voices, SSML support | $$ |
| Google Cloud | Good | Many Japanese voices | $ |
| Amazon Polly | Good | Neural and standard voices | $$ |

#### TTS Service Implementation
```typescript
// services/tts.ts
class TTSService {
  async synthesize(text: string, options: TTSOptions): Promise<TTSResult> {
    // Route to selected provider
    // Return audio as base64 or URL
  }

  async getVoices(provider: string): Promise<Voice[]> {
    // List available voices for provider
  }
}
```

#### Japanese Voices Available
| Provider | Voice ID | Description |
|----------|----------|-------------|
| ElevenLabs | Yuki | Female, natural |
| Microsoft | ja-JP-NanamiNeural | Female, neural |
| Microsoft | ja-JP-KeitaNeural | Male, neural |
| Google | ja-JP-Neural2-B | Female, natural |
| Google | ja-JP-Neural2-C | Male, natural |

#### Key Files
- `nxflix-agents-ts/src/services/tts.ts`
- `nxflix-agents-ts/src/routers/tts.ts`

---

### 2. D-ID Talking Head Integration

Generate lip-synced avatar videos from images and text/audio.

#### Features
- Upload portrait image (base64 or URL)
- Text-to-speech with D-ID's built-in voices
- Custom audio upload support
- Multiple presenter styles
- Async job processing with polling

#### D-ID Service Implementation
```typescript
// services/did.ts
class DIDService {
  async generateTalkingVideo(options: {
    image: string
    imageIsBase64: boolean
    text?: string
    voiceId?: string
    provider?: TTSProvider
    waitForCompletion?: boolean
  }): Promise<TalkingVideoResult>

  async getTalk(talkId: string): Promise<Talk>
  async getCredits(): Promise<Credits>
  async getVoices(provider: string): Promise<Voice[]>
}
```

#### API Endpoints
```
POST /api/animation/generate       # Start talking head generation
GET  /api/animation/status/:jobId  # Check generation status
POST /api/animation/wait/:jobId    # Poll until complete
GET  /api/animation/voices         # List available voices
GET  /api/animation/credits        # Check remaining credits
GET  /api/animation/config         # Get provider configuration
```

#### Key Files
- `nxflix-agents-ts/src/services/did.ts`
- `nxflix-agents-ts/src/routers/animation.ts`

---

### 3. Video Studio

A complete video project management system for creating educational content.

#### Video Project Model
```typescript
VideoProject {
  id: string
  userId: string
  prompt: string
  script: VideoScript
  characterStyle: CharacterStyle
  videoStyle: VideoStyle
  voice: string
  status: 'draft' | 'generating' | 'ready' | 'failed'
  audioUrl?: string
  audioBase64?: string
  videoUrl?: string
  thumbnailUrl?: string
  progress: number
  errorMessage?: string
}
```

#### Character Styles
| Style | Description |
|-------|-------------|
| `anime_female` | Anime-style female character |
| `anime_male` | Anime-style male character |
| `realistic_female` | Photo-realistic female |
| `realistic_male` | Photo-realistic male |
| `chibi` | Cute chibi character |
| `mascot` | App mascot character |
| `none` | Subtitles only |

#### Video Styles (Backgrounds)
| Style | Description |
|-------|-------------|
| `classroom` | Traditional learning setting |
| `cafe` | Casual conversation setting |
| `nature` | Outdoor/scenic backgrounds |
| `abstract` | Minimalist/gradient backgrounds |
| `manga` | Comic panel style |

#### Video Script with Furigana
```typescript
VideoScript {
  id: string
  title: string
  subtitles: VideoSubtitle[]
  totalDurationSeconds: number
  targetVocabulary: string[]
  grammarPoints: string[]
}

VideoSubtitle {
  id: string
  startTime: number
  endTime: number
  text: string           // Japanese text
  reading?: string       // Full reading
  furigana: Furigana[]   // Ruby annotations
  translation?: string   // English translation
}
```

#### Key Files
- `nxflix-agents-ts/src/models/video.ts`
- `nxflix-agents-ts/src/agents/video-creator.ts`
- `nxflix-agents-ts/src/routers/video.ts`
- `frontend/client/src/pages/video-studio.tsx`

---

### 4. Animation Lab

An experimental UI for testing video generation features.

#### Features
- **Provider Selection:** Choose between D-ID and future providers
- **Image Upload:** Drag-and-drop or URL input
- **Text Input:** Enter speech text with character count
- **Voice Selection:** Browse and preview available voices
- **TTS Provider Selection:** Choose audio generation provider
- **Real-time Status:** Monitor generation progress
- **Video Preview:** Watch generated videos in-browser

#### UI Components
- Provider configuration display
- Image preview with base64 handling
- Voice selector with filtering
- Generation progress indicator
- Video player with download option

#### Key Files
- `frontend/client/src/pages/animation-lab.tsx`

---

### 5. Video Creator Agent

AI agent that orchestrates the complete video creation pipeline.

#### Pipeline Steps
```
1. Script Generation
   └─ LLM generates timed subtitles with furigana

2. Audio Generation
   └─ TTS service creates voiceover

3. Video Composition
   └─ Combine audio + visuals + subtitles
```

#### Agent Implementation
```typescript
// agents/video-creator.ts
class VideoCreatorAgent {
  async createVideo(request: VideoCreateRequest): Promise<VideoProject> {
    // Step 1: Generate script from prompt
    const script = await this.generateScript(request.prompt)

    // Step 2: Generate audio from script
    const audio = await this.generateAudio(script, request.voice)

    // Step 3: Compose final video
    const video = await this.renderVideo(project)

    return project
  }
}
```

---

### 6. Hedra Integration (Alternative Provider)

Backup talking head provider with different capabilities.

#### Features
- Character generation from image
- Audio-driven lip sync
- Alternative visual styles

#### Key Files
- `nxflix-agents-ts/src/services/hedra.ts`

---

## New Database Schema

### Video Projects Table
```sql
CREATE TABLE video_projects (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  script JSONB,
  character_style VARCHAR(50),
  video_style VARCHAR(50),
  voice VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft',
  audio_url TEXT,
  audio_base64 TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  error_message TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## New API Endpoints

### TTS Endpoints
```
POST /api/tts/synthesize    # Generate audio from text
GET  /api/tts/voices        # List available voices
```

### Animation Endpoints
```
GET  /api/animation/config           # Provider configuration
GET  /api/animation/voices           # Available voices
GET  /api/animation/credits          # Check credits
POST /api/animation/generate         # Generate talking head
GET  /api/animation/status/:jobId    # Check status
POST /api/animation/wait/:jobId      # Wait for completion
```

### Video Studio Endpoints
```
GET  /api/video                # List user's projects
GET  /api/video/:id            # Get project details
POST /api/video/create         # Create new project
GET  /api/video/:id/status     # Check generation status
GET  /api/video/styles         # Available styles
GET  /api/video/voices         # Available voices
```

---

## Frontend Pages Added

| Page | Path | Description |
|------|------|-------------|
| Video Studio | `/video-studio` | Create and manage video projects |
| Animation Lab | `/animation-lab` | Experiment with video generation |
| Creator Dashboard | `/creator-dashboard` | Overview of created content |

---

## Technology Additions

### New Dependencies (Backend)
```json
{
  "@elevenlabs/elevenlabs-js": "^2.32.0",
  "axios": "^1.13.2"
}
```

### External APIs Integrated
| Service | Purpose | Status |
|---------|---------|--------|
| D-ID | Talking head videos | Active |
| ElevenLabs | Premium TTS | Active |
| Microsoft Azure | Neural TTS | Active |
| Google Cloud | TTS | Active |
| Amazon Polly | TTS | Active |
| Hedra | Backup video | Configured |

---

## Environment Variables Added

```bash
# D-ID
DID_API_KEY=your_did_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_key

# Microsoft Azure TTS
MICROSOFT_SPEECH_KEY=your_azure_key
MICROSOFT_SPEECH_REGION=eastus

# Google Cloud TTS
GOOGLE_TTS_KEY=your_google_key

# Amazon Polly
AMAZON_POLLY_ACCESS_KEY=your_access_key
AMAZON_POLLY_SECRET_KEY=your_secret_key

# Hedra (Optional)
HEDRA_API_KEY=your_hedra_key
```

---

## Development Progress

### Completed Features
- [x] Multi-provider TTS service
- [x] ElevenLabs integration
- [x] Microsoft Azure TTS integration
- [x] Google Cloud TTS integration
- [x] Amazon Polly integration
- [x] D-ID talking head integration
- [x] Video project model and schema
- [x] Video creator agent
- [x] Video studio page
- [x] Animation lab page
- [x] Voice selection UI
- [x] Character style selection
- [x] Video style selection
- [x] Generation progress tracking
- [x] Video preview and download
- [x] Hedra backup integration

### In Progress
- [ ] FFmpeg video composition
- [ ] Subtitle rendering with furigana
- [ ] AI video generation (Runway ML)

---

## Key Metrics

| Metric | Value |
|--------|-------|
| TTS Providers | 4 |
| Video Providers | 2 |
| Character Styles | 7 |
| Video Styles | 5 |
| New API Endpoints | 12 |

---

## Next Steps

- Runway ML integration for AI video generation
- Hollywood script generator for educational content
- FFmpeg-based video composition
- Creator rewards system
- Blockchain subscription integration

---

*NXFlix - Checkpoint 2: Content Creation Tools*
