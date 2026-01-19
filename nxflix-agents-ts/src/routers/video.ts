import { Router, Request, Response } from 'express';
import { VideoCreatorAgent } from '../agents/video-creator.js';
import {
  VideoRendererService,
  CHARACTER_ASSETS,
  BACKGROUND_ASSETS,
} from '../services/video-renderer.js';
import { FFmpegRendererService } from '../services/ffmpeg-renderer.js';
import { JapaneseVoices } from '../services/tts.js';
import {
  getProvidersStatus,
  renderWithFallback,
} from '../services/provider-factory.js';
import {
  VideoProject,
  VideoCreateRequest,
  ScriptGenerateRequest,
  CharacterStyle,
  VideoStyle,
} from '../models/video.js';
import { PipelineConfig } from '../models/pipeline-config.js';

const videoRouter = Router();

// Singleton services
const videoCreator = new VideoCreatorAgent();
const videoRenderer = new VideoRendererService();
const ffmpegRenderer = new FFmpegRendererService();

// In-memory storage for video projects
const videoProjects: Record<string, VideoProject> = {};
const userProjectsIndex: Record<string, string[]> = {};

// Request schemas
const VideoCreateSchema = VideoCreateRequest;
const ScriptGenerateSchema = ScriptGenerateRequest;

// Response types
interface VideoListResponse {
  projects: VideoProject[];
  count: number;
}

interface VideoSingleResponse {
  project: VideoProject;
}

interface VideoStatusResponse {
  status: VideoProject['status'];
  progress: number;
  error?: string;
}

// POST /api/video/create - Start video generation
videoRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const request = VideoCreateSchema.parse(req.body);

    // Create the video project
    const project = await videoCreator.createVideo(request);

    // Store in memory
    videoProjects[project.id] = project;

    // Index by user
    if (!userProjectsIndex[request.userId]) {
      userProjectsIndex[request.userId] = [];
    }
    userProjectsIndex[request.userId].push(project.id);

    res.json({ project } as VideoSingleResponse);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/video/script - Generate just the script (for preview)
videoRouter.post('/script', async (req: Request, res: Response) => {
  try {
    const request = ScriptGenerateSchema.parse(req.body);

    const script = await videoCreator.generateScriptOnly(
      request.prompt,
      request.maxDurationSeconds
    );

    res.json({ script });
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/video/:id - Get project status and details
videoRouter.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const project = videoProjects[req.params.id];
  if (!project) {
    res.status(404).json({ error: 'Video project not found' });
    return;
  }
  res.json({ project } as VideoSingleResponse);
});

// GET /api/video/:id/status - Poll generation status
videoRouter.get('/:id/status', (req: Request<{ id: string }>, res: Response) => {
  const project = videoProjects[req.params.id];
  if (!project) {
    res.status(404).json({ error: 'Video project not found' });
    return;
  }
  res.json({
    status: project.status,
    progress: project.progress,
    error: project.errorMessage,
  } as VideoStatusResponse);
});

// GET /api/video/:id/audio - Stream audio for video
videoRouter.get('/:id/audio', (req: Request<{ id: string }>, res: Response) => {
  const project = videoProjects[req.params.id];
  if (!project) {
    res.status(404).json({ error: 'Video project not found' });
    return;
  }

  if (!project.audioBase64) {
    res.status(404).json({ error: 'Audio not available' });
    return;
  }

  const audioBuffer = Buffer.from(project.audioBase64, 'base64');
  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': audioBuffer.length,
  });
  res.send(audioBuffer);
});

// GET /api/video - List user's video projects
videoRouter.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    // Return all projects (admin view)
    const allProjects = Object.values(videoProjects).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ projects: allProjects, count: allProjects.length } as VideoListResponse);
    return;
  }

  // Return user's projects
  const projectIds = userProjectsIndex[userId] || [];
  const projects = projectIds
    .map((id) => videoProjects[id])
    .filter(Boolean)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  res.json({ projects, count: projects.length } as VideoListResponse);
});

// DELETE /api/video/:id - Delete project
videoRouter.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  const project = videoProjects[req.params.id];
  if (!project) {
    res.status(404).json({ error: 'Video project not found' });
    return;
  }

  // Remove from storage
  delete videoProjects[req.params.id];

  // Remove from user index
  const userProjects = userProjectsIndex[project.userId];
  if (userProjects) {
    const idx = userProjects.indexOf(req.params.id);
    if (idx !== -1) {
      userProjects.splice(idx, 1);
    }
  }

  res.json({ success: true, deletedId: req.params.id });
});

