# NXFlix - Checkpoint 3 Submission

## Project Overview

**NXFlix** is an AI-powered Japanese language learning platform for JLPT preparation. Since Checkpoint 2, we've added AI video generation with Runway ML, Hollywood-style script generation, a comprehensive creator rewards system, and blockchain-based subscriptions.

**Repository:** nxflix/nxflix

---

## What's New Since Checkpoint 2

### 1. Runway ML AI Video Integration

Full integration with Runway ML's Gen-3 Alpha model for AI video generation.

#### Features
- **Text-to-Video:** Generate videos from text prompts
- **Image-to-Video:** Animate static images with motion
- **Configurable Duration:** 5 or 10 second clips
- **Aspect Ratios:** 16:9, 9:16, 1:1
- **Async Processing:** Job-based generation with polling

#### Runway Service Implementation
```typescript
// services/runway.ts
class RunwayService {
  async generateFromText(options: {
    prompt: string
    duration?: 5 | 10
    ratio?: '16:9' | '9:16' | '1:1'
    waitForCompletion?: boolean
  }): Promise<GenerateVideoResult>

  async generateFromImage(options: {
    prompt: string
    image: string
    imageIsUrl?: boolean
    duration?: 5 | 10
    ratio?: '16:9' | '9:16' | '1:1'
  }): Promise<GenerateVideoResult>

  async getTask(taskId: string): Promise<GetTaskResponse>
  async waitForCompletion(taskId: string): Promise<GenerateVideoResult>
}
```

#### API Configuration
- **Base URL:** `https://api.runwayml.com/v1`
- **Auth:** Bearer token
- **API Version:** `2024-11-06`
- **Model:** `gen3a_turbo`

#### New API Endpoints
```
POST /api/animation/ai-video/generate     # Start AI video generation
GET  /api/animation/ai-video/status/:jobId # Check generation status
POST /api/animation/ai-video/wait/:jobId   # Poll until complete
```

#### Key Files
- `nxflix-agents-ts/src/services/runway.ts`
- `nxflix-agents-ts/src/routers/animation.ts` (updated)

---

### 2. Hollywood Script Generator

AI-powered screenplay generation for creating educational video scripts.

#### Features
- **Scene Generation:** Multiple scenes with settings, actions, dialogue
- **Character Development:** Named characters with descriptions
- **Dialogue Lines:** Natural Japanese with speaker attribution
- **Camera Directions:** Visual storytelling guidance
- **Genre Support:** Various video genres (educational, conversation, etc.)

#### Script Structure
```typescript
HollywoodScript {
  title: string
  genre: string
  targetDuration: number
  scenes: Scene[]
  characters: Character[]
}

Scene {
  sceneNumber: number
  setting: string
  timeOfDay: string
  description: string
  dialogue: DialogueLine[]
  actions: string[]
  cameraDirections: string[]
}

DialogueLine {
  characterId: string
  characterName: string
  line: string
  emotion?: string
  direction?: string
}

Character {
  id: string
  name: string
  description: string
  role: string
}
```

#### Script Generator Service
```typescript
// services/script-generator.ts
class ScriptGeneratorService {
  async generateScript(options: {
    grammar?: GrammarPoint[]
    vocabulary?: VocabItem[]
    kanji?: KanjiItem[]
    genre: string
    context?: string
    targetDuration?: number
  }): Promise<HollywoodScript>

  extractDialogueText(script: HollywoodScript, characterId?: string): string
}
```

#### LLM Integration
- **Primary:** Anthropic Claude (claude-3-5-sonnet)
- **Fallback:** OpenAI GPT-4
- **Auto-fallback:** If Claude fails, automatically tries OpenAI

#### New API Endpoints
```
POST /api/animation/script/generate           # Generate Hollywood script
POST /api/animation/script/extract-dialogue   # Extract dialogue from script
```

#### Key Files
- `nxflix-agents-ts/src/services/script-generator.ts`
- `nxflix-agents-ts/src/routers/animation.ts` (updated)

---

### 3. Enhanced Animation Lab UI

Updated Animation Lab with Hollywood script integration and AI video generation.

#### New Features
- **Default to AI Video:** AI Video Gen tab selected by default
- **Script Generation Panel:** Full screenplay preview with scenes
- **Script-to-Video Workflow:** Use dialogue as video prompts
- **Scene Actions:** "Use for AI Video" buttons on scenes
- **Character Display:** View all script characters
- **Dialogue Preview:** Click lines to use as speech text

#### UI Flow
```
1. Enter prompt or study content
2. Generate Hollywood Script
3. Review scenes and dialogue
4. Select scene for AI Video
5. Generate video with Runway ML
6. Preview and download result
```

