import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Beaker,
  Upload,
  Play,
  Pause,
  Image as ImageIcon,
  Video,
  Mic,
  Sparkles,
  Loader2,
  RefreshCw,
  Download,
  Settings2,
  Wand2,
  User,
  Film,
  Layers,
  Zap,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Languages,
  Type,
  GraduationCap,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  useGrammar,
  useVocabulary,
  useKanji,
  useAnimationConfig,
  useGenerateAnimation,
  useAnimationStatus,
  useGenerateAnimationScript,
  useGenerateAIVideo,
  useAIVideoStatus,
} from '@/lib/api';
import type { GrammarPoint, VocabularyItem, KanjiItem } from '@/lib/api-types';
import type { AnimationResult, HollywoodScript, ScriptScene, ScriptLine, AIVideoResult } from '@/lib/api';

// Experiment types
type ExperimentType = 'live2d' | 'ai-video' | 'talking-head' | 'sd-animation';

interface ExperimentResult {
  id: string;
  type: ExperimentType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputImage?: string;
  outputUrl?: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
  error?: string;
}

// Provider configurations
const AI_VIDEO_PROVIDERS = [
  { id: 'kling', name: 'Kling AI', status: 'available', description: 'High-quality anime video generation' },
  { id: 'minimax', name: 'Minimax (Hailuo)', status: 'available', description: 'Character-focused video' },
  { id: 'runway', name: 'Runway Gen-3', status: 'available', description: 'Professional quality' },
  { id: 'pika', name: 'Pika Labs', status: 'available', description: 'Quick anime clips' },
  { id: 'vidu', name: 'Vidu', status: 'coming_soon', description: 'Character consistency' },
];

const TALKING_HEAD_PROVIDERS = [
  { id: 'hedra', name: 'Hedra', status: 'available', description: 'Character video from image + audio' },
  { id: 'd-id', name: 'D-ID', status: 'available', description: 'Digital human animation' },
  { id: 'heygen', name: 'HeyGen', status: 'available', description: 'AI video avatars with lip-sync' },
  { id: 'sync-labs', name: 'Sync Labs', status: 'available', description: 'Lip-sync any video' },
];

const SD_ANIMATION_METHODS = [
  { id: 'animatediff', name: 'AnimateDiff', description: 'Motion modules for Stable Diffusion' },
  { id: 'deforum', name: 'Deforum', description: 'Keyframe-based animation' },
  { id: 'ebsynth', name: 'EbSynth', description: 'Style transfer between frames' },
  { id: 'comfyui', name: 'ComfyUI Workflows', description: 'Node-based animation pipelines' },
];

const ANIME_STYLES = [
  { id: 'modern', name: 'Modern Anime', preview: 'from-pink-500 to-purple-600' },
  { id: 'ghibli', name: 'Ghibli Style', preview: 'from-green-400 to-blue-500' },
  { id: 'shonen', name: 'Shonen Action', preview: 'from-orange-500 to-red-600' },
  { id: 'slice-of-life', name: 'Slice of Life', preview: 'from-yellow-400 to-pink-400' },
  { id: 'chibi', name: 'Chibi/Cute', preview: 'from-pink-400 to-purple-400' },
];

// Sample talent/actors for casting (like a talent agency roster)
// Using PNG format with realistic avatars - Hedra requires raster images, not SVG
const SAMPLE_CHARACTERS = [
  {
    id: 'aoi-talent',
    name: 'Aoi',
    description: 'Lead actress',
    tags: ['Drama', 'Romance'],
    // Using notionists-neutral for more realistic faces (PNG format)
    imageUrl: 'https://api.dicebear.com/7.x/notionists-neutral/png?seed=AoiActress&backgroundColor=ffd5dc&size=256',
  },
  {
    id: 'ren-talent',
    name: 'Ren',
    description: 'Lead actor',
    tags: ['Action', 'Thriller'],
    imageUrl: 'https://api.dicebear.com/7.x/notionists-neutral/png?seed=RenActor&backgroundColor=c0aede&size=256',
  },
  {
    id: 'hana-talent',
    name: 'Hana',
    description: 'Supporting actress',
    tags: ['Comedy', 'Slice of Life'],
    imageUrl: 'https://api.dicebear.com/7.x/notionists-neutral/png?seed=HanaSupport&backgroundColor=b6e3f4&size=256',
  },
  {
    id: 'kai-talent',
    name: 'Kai',
    description: 'Character actor',
    tags: ['Mystery', 'Horror'],
    imageUrl: 'https://api.dicebear.com/7.x/notionists-neutral/png?seed=KaiCharacter&backgroundColor=d1d4f9&size=256',
  },
  {
    id: 'yuki-talent',
    name: 'Yuki',
    description: 'Narrator',
    tags: ['Documentary', 'Educational'],
    imageUrl: 'https://api.dicebear.com/7.x/notionists-neutral/png?seed=YukiNarrator&backgroundColor=ffeaa7&size=256',
  },
  {
    id: 'sora-talent',
    name: 'Sora',
    description: 'Voice actor',
    tags: ['Animation', 'Fantasy'],
    imageUrl: 'https://api.dicebear.com/7.x/notionists-neutral/png?seed=SoraVoice&backgroundColor=a3e4d7&size=256',
  },
];

// Scene/Genre types for video generation
const SCENE_GENRES = [
  { id: 'slice-of-life', name: 'Slice of Life', description: 'Everyday conversations and situations' },
  { id: 'drama', name: 'Drama', description: 'Emotional scenes with conflict' },
  { id: 'comedy', name: 'Comedy', description: 'Humorous interactions' },
  { id: 'romance', name: 'Romance', description: 'Romantic dialogue and confessions' },
  { id: 'action', name: 'Action', description: 'Intense confrontations' },
  { id: 'mystery', name: 'Mystery', description: 'Investigative dialogue' },
  { id: 'educational', name: 'Educational', description: 'Direct teaching style' },
  { id: 'business', name: 'Business', description: 'Formal/keigo conversations' },
];

