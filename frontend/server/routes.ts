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

  app.post("/api/grammar/generate", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/grammar/generate", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/grammar/save", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/grammar/save", "POST", req.body);
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

  app.post("/api/kanji/save", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/kanji/save", "POST", req.body);
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

  app.post("/api/vocabulary/save", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/vocabulary/save", "POST", req.body);
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

  app.post("/api/reading/save", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/reading/save", "POST", req.body);
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

  app.post("/api/listening/save", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/listening/save", "POST", req.body);
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
  // Animation Routes (proxy to TypeScript agent - Hedra integration)
  // ============================================================================
  app.get("/api/animation/config", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/animation/config", "GET");
    res.json(result);
  });

  app.get("/api/animation/credits", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/animation/credits", "GET");
    // Check for error response from backend
    if ((result as any).error && !(result as any).credits) {
      res.status(500).json(result);
      return;
    }
    res.json(result);
  });

  app.post("/api/animation/generate", async (req: Request, res: Response) => {
    // Longer timeout for video generation (up to 5 minutes)
    const result = await proxyToAgent(AGENT_TS_URL, "/api/animation/generate", "POST", req.body, 300000);
    // Note: result.status here is the generation status ("processing", "failed", etc.), not HTTP status
    // Return 200 with the result - frontend handles the generation status
    if ((result as any).error && !(result as any).jobId) {
      res.status(500).json(result);
      return;
    }
    res.json(result);
  });

  app.get("/api/animation/status/:jobId", async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const result = await proxyToAgent(AGENT_TS_URL, `/api/animation/status/${jobId}`, "GET");
    // Note: result.status is the job status, not HTTP status
    res.json(result);
  });

  app.post("/api/animation/wait/:jobId", async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const timeout = req.query.timeout || '300000';
    // Longer timeout for waiting (up to 5 minutes)
    const result = await proxyToAgent(AGENT_TS_URL, `/api/animation/wait/${jobId}?timeout=${timeout}`, "POST", req.body, 300000);
    // Note: result.status is the job status, not HTTP status
    res.json(result);
  });

  app.get("/api/animation/voices", async (req: Request, res: Response) => {
    const provider = req.query.provider || 'microsoft';
    const result = await proxyToAgent(AGENT_TS_URL, `/api/animation/voices?provider=${provider}`, "GET");
    res.json(result);
  });

  // Script generation routes
  app.post("/api/animation/script/generate", async (req: Request, res: Response) => {
    // Script generation can take time with LLM
    const result = await proxyToAgent(AGENT_TS_URL, "/api/animation/script/generate", "POST", req.body, 120000);
    res.json(result);
  });

  app.post("/api/animation/script/extract-dialogue", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/animation/script/extract-dialogue", "POST", req.body);
    res.json(result);
  });

  // AI Video Generation Routes (Runway ML)
  app.post("/api/animation/ai-video/generate", async (req: Request, res: Response) => {
    // AI video generation - short timeout to start, polling for completion
    const result = await proxyToAgent(AGENT_TS_URL, "/api/animation/ai-video/generate", "POST", req.body, 60000);
    res.json(result);
  });

  app.get("/api/animation/ai-video/status/:jobId", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/animation/ai-video/status/${req.params.jobId}`, "GET");
    res.json(result);
  });

  app.post("/api/animation/ai-video/wait/:jobId", async (req: Request, res: Response) => {
    // Long timeout for waiting for completion (up to 10 minutes)
    const timeout = parseInt(req.query.timeout as string) || 10 * 60 * 1000;
    const result = await proxyToAgent(
      AGENT_TS_URL,
      `/api/animation/ai-video/wait/${req.params.jobId}?timeout=${timeout}`,
      "POST",
      req.body,
      timeout + 30000 // Extra buffer for network
    );
    res.json(result);
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

  // ============================================================================
  // Analytics Routes (proxy to TypeScript agent)
  // ============================================================================
  app.post("/api/analytics/event", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/analytics/event", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/analytics/content/:contentId/stats", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/analytics/content/${req.params.contentId}/stats`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/analytics/creator/:userId/performance", async (req: Request, res: Response) => {
    const epochId = req.query.epochId ? `?epochId=${req.query.epochId}` : "";
    const result = await proxyToAgent(AGENT_TS_URL, `/api/analytics/creator/${req.params.userId}/performance${epochId}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/analytics/leaderboard", async (req: Request, res: Response) => {
    const queryParams = new URLSearchParams();
    if (req.query.epochId) queryParams.set("epochId", req.query.epochId as string);
    if (req.query.contentType) queryParams.set("contentType", req.query.contentType as string);
    if (req.query.limit) queryParams.set("limit", req.query.limit as string);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const result = await proxyToAgent(AGENT_TS_URL, `/api/analytics/leaderboard${queryString}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/analytics/epochs", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/analytics/epochs", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/analytics/epochs/current", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/analytics/epochs/current", "GET");
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Rewards Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/rewards/creator/:creatorId/points", async (req: Request, res: Response) => {
    const epochId = req.query.epochId ? `?epochId=${req.query.epochId}` : "";
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/creator/${req.params.creatorId}/points${epochId}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/creator/:creatorId/total", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/creator/${req.params.creatorId}/total`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/creator/:creatorId/rewards", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/creator/${req.params.creatorId}/rewards`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/leaderboard", async (req: Request, res: Response) => {
    const queryParams = new URLSearchParams();
    if (req.query.epochId) queryParams.set("epochId", req.query.epochId as string);
    if (req.query.limit) queryParams.set("limit", req.query.limit as string);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/leaderboard${queryString}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/tiers", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/rewards/tiers", "GET");
    res.status((result as any).status || 200).json(result);
  });

  // Daily Rewards
  app.post("/api/rewards/daily/check", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/rewards/daily/check", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/daily/:userId/today", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/daily/${req.params.userId}/today`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/rewards/daily/:rewardId/claim", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/daily/${req.params.rewardId}/claim`, "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/daily/:userId/history", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/daily/${req.params.userId}/history`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/daily/:userId/streak", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/daily/${req.params.userId}/streak`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/daily/pool", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/rewards/daily/pool", "GET");
    res.status((result as any).status || 200).json(result);
  });

  // Featured Content
  app.get("/api/rewards/featured/today", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/rewards/featured/today", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/rewards/featured/recent", async (req: Request, res: Response) => {
    const days = req.query.days ? `?days=${req.query.days}` : "";
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/featured/recent${days}`, "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/rewards/featured/:featuredId/impression", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/featured/${req.params.featuredId}/impression`, "POST");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/rewards/featured/:featuredId/click", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/rewards/featured/${req.params.featuredId}/click`, "POST");
    res.status((result as any).status || 200).json(result);
  });

  // ============================================================================
  // Admin Routes (proxy to TypeScript agent)
  // ============================================================================
  app.get("/api/admin/rewards/pending", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/admin/rewards/pending", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/rewards/:rewardId/approve", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/admin/rewards/${req.params.rewardId}/approve`, "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/rewards/:rewardId/reject", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/admin/rewards/${req.params.rewardId}/reject`, "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/rewards/:rewardId/distribute", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/admin/rewards/${req.params.rewardId}/distribute`, "POST");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/featured/select", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/admin/featured/select", "POST", req.body);
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/featured/auto-select", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/admin/featured/auto-select", "POST");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/admin/epochs", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/admin/epochs", "GET");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/epochs/rollover", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/admin/epochs/rollover", "POST");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/epochs/initialize", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/admin/epochs/initialize", "POST");
    res.status((result as any).status || 200).json(result);
  });

  app.post("/api/admin/epochs/:epochId/process", async (req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, `/api/admin/epochs/${req.params.epochId}/process`, "POST");
    res.status((result as any).status || 200).json(result);
  });

  app.get("/api/admin/stats", async (_req: Request, res: Response) => {
    const result = await proxyToAgent(AGENT_TS_URL, "/api/admin/stats", "GET");
    res.status((result as any).status || 200).json(result);
  });

  return httpServer;
}
