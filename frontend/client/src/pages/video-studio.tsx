import { useState } from 'react';
import {
  useVideoProjects,
  useCreateVideo,
  useVideoStyles,
  useVideoVoices,
  useDeleteVideo,
} from '@/lib/api';
import type {
  VideoProject,
  CharacterStyle,
  VideoStyle,
  VideoCreateRequest,
} from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Video,
  Sparkles,
  Loader2,
  Play,
  Trash2,
  Download,
  Clock,
  Volume2,
  Check,
  AlertCircle,
  Film,
  User,
  Palette,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const USER_ID = 'demo-user'; // TODO: Replace with actual user auth

const characterStyleInfo: Record<CharacterStyle, { name: string; emoji: string }> = {
  anime_female: { name: 'Sakura', emoji: '👧' },
  anime_male: { name: 'Takeshi', emoji: '👦' },
  realistic_female: { name: 'Yuki', emoji: '👩' },
  realistic_male: { name: 'Kenji', emoji: '👨' },
  chibi: { name: 'Chibi-chan', emoji: '🧸' },
  mascot: { name: 'NxFlix-kun', emoji: '🐱' },
  none: { name: 'No Character', emoji: '📝' },
};

const videoStyleInfo: Record<VideoStyle, { name: string; emoji: string }> = {
  classroom: { name: 'Classroom', emoji: '🏫' },
  cafe: { name: 'Cafe', emoji: '☕' },
  nature: { name: 'Nature', emoji: '🌳' },
  abstract: { name: 'Abstract', emoji: '🎨' },
  manga: { name: 'Manga', emoji: '📚' },
};

