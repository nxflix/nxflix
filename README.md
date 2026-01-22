# NXFlix - JLPT Study Platform

An AI-powered Japanese language learning platform designed for JLPT (Japanese Language Proficiency Test) preparation. Features adaptive study algorithms, AI-generated content, video creation tools, and blockchain-based subscriptions.

## Features

### Study System
- **Grammar, Kanji, Vocabulary, Reading, Listening** - Complete JLPT content coverage
- **SM-2 Spaced Repetition** - Adaptive review scheduling for optimal retention
- **AI-Generated Quizzes** - Dynamic question generation based on study materials
- **Focus Mode** - Daily personalized study sessions with AI-selected content
- **Progress Tracking** - Mastery levels, streaks, and comprehensive analytics

### Content Creation (Animation Lab)
- **Hollywood Script Generator** - AI-generated screenplays with scenes, characters, and dialogue
- **Talking Head Videos** - D-ID integration for lip-synced avatar videos
- **AI Video Generation** - Runway ML integration for text-to-video and image-to-video
- **Text-to-Speech** - Multi-provider TTS (ElevenLabs, Microsoft, Google, Amazon)

### Creator Economy
- **Content Publishing** - Create and share study materials
- **Analytics Dashboard** - Track views, studies, and engagement metrics
- **Epoch-based Rewards** - Points system with tier progression
- **Featured Content** - Daily highlighted materials

### Blockchain Integration
- **Subscription Smart Contract** - ETH-based subscription plans (Monthly/Quarterly/Yearly)
- **Multi-chain Support** - Ethereum Mainnet, Base, and testnets
- **Crypto Payments** - SideShift integration for token conversions

## Repository Structure

```
nxflix/
├── frontend/                    # React frontend application
│   ├── client/
│   │   ├── src/
│   │   │   ├── pages/          # Main application pages
│   │   │   │   ├── animation-lab.tsx    # Video creation studio
│   │   │   │   ├── creator.tsx          # Content creation
│   │   │   │   ├── creator-dashboard.tsx # Analytics
│   │   │   │   ├── discover.tsx         # Browse content
│   │   │   │   ├── focus.tsx            # Daily study mode
│   │   │   │   ├── study-dashboard.tsx  # Study overview
│   │   │   │   ├── subscription.tsx     # Subscription management
│   │   │   │   └── video-studio.tsx     # Video project studio
│   │   │   ├── components/     # Reusable UI components
│   │   │   └── lib/            # API hooks and utilities
│   │   └── index.html
│   ├── server/                 # Express server (proxy to backend)
│   │   ├── routes.ts
│   │   └── index.ts
│   └── shared/                 # Shared types and schemas
│
├── nxflix-agents-ts/           # TypeScript AI Agent Backend
│   ├── src/
│   │   ├── agents/             # AI agents
│   │   │   ├── content-creator.ts      # Content generation
│   │   │   ├── knowledge-assessor.ts   # Quiz evaluation
│   │   │   ├── study-orchestrator.ts   # Study recommendations
│   │   │   └── video-creator.ts        # Video pipeline
│   │   ├── services/           # Business logic
│   │   │   ├── did.ts                  # D-ID talking head API
│   │   │   ├── runway.ts               # Runway ML video API
│   │   │   ├── hedra.ts                # Hedra API
│   │   │   ├── tts.ts                  # Text-to-speech
│   │   │   ├── script-generator.ts     # Hollywood script AI
│   │   │   ├── grammar.ts              # Grammar service
│   │   │   ├── kanji.ts                # Kanji service
│   │   │   ├── vocabulary.ts           # Vocabulary service
│   │   │   ├── reading.ts              # Reading service
│   │   │   ├── listening.ts            # Listening service
│   │   │   ├── spaced-repetition.ts    # SM-2 algorithm
│   │   │   ├── analytics.ts            # Event tracking
│   │   │   ├── rewards.ts              # Creator rewards
│   │   │   └── subscription.ts         # Subscription logic
│   │   ├── routers/            # API endpoints
│   │   ├── models/             # Data models (Zod schemas)
│   │   ├── db/                 # Database schema (Drizzle)
│   │   └── providers/          # LLM providers
│   └── package.json
│
├── nxflix-agents-python/       # Python agent runtime (alternative)
│   └── src/nxflix_agents/
│
└── contracts/                  # Solidity smart contracts
    ├── src/
    │   ├── Subscription.sol    # Main subscription contract
    │   └── interfaces/
    ├── script/                 # Deployment scripts
    ├── test/                   # Contract tests
    └── deployments/            # Deployed contract addresses
```

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **TailwindCSS 4** for styling
- **Radix UI** for accessible components
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Framer Motion** for animations
- **Privy** for authentication

