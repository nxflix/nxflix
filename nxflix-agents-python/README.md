# NXFlix Agents (Python)

JLPT N1 Study App - Python Agent Runtime using FastAPI and LiteLLM.

## Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e .

# Copy environment file
cp .env.example .env
# Edit .env with your API keys
```

## Running

```bash
# Development
python -m nxflix_agents.main

# Or with uvicorn directly
uvicorn nxflix_agents.main:app --reload --port 8000
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

Supports OpenAI, Anthropic, Google Gemini, and Ollama via LiteLLM.