#### Key Files
- `frontend/client/src/pages/animation-lab.tsx` (major update)
- `frontend/client/src/lib/api.ts` (new hooks)

---

### 4. Creator Rewards System (Database)

Complete database schema for tracking creator engagement and rewards.

#### Epoch System
Time-based periods for reward calculation:
| Type | Duration | Purpose |
|------|----------|---------|
| Daily | 24 hours | User engagement rewards |
| Weekly | 7 days | Primary creator rewards |
| Monthly | Calendar month | Leaderboards/milestones |

#### Event Tracking
| Event Type | Weight | Description |
|------------|--------|-------------|
| `view` | 1x | Content displayed |
| `study` | 3x | Active study session |
| `complete` | 5x | Finished all questions |
| `save` | 2x | Added to library |
| `share` | 4x | Shared externally |

#### Reward Tiers
| Tier | Points/Week | Benefits |
|------|-------------|----------|
| Bronze | 10-50 | Badge + featured consideration |
| Silver | 51-200 | Badge + 1 week featured |
| Gold | 201-500 | Badge + 2 weeks featured |
| Platinum | 501+ | All above + token consideration |

#### New Database Tables
```sql
-- Epoch periods
CREATE TABLE epochs (
  id VARCHAR(100) PRIMARY KEY,
  epoch_type VARCHAR(20) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active'
);

-- Content events (analytics)
CREATE TABLE content_events (
  id VARCHAR(100) PRIMARY KEY,
  content_id VARCHAR(100) NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  user_id VARCHAR(100),
  event_type VARCHAR(30) NOT NULL,
  event_data JSONB
);

-- Aggregated stats per epoch
CREATE TABLE content_epoch_stats (
  id VARCHAR(100) PRIMARY KEY,
  epoch_id VARCHAR(100) NOT NULL,
  content_id VARCHAR(100) NOT NULL,
  view_count INTEGER DEFAULT 0,
  study_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0
);

-- Creator points ledger
CREATE TABLE creator_points (
  id VARCHAR(100) PRIMARY KEY,
  creator_id VARCHAR(100) NOT NULL,
  epoch_id VARCHAR(100) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  tier VARCHAR(20)
);

-- Pending rewards
CREATE TABLE creator_rewards (
  id VARCHAR(100) PRIMARY KEY,
  creator_id VARCHAR(100) NOT NULL,
  epoch_id VARCHAR(100) NOT NULL,
  points_earned INTEGER NOT NULL,
  tier VARCHAR(20),
  reward_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  token_amount REAL
);

-- Daily user rewards
CREATE TABLE daily_rewards (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  reward_date TIMESTAMP NOT NULL,
  reward_rarity VARCHAR(20) NOT NULL,
  reward_type VARCHAR(50) NOT NULL,
  claimed BOOLEAN DEFAULT FALSE
);

-- Featured content
CREATE TABLE featured_content (
  id VARCHAR(100) PRIMARY KEY,
  content_id VARCHAR(100) NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  feature_date TIMESTAMP NOT NULL,
  feature_reason TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0
);
```

#### Content Sharing Fields
All content tables now include:
```sql
is_public BOOLEAN DEFAULT FALSE,
created_by VARCHAR(100)
```

#### Key Files
- `nxflix-agents-ts/src/db/schema.ts` (updated)
- `nxflix-agents-ts/src/services/analytics.ts`
- `nxflix-agents-ts/src/services/epoch.ts`
- `nxflix-agents-ts/src/services/rewards.ts`

---

### 5. Blockchain Subscription System

Smart contract for managing time-based subscriptions with crypto payments.

#### Subscription Contract Features
- **Plan Types:** Monthly, Quarterly, Yearly
- **Payment:** ETH (native token)
- **Auto-renewal:** Optional automatic renewal
- **Grace Period:** Configurable expiration buffer
- **Platform Fee:** 2% fee collection
- **Treasury:** Configurable withdrawal address

#### Contract Interface
```solidity
// contracts/src/Subscription.sol
contract Subscription {
  // Plans
  struct Plan {
    uint256 price;
    uint256 duration;
    bool active;
  }

  // User subscription
  struct Subscription {
    uint256 planIndex;
    uint256 startTime;
    uint256 endTime;
    bool autoRenew;
  }

  // Functions
  function subscribe(uint256 planIndex) external payable;
  function renew() external payable;
  function cancel() external;
  function isActive(address user) external view returns (bool);
}
```

#### Deployment
| Network | Status |
|---------|--------|
| Ethereum Mainnet | Deployed |
| Base | Deployed |
| Sepolia Testnet | Deployed |
| Base Sepolia | Deployed |

#### SideShift Integration
Token conversion service for accepting various cryptocurrencies:
- Convert any supported token to ETH
- Seamless payment flow
- Real-time exchange rates

