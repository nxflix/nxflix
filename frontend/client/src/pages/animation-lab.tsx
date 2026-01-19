import { useState, useRef } from 'react';
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
import { useGrammar, useVocabulary, useKanji } from '@/lib/api';
import type { GrammarPoint, VocabularyItem, KanjiItem } from '@/lib/api-types';

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

  // General state
  const [activeTab, setActiveTab] = useState<ExperimentType>('ai-video');
  const [experiments, setExperiments] = useState<ExperimentResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Generate script prompt from selected content
  const generateScriptPrompt = () => {
    const parts: string[] = [];

    if (selectedGrammar.length > 0) {
      parts.push(`Grammar points to demonstrate: ${selectedGrammar.map(g => `${g.pattern} (${g.meaning})`).join(', ')}`);
    }
    if (selectedVocabulary.length > 0) {
      parts.push(`Vocabulary to include: ${selectedVocabulary.map(v => `${v.word} (${v.meanings[0]})`).join(', ')}`);
    }
    if (selectedKanji.length > 0) {
      parts.push(`Kanji to feature: ${selectedKanji.map(k => `${k.character} (${k.meanings[0]})`).join(', ')}`);
    }
    if (sceneContext) {
      parts.push(`Scene context: ${sceneContext}`);
    }

    const genre = SCENE_GENRES.find(g => g.id === sceneGenre);
    parts.push(`Genre/Style: ${genre?.name} - ${genre?.description}`);

    return parts.join('\n\n');
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
    setIsProcessing(true);

    const newExperiment: ExperimentResult = {
      id: `exp-${Date.now()}`,
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
        // Learning content
        grammarPoints: selectedGrammar.map(g => ({ id: g.id, pattern: g.pattern, meaning: g.meaning })),
        vocabulary: selectedVocabulary.map(v => ({ id: v.id, word: v.word, meaning: v.meanings[0] })),
        kanji: selectedKanji.map(k => ({ id: k.id, character: k.character, meaning: k.meanings[0] })),
        sceneGenre,
        sceneContext,
      },
      timestamp: new Date(),
    };

    setExperiments(prev => [newExperiment, ...prev]);

    // Simulate processing (replace with actual API calls)
    toast({
      title: 'Experiment Started',
      description: `Running ${activeTab} experiment with ${newExperiment.parameters.provider}...`,
    });

    // Simulated delay - replace with actual API integration
    setTimeout(() => {
      setExperiments(prev => prev.map(exp =>
        exp.id === newExperiment.id
          ? { ...exp, status: 'completed' as const, outputUrl: '/placeholder-video.mp4' }
          : exp
      ));
      setIsProcessing(false);
      toast({
        title: 'Experiment Complete',
        description: 'Your animation has been generated. Check the results panel.',
      });
    }, 3000);
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

                  {/* Auto-generate prompt button */}
                  {(selectedGrammar.length > 0 || selectedVocabulary.length > 0 || selectedKanji.length > 0) && (
                    <Button
                      variant="outline"
                      className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                      onClick={() => setPromptText(generateScriptPrompt())}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Script Prompt from Selection
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reference Image Upload */}
            <Card className="bg-[#12121f] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  Reference Character
                </CardTitle>
                <CardDescription>
                  Upload a character image to animate (optional for some providers)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
                      referenceImage
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    )}
                  >
                    {referenceImage ? (
                      <img src={referenceImage} alt="Reference" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                        <span className="text-xs text-gray-500">Upload</span>
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
                    <Label className="text-xs text-gray-400">Or generate with AI</Label>
                    <div className="mt-2 flex gap-2">
                      {ANIME_STYLES.slice(0, 3).map(style => (
                        <button
                          key={style.id}
                          onClick={() => setAnimeStyle(style.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            animeStyle === style.id
                              ? 'bg-gradient-to-r text-white ' + style.preview
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          )}
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Input
                        placeholder="Describe your character..."
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
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
                <div className="aspect-[9/16] bg-black/50 rounded-lg flex items-center justify-center border border-white/10">
                  {isProcessing ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Generating animation...</p>
                    </div>
                  ) : experiments[0]?.status === 'completed' ? (
                    <div className="text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Animation ready</p>
                      <Button size="sm" variant="outline" className="mt-3 border-white/10">
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Run an experiment to see results</p>
                    </div>
                  )}
                </div>
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