// GET /api/video/styles - Get available character and background styles
videoRouter.get('/meta/styles', (_req: Request, res: Response) => {
  const characters = Object.entries(CHARACTER_ASSETS).map(([id, asset]) => ({
    id: id as CharacterStyle,
    name: asset.name,
    description: asset.description,
    imagePath: asset.imagePath,
  }));

  const backgrounds = Object.entries(BACKGROUND_ASSETS).map(([id, asset]) => ({
    id: id as VideoStyle,
    name: asset.name,
    description: asset.description,
    imagePath: asset.imagePath,
    gradient: asset.gradient,
  }));

  res.json({ characters, backgrounds });
});

// GET /api/video/voices - Get available TTS voices
videoRouter.get('/meta/voices', (_req: Request, res: Response) => {
  const voices = [];

  for (const [provider, providerVoices] of Object.entries(JapaneseVoices)) {
    for (const [id, voice] of Object.entries(providerVoices)) {
      voices.push({
        id,
        name: voice.name,
        gender: voice.gender,
        description: voice.description,
        provider,
      });
    }
  }

  res.json({ voices });
});

// GET /api/video/providers - Get available providers and their status
videoRouter.get('/meta/providers', async (_req: Request, res: Response) => {
  try {
    const providers = await getProvidersStatus();
    res.json(providers);
  } catch (error) {
    console.error('Error getting providers status:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/video/:id/render - Trigger video rendering with FFmpeg
videoRouter.post('/:id/render', async (req: Request<{ id: string }>, res: Response) => {
  const project = videoProjects[req.params.id];
  if (!project) {
    res.status(404).json({ error: 'Video project not found' });
    return;
  }

  try {
    // Update status to generating
    project.status = 'generating';
    project.progress = 25;
    project.updatedAt = new Date().toISOString();

    // Check if FFmpeg is available
    const ffmpegAvailable = await ffmpegRenderer.checkFFmpegAvailable();

    if (ffmpegAvailable) {
      // Render with FFmpeg
      project.progress = 50;
      const renderResult = await ffmpegRenderer.render(project);

      // Update project with results
      project.videoUrl = renderResult.videoUrl;
      project.thumbnailUrl = renderResult.thumbnailUrl;
      project.status = 'ready';
      project.progress = 100;
    } else {
      // Fall back to placeholder renderer
      console.warn('FFmpeg not available, using placeholder renderer');
      const renderResult = await videoRenderer.render(project);
      project.videoUrl = renderResult.videoUrl;
      project.thumbnailUrl = renderResult.thumbnailUrl;
      project.status = 'ready';
      project.progress = 100;
    }

    project.updatedAt = new Date().toISOString();
    res.json({ project } as VideoSingleResponse);
  } catch (error) {
    console.error('Error rendering video:', error);
    project.status = 'failed';
    project.errorMessage = String(error);
    project.updatedAt = new Date().toISOString();
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/video/:id/render-with-provider - Render with specific provider
videoRouter.post('/:id/render-with-provider', async (req: Request<{ id: string }>, res: Response) => {
  const project = videoProjects[req.params.id];
  if (!project) {
    res.status(404).json({ error: 'Video project not found' });
    return;
  }

  const { provider = 'ffmpeg' } = req.body;

  try {
    // Update status to generating
    project.status = 'generating';
    project.progress = 25;
    project.updatedAt = new Date().toISOString();

    // Render with fallback support
    const renderResult = await renderWithFallback(project, provider, ['ffmpeg']);

    // Update project with results
    project.videoUrl = renderResult.videoUrl;
    project.thumbnailUrl = renderResult.thumbnailUrl;
    project.status = 'ready';
    project.progress = 100;
    project.updatedAt = new Date().toISOString();

    res.json({ project } as VideoSingleResponse);
  } catch (error) {
    console.error('Error rendering video:', error);
    project.status = 'failed';
    project.errorMessage = String(error);
    project.updatedAt = new Date().toISOString();
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/video/:id/subtitles - Get subtitle render data with furigana HTML
videoRouter.get('/:id/subtitles', (req: Request<{ id: string }>, res: Response) => {
  const project = videoProjects[req.params.id];
  if (!project) {
    res.status(404).json({ error: 'Video project not found' });
    return;
  }

  const subtitleData = videoRenderer.generateSubtitleRenderData(project.script);
  res.json({ subtitles: subtitleData });
});

// Export router and helper functions
export { videoRouter, videoProjects, userProjectsIndex };

// Helper function to get a video project by ID (for use in other modules)
export function getVideoProject(id: string): VideoProject | undefined {
  return videoProjects[id];
}

// Helper function to update a video project
export function updateVideoProject(
  id: string,
  updates: Partial<VideoProject>
): VideoProject | undefined {
  const project = videoProjects[id];
  if (!project) return undefined;

  const updated = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  videoProjects[id] = updated;
  return updated;
}
