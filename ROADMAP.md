# NXFlix Development Roadmap

This document tracks the development progress of NXFlix, showing completed features, work in progress, and planned future enhancements.

---

## Legend

| Status | Description |
|--------|-------------|
| ✅ | Completed |
| 🚧 | In Progress |
| 📋 | Planned |
| 💡 | Future Consideration |

---

## Phase 1: Core Study Platform ✅

The foundational JLPT study system with content types and learning algorithms.

### Content Types
| Feature | Status | Description |
|---------|--------|-------------|
| Grammar | ✅ | Patterns, meanings, examples, formation rules |
| Kanji | ✅ | Characters, readings (on/kun), meanings, compounds, mnemonics |
| Vocabulary | ✅ | Words, readings, meanings, part of speech, examples |
| Reading | ✅ | Passages (short/medium/long), comprehension questions |
| Listening | ✅ | Audio content, transcripts, dialogue, comprehension questions |

### Study System
| Feature | Status | Description |
|---------|--------|-------------|
| SM-2 Spaced Repetition | ✅ | Adaptive review scheduling algorithm |
| User Progress Tracking | ✅ | Track ease factor, intervals, repetitions per item |
| Mastery Levels | ✅ | 0-5 mastery progression per content item |
| Quiz Generation | ✅ | AI-generated quizzes from content |
| Quiz Grading | ✅ | Automated answer evaluation with explanations |
| Focus Mode | ✅ | Daily AI-selected content for personalized study |
| Focus Sessions | ✅ | Track study session data and completion |

### Backend Services
| Service | Status | Description |
|---------|--------|-------------|
| Grammar Service | ✅ | CRUD operations, AI generation |
| Kanji Service | ✅ | CRUD operations, AI generation |
| Vocabulary Service | ✅ | CRUD operations, AI generation |
| Reading Service | ✅ | Passage generation, questions |
| Listening Service | ✅ | Audio generation with TTS |
| Study Orchestrator Agent | ✅ | AI agent for study recommendations |
| Knowledge Assessor Agent | ✅ | AI agent for quiz evaluation |
| Content Creator Agent | ✅ | AI agent for content generation |

---

## Phase 2: Content Creation Tools ✅

Tools for creating educational video content using AI.

### Text-to-Speech
| Feature | Status | Description |
|---------|--------|-------------|
| Multi-provider TTS | ✅ | Support for multiple TTS providers |
| ElevenLabs | ✅ | Premium natural voices |
| Microsoft Azure | ✅ | Neural TTS voices |
| Google Cloud TTS | ✅ | Japanese language support |
| Amazon Polly | ✅ | Additional voice options |
| Voice Selection | ✅ | Choose from available voices per provider |

### Video Generation
| Feature | Status | Description |
|---------|--------|-------------|
| D-ID Integration | ✅ | Talking head video generation |
| Runway ML Integration | ✅ | AI video (text-to-video, image-to-video) |
| Hollywood Script Generator | ✅ | AI-generated screenplays with scenes/dialogue |
| Video Creator Agent | ✅ | Orchestrates video creation pipeline |
| Hedra Integration | ✅ | Alternative talking head provider |

### Frontend
| Feature | Status | Description |
|---------|--------|-------------|
| Animation Lab | ✅ | UI for video generation experiments |
| Video Studio | ✅ | Full video project management |
| Script Preview Panel | ✅ | View generated scripts with scenes/dialogue |
| Script-to-Video Workflow | ✅ | Use scripts as input for video generation |

---

## Phase 3: Creator Economy 🚧

Reward system for content creators based on engagement.

### Database Schema
| Feature | Status | Description |
|---------|--------|-------------|
| Epochs Table | ✅ | Time-based periods (daily/weekly/monthly) |
| Content Events Table | ✅ | Event logging (view/study/complete/save/share) |
| Content Epoch Stats Table | ✅ | Aggregated performance per epoch |
| Creator Points Table | ✅ | Points ledger per creator per epoch |
| Creator Rewards Table | ✅ | Pending rewards for approval |
| Daily Rewards Table | ✅ | Random user engagement rewards |
| Featured Content Table | ✅ | Daily highlighted content |
| Content Sharing Fields | ✅ | `isPublic`, `createdBy` on all content tables |

### Backend Services
| Feature | Status | Description |
|---------|--------|-------------|
| Analytics Service | 🚧 | Event tracking, stats aggregation |
| Epoch Service | 🚧 | Epoch management, creation, status |
| Rewards Service | 🚧 | Points calculation, reward generation |
| Featured Content Service | 🚧 | Weighted content selection algorithm |

### API Endpoints
| Feature | Status | Description |
|---------|--------|-------------|
| Analytics Router | 🚧 | Event tracking + stats endpoints |
| Rewards Router | 🚧 | Creator rewards + daily rewards |
| Admin Router | 📋 | Admin panel for reward approval |

### Background Jobs
| Feature | Status | Description |
|---------|--------|-------------|
| Epoch Rollover Job | 📋 | Weekly epoch processing, points calculation |
| Featured Content Job | 📋 | Daily featured selection |
| Reward Distribution Job | 📋 | Process approved rewards |

### Frontend
| Feature | Status | Description |
|---------|--------|-------------|
| Creator Page | ✅ | Content creation interface |
| Creator Dashboard | ✅ | Basic analytics display |
| Analytics Integration | 📋 | Full performance metrics |
| Daily Reward UI | 📋 | Mystery box/scratch card reveal |
| Admin Rewards Panel | 📋 | Review and approve creator rewards |
| Leaderboard | 📋 | Top creators by epoch |

