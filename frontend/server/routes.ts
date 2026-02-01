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

  // ============================================================================
  // Pods Routes (direct database access)
  // ============================================================================

  const { db, pods, podMembers, checkIns, userProfiles, users, weeklyReviews, podInvites } = await import("./db");
  const { eq, and, desc, gte, sql } = await import("drizzle-orm");

  // Create a new pod
  app.post("/api/pods", async (req: Request, res: Response) => {
    try {
      const { name, description, jlptLevel, targetExam, dailyCommitment, maxMembers, joinType, leaderId, rules } = req.body;

      if (!name || !jlptLevel || !targetExam || !dailyCommitment || !leaderId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create the pod
      const [newPod] = await db.insert(pods).values({
        name,
        description,
        jlptLevel,
        targetExam: new Date(targetExam),
        dailyCommitment,
        maxMembers: maxMembers || 8,
        joinType: joinType || "request",
        leaderId,
        rules: rules || {
          requireDailyCheckIn: true,
          requireProof: false,
          minStudyMinutes: 0,
          autoRemoveInactiveDays: null,
          weeklyReviewDay: 0,
        },
      }).returning();

      // Add the leader as a member
      await db.insert(podMembers).values({
        podId: newPod.id,
        userId: leaderId,
        role: "leader",
        status: "active",
      });

      res.status(201).json(newPod);
    } catch (error) {
      console.error("Error creating pod:", error);
      res.status(500).json({ error: "Failed to create pod" });
    }
  });

  // List all pods (with optional filters)
  app.get("/api/pods", async (req: Request, res: Response) => {
    try {
      const { jlptLevel, hasSpace } = req.query;

      let query = db.select().from(pods);

      const allPods = await query.orderBy(desc(pods.createdAt));

      // Filter in JS for now (could optimize with SQL later)
      let filtered = allPods;
      if (jlptLevel) {
        filtered = filtered.filter(p => p.jlptLevel === jlptLevel);
      }
      if (hasSpace === "true") {
        filtered = filtered.filter(p => p.memberCount < p.maxMembers);
      }

      res.json(filtered);
    } catch (error) {
      console.error("Error listing pods:", error);
      res.status(500).json({ error: "Failed to list pods" });
    }
  });

  // Get a single pod by ID
  app.get("/api/pods/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const [pod] = await db.select().from(pods).where(eq(pods.id, id));

      if (!pod) {
        return res.status(404).json({ error: "Pod not found" });
      }

      // Get members with user info
      const members = await db
        .select({
          id: podMembers.id,
          userId: podMembers.userId,
          role: podMembers.role,
          status: podMembers.status,
          currentStreak: podMembers.currentStreak,
          longestStreak: podMembers.longestStreak,
          totalCheckIns: podMembers.totalCheckIns,
          totalStudyMinutes: podMembers.totalStudyMinutes,
          joinedAt: podMembers.joinedAt,
          lastCheckInDate: podMembers.lastCheckInDate,
          username: users.username,
        })
        .from(podMembers)
        .leftJoin(users, eq(podMembers.userId, users.id))
        .where(eq(podMembers.podId, id));

      res.json({ ...pod, members });
    } catch (error) {
      console.error("Error getting pod:", error);
      res.status(500).json({ error: "Failed to get pod" });
    }
  });

  // Get pod members
  app.get("/api/pods/:id/members", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const members = await db
        .select({
          id: podMembers.id,
          userId: podMembers.userId,
          role: podMembers.role,
          status: podMembers.status,
          currentStreak: podMembers.currentStreak,
          longestStreak: podMembers.longestStreak,
          totalCheckIns: podMembers.totalCheckIns,
          totalStudyMinutes: podMembers.totalStudyMinutes,
          joinedAt: podMembers.joinedAt,
          lastCheckInDate: podMembers.lastCheckInDate,
          username: users.username,
        })
        .from(podMembers)
        .leftJoin(users, eq(podMembers.userId, users.id))
        .where(eq(podMembers.podId, id));

      res.json(members);
    } catch (error) {
      console.error("Error getting pod members:", error);
      res.status(500).json({ error: "Failed to get pod members" });
    }
  });

  // Join a pod
  app.post("/api/pods/:id/join", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { userId, introMessage } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Check if pod exists and has space
      const [pod] = await db.select().from(pods).where(eq(pods.id, id));
      if (!pod) {
        return res.status(404).json({ error: "Pod not found" });
      }
      if (pod.memberCount >= pod.maxMembers) {
        return res.status(400).json({ error: "Pod is full" });
      }

      // Check if user is already a member
      const [existingMember] = await db
        .select()
        .from(podMembers)
        .where(and(eq(podMembers.podId, id), eq(podMembers.userId, userId)));

      if (existingMember) {
        return res.status(400).json({ error: "User is already a member of this pod" });
      }

      // Determine status based on join type
      const status = pod.joinType === "open" ? "active" : "pending";

      // Add member
      const [newMember] = await db.insert(podMembers).values({
        podId: id,
        userId,
        role: "member",
        status,
        introMessage,
      }).returning();

      // Update member count if active
      if (status === "active") {
        await db
          .update(pods)
          .set({ memberCount: pod.memberCount + 1 })
          .where(eq(pods.id, id));
      }

      res.status(201).json(newMember);
    } catch (error) {
      console.error("Error joining pod:", error);
      res.status(500).json({ error: "Failed to join pod" });
    }
  });

  // Leave a pod
  app.post("/api/pods/:id/leave", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Check if user is a member
      const [member] = await db
        .select()
        .from(podMembers)
        .where(and(eq(podMembers.podId, id), eq(podMembers.userId, userId)));

      if (!member) {
        return res.status(404).json({ error: "User is not a member of this pod" });
      }

      // Can't leave if you're the leader
      if (member.role === "leader") {
        return res.status(400).json({ error: "Leaders cannot leave. Transfer leadership first." });
      }

      // Remove member
      await db
        .delete(podMembers)
        .where(and(eq(podMembers.podId, id), eq(podMembers.userId, userId)));

      // Update member count
      const [pod] = await db.select().from(pods).where(eq(pods.id, id));
      if (pod && member.status === "active") {
        await db
          .update(pods)
          .set({ memberCount: Math.max(0, pod.memberCount - 1) })
          .where(eq(pods.id, id));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving pod:", error);
      res.status(500).json({ error: "Failed to leave pod" });
    }
  });

  // Daily check-in
  app.post("/api/pods/:id/check-in", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { userId, studyMinutes, mood, studyTags, proofType, proofContent, reflection } = req.body;

      if (!userId || !studyMinutes || !mood) {
        return res.status(400).json({ error: "User ID, study minutes, and mood are required" });
      }

      // Check if user is an active member
      const [member] = await db
        .select()
        .from(podMembers)
        .where(and(eq(podMembers.podId, id), eq(podMembers.userId, userId), eq(podMembers.status, "active")));

      if (!member) {
        return res.status(404).json({ error: "User is not an active member of this pod" });
      }

      // Check if already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [existingCheckIn] = await db
        .select()
        .from(checkIns)
        .where(
          and(
            eq(checkIns.podId, id),
            eq(checkIns.userId, userId),
            gte(checkIns.date, today)
          )
        );

      if (existingCheckIn) {
        return res.status(400).json({ error: "Already checked in today" });
      }

      // Calculate streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = 1;
      if (member.lastCheckInDate) {
        const lastDate = new Date(member.lastCheckInDate);
        lastDate.setHours(0, 0, 0, 0);
        if (lastDate.getTime() === yesterday.getTime()) {
          newStreak = member.currentStreak + 1;
        }
      }

      // Create check-in
      const [checkIn] = await db.insert(checkIns).values({
        podId: id,
        userId,
        date: today,
        studyMinutes,
        mood,
        studyTags: studyTags || [],
        proofType,
        proofContent,
        reflection,
        streakDay: newStreak,
      }).returning();

      // Update member stats
      const newLongestStreak = Math.max(member.longestStreak, newStreak);
      await db
        .update(podMembers)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          totalCheckIns: member.totalCheckIns + 1,
          totalStudyMinutes: member.totalStudyMinutes + studyMinutes,
          lastCheckInDate: today,
        })
        .where(eq(podMembers.id, member.id));

      res.status(201).json({
        checkIn,
        streak: newStreak,
        longestStreak: newLongestStreak,
      });
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  // Get check-ins for a pod (today or date range)
  app.get("/api/pods/:id/check-ins", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { date, startDate, endDate } = req.query;

      let query = db
        .select({
          id: checkIns.id,
          userId: checkIns.userId,
          date: checkIns.date,
          studyMinutes: checkIns.studyMinutes,
          mood: checkIns.mood,
          studyTags: checkIns.studyTags,
          reflection: checkIns.reflection,
          streakDay: checkIns.streakDay,
          createdAt: checkIns.createdAt,
          username: users.username,
        })
        .from(checkIns)
        .leftJoin(users, eq(checkIns.userId, users.id))
        .where(eq(checkIns.podId, id))
        .orderBy(desc(checkIns.createdAt));

      const results = await query;

      // Filter by date in JS (could optimize with SQL)
      let filtered = results;
      if (date) {
        const targetDate = new Date(date as string);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        filtered = results.filter(c => {
          const checkInDate = new Date(c.date);
          return checkInDate >= targetDate && checkInDate < nextDay;
        });
      }

      res.json(filtered);
    } catch (error) {
      console.error("Error getting check-ins:", error);
      res.status(500).json({ error: "Failed to get check-ins" });
    }
  });

  // Get user's pods
  app.get("/api/users/:userId/pods", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;

      const userPods = await db
        .select({
          pod: pods,
          membership: podMembers,
        })
        .from(podMembers)
        .innerJoin(pods, eq(podMembers.podId, pods.id))
        .where(and(eq(podMembers.userId, userId), eq(podMembers.status, "active")));

      res.json(userPods);
    } catch (error) {
      console.error("Error getting user pods:", error);
      res.status(500).json({ error: "Failed to get user pods" });
    }
  });

  // Approve a pending member (leader only)
  app.post("/api/pods/:id/members/:memberId/approve", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const memberId = req.params.memberId as string;
      const { leaderId } = req.body;

      // Verify requester is the leader
      const [leader] = await db
        .select()
        .from(podMembers)
        .where(and(eq(podMembers.podId, id), eq(podMembers.userId, leaderId), eq(podMembers.role, "leader")));

      if (!leader) {
        return res.status(403).json({ error: "Only the pod leader can approve members" });
      }

      // Get the pending member
      const [member] = await db
        .select()
        .from(podMembers)
        .where(and(eq(podMembers.id, memberId), eq(podMembers.status, "pending")));

      if (!member) {
        return res.status(404).json({ error: "Pending member not found" });
      }

      // Check pod capacity
      const [pod] = await db.select().from(pods).where(eq(pods.id, id));
      if (pod && pod.memberCount >= pod.maxMembers) {
        return res.status(400).json({ error: "Pod is full" });
      }

      // Approve member
      await db
        .update(podMembers)
        .set({ status: "active" })
        .where(eq(podMembers.id, memberId));

      // Update member count
      if (pod) {
        await db
          .update(pods)
          .set({ memberCount: pod.memberCount + 1 })
          .where(eq(pods.id, id));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error approving member:", error);
      res.status(500).json({ error: "Failed to approve member" });
    }
  });

  return httpServer;
}