export default function AnimationLab() {
  const { toast } = useToast();

  // Fetch learning content from API
  const { data: grammarData, isLoading: grammarLoading } = useGrammar();
  const { data: vocabularyData, isLoading: vocabLoading } = useVocabulary();
  const { data: kanjiData, isLoading: kanjiLoading } = useKanji();

  // Animation API hooks
  const { data: animationConfig } = useAnimationConfig();
  const generateAnimation = useGenerateAnimation();
  const generateScript = useGenerateAnimationScript();
  const generateAIVideo = useGenerateAIVideo();

  // Script state
  const [generatedScript, setGeneratedScript] = useState<HollywoodScript | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [showScriptPanel, setShowScriptPanel] = useState(false);

  // General state
  const [activeTab, setActiveTab] = useState<ExperimentType>('ai-video');
  const [experiments, setExperiments] = useState<ExperimentResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<string>('d-id');
  const [currentJobType, setCurrentJobType] = useState<'talking-head' | 'ai-video'>('talking-head');

  // Poll for status when we have a job - talking head
  const { data: animationStatus } = useAnimationStatus(
    currentJobId || '',
    !!currentJobId && currentJobType === 'talking-head',
    currentProvider
  );

  // Poll for status when we have a job - AI video
  const { data: aiVideoStatus } = useAIVideoStatus(
    currentJobId || '',
    !!currentJobId && currentJobType === 'ai-video'
  );

  // Handle animation status updates (talking-head)
  useEffect(() => {
    if (animationStatus && currentJobId && currentJobType === 'talking-head') {
      // Update the experiment in the list
      setExperiments(prev => prev.map(exp =>
        exp.id === currentJobId
          ? {
              ...exp,
              status: animationStatus.status as ExperimentResult['status'],
              outputUrl: animationStatus.videoUrl,
              error: animationStatus.error,
            }
          : exp
      ));

      // Show toast on completion
      if (animationStatus.status === 'completed') {
        toast({
          title: 'Animation Complete',
          description: 'Your talking head video is ready!',
        });
        setIsProcessing(false);
      } else if (animationStatus.status === 'failed') {
        toast({
          title: 'Animation Failed',
          description: animationStatus.error || 'Unknown error occurred',
          variant: 'destructive',
        });
        setIsProcessing(false);
        setCurrentJobId(null);
      }
    }
  }, [animationStatus, currentJobId, currentJobType, toast]);

  // Handle AI video status updates (Runway)
  useEffect(() => {
    if (aiVideoStatus && currentJobId && currentJobType === 'ai-video') {
      // Update the experiment in the list
      setExperiments(prev => prev.map(exp =>
        exp.id === currentJobId
          ? {
              ...exp,
              status: aiVideoStatus.status as ExperimentResult['status'],
              outputUrl: aiVideoStatus.videoUrl,
              error: aiVideoStatus.error,
            }
          : exp
      ));

      // Show toast on completion
      if (aiVideoStatus.status === 'completed') {
        toast({
          title: 'AI Video Complete',
          description: 'Your AI-generated video is ready!',
        });
        setIsProcessing(false);
      } else if (aiVideoStatus.status === 'failed') {
        toast({
          title: 'AI Video Generation Failed',
          description: aiVideoStatus.error || 'Unknown error occurred',
          variant: 'destructive',
        });
        setIsProcessing(false);
        setCurrentJobId(null);
      }
    }
  }, [aiVideoStatus, currentJobId, currentJobType, toast]);

  // Learning content selection
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarPoint[]>([]);
  const [selectedVocabulary, setSelectedVocabulary] = useState<VocabularyItem[]>([]);
  const [selectedKanji, setSelectedKanji] = useState<KanjiItem[]>([]);
  const [sceneGenre, setSceneGenre] = useState('slice-of-life');
  const [sceneContext, setSceneContext] = useState('');

  // Input states
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');
  const [sampleText, setSampleText] = useState('こんにちは、私はあなたの日本語の先生です。今日は一緒に勉強しましょう。');

  // Toggle grammar selection
  const toggleGrammar = (grammar: GrammarPoint) => {
    setSelectedGrammar(prev =>
      prev.find(g => g.id === grammar.id)
        ? prev.filter(g => g.id !== grammar.id)
        : [...prev, grammar]
    );
  };

  // Toggle vocabulary selection
  const toggleVocabulary = (vocab: VocabularyItem) => {
    setSelectedVocabulary(prev =>
      prev.find(v => v.id === vocab.id)
        ? prev.filter(v => v.id !== vocab.id)
        : [...prev, vocab]
    );
  };

  // Toggle kanji selection
  const toggleKanji = (kanji: KanjiItem) => {
    setSelectedKanji(prev =>
      prev.find(k => k.id === kanji.id)
        ? prev.filter(k => k.id !== kanji.id)
        : [...prev, kanji]
    );
  };

  // Generate Hollywood-style script from selected content
  const handleGenerateScript = async () => {
    if (selectedGrammar.length === 0 && selectedVocabulary.length === 0 && selectedKanji.length === 0) {
      toast({
        title: 'No Content Selected',
        description: 'Please select at least some grammar, vocabulary, or kanji to generate a script.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingScript(true);
    toast({
      title: 'Generating Script',
      description: 'Creating a Hollywood-style screenplay for your learning content...',
    });

    try {
      const result = await generateScript.mutateAsync({
        grammar: selectedGrammar.map(g => ({
          pattern: g.pattern,
          meaning: g.meaning,
          example: g.example,
        })),
        vocabulary: selectedVocabulary.map(v => ({
          word: v.word,
          reading: v.reading,
          meaning: v.meanings[0],
        })),
        kanji: selectedKanji.map(k => ({
          character: k.character,
          meaning: k.meanings[0],
          readings: [...(k.onyomi || []), ...(k.kunyomi || [])],
        })),
        genre: sceneGenre,
        context: sceneContext || undefined,
        targetDuration: 60,
        characterCount: 2,
        level: 'JLPT N1',
      });

      if (result.success && result.script) {
        setGeneratedScript(result.script);
        setShowScriptPanel(true);
        toast({
          title: 'Script Generated',
          description: `"${result.script.title}" - ${result.script.scenes.length} scene(s) ready`,
        });
      } else {
        throw new Error('Failed to generate script');
      }
    } catch (error) {
      console.error('Script generation error:', error);
      toast({
        title: 'Script Generation Failed',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Extract all dialogue from script for speech
  const getScriptDialogue = (script: HollywoodScript, characterId?: string): string => {
    const lines: string[] = [];
    for (const scene of script.scenes) {
      for (const line of scene.lines) {
        if (line.type === 'dialogue') {
          if (!characterId || line.characterId === characterId) {
            lines.push(line.japanese);
          }
        }
      }
    }
    return lines.join('\n');
  };

  // Use first dialogue line from script
  const useDialogueFromScript = (line: ScriptLine) => {
    setSampleText(line.japanese);
    toast({
      title: 'Dialogue Selected',
      description: 'The dialogue has been set as your speech text.',
    });
  };

  // Generate AI Video prompt from script
  const generateVideoPromptFromScript = (script: HollywoodScript, sceneIndex: number = 0): string => {
    const scene = script.scenes[sceneIndex];
    if (!scene) return '';

    const parts: string[] = [];

    // Add scene setting
    parts.push(`Scene: ${scene.location}`);
    parts.push(`Setting: ${scene.description}`);

    // Add character descriptions
    const sceneCharacterIds = new Set(
      scene.lines
        .filter(l => l.type === 'dialogue' && l.characterId)
        .map(l => l.characterId)
    );
    const sceneCharacters = script.characters.filter(c => sceneCharacterIds.has(c.id));
    if (sceneCharacters.length > 0) {
      parts.push(`Characters: ${sceneCharacters.map(c => `${c.name} (${c.description})`).join(', ')}`);
    }

    // Add action descriptions
    const actions = scene.lines.filter(l => l.type === 'action').map(l => l.english);
    if (actions.length > 0) {
      parts.push(`Actions: ${actions.join('. ')}`);
    }

    // Add style hints
    parts.push(`Style: Anime, ${script.genre}, Japanese language learning video`);
    parts.push(`Mood: Educational yet engaging, natural conversation`);

    return parts.join('\n');
  };

  // Use script for AI Video generation
  const useScriptForVideoGen = (sceneIndex: number = 0) => {
    if (!generatedScript) return;

    const prompt = generateVideoPromptFromScript(generatedScript, sceneIndex);
    setPromptText(prompt);
    setActiveTab('ai-video');

    toast({
      title: 'Script Applied to AI Video',
      description: `Scene ${sceneIndex + 1} has been converted to a video prompt.`,
    });
  };

  // AI Video settings
  const [aiVideoProvider, setAiVideoProvider] = useState('kling');
  const [videoDuration, setVideoDuration] = useState([5]);
  const [animeStyle, setAnimeStyle] = useState('modern');
  const [motionIntensity, setMotionIntensity] = useState([50]);

  // Talking Head settings
  const [talkingHeadProvider, setTalkingHeadProvider] = useState('hedra');
  const [voiceId, setVoiceId] = useState('ja-female-1');
  const [expressionIntensity, setExpressionIntensity] = useState([70]);

  // SD Animation settings
  const [sdMethod, setSdMethod] = useState('animatediff');
  const [frameCount, setFrameCount] = useState([24]);
  const [motionModule, setMotionModule] = useState('mm_sd_v15_v2');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runExperiment = async () => {
    // Check if D-ID is configured for talking-head
    if (activeTab === 'talking-head') {
      const didConfigured = animationConfig?.providers?.did?.configured;
      const hedraConfigured = animationConfig?.providers?.hedra?.configured;

      if (!didConfigured && !hedraConfigured) {
        toast({
          title: 'No Video Provider Configured',
          description: 'Set DID_API_KEY or HEDRA_API_KEY in your environment to enable talking head generation.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Require image for talking-head
    if (activeTab === 'talking-head' && !referenceImage) {
      toast({
        title: 'Image Required',
        description: 'Please upload a portrait image for the talking head animation.',
        variant: 'destructive',
      });
      return;
    }

    // Require text for talking-head
    if (activeTab === 'talking-head' && !sampleText.trim()) {
      toast({
        title: 'Text Required',
        description: 'Please enter Japanese text for the character to speak.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    const experimentId = `exp-${Date.now()}`;
    const newExperiment: ExperimentResult = {
      id: experimentId,
      type: activeTab,
      status: 'processing',
      inputImage: referenceImage || undefined,
      parameters: {
        provider: activeTab === 'ai-video' ? aiVideoProvider :
                  activeTab === 'talking-head' ? talkingHeadProvider : sdMethod,
        prompt: promptText,
        text: sampleText,
        style: animeStyle,
        duration: videoDuration[0],
        grammarPoints: selectedGrammar.map(g => ({ id: g.id, pattern: g.pattern, meaning: g.meaning })),
        vocabulary: selectedVocabulary.map(v => ({ id: v.id, word: v.word, meaning: v.meanings[0] })),
        kanji: selectedKanji.map(k => ({ id: k.id, character: k.character, meaning: k.meanings[0] })),
        sceneGenre,
        sceneContext,
      },
      timestamp: new Date(),
    };

    setExperiments(prev => [newExperiment, ...prev]);

    // Use D-ID or Hedra API for talking-head
    if (activeTab === 'talking-head') {
      const useDidProvider = animationConfig?.providers?.did?.configured;
      const providerName = useDidProvider ? 'D-ID' : 'Hedra';

      toast({
        title: 'Generating Animation',
        description: `Using ${providerName} to create your talking head video...`,
      });

      try {
        // Extract base64 from data URL
        const imageBase64 = referenceImage!.split(',')[1] || referenceImage!;

        const result = await generateAnimation.mutateAsync({
          image: imageBase64,
          text: sampleText,
          provider: useDidProvider ? 'd-id' : 'hedra',
          ttsProvider: 'microsoft', // D-ID works well with Microsoft voices
          voiceId: voiceId === 'ja-female-1' ? 'ja-JP-NanamiNeural' :
                   voiceId === 'ja-female-2' ? 'ja-JP-AoiNeural' :
                   voiceId === 'ja-male-1' ? 'ja-JP-KeitaNeural' :
                   'ja-JP-DaichiNeural',
          waitForCompletion: false,
        });

        if (result.success && result.jobId) {
          // Update experiment with job ID
          setExperiments(prev => prev.map(exp =>
            exp.id === experimentId
              ? { ...exp, id: result.jobId }
              : exp
          ));
          setCurrentJobId(result.jobId);
          setCurrentProvider(result.provider || (useDidProvider ? 'd-id' : 'hedra'));
          setCurrentJobType('talking-head');

          toast({
            title: 'Processing',
            description: `Video generation started with ${providerName}. This may take 1-2 minutes...`,
          });
        } else {
          throw new Error(result.error || 'Failed to start generation');
        }
      } catch (error) {
        console.error('Animation generation error:', error);
        setExperiments(prev => prev.map(exp =>
          exp.id === experimentId
            ? { ...exp, status: 'failed' as const, error: String(error) }
            : exp
        ));
        setIsProcessing(false);
        toast({
          title: 'Generation Failed',
          description: String(error),
          variant: 'destructive',
        });
      }
    } else if (activeTab === 'ai-video') {
      // AI Video Generation with Runway ML
      const runwayConfigured = animationConfig?.providers?.runway?.configured;

      if (!runwayConfigured) {
        toast({
          title: 'Runway API Not Configured',
          description: 'Set RUNWAY_API_KEY in your environment to enable AI video generation.',
          variant: 'destructive',
        });
        setExperiments(prev => prev.map(exp =>
          exp.id === experimentId
            ? { ...exp, status: 'failed' as const, error: 'Runway API not configured' }
            : exp
        ));
        setIsProcessing(false);
        return;
      }

      if (!promptText.trim()) {
        toast({
          title: 'Prompt Required',
          description: 'Please enter a scene description for AI video generation.',
          variant: 'destructive',
        });
        setExperiments(prev => prev.map(exp =>
          exp.id === experimentId
            ? { ...exp, status: 'failed' as const, error: 'No prompt provided' }
            : exp
        ));
        setIsProcessing(false);
        return;
      }

      toast({
        title: 'Generating AI Video',
        description: 'Using Runway ML to create your video...',
      });

      try {
        // Prepare the request
        const aiVideoRequest: {
          prompt: string;
          duration: '5' | '10';
          ratio: '16:9' | '9:16' | '1:1';
          waitForCompletion: boolean;
          image?: string;
          imageIsUrl?: boolean;
        } = {
          prompt: promptText,
          duration: videoDuration[0] <= 5 ? '5' : '10',
          ratio: '9:16', // Vertical for mobile/shorts
          waitForCompletion: false,
        };

        // Include reference image if provided
        if (referenceImage) {
          if (referenceImage.startsWith('http')) {
            aiVideoRequest.image = referenceImage;
            aiVideoRequest.imageIsUrl = true;
          } else {
            // Extract base64 from data URL
            aiVideoRequest.image = referenceImage.split(',')[1] || referenceImage;
            aiVideoRequest.imageIsUrl = false;
          }
        }

        const result = await generateAIVideo.mutateAsync(aiVideoRequest);

        if (result.success && result.jobId) {
          // Update experiment with job ID
          setExperiments(prev => prev.map(exp =>
            exp.id === experimentId
              ? { ...exp, id: result.jobId }
              : exp
          ));
          setCurrentJobId(result.jobId);
          setCurrentJobType('ai-video');

          toast({
            title: 'Processing',
            description: 'AI video generation started with Runway ML. This may take 2-5 minutes...',
          });
        } else {
          throw new Error(result.error || 'Failed to start AI video generation');
        }
      } catch (error) {
        console.error('AI video generation error:', error);
        setExperiments(prev => prev.map(exp =>
          exp.id === experimentId
            ? { ...exp, status: 'failed' as const, error: String(error) }
            : exp
        ));
        setIsProcessing(false);
        toast({
          title: 'AI Video Generation Failed',
          description: String(error),
          variant: 'destructive',
        });
      }
    } else {
      // Simulate for other types (not yet implemented)
      toast({
        title: 'Experiment Started',
        description: `Running ${activeTab} experiment (simulated)...`,
      });

      setTimeout(() => {
        setExperiments(prev => prev.map(exp =>
          exp.id === experimentId
            ? { ...exp, status: 'completed' as const, outputUrl: '/placeholder-video.mp4' }
            : exp
        ));
        setIsProcessing(false);
        toast({
          title: 'Note',
          description: `${activeTab} is not yet integrated. Use AI Video Gen (Runway) or Talking Heads (D-ID/Hedra).`,
        });
      }, 2000);
    }
  };

  const ProviderStatusBadge = ({ status }: { status: string }) => (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-full',
      status === 'available' ? 'bg-green-500/20 text-green-400' :
      status === 'coming_soon' ? 'bg-yellow-500/20 text-yellow-400' :
      'bg-gray-500/20 text-gray-400'
    )}>
      {status === 'available' ? 'Available' : status === 'coming_soon' ? 'Coming Soon' : status}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Beaker className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold">Animation Lab</h1>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                Experimental
              </span>
            </div>
            <p className="text-gray-400">
              Test different AI animation approaches for your anime avatar actors
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white">
              <Settings2 className="w-4 h-4 mr-2" />
              API Keys
            </Button>
            <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white">
              <ExternalLink className="w-4 h-4 mr-2" />
              Docs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Experiment Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Content Selection */}
            <Card className="bg-[#12121f] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-green-400" />
                  Learning Content
                </CardTitle>
                <CardDescription>
                  Select grammar points, vocabulary, and kanji to feature in your video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Items Summary */}
                {(selectedGrammar.length > 0 || selectedVocabulary.length > 0 || selectedKanji.length > 0) && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-400">Selected Content</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-gray-400 hover:text-white"
                        onClick={() => {
                          setSelectedGrammar([]);
                          setSelectedVocabulary([]);
                          setSelectedKanji([]);
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedGrammar.map(g => (
                        <Badge
                          key={g.id}
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 cursor-pointer"
                          onClick={() => toggleGrammar(g)}
                        >
                          {g.pattern}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                      {selectedVocabulary.map(v => (
                        <Badge
                          key={v.id}
                          variant="secondary"
                          className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 cursor-pointer"
                          onClick={() => toggleVocabulary(v)}
                        >
                          {v.word}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                      {selectedKanji.map(k => (
                        <Badge
                          key={k.id}
                          variant="secondary"
                          className="bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 cursor-pointer"
                          onClick={() => toggleKanji(k)}
                        >
                          {k.character}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Accordion type="multiple" className="w-full">
                  {/* Grammar Points */}
                  <AccordionItem value="grammar" className="border-white/10">
                    <AccordionTrigger className="hover:bg-white/5 px-3 rounded">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span>Grammar Points</span>
                        {selectedGrammar.length > 0 && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 ml-2">
                            {selectedGrammar.length} selected
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pt-2">
                      {grammarLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                        </div>
                      ) : grammarData && grammarData.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {grammarData.map((grammar) => (
                            <div
                              key={grammar.id}
                              onClick={() => toggleGrammar(grammar)}
                              className={cn(
                                'p-3 rounded-lg border cursor-pointer transition-all',
                                selectedGrammar.find(g => g.id === grammar.id)
                                  ? 'border-purple-500 bg-purple-500/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-purple-300">{grammar.pattern}</span>
                                <Checkbox
                                  checked={!!selectedGrammar.find(g => g.id === grammar.id)}
                                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                />
                              </div>
                              <p className="text-sm text-gray-400">{grammar.meaning}</p>
                              <p className="text-xs text-gray-500 mt-1">{grammar.example}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          No grammar points available. Generate some in the Study section.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Vocabulary */}
                  <AccordionItem value="vocabulary" className="border-white/10">
                    <AccordionTrigger className="hover:bg-white/5 px-3 rounded">
                      <div className="flex items-center gap-3">
                        <Languages className="w-4 h-4 text-blue-400" />
                        <span>Vocabulary</span>
                        {selectedVocabulary.length > 0 && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 ml-2">
                            {selectedVocabulary.length} selected
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pt-2">
                      {vocabLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                      ) : vocabularyData && vocabularyData.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {vocabularyData.map((vocab) => (
                            <div
                              key={vocab.id}
                              onClick={() => toggleVocabulary(vocab)}
                              className={cn(
                                'p-3 rounded-lg border cursor-pointer transition-all',
                                selectedVocabulary.find(v => v.id === vocab.id)
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <span className="font-medium text-blue-300">{vocab.word}</span>
                                  <span className="text-gray-500 ml-2 text-sm">({vocab.reading})</span>
                                </div>
                                <Checkbox
                                  checked={!!selectedVocabulary.find(v => v.id === vocab.id)}
                                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                              </div>
                              <p className="text-sm text-gray-400">{vocab.meanings.join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          No vocabulary available. Generate some in the Study section.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Kanji */}
                  <AccordionItem value="kanji" className="border-white/10">
                    <AccordionTrigger className="hover:bg-white/5 px-3 rounded">
                      <div className="flex items-center gap-3">
                        <Type className="w-4 h-4 text-orange-400" />
                        <span>Kanji</span>
                        {selectedKanji.length > 0 && (
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 ml-2">
                            {selectedKanji.length} selected
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pt-2">
                      {kanjiLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                        </div>
                      ) : kanjiData && kanjiData.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2">
                          {kanjiData.map((kanji) => (
                            <div
                              key={kanji.id}
                              onClick={() => toggleKanji(kanji)}
                              className={cn(
                                'p-3 rounded-lg border cursor-pointer transition-all text-center',
                                selectedKanji.find(k => k.id === kanji.id)
                                  ? 'border-orange-500 bg-orange-500/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              )}
                            >
                              <span className="text-2xl font-bold text-orange-300">{kanji.character}</span>
                              <p className="text-xs text-gray-500 mt-1 truncate">{kanji.meanings[0]}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          No kanji available. Generate some in the Study section.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Scene Genre & Context */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div>
                    <Label className="text-xs text-gray-400 mb-2 block">Scene Genre</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {SCENE_GENRES.map(genre => (
                        <button
                          key={genre.id}
                          onClick={() => setSceneGenre(genre.id)}
                          className={cn(
                            'p-2 rounded-lg border text-center transition-all',
                            sceneGenre === genre.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          )}
                        >
                          <span className="text-xs font-medium">{genre.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-400 mb-2 block">Scene Context (Optional)</Label>
                    <Input
                      placeholder="e.g., 'Two friends meeting at a coffee shop after school'"
                      value={sceneContext}
                      onChange={(e) => setSceneContext(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Generate Hollywood Script button */}
                  {(selectedGrammar.length > 0 || selectedVocabulary.length > 0 || selectedKanji.length > 0) && (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        onClick={handleGenerateScript}
                        disabled={isGeneratingScript}
                      >
                        {isGeneratingScript ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Script...
                          </>
                        ) : (
                          <>
                            <Film className="w-4 h-4 mr-2" />
                            Generate Hollywood Script
                          </>
                        )}
                      </Button>
                      {generatedScript && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-gray-400 hover:text-white"
                          onClick={() => setShowScriptPanel(!showScriptPanel)}
                        >
                          {showScriptPanel ? 'Hide Script' : 'Show Script'} ({generatedScript.scenes.length} scenes)
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hollywood Script Preview Panel */}
            {showScriptPanel && generatedScript && (
              <Card className="bg-[#12121f] border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Film className="w-4 h-4 text-purple-400" />
                      Generated Script
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      onClick={() => setShowScriptPanel(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Click on any dialogue line to use it as your speech text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title & Synopsis */}
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                    <h3 className="text-lg font-bold text-white">{generatedScript.title}</h3>
                    <p className="text-purple-300 text-sm">{generatedScript.titleJapanese}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                        {generatedScript.genre}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        {generatedScript.targetLevel}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-500/20 text-gray-300">
                        ~{generatedScript.totalDuration}s
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mt-3">{generatedScript.synopsis}</p>
                    <p className="text-xs text-gray-500 mt-1">{generatedScript.synopsisJapanese}</p>
                  </div>

                  {/* Characters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Characters
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {generatedScript.characters.map((char) => (
                        <div
                          key={char.id}
                          className="p-2 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
                              {char.nameJapanese.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{char.name}</p>
                              <p className="text-xs text-gray-500">{char.nameJapanese} • {char.role}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{char.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scenes */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Scenes
                    </h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {generatedScript.scenes.map((scene) => (
                        <div
                          key={scene.sceneNumber}
                          className="p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          {/* Scene Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-xs text-purple-400 font-mono">
                                SCENE {scene.sceneNumber}
                              </span>
                              <p className="text-sm font-medium text-gray-200">{scene.location}</p>
                              <p className="text-xs text-gray-500">{scene.locationJapanese}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  useScriptForVideoGen(scene.sceneNumber - 1);
                                }}
                              >
                                <Video className="w-3 h-3 mr-1" />
                                Use for AI Video
                              </Button>
                              <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 text-xs">
                                {scene.timeOfDay}
                              </Badge>
                            </div>
                          </div>

                          {/* Scene Description */}
                          <p className="text-xs text-gray-400 mb-3 italic">{scene.description}</p>

                          {/* Lines */}
                          <div className="space-y-2">
                            {scene.lines.map((line, lineIdx) => (
                              <div
                                key={lineIdx}
                                className={cn(
                                  'p-2 rounded border transition-all',
                                  line.type === 'dialogue'
                                    ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50 cursor-pointer'
                                    : line.type === 'action'
                                    ? 'bg-yellow-500/5 border-yellow-500/20'
                                    : line.type === 'direction'
                                    ? 'bg-gray-500/10 border-gray-500/20'
                                    : 'bg-white/5 border-white/10'
                                )}
                                onClick={() => {
                                  if (line.type === 'dialogue') {
                                    useDialogueFromScript(line);
                                  }
                                }}
                              >
                                {line.type === 'dialogue' && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-blue-400 uppercase">
                                      {generatedScript.characters.find(c => c.id === line.characterId)?.name || line.characterId}
                                    </span>
                                    {line.notes && (
                                      <span className="text-xs text-gray-500 italic">
                                        {line.notes}
                                      </span>
                                    )}
                                    <Mic className="w-3 h-3 text-blue-400 ml-auto" />
                                  </div>
                                )}
                                {line.type === 'action' && (
                                  <span className="text-xs text-yellow-400 uppercase block mb-1">
                                    ACTION
                                  </span>
                                )}
                                {line.type === 'direction' && (
                                  <span className="text-xs text-gray-400 uppercase block mb-1">
                                    DIRECTION
                                  </span>
                                )}
                                <p className={cn(
                                  'text-sm',
                                  line.type === 'dialogue' ? 'text-white' : 'text-gray-400 italic'
                                )}>
                                  {line.japanese}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{line.english}</p>
                                {line.duration && (
                                  <span className="text-xs text-gray-600 mt-1 block">
                                    ~{line.duration}s
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Learning Focus */}
                          {scene.learningFocus && scene.learningFocus.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <span className="text-xs text-green-400">Learning Focus: </span>
                              <span className="text-xs text-gray-400">
                                {scene.learningFocus.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Learning Objectives
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {generatedScript.learningObjectives.grammar.length > 0 && (
                        <div>
                          <span className="text-purple-400">Grammar:</span>
                          <p className="text-gray-400">{generatedScript.learningObjectives.grammar.join(', ')}</p>
                        </div>
                      )}
                      {generatedScript.learningObjectives.vocabulary.length > 0 && (
                        <div>
                          <span className="text-blue-400">Vocabulary:</span>
                          <p className="text-gray-400">{generatedScript.learningObjectives.vocabulary.join(', ')}</p>
                        </div>
                      )}
                      {generatedScript.learningObjectives.kanji.length > 0 && (
                        <div>
                          <span className="text-orange-400">Kanji:</span>
                          <p className="text-gray-400">{generatedScript.learningObjectives.kanji.join(', ')}</p>
                        </div>
                      )}
                      {generatedScript.learningObjectives.culturalNotes && generatedScript.learningObjectives.culturalNotes.length > 0 && (
                        <div>
                          <span className="text-pink-400">Cultural Notes:</span>
                          <p className="text-gray-400">{generatedScript.learningObjectives.culturalNotes.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      onClick={() => useScriptForVideoGen(0)}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Use for AI Video
                    </Button>
                    <Button
                      variant="outline"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      onClick={() => {
                        const allDialogue = getScriptDialogue(generatedScript);
                        setSampleText(allDialogue);
                        setActiveTab('talking-head');
                        toast({
                          title: 'All Dialogue Loaded',
                          description: 'All dialogue from the script has been set as your speech text.',
                        });
                      }}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Use for Talking Head
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Casting - Talent Selection */}
            <Card className="bg-[#12121f] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Casting
                </CardTitle>
                <CardDescription>
                  Cast talent from the roster or upload your own character
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Talent Roster */}
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">Talent Roster - Cast Your Scene</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SAMPLE_CHARACTERS.map(char => (
                      <button
                        key={char.id}
                        onClick={async () => {
                          // Fetch the image and convert to data URL
                          try {
                            const response = await fetch(char.imageUrl);
                            const blob = await response.blob();
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReferenceImage(reader.result as string);
                            };
                            reader.readAsDataURL(blob);
                            toast({
                              title: 'Talent Cast',
                              description: `${char.name} cast for your scene`,
                            });
                          } catch {
                            // If fetch fails, just use the URL directly
                            setReferenceImage(char.imageUrl);
                          }
                        }}
                        className={cn(
                          'p-2 rounded-xl border-2 transition-all hover:scale-105',
                          referenceImage?.includes(char.id) || referenceImage === char.imageUrl
                            ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        )}
                      >
                        <img
                          src={char.imageUrl}
                          alt={char.name}
                          className="w-full aspect-square rounded-lg object-cover bg-white/10"
                        />
                        <p className="text-xs text-center mt-1.5 font-medium">{char.name}</p>
                        <p className="text-[10px] text-gray-500 text-center">{char.description}</p>
                        <div className="flex flex-wrap gap-1 justify-center mt-1">
                          {char.tags?.slice(0, 1).map(tag => (
                            <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Custom */}
                <div className="flex gap-4 pt-2 border-t border-white/10">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors flex-shrink-0',
                      referenceImage && !SAMPLE_CHARACTERS.some(c => referenceImage === c.imageUrl || referenceImage?.includes(c.id))
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    )}
                  >
                    {referenceImage && !SAMPLE_CHARACTERS.some(c => referenceImage === c.imageUrl) ? (
                      <img src={referenceImage} alt="Reference" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                        <span className="text-[10px] text-gray-500">Upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Upload your own portrait (Recommended)</Label>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Hedra works best with <span className="text-purple-400">real portrait photos</span> or high-quality character illustrations.
                      Use a clear front-facing image with good lighting. PNG or JPG format.
                    </p>
                    {referenceImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                        onClick={() => setReferenceImage(null)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear Selection
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Animation Method Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ExperimentType)} className="w-full">
              <TabsList className="w-full bg-[#12121f] border border-white/10 p-1 h-auto">
                <TabsTrigger
                  value="ai-video"
                  className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white py-3"
                >
                  <Video className="w-4 h-4 mr-2" />
                  AI Video Gen
                </TabsTrigger>
                <TabsTrigger
                  value="talking-head"
                  className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white py-3"
                >
                  <User className="w-4 h-4 mr-2" />
                  Talking Heads
                </TabsTrigger>
                <TabsTrigger
                  value="sd-animation"
                  className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white py-3"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  SD Animation
                </TabsTrigger>
                <TabsTrigger
                  value="live2d"
                  className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white py-3"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Live2D
                </TabsTrigger>
              </TabsList>

              {/* AI Video Generation Tab */}
              <TabsContent value="ai-video" className="mt-4">
                <Card className="bg-[#12121f] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">AI Video Generation</CardTitle>
                    <CardDescription>
                      Generate anime video clips from text prompts or reference images
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Provider</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {AI_VIDEO_PROVIDERS.map(provider => (
                          <button
                            key={provider.id}
                            onClick={() => setAiVideoProvider(provider.id)}
                            disabled={provider.status !== 'available'}
                            className={cn(
                              'p-3 rounded-lg border text-left transition-all',
                              aiVideoProvider === provider.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20',
                              provider.status !== 'available' && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{provider.name}</span>
                              <ProviderStatusBadge status={provider.status} />
                            </div>
                            <p className="text-xs text-gray-500">{provider.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Duration (seconds)</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={videoDuration}
                            onValueChange={setVideoDuration}
                            min={2}
                            max={15}
                            step={1}
                            className="flex-1 [&_[role=slider]]:bg-purple-500"
                          />
                          <span className="text-sm w-8">{videoDuration[0]}s</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Motion Intensity</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={motionIntensity}
                            onValueChange={setMotionIntensity}
                            min={0}
                            max={100}
                            step={10}
                            className="flex-1 [&_[role=slider]]:bg-purple-500"
                          />
                          <span className="text-sm w-8">{motionIntensity[0]}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Scene Prompt</Label>
                      <Textarea
                        placeholder="Describe the scene and action... (e.g., 'Anime girl teacher explaining at a blackboard, gentle smile, classroom background')"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[80px]"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Talking Heads Tab */}
              <TabsContent value="talking-head" className="mt-4">
                <Card className="bg-[#12121f] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Talking Head Animation</CardTitle>
                    <CardDescription>
                      Animate a character image to speak with lip-sync
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Provider</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TALKING_HEAD_PROVIDERS.map(provider => (
                          <button
                            key={provider.id}
                            onClick={() => setTalkingHeadProvider(provider.id)}
                            className={cn(
                              'p-3 rounded-lg border text-left transition-all',
                              talkingHeadProvider === provider.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{provider.name}</span>
                              <ProviderStatusBadge status={provider.status} />
                            </div>
                            <p className="text-xs text-gray-500">{provider.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Voice</Label>
                      <Select value={voiceId} onValueChange={setVoiceId}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="ja-female-1">Japanese Female (Yuki)</SelectItem>
                          <SelectItem value="ja-female-2">Japanese Female (Sakura)</SelectItem>
                          <SelectItem value="ja-male-1">Japanese Male (Takeshi)</SelectItem>
                          <SelectItem value="ja-male-2">Japanese Male (Kenji)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Expression Intensity</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={expressionIntensity}
                          onValueChange={setExpressionIntensity}
                          min={0}
                          max={100}
                          step={10}
                          className="flex-1 [&_[role=slider]]:bg-purple-500"
                        />
                        <span className="text-sm w-8">{expressionIntensity[0]}%</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Speech Text (Japanese)</Label>
                      <Textarea
                        placeholder="Enter Japanese text for the character to speak..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[80px]"
                        value={sampleText}
                        onChange={(e) => setSampleText(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SD Animation Tab */}
              <TabsContent value="sd-animation" className="mt-4">
                <Card className="bg-[#12121f] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Stable Diffusion Animation</CardTitle>
                    <CardDescription>
                      Create consistent anime animations using SD-based methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Animation Method</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {SD_ANIMATION_METHODS.map(method => (
                          <button
                            key={method.id}
                            onClick={() => setSdMethod(method.id)}
                            className={cn(
                              'p-3 rounded-lg border text-left transition-all',
                              sdMethod === method.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            )}
                          >
                            <span className="font-medium text-sm block mb-1">{method.name}</span>
                            <p className="text-xs text-gray-500">{method.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {sdMethod === 'animatediff' && (
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Motion Module</Label>
                        <Select value={motionModule} onValueChange={setMotionModule}>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-white/10">
                            <SelectItem value="mm_sd_v15_v2">MM SD 1.5 v2 (General)</SelectItem>
                            <SelectItem value="mm_sd_v15_v3">MM SD 1.5 v3 (Improved)</SelectItem>
                            <SelectItem value="mm_sdxl_v10">MM SDXL v1.0 (High Quality)</SelectItem>
                            <SelectItem value="hotshot-xl">HotShot-XL (Fast)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Frame Count</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={frameCount}
                            onValueChange={setFrameCount}
                            min={8}
                            max={64}
                            step={8}
                            className="flex-1 [&_[role=slider]]:bg-purple-500"
                          />
                          <span className="text-sm w-8">{frameCount[0]}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Motion Strength</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={motionIntensity}
                            onValueChange={setMotionIntensity}
                            min={0}
                            max={100}
                            step={10}
                            className="flex-1 [&_[role=slider]]:bg-purple-500"
                          />
                          <span className="text-sm w-8">{motionIntensity[0]}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Character/Scene Prompt</Label>
                      <Textarea
                        placeholder="Describe your anime character and scene..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[80px]"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Live2D Tab */}
              <TabsContent value="live2d" className="mt-4">
                <Card className="bg-[#12121f] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Live2D Animation</CardTitle>
                    <CardDescription>
                      Use rigged 2D characters with natural movement and lip-sync
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-400 mb-1">Requires Live2D Models</h4>
                          <p className="text-sm text-gray-400">
                            Live2D requires pre-rigged character models. You can:
                          </p>
                          <ul className="text-sm text-gray-400 mt-2 space-y-1 list-disc list-inside">
                            <li>Purchase models from <a href="#" className="text-purple-400 hover:underline">Booth.pm</a> or <a href="#" className="text-purple-400 hover:underline">nizima</a></li>
                            <li>Create custom models with Live2D Cubism Editor</li>
                            <li>Commission artists who specialize in Live2D rigging</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Available Models</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Yuki (Demo)', 'Sakura (Demo)', 'Upload Custom'].map((name, i) => (
                          <button
                            key={name}
                            className={cn(
                              'p-4 rounded-lg border text-center transition-all',
                              i === 2
                                ? 'border-dashed border-white/20 hover:border-white/40'
                                : 'border-white/10 bg-white/5 hover:border-purple-500'
                            )}
                          >
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              {i === 2 ? <Upload className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <span className="text-sm">{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Animation Parameters</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <span className="text-xs text-gray-400">Lip Sync</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm">Enabled</span>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <span className="text-xs text-gray-400">Eye Tracking</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm">Enabled</span>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <span className="text-xs text-gray-400">Idle Motion</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm">Breathing</span>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <span className="text-xs text-gray-400">Expression</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm">Auto</span>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Run Experiment Button */}
            <Button
              onClick={runExperiment}
              disabled={isProcessing}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Run Experiment
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {/* Preview */}
            <Card className="bg-[#12121f] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[9/16] bg-black/50 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                  {isProcessing ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Generating animation...</p>
                      <p className="text-xs text-gray-500 mt-1">This may take 1-2 minutes</p>
                    </div>
                  ) : experiments[0]?.status === 'completed' && experiments[0]?.outputUrl ? (
                    <video
                      src={experiments[0].outputUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                  ) : experiments[0]?.status === 'failed' ? (
                    <div className="text-center p-4">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-400">Generation failed</p>
                      <p className="text-xs text-gray-500 mt-1">{experiments[0]?.error || 'Unknown error'}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Run an experiment to see results</p>
                    </div>
                  )}
                </div>
                {/* Download button when video is ready */}
                {experiments[0]?.status === 'completed' && experiments[0]?.outputUrl && (
                  <div className="mt-3 flex gap-2">
                    <a
                      href={experiments[0].outputUrl}
                      download={`animation-${experiments[0].id}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full border-white/10">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10"
                      onClick={() => window.open(experiments[0].outputUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experiment History */}
            <Card className="bg-[#12121f] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-purple-400" />
                    Experiment History
                  </span>
                  <span className="text-xs text-gray-500">{experiments.length} runs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {experiments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No experiments yet. Run one to see results here.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {experiments.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{exp.type.replace('-', ' ')}</span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            exp.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            exp.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                            exp.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          )}>
                            {exp.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{exp.parameters.provider as string}</span>
                          <span>{exp.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-[#12121f] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-400 space-y-2">
                <p>• <strong className="text-green-400">Start with content</strong>: Select grammar/vocab first, then generate prompt</p>
                <p>• <strong className="text-white">AI Video</strong>: Best for full scene generation with movement</p>
                <p>• <strong className="text-white">Talking Heads</strong>: Best for dialogue scenes with lip-sync</p>
                <p>• <strong className="text-white">SD Animation</strong>: Best for consistent character animation</p>
                <p>• <strong className="text-white">Live2D</strong>: Best for reusable, high-quality characters</p>
              </CardContent>
            </Card>

            {/* Selected Content Summary */}
            {(selectedGrammar.length > 0 || selectedVocabulary.length > 0 || selectedKanji.length > 0) && (
              <Card className="bg-[#12121f] border-white/10 border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-400" />
                    Script Will Feature
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {selectedGrammar.length > 0 && (
                    <div>
                      <span className="text-purple-400 font-medium">Grammar:</span>
                      <span className="text-gray-300 ml-2">{selectedGrammar.map(g => g.pattern).join(', ')}</span>
                    </div>
                  )}
                  {selectedVocabulary.length > 0 && (
                    <div>
                      <span className="text-blue-400 font-medium">Vocabulary:</span>
                      <span className="text-gray-300 ml-2">{selectedVocabulary.map(v => v.word).join(', ')}</span>
                    </div>
                  )}
                  {selectedKanji.length > 0 && (
                    <div>
                      <span className="text-orange-400 font-medium">Kanji:</span>
                      <span className="text-gray-300 ml-2">{selectedKanji.map(k => k.character).join(', ')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-gray-400">Genre:</span>
                    <span className="text-white ml-2">{SCENE_GENRES.find(g => g.id === sceneGenre)?.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
