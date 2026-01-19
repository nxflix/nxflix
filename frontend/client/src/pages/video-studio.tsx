import { useState, useRef } from 'react';
import {
  useCreateVideo,
  useVideoVoices,
} from '@/lib/api';
import type {
  VideoProject,
  CharacterStyle,
  VideoStyle,
  VideoCreateRequest,
} from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Film,
  User,
  Mic,
  FileText,
  Image,
  Music,
  Subtitles,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
  Loader2,
  History,
  Download,
  Share2,
  Plus,
  Minus,
  Move,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Scissors,
  Copy,
  Trash2,
  Search,
  Grid3X3,
  PanelLeftClose,
  PanelLeftOpen,
  Wand2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { VideoWizardDialog } from '@/components/video/video-wizard-dialog';

const USER_ID = 'demo-user';

// Avatar data
const avatars = [
  { id: 'angela', name: 'Angela', style: 'anime_female' as CharacterStyle },
  { id: 'marcus', name: 'Marcus', style: 'anime_male' as CharacterStyle },
  { id: 'yuki', name: 'Yuki', style: 'realistic_female' as CharacterStyle },
  { id: 'david', name: 'David', style: 'realistic_male' as CharacterStyle },
  { id: 'sarah', name: 'Sarah', style: 'chibi' as CharacterStyle },
];

const avatarStyles = ['Professional', 'Casual', 'Animated'];

// Background scenes
const scenes: { id: VideoStyle; name: string; gradient: string }[] = [
  { id: 'classroom', name: 'Office', gradient: 'from-slate-700 to-slate-800' },
  { id: 'abstract', name: 'Studio', gradient: 'from-purple-900/50 to-slate-800' },
  { id: 'cafe', name: 'Home', gradient: 'from-amber-900/30 to-slate-800' },
  { id: 'nature', name: 'Outdoor', gradient: 'from-emerald-900/30 to-slate-800' },
];

// Sidebar navigation icons
const sidebarIcons = [
  { icon: Film, label: 'Studio', active: true },
  { icon: User, label: 'Avatars' },
  { icon: Mic, label: 'Voice' },
  { icon: FileText, label: 'Scripts' },
  { icon: Image, label: 'Media' },
  { icon: Music, label: 'Audio' },
  { icon: Subtitles, label: 'Captions' },
];

