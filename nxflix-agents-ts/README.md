# NXFlix Agents (TypeScript)

JLPT N1 Study App - TypeScript Agent Runtime using Express and Vercel AI SDK.

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

- `POST /api/study/recommendations` - Get personalized study recommendations
- `POST /api/study/sessions` - Start a study session
- `PUT /api/study/sessions/:id/complete` - Complete a session
- `POST /api/quiz/generate` - Generate a quiz
- `POST /api/quiz/:id/answer/:questionId` - Submit an answer
- `POST /api/quiz/:id/submit` - Submit all answers
- `GET /api/progress/:userId/stats` - Get user statistics
- `GET /api/progress/:userId/due` - Get items due for review
- `GET /api/health` - Health check

## Multi-Model Support

Supports OpenAI, Anthropic, Google Gemini, and Ollama via Vercel AI SDK.
