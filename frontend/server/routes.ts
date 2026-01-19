import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Agent service URLs - configurable via environment
const AGENT_TS_URL = process.env.AGENT_TS_URL || "http://localhost:8001";
const AGENT_PY_URL = process.env.AGENT_PY_URL || "http://localhost:8000";

// Helper to proxy requests to agent services
async function proxyToAgent(
  agentUrl: string,
  path: string,
  method: string,
  body?: unknown,
  timeoutMs: number = 30000 // Default 30s timeout
): Promise<Response | { error: string; status: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${agentUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return { status: response.status, ...data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Agent proxy timeout: ${path}`);
      return { error: "Request timed out", status: 504 };
    }
    console.error(`Agent proxy error: ${error}`);
    return { error: "Agent service unavailable", status: 503 };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============================================================================
  // Health Check
  // ============================================================================
  app.get("/api/health", async (_req: Request, res: Response) => {
    const tsHealth = await proxyToAgent(AGENT_TS_URL, "/api/health", "GET");
    const pyHealth = await proxyToAgent(AGENT_PY_URL, "/api/health", "GET");

    res.json({
      frontend: "ok",
      agentTs: tsHealth,
      agentPy: pyHealth,
    });
  });

  // ============================================================================
  // Grammar Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/grammar", async (_req: Request, res: Response) => {
    // Use seeded grammar from agents
    const result = await proxyToAgent(AGENT_TS_URL, "/api/grammar", "GET");
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Kanji Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/kanji", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/kanji", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/kanji/search", async (req: Request, res: Response) => {
    const query = req.query.query as string;
    const result = await proxyToAgent(AGENT_TS_URL, `/api/kanji/search?query=${encodeURIComponent(query)}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/kanji/generate", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/kanji/generate", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Vocabulary Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/vocabulary", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/vocabulary", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/vocabulary/search", async (req: Request, res: Response) => {
    const query = req.query.query as string;
    const result = await proxyToAgent(AGENT_TS_URL, `/api/vocabulary/search?query=${encodeURIComponent(query)}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/vocabulary/generate", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/vocabulary/generate", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Reading Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/reading", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/reading", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/reading/generate", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/reading/generate", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Listening Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/listening", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/listening", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/listening/generate", async (req: Request, res: Response) => {
    // Longer timeout for listening generation (LLM + TTS can take 2+ minutes)
    const result = await proxyToAgent(AGENT_TS_URL, "/api/listening/generate", "POST", req.body, 180000);
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // TTS Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/tts/voices", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/tts/voices", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/tts/synthesize", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/tts/synthesize", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Quiz Routes (proxy to TypeScript agent)
  // ============================================================================
  app.post("/api/quiz/generate", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/quiz/generate", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/quiz/:quizId/grade", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/quiz/${req.params.quizId}/grade`, "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Study Routes (proxy to TypeScript agent)
  // ============================================================================
  app.post("/api/study/recommendations", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/study/recommendations", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/study/sessions", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/study/sessions", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Progress Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/progress/:userId/stats", async (req: Request, res: Response) => {
    const contentType = req.query.contentType ? `?contentType=${req.query.contentType}` : "";
    const result = await proxyToAgent(AGENT_TS_URL, `/api/progress/${req.params.userId}/stats${contentType}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/progress/:userId/due", async (req: Request, res: Response) => {
    const contentType = req.query.contentType ? `?contentType=${req.query.contentType}` : "";
    const result = await proxyToAgent(AGENT_TS_URL, `/api/progress/${req.params.userId}/due${contentType}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  return httpServer;
}
