# NXFlix - Checkpoint 1 Submission

## Project Overview

**NXFlix** is an AI-powered Japanese language learning platform designed for JLPT (Japanese Language Proficiency Test) preparation. The platform features adaptive study algorithms, AI-generated content, and comprehensive tracking across all JLPT test sections.

**Target Level:** JLPT N1 (Advanced)

---

## System Architecture

```
nxflix/
├── frontend/                    # React frontend application
│   ├── client/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── pages/          # Application pages
│   │   │   ├── components/     # Reusable UI components
│   │   │   └── lib/            # API hooks and utilities
│   │   └── index.html
│   ├── server/                 # Express.js backend proxy
│   └── shared/                 # Shared types and schema
│
├── nxflix-agents-ts/           # TypeScript AI Agent Backend
│   ├── src/
│   │   ├── agents/             # AI agents for content/quiz
│   │   ├── services/           # Business logic services
│   │   ├── routers/            # API endpoint definitions
│   │   ├── models/             # Zod data models
│   │   └── db/                 # Drizzle ORM schema
│   └── package.json
│
├── nxflix-agents-python/       # Python agent runtime (alternative)
│   └── src/nxflix_agents/
│
└── contracts/                  # Solidity smart contracts
    └── src/
        └── Subscription.sol    # Subscription management
```

---

## Core Study Platform

### Content Types

We implemented five core content types covering all JLPT test sections:

#### 1. Grammar (`grammar`)
- **Fields:** pattern, meaning, meaningJp, example, exampleTranslation, explanation
- **Features:** Formation rules, usage notes, related patterns
- **AI Generation:** Claude/GPT-4 generates grammar points with natural examples

#### 2. Kanji (`kanji`)
- **Fields:** character, strokeCount, onyomi, kunyomi, meanings, radicals
- **Features:** Compound words with readings, mnemonics for memorization
- **AI Generation:** Character analysis with reading patterns

#### 3. Vocabulary (`vocabulary`)
- **Fields:** word, reading, meanings, partOfSpeech, examples, synonyms
- **Features:** Audio URL support, multiple example sentences
- **AI Generation:** Contextual vocabulary with usage examples

#### 4. Reading (`reading`)
- **Fields:** passageType, title, content, wordCount, questions, keyVocabulary
- **Passage Types:** short, medium, long, comparison
- **Features:** Comprehension questions with explanations, estimated reading time

#### 5. Listening (`listening`)
- **Fields:** listeningType, audioUrl, transcript, dialogue, speakers, questions
- **Listening Types:** task_based, point_comprehension, quick_response
- **Features:** Multi-speaker dialogue support, TTS-generated audio

---

## SM-2 Spaced Repetition Algorithm

Implemented the SuperMemo 2 algorithm for optimal review scheduling:

### Algorithm Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `easeFactor` | Item difficulty (1.3-2.5+) | 2.5 |
| `interval` | Days until next review | 1 |
| `repetitions` | Consecutive correct answers | 0 |

### Grading Scale
| Grade | Description | Effect |
|-------|-------------|--------|
| 0 | Complete blackout | Reset to 0 reps |
| 1 | Incorrect, remembered on hint | Reset to 0 reps |
| 2 | Incorrect, easy to recall | Reset to 0 reps |
| 3 | Correct with difficulty | Continue, reduce EF |
| 4 | Correct with hesitation | Continue, maintain EF |
| 5 | Perfect response | Continue, increase EF |

### Service Implementation
```typescript
// services/spaced-repetition.ts
calculateNextReview(progress: UserProgress, grade: number): SM2Result {
  // Adjust ease factor based on grade
  // Calculate new interval
  // Return next review date
}
```

---

## User Progress Tracking

### Progress Model
```typescript
UserProgress {
  userId: string
  itemId: string
  contentType: ContentType  // grammar|vocabulary|kanji|reading|listening
  easeFactor: number        // SM2 ease factor
  interval: number          // Days until review
  repetitions: number       // Consecutive correct
  timesStudied: number      // Total study sessions
  timesCorrect: number      // Correct answers
  lastScore: number         // Most recent grade
  masteryLevel: number      // 0-5 mastery
  nextReviewAt: timestamp   // Scheduled review
  lastStudiedAt: timestamp  // Last study time
}
```

### Mastery Levels
| Level | Name | Criteria |
|-------|------|----------|
| 0 | New | Never studied |
| 1 | Learning | < 3 correct |
| 2 | Familiar | 3-6 correct, EF < 2.3 |
| 3 | Comfortable | 7-12 correct, EF 2.3-2.5 |
| 4 | Proficient | 13-20 correct, EF > 2.5 |
| 5 | Mastered | 20+ correct, long intervals |

---

## AI Agents

### 1. Knowledge Assessor Agent
Evaluates quiz answers and provides feedback.