### Reward Tiers
| Tier | Points/Week | Benefits | Status |
|------|-------------|----------|--------|
| Bronze | 10-50 | Badge + featured consideration | 📋 |
| Silver | 51-200 | Badge + 1 week featured | 📋 |
| Gold | 201-500 | Badge + 2 weeks featured + priority support | 📋 |
| Platinum | 501+ | All above + token allocation consideration | 📋 |

---

## Phase 4: Blockchain Integration 🚧

Cryptocurrency payments and token-based rewards.

### Smart Contracts
| Feature | Status | Description |
|---------|--------|-------------|
| Subscription.sol | ✅ | Time-based subscription contract |
| Monthly Plan | ✅ | 30-day subscription |
| Quarterly Plan | ✅ | 90-day subscription |
| Yearly Plan | ✅ | 365-day subscription |
| Auto-renewal | ✅ | Optional automatic renewal |
| Grace Period | ✅ | Configurable expiration buffer |
| Multi-chain Deploy | ✅ | Ethereum, Base, testnets |

### Payment Integration
| Feature | Status | Description |
|---------|--------|-------------|
| SideShift Integration | ✅ | Token conversion service |
| ETH Payments | ✅ | Native ETH subscription payments |
| Privy Authentication | ✅ | Web3 wallet connection |

### Future Token System
| Feature | Status | Description |
|---------|--------|-------------|
| JLPT Token Contract | 📋 | ERC-20 token for creator rewards |
| Points-to-Token Conversion | 📋 | Mint tokens from accumulated points |
| Token Subscription Payments | 📋 | Pay subscriptions with JLPT tokens |
| JLPT/USDC Liquidity Pool | 💡 | Token exchange capability |

---

## Phase 5: Advanced Video Pipeline 📋

Enhanced video creation with more providers and rendering options.

### Additional Providers
| Feature | Status | Description |
|---------|--------|-------------|
| Gemini Veo | 📋 | Google AI video generation |
| Pika Labs | 📋 | Alternative AI video |
| Stable Diffusion | 📋 | AI image generation for assets |
| DALL-E 3 | 📋 | AI image generation |

### Video Composition
| Feature | Status | Description |
|---------|--------|-------------|
| FFmpeg Renderer | 📋 | Traditional video composition |
| Subtitle Rendering (ASS) | 📋 | Furigana-enabled subtitles |
| Background Assets | 📋 | Pre-made scene backgrounds |
| Character Assets | 📋 | Avatar/character overlays |
| Thumbnail Generation | 📋 | Auto-generate video thumbnails |

### Pipeline Configuration
| Feature | Status | Description |
|---------|--------|-------------|
| Provider Selection UI | 📋 | Choose provider per pipeline step |
| Provider Fallback | 📋 | Automatic failover to backup providers |
| Cost Optimization | 📋 | Route to cost-effective providers |

---

## Phase 6: Platform Enhancements 💡

Future improvements and features under consideration.

### Study Enhancements
| Feature | Status | Description |
|---------|--------|-------------|
| Offline Mode | 💡 | Download content for offline study |
| Study Groups | 💡 | Collaborative learning features |
| Tutor Matching | 💡 | Connect with Japanese tutors |
| Live Sessions | 💡 | Real-time tutoring integration |

### Content Expansion
| Feature | Status | Description |
|---------|--------|-------------|
| N2-N5 Content | 💡 | Expand beyond N1 |
| Custom Content Import | 💡 | Import external study materials |
| Manga Reader | 💡 | Reading practice with manga |
| News Articles | 💡 | Current events reading practice |

### Gamification
| Feature | Status | Description |
|---------|--------|-------------|
| Achievements | 💡 | Unlock badges for milestones |
| Streak Challenges | 💡 | Multi-user streak competitions |
| XP System | 💡 | Experience points with levels |
| Virtual Currency | 💡 | Earn and spend in-app currency |

### Mobile
| Feature | Status | Description |
|---------|--------|-------------|
| iOS App | 💡 | Native iOS application |
| Android App | 💡 | Native Android application |
| Push Notifications | 💡 | Study reminders and rewards |

---

## Development Timeline

### Completed (Q4 2024 - Q1 2025)
- Core study platform with all content types
- SM-2 spaced repetition algorithm
- TTS integration (4 providers)
- D-ID and Runway ML video generation
- Hollywood script generator
- Animation Lab and Video Studio UI
- Subscription smart contract
- SideShift payment integration
- Creator rewards database schema

### Current Sprint (January 2025)
- Analytics service implementation
- Epoch service with rollover logic
- Rewards calculation backend
- Featured content selection algorithm

### Next Sprint
- Admin panel for reward approval
- Daily engagement rewards UI
- Full creator dashboard with analytics
- Background job scheduling

### Future Quarters
- JLPT Token contract development
- Additional video providers
- FFmpeg rendering pipeline
- Mobile applications

---

## Technical Debt & Improvements

| Item | Priority | Description |
|------|----------|-------------|
| Test Coverage | High | Add unit and integration tests |
| Error Handling | High | Standardize API error responses |
| Rate Limiting | Medium | Protect API from abuse |
| Caching | Medium | Redis caching for frequent queries |
| Logging | Medium | Structured logging with levels |
| Documentation | Medium | API documentation (OpenAPI/Swagger) |
| Performance | Low | Database query optimization |
| Monitoring | Low | Application performance monitoring |

---

## Contributing

See [README.md](./README.md) for setup instructions. When contributing:

1. Check this roadmap for planned features
2. Open an issue to discuss new features before implementation
3. Follow existing code patterns and conventions
4. Include tests for new functionality
5. Update this roadmap when completing features