export default function VideoStudio() {
  const { toast } = useToast();

  // Panel & dialog state
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Form state
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [avatarStyle, setAvatarStyle] = useState('Professional');
  const [voice, setVoice] = useState('shimmer');
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [script, setScript] = useState('');
  const [selectedScene, setSelectedScene] = useState(scenes[0]);
  const [projectName, setProjectName] = useState('Untitled Project');

  // Preview state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [generatedProject, setGeneratedProject] = useState<VideoProject | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [zoom, setZoom] = useState(100);

  const audioRef = useRef<HTMLAudioElement>(null);

  // API hooks
  const { data: voicesData } = useVideoVoices();
  const createVideo = useCreateVideo();

  const maxDuration = 60;
  const estimatedDuration = Math.min(Math.ceil(script.length / 10), maxDuration);

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast({
        title: 'Script required',
        description: 'Please enter a script for your video.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const request: VideoCreateRequest = {
        prompt: script,
        userId: USER_ID,
        characterStyle: selectedAvatar.style,
        videoStyle: selectedScene.id,
        voice,
        maxDurationSeconds: maxDuration,
      };

      const result = await createVideo.mutateAsync(request);
      setGeneratedProject(result.project);
      toast({
        title: 'Video Generated!',
        description: `"${result.project.script.title}" is ready to preview.`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle generation from wizard dialog
  const handleWizardGenerate = async (request: VideoCreateRequest) => {
    try {
      const result = await createVideo.mutateAsync(request);
      setGeneratedProject(result.project);
      toast({
        title: 'Video Generated!',
        description: `"${result.project.script.title}" is ready to preview.`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const togglePlayback = () => {
    if (audioRef.current && generatedProject?.audioBase64) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)] bg-[#0d0d1a] text-white overflow-hidden">
        {/* Video Wizard Dialog */}
        <VideoWizardDialog
          open={isWizardOpen}
          onOpenChange={setIsWizardOpen}
          onGenerate={handleWizardGenerate}
          isGenerating={createVideo.isPending}
          voices={voicesData?.voices}
        />

        {/* Left Icon Sidebar */}
        <div className="w-14 bg-[#0a0a14] border-r border-white/5 flex flex-col items-center py-4 gap-2">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Grid3X3 className="w-5 h-5" />
          </div>
          {sidebarIcons.map((item, i) => (
            <button
              key={i}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                item.active
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              )}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          <div className="flex-1" />

          {/* Wizard button - always visible in sidebar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-purple-400 hover:text-white hover:bg-purple-600/20 transition-colors"
              >
                <Wand2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Open Wizard</p>
            </TooltipContent>
          </Tooltip>

          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Left Panel - Controls (Collapsible) */}
        <div
          className={cn(
            'bg-[#12121f] border-r border-white/5 flex flex-col overflow-hidden transition-all duration-300',
            isPanelCollapsed ? 'w-0' : 'w-80'
          )}
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between min-w-80">
            <div>
              <h1 className="text-lg font-semibold">Director's Studio</h1>
              <p className="text-sm text-gray-500">Create your AI-powered video clip</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsWizardOpen(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-400 hover:text-white hover:bg-purple-600/20 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Wizard</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsPanelCollapsed(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Collapse Panel</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Step 1: Choose Avatar */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                Choose Avatar
              </h3>
              <span className="text-xs text-gray-500">Step 1</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={cn(
                    'relative rounded-lg overflow-hidden aspect-square bg-gradient-to-br from-purple-900/30 to-slate-800 border-2 transition-all',
                    selectedAvatar.id === avatar.id
                      ? 'border-purple-500 ring-2 ring-purple-500/30'
                      : 'border-transparent hover:border-white/20'
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-300" />
                    </div>
                  </div>
                  {selectedAvatar.id === avatar.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
              <button className="rounded-lg aspect-square bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center hover:border-white/20 transition-colors">
                <Plus className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-2 text-xs text-gray-400">
              {avatars.slice(0, 3).map((avatar) => (
                <span key={avatar.id} className={cn(
                  'w-16 text-center truncate',
                  selectedAvatar.id === avatar.id && 'text-white'
                )}>
                  {avatar.name}
                </span>
              ))}
            </div>

            {/* Avatar Style */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Avatar Style</p>
              <div className="flex gap-2">
                {avatarStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setAvatarStyle(style)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                      avatarStyle === style
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Step 2: Voice & Language */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                Voice & Language
              </h3>
              <span className="text-xs text-gray-500">Step 2</span>
            </div>

            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                {voicesData?.voices.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-white hover:bg-white/10">
                    {v.name} ({v.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Voice Preview */}
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Voice Preview</span>
                <button className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors">
                  <Play className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              <div className="mt-2 h-1 bg-white/10 rounded-full">
                <div className="h-full w-0 bg-purple-500 rounded-full" />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">0:00</div>
            </div>

            {/* Speed & Pitch */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Speed</span>
                  <span className="text-xs text-white">{speed[0].toFixed(1)}x</span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="[&_[role=slider]]:bg-purple-500"
                />
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Pitch</span>
                  <span className="text-xs text-white">{pitch[0]}</span>
                </div>
                <Slider
                  value={pitch}
                  onValueChange={setPitch}
                  min={-10}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:bg-purple-500"
                />
              </div>
            </div>
          </section>

          {/* Step 3: Script */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-400" />
                Script
              </h3>
              <span className="text-xs text-gray-500">Step 3</span>
            </div>

            <div className="relative">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter your script here... AI will help optimize it for better delivery."
                className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none pr-20"
                maxLength={500}
              />
              <button className="absolute bottom-3 right-3 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Enhance
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{script.length} / 500 characters</span>
              <span>~{estimatedDuration}s duration</span>
            </div>
          </section>

          {/* Scene & Background */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Image className="w-4 h-4 text-orange-400" />
                Scene & Background
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedScene(scene)}
                  className={cn(
                    'relative rounded-lg overflow-hidden aspect-video bg-gradient-to-br border-2 transition-all',
                    scene.gradient,
                    selectedScene.id === scene.id
                      ? 'border-purple-500'
                      : 'border-transparent hover:border-white/20'
                  )}
                >
                  <span className="absolute bottom-2 left-2 text-xs font-medium">
                    {scene.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Generate Button */}
        <div className="p-4 border-t border-white/5">
          <Button
            onClick={handleGenerate}
            disabled={createVideo.isPending || !script.trim()}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium"
          >
            {createVideo.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Video
              </>
            )}
          </Button>
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
            <span>~30s to generate</span>
            <span>2 credits</span>
          </div>
        </div>
      </div>

        {/* Main Content - Preview Area */}
        <div className="flex-1 flex flex-col bg-[#0d0d1a] relative">
          {/* Expand Panel Button - Shows when panel is collapsed */}
          {isPanelCollapsed && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsPanelCollapsed(false)}
                    className="w-10 h-10 rounded-lg bg-[#12121f] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shadow-lg"
                  >
                    <PanelLeftOpen className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand Panel</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsWizardOpen(true)}
                    className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white hover:from-purple-500 hover:to-pink-500 transition-colors shadow-lg"
                  >
                    <Wand2 className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Create with Wizard</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Header */}
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-4">
            <div className={cn(isPanelCollapsed && 'ml-24')}>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none"
              />
              <p className="text-xs text-gray-500">Last edited: Just now</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-500">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

        {/* Toolbar */}
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded hover:bg-white/5">
              <Move className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center bg-white/5 rounded-lg">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-2 hover:bg-white/10 rounded-l-lg"
              >
                <Minus className="w-4 h-4 text-gray-400" />
              </button>
              <span className="px-3 text-sm text-gray-300">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-2 hover:bg-white/10 rounded-r-lg"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[
              { device: 'mobile' as const, icon: Smartphone },
              { device: 'tablet' as const, icon: Tablet },
              { device: 'desktop' as const, icon: Monitor },
            ].map(({ device, icon: Icon }) => (
              <button
                key={device}
                onClick={() => setPreviewDevice(device)}
                className={cn(
                  'p-2 rounded transition-colors',
                  previewDevice === device ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div
            className={cn(
              'bg-[#1a1a2e] rounded-2xl border border-white/10 flex flex-col items-center justify-center transition-all',
              previewDevice === 'mobile' && 'w-[280px] h-[500px]',
              previewDevice === 'tablet' && 'w-[400px] h-[300px]',
              previewDevice === 'desktop' && 'w-[600px] h-[340px]'
            )}
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {generatedProject ? (
              <div className="w-full h-full p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-center mb-4">
                  {generatedProject.script.title}
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {generatedProject.script.subtitles.map((sub, i) => (
                    <div key={sub.id} className="text-center">
                      <p className="text-lg">{sub.text}</p>
                      {sub.translation && (
                        <p className="text-sm text-gray-400">{sub.translation}</p>
                      )}
                    </div>
                  ))}
                </div>
                {generatedProject.audioBase64 && (
                  <audio
                    ref={audioRef}
                    src={`data:audio/mpeg;base64,${generatedProject.audioBase64}`}
                    onEnded={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  />
                )}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Grid3X3 className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your Video Preview</h3>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  Configure your avatar, voice, and script then generate to see the magic happen
                </p>
                <div className="flex gap-3 mt-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-xs">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      selectedAvatar ? 'bg-green-500' : 'bg-gray-500'
                    )} />
                    Avatar Ready
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-xs">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      script.trim() ? 'bg-green-500' : 'bg-gray-500'
                    )} />
                    {script.trim() ? 'Script Ready' : 'Add Script'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex justify-center gap-4 py-4">
          <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <SkipBack className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={togglePlayback}
            className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <SkipForward className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Timeline */}
        <div className="h-48 border-t border-white/5 bg-[#0a0a14] pb-16">
          {/* Timeline Header */}
          <div className="h-10 border-b border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Timeline</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded hover:bg-white/5">
                  <Scissors className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-1.5 rounded hover:bg-white/5">
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-1.5 rounded hover:bg-white/5">
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {formatTime(currentTime)} / {formatTime(generatedProject?.script.totalDurationSeconds || 0)}
              </span>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={50}
                  max={200}
                  className="w-24 [&_[role=slider]]:bg-white"
                />
                <Search className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Timeline Ruler */}
          <div className="h-6 border-b border-white/5 flex items-end px-4 ml-20">
            {[0, 5, 10, 15, 20].map((sec) => (
              <div key={sec} className="flex-1 text-xs text-gray-500 border-l border-white/10 pl-1">
                {sec}s
              </div>
            ))}
          </div>

          {/* Timeline Tracks */}
          <div className="px-4 py-2 space-y-2">
            {/* Video Track */}
            <div className="flex items-center gap-3">
              <div className="w-16 flex items-center gap-2 text-xs text-gray-400">
                <Film className="w-4 h-4 text-purple-400" />
                Video
              </div>
              <div className="flex-1 h-8 bg-white/5 rounded overflow-hidden">
                {generatedProject ? (
                  <div className="h-full bg-purple-600/30 border border-purple-500/50 rounded flex items-center px-2">
                    <span className="text-xs truncate">{generatedProject.script.title}</span>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-xs text-gray-500">Empty - Generate to populate</span>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Track */}
            <div className="flex items-center gap-3">
              <div className="w-16 flex items-center gap-2 text-xs text-gray-400">
                <Music className="w-4 h-4 text-blue-400" />
                Audio
              </div>
              <div className="flex-1 h-8 bg-white/5 rounded">
                {generatedProject?.audioBase64 && (
                  <div className="h-full bg-blue-600/20 border border-blue-500/50 rounded" />
                )}
              </div>
            </div>

            {/* Captions Track */}
            <div className="flex items-center gap-3">
              <div className="w-16 flex items-center gap-2 text-xs text-gray-400">
                <Subtitles className="w-4 h-4 text-green-400" />
                Captions
              </div>
              <div className="flex-1 h-8 bg-white/5 rounded">
                {generatedProject && (
                  <div className="h-full flex gap-1 p-1">
                    {generatedProject.script.subtitles.map((sub, i) => (
                      <div
                        key={sub.id}
                        className="h-full bg-green-600/20 border border-green-500/50 rounded flex-1"
                        title={sub.text}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