### Backend (nxflix-agents-ts)
- **Express 5** REST API
- **Vercel AI SDK** for LLM integration
- **Drizzle ORM** with PostgreSQL
- **Zod** for validation
- **Multi-provider AI**: Anthropic (Claude), OpenAI, Google (Gemini), Ollama

### Video & Animation
- **D-ID** - Talking head video generation
- **Runway ML** - AI video generation (Gen-3 Alpha)
- **ElevenLabs** - Premium text-to-speech
- **FFmpeg** - Video composition

### Blockchain
- **Solidity ^0.8.24** smart contracts
- **Foundry** for development and testing
- **Viem** for blockchain interaction
- **SideShift** for crypto conversions

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL
- FFmpeg (for video rendering)

### Environment Variables

Create `.env` files in the appropriate directories:

**nxflix-agents-ts/.env**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nxflix

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Video & Animation
DID_API_KEY=...
RUNWAY_API_KEY=...
HEDRA_API_KEY=...

# Text-to-Speech
ELEVENLABS_API_KEY=...
MICROSOFT_SPEECH_KEY=...
MICROSOFT_SPEECH_REGION=...
GOOGLE_TTS_KEY=...
AMAZON_POLLY_ACCESS_KEY=...
AMAZON_POLLY_SECRET_KEY=...

# Blockchain
SIDESHIFT_AFFILIATE_ID=...
```

**frontend/.env**
```bash
VITE_PRIVY_APP_ID=...
AGENTS_API_URL=http://localhost:8000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nxflix.git
cd nxflix

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../nxflix-agents-ts
npm install

# Setup database
npm run db:push
```

### Running the Application

```bash
# Terminal 1: Start backend
cd nxflix-agents-ts
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5000` and the backend on `http://localhost:8000`.

## API Overview

### Animation Endpoints
| Endpoint | Description |
|----------|-------------|
| `POST /api/animation/generate` | Generate talking head video (D-ID) |
| `POST /api/animation/ai-video/generate` | Generate AI video (Runway) |
| `POST /api/animation/script/generate` | Generate Hollywood script |
| `GET /api/animation/status/:jobId` | Check generation status |

### Study Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/grammar` | List grammar points |
| `GET /api/kanji` | List kanji |
| `GET /api/vocabulary` | List vocabulary |
| `POST /api/quiz/generate` | Generate quiz |
| `POST /api/quiz/grade` | Grade quiz answers |

### Analytics Endpoints
| Endpoint | Description |
|----------|-------------|
| `POST /api/analytics/event` | Track content event |
| `GET /api/analytics/content/:id/stats` | Get content statistics |
| `GET /api/analytics/creator/:id/performance` | Get creator performance |

## Smart Contract

The Subscription contract (`contracts/src/Subscription.sol`) manages time-based subscriptions:

- **Plans**: Monthly, Quarterly, Yearly with configurable pricing
- **Auto-renewal**: Optional automatic subscription renewal
- **Grace period**: Configurable grace period after expiration
- **Treasury**: Configurable withdrawal address

### Deployed Addresses
Check `contracts/deployments/` for deployed contract addresses on various networks.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary. All rights reserved.