#### Key Files
- `contracts/src/Subscription.sol`
- `contracts/src/interfaces/ISubscription.sol`
- `nxflix-agents-ts/src/services/subscription.ts`
- `nxflix-agents-ts/src/services/sideshift.ts`
- `frontend/client/src/pages/subscription.tsx`

---

### 6. Creator Dashboard & Pages

Full creator experience with content management and analytics.

#### Creator Page Features
- Create new content (grammar, vocabulary, kanji, reading, listening)
- AI-assisted content generation
- Publish/unpublish controls
- Edit existing content

#### Creator Dashboard Features
- Content performance overview
- View counts and study metrics
- Recent activity feed
- Points and tier display

#### Key Files
- `frontend/client/src/pages/creator.tsx`
- `frontend/client/src/pages/creator-dashboard.tsx`

---

## Updated Animation Router

The animation router now supports multiple providers and features:

```typescript
// routers/animation.ts
GET  /api/animation/config              # All provider configurations
GET  /api/animation/voices              # Available voices
GET  /api/animation/credits             # Check credits

// Talking Head (D-ID)
POST /api/animation/generate            # Generate talking head
GET  /api/animation/status/:jobId       # Check status
POST /api/animation/wait/:jobId         # Wait for completion

// AI Video (Runway ML)
POST /api/animation/ai-video/generate   # Generate AI video
GET  /api/animation/ai-video/status/:jobId
POST /api/animation/ai-video/wait/:jobId

// Script Generation
POST /api/animation/script/generate     # Generate Hollywood script
POST /api/animation/script/extract-dialogue
```

---

## New Frontend API Hooks

```typescript
// lib/api.ts

// Script Generation
useGenerateAnimationScript()

// AI Video Generation
useGenerateAIVideo()
useAIVideoStatus(jobId)
useWaitForAIVideo()

// Existing (updated)
useAnimationConfig()
useGenerateTalkingVideo()
useTalkingVideoStatus(jobId)
```

---

## Environment Variables Added

```bash
# Runway ML
RUNWAY_API_KEY=your_runway_api_key

# Script Generation (uses existing keys)
ANTHROPIC_API_KEY=sk-ant-...  # Primary
OPENAI_API_KEY=sk-...         # Fallback

# SideShift
SIDESHIFT_AFFILIATE_ID=your_affiliate_id
```

---

## Development Progress

### Completed Features
- [x] Runway ML AI video integration
- [x] Text-to-video generation
- [x] Image-to-video generation
- [x] Hollywood script generator
- [x] Scene and dialogue extraction
- [x] Script-to-video workflow
- [x] Animation Lab UI updates
- [x] AI Video as default tab
- [x] Epochs database schema
- [x] Content events tracking schema
- [x] Creator points schema
- [x] Creator rewards schema
- [x] Daily rewards schema
- [x] Featured content schema
- [x] Content sharing fields
- [x] Subscription smart contract
- [x] Multi-chain deployment
- [x] SideShift integration
- [x] Creator page
- [x] Creator dashboard

### In Progress
- [ ] Analytics service implementation
- [ ] Epoch rollover job
- [ ] Rewards calculation service
- [ ] Featured content algorithm
- [ ] Admin rewards panel

---

## Git Commit History (Recent)

```
cab549c - add hollywood scripts
847bf42 - use official elevenlabs sdk
87837d8 - rewards system
76fcd85 - add storage or persistence of generated content
ae4b26d - audio generation
```

---

## Key Metrics

| Metric | Checkpoint 2 | Checkpoint 3 |
|--------|-------------|--------------|
| Video Providers | 2 | 3 (+Runway) |
| Database Tables | 8 | 15 (+7 rewards) |
| API Endpoints | 25 | 35 (+10) |
| Smart Contracts | 0 | 1 |
| Networks Deployed | 0 | 4 |

---

## Technical Highlights

### Runway ML Integration
- Bearer token authentication
- Version header: `X-Runway-Version: 2024-11-06`
- Job-based async processing
- Automatic status polling

### Script Generator Fallback
- Primary: Claude 3.5 Sonnet
- Catches Anthropic errors gracefully
- Falls back to OpenAI GPT-4
- Unified response format

### Creator Rewards Architecture
- Event-driven analytics
- Epoch-based aggregation
- Tier progression system
- Manual approval workflow

---

## Next Steps

- Complete analytics service implementation
- Build epoch rollover cron job
- Implement rewards calculation
- Create admin rewards panel
- Add daily engagement rewards UI
- Deploy JLPT token contract
- Integrate token payments

---

*NXFlix - Checkpoint 3: AI Video & Creator Economy*
*Last Updated: January 2025*