```typescript
// agents/knowledge-assessor.ts
assessAnswer(question: Question, userAnswer: string): Assessment {
  // Use LLM to evaluate partial correctness
  // Generate explanation for mistakes
  // Return score and feedback
}
```

### 2. Study Orchestrator Agent
Recommends personalized study content.

```typescript
// agents/study-orchestrator.ts
getRecommendations(userId: string): Recommendations {
  // Analyze user progress
  // Identify weak areas
  // Select optimal content mix
}
```

### 3. Content Creator Agent
Generates new study content on demand.

```typescript
// agents/content-creator.ts
generateContent(type: ContentType, options: GenerateOptions): Content {
  // Use LLM to create authentic content
  // Validate against JLPT standards
  // Return formatted content
}
```

---

## Quiz System

### Question Types
| Type | Content Types | Description |
|------|---------------|-------------|
| `grammar_usage` | grammar | Select correct grammar in context |
| `grammar_meaning` | grammar | Match pattern to meaning |
| `kanji_reading` | kanji | Provide reading for kanji |
| `kanji_meaning` | kanji | Select meaning for kanji |
| `kanji_compound` | kanji | Complete compound word |
| `vocab_meaning` | vocabulary | Select meaning for word |
| `vocab_reading` | vocabulary | Select reading for word |
| `vocab_usage` | vocabulary | Select correct usage |
| `reading_comprehension` | reading | Answer from passage |
| `listening_comprehension` | listening | Answer from audio |

### Quiz Flow
1. **Generate** - AI creates questions from selected content
2. **Present** - Display question with options
3. **Grade** - Evaluate answer with partial credit
4. **Update** - Apply SM2 algorithm to progress
5. **Feedback** - Show explanation and next steps

---

## Focus Mode

Daily personalized study sessions with AI-selected content.

### Features
- AI selects optimal content mix based on:
  - Due reviews (spaced repetition)
  - Weak areas needing practice
  - New content introduction
- Session tracking with time spent
- Streak tracking for consecutive days
- Reveal mechanic for learning new items

### Focus Session Model
```typescript
FocusSession {
  userId: string
  contentId: string
  contentType: ContentType
  itemId: string
  startedAt: timestamp
  completedAt: timestamp
  revealed: boolean
  timeSpentSeconds: number
}
```

---

## Database Schema

### Tables Implemented
| Table | Purpose |
|-------|---------|
| `grammar` | Grammar patterns and examples |
| `vocabulary` | Words with readings and meanings |
| `kanji` | Characters with readings and compounds |
| `reading` | Passages with comprehension questions |
| `listening` | Audio content with transcripts |
| `user_progress` | SM2 tracking per user per item |
| `focus_sessions` | Daily focus session tracking |

---

## API Endpoints

### Content Endpoints
```
GET  /api/grammar              # List grammar points
GET  /api/grammar/:id          # Get single grammar
POST /api/grammar/generate     # AI-generate grammar

GET  /api/vocabulary           # List vocabulary
POST /api/vocabulary/generate  # AI-generate vocabulary

GET  /api/kanji                # List kanji
POST /api/kanji/generate       # AI-generate kanji

GET  /api/reading              # List reading passages
POST /api/reading/generate     # AI-generate passage

GET  /api/listening            # List listening items
POST /api/listening/generate   # AI-generate listening
```

### Study Endpoints
```
GET  /api/progress/:userId     # Get user progress
POST /api/progress/update      # Update after study

POST /api/quiz/generate        # Generate quiz
POST /api/quiz/grade           # Grade quiz answers

GET  /api/focus/today/:userId  # Get today's focus content
POST /api/focus/complete       # Mark focus item complete
```

---

## Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Styling:** TailwindCSS 4 + Radix UI
- **State:** TanStack React Query
- **Routing:** Wouter
- **Auth:** Privy

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod
- **AI:** Vercel AI SDK (Claude, GPT-4, Gemini)

---

## Development Progress

### Completed Features
- [x] All 5 content types with full schemas
- [x] SM-2 spaced repetition algorithm
- [x] User progress tracking
- [x] Quiz generation and grading
- [x] Focus mode with AI selection
- [x] Knowledge Assessor agent
- [x] Study Orchestrator agent
- [x] Content Creator agent
- [x] Grammar service and router
- [x] Vocabulary service and router
- [x] Kanji service and router
- [x] Reading service and router
- [x] Listening service and router
- [x] Study dashboard UI
- [x] Focus page UI
- [x] Discover page UI

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Content Types | 5 |
| AI Agents | 3 |
| API Endpoints | 25+ |
| Database Tables | 7 |
| Question Types | 10 |

---

## Next Steps

- Text-to-speech integration for listening content
- Video generation for educational content
- Creator tools for user-generated content
- Subscription system with blockchain payments

---

*NXFlix - AI-Powered JLPT Study Platform*