export default function VideoStudio() {
  const [activeTab, setActiveTab] = useState<'create' | 'projects'>('create');
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const { toast } = useToast();

  // Form states
  const [prompt, setPrompt] = useState('');
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>('anime_female');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('classroom');
  const [voice, setVoice] = useState('shimmer');
  const [maxDuration, setMaxDuration] = useState(60);

  // Queries and mutations
  const { data: projects, isLoading: projectsLoading } = useVideoProjects(USER_ID);
  const { data: stylesData } = useVideoStyles();
  const { data: voicesData } = useVideoVoices();
  const createVideo = useCreateVideo();
  const deleteVideo = useDeleteVideo();

  const handleCreate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Please enter a prompt',
        description: 'Describe the Japanese learning content you want to create.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const request: VideoCreateRequest = {
        prompt,
        userId: USER_ID,
        characterStyle,
        videoStyle,
        voice,
        maxDurationSeconds: maxDuration,
      };

      const result = await createVideo.mutateAsync(request);
      setSelectedProject(result.project);
      setActiveTab('projects');
      toast({
        title: 'Video Created!',
        description: `"${result.project.script.title}" is ready to view.`,
      });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVideo.mutateAsync(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      toast({
        title: 'Deleted',
        description: 'Video project has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <Video className="w-8 h-8 text-primary" />
            Video Studio
          </h1>
          <p className="text-muted-foreground">
            Create short AI videos for Japanese language learning
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel: Creation Form / Project List */}
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="create" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create New
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-2">
                  <Film className="w-4 h-4" />
                  My Videos
                  {projects?.count ? (
                    <span className="ml-1 text-xs bg-muted px-1.5 rounded-full">
                      {projects.count}
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              {/* Create Tab */}
              <TabsContent value="create" className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-base font-medium">
                    What would you like to teach?
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Teach how to order coffee in Japanese, showing polite expressions..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific about the topic, level, and any vocabulary you want to include.
                  </p>
                </div>

                {/* Character Style */}
                <div className="space-y-2">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Character
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(characterStyleInfo).map(([style, info]) => (
                      <button
                        key={style}
                        onClick={() => setCharacterStyle(style as CharacterStyle)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all text-center hover:border-primary/50',
                          characterStyle === style
                            ? 'border-primary bg-primary/10'
                            : 'border-muted'
                        )}
                      >
                        <div className="text-2xl mb-1">{info.emoji}</div>
                        <div className="text-xs truncate">{info.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Style */}
                <div className="space-y-2">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Background
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(videoStyleInfo).map(([style, info]) => (
                      <button
                        key={style}
                        onClick={() => setVideoStyle(style as VideoStyle)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all text-center hover:border-primary/50',
                          videoStyle === style
                            ? 'border-primary bg-primary/10'
                            : 'border-muted'
                        )}
                      >
                        <div className="text-2xl mb-1">{info.emoji}</div>
                        <div className="text-xs truncate">{info.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Voice
                  </Label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voicesData?.voices.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} ({v.gender}) - {v.provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration: {maxDuration}s
                  </Label>
                  <Slider
                    value={[maxDuration]}
                    onValueChange={([v]) => setMaxDuration(v)}
                    min={15}
                    max={60}
                    step={5}
                    className="py-4"
                  />
                  <p className="text-xs text-muted-foreground">
                    Shorter videos are more engaging for learning.
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCreate}
                  disabled={createVideo.isPending || !prompt.trim()}
                >
                  {createVideo.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Video...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Video
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="space-y-4">
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : projects?.projects.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No videos yet</p>
                    <p className="text-sm">Create your first video above!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-auto">
                    {projects?.projects.map((project) => (
                      <Card
                        key={project.id}
                        className={cn(
                          'p-4 cursor-pointer transition-all hover:border-primary/50',
                          selectedProject?.id === project.id && 'border-primary'
                        )}
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {project.script.title}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {project.prompt}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {characterStyleInfo[project.characterStyle].emoji}
                                {characterStyleInfo[project.characterStyle].name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {Math.round(project.script.totalDurationSeconds)}s
                              </span>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded',
                                  project.status === 'ready' && 'bg-green-500/10 text-green-500',
                                  project.status === 'generating' &&
                                    'bg-yellow-500/10 text-yellow-500',
                                  project.status === 'failed' && 'bg-red-500/10 text-red-500'
                                )}
                              >
                                {project.status}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>

          {/* Right Panel: Preview */}
          <Card className="p-6 min-h-[600px]">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              Preview
              {selectedProject?.status === 'ready' && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </h3>

            <AnimatePresence mode="wait">
              {createVideo.isPending ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-4"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">AI Agent Working</p>
                    <p className="text-sm text-muted-foreground">
                      Generating script and audio...
                    </p>
                  </div>
                </motion.div>
              ) : selectedProject ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <VideoPreview project={selectedProject} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-muted-foreground"
                >
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Video className="w-8 h-8" />
                  </div>
                  <p className="text-center">
                    Create a video or select one
                    <br />
                    from your projects to preview.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VideoPreview({ project }: { project: VideoProject }) {
  const [showTranslations, setShowTranslations] = useState(true);

  if (project.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-destructive">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="font-medium">Generation Failed</p>
        <p className="text-sm text-center mt-2">{project.errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title and Info */}
      <div>
        <h4 className="text-lg font-semibold">{project.script.title}</h4>
        {project.script.description && (
          <p className="text-sm text-muted-foreground">{project.script.description}</p>
        )}
      </div>

      {/* Audio Player */}
      {project.audioBase64 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <audio
            controls
            className="w-full"
            src={`data:audio/mpeg;base64,${project.audioBase64}`}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Subtitles with Furigana */}
      <div className="space-y-3 max-h-[300px] overflow-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Script ({project.script.subtitles.length} lines)</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranslations(!showTranslations)}
          >
            {showTranslations ? 'Hide' : 'Show'} Translations
          </Button>
        </div>

        {project.script.subtitles.map((subtitle, index) => (
          <Card key={subtitle.id} className="p-3">
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground shrink-0 w-12">
                {formatTime(subtitle.startTime)}
              </span>
              <div className="flex-1">
                <div className="text-lg leading-loose">
                  <FuriganaText text={subtitle.text} furigana={subtitle.furigana} />
                </div>
                {showTranslations && subtitle.translation && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {subtitle.translation}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Vocabulary and Grammar */}
      <div className="grid grid-cols-2 gap-4">
        {project.script.targetVocabulary.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Vocabulary
            </p>
            <div className="flex flex-wrap gap-1">
              {project.script.targetVocabulary.map((word, i) => (
                <span
                  key={i}
                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        {project.script.grammarPoints.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Grammar
            </p>
            <div className="flex flex-wrap gap-1">
              {project.script.grammarPoints.map((point, i) => (
                <span
                  key={i}
                  className="text-xs bg-secondary/50 px-2 py-0.5 rounded"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
        <span>
          {characterStyleInfo[project.characterStyle].emoji}{' '}
          {characterStyleInfo[project.characterStyle].name}
        </span>
        <span>
          {videoStyleInfo[project.videoStyle].emoji}{' '}
          {videoStyleInfo[project.videoStyle].name}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {Math.round(project.script.totalDurationSeconds)}s
        </span>
      </div>
    </div>
  );
}

function FuriganaText({
  text,
  furigana,
}: {
  text: string;
  furigana: { word: string; reading: string; startIndex: number }[];
}) {
  if (!furigana || furigana.length === 0) {
    return <span>{text}</span>;
  }

  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  // Sort by startIndex
  const sorted = [...furigana].sort((a, b) => a.startIndex - b.startIndex);

  sorted.forEach((f, i) => {
    // Add text before this furigana
    if (f.startIndex > lastIndex) {
      result.push(<span key={`text-${i}`}>{text.slice(lastIndex, f.startIndex)}</span>);
    }

    // Add ruby annotation
    result.push(
      <ruby key={`ruby-${i}`}>
        {f.word}
        <rt className="text-xs text-primary">{f.reading}</rt>
      </ruby>
    );

    lastIndex = f.startIndex + f.word.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <>{result}</>;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
