import { useState } from 'react';
import { Link } from 'wouter';
import {
  useGenerateGrammar,
  useGenerateKanji,
  useGenerateVocabulary,
  useGenerateReading,
  useGenerateListening,
  useSaveGrammar,
  useSaveKanji,
  useSaveVocabulary,
  useSaveReading,
  useSaveListening,
} from '@/lib/api';
import type {
  ContentType,
  ReadingPassageType,
  ListeningType,
  PartOfSpeech,
  GrammarPoint,
  KanjiItem,
  VocabularyItem,
  ReadingPassage,
  ListeningItem,
  TTSProvider,
} from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  BookOpen,
  Languages,
  FileText,
  Headphones,
  PenTool,
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  Save,
  Globe,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type GeneratedContent =
  | { type: 'grammar'; data: GrammarPoint[] }
  | { type: 'kanji'; data: KanjiItem[] }
  | { type: 'vocabulary'; data: VocabularyItem[] }
  | { type: 'reading'; data: ReadingPassage }
  | { type: 'listening'; data: ListeningItem };

const contentTypeInfo: Record<ContentType, { icon: typeof BookOpen; label: string; color: string; description: string }> = {
  kanji: {
    icon: PenTool,
    label: 'Kanji',
    color: 'text-purple-500',
    description: 'Generate kanji cards with readings and compounds',
  },
  vocabulary: {
    icon: Languages,
    label: 'Vocabulary',
    color: 'text-green-500',
    description: 'Generate JLPT N1 vocabulary sets with examples',
  },
  grammar: {
    icon: BookOpen,
    label: 'Grammar',
    color: 'text-blue-500',
    description: 'Generate JLPT N1 grammar points with examples',
  },
  listening: {
    icon: Headphones,
    label: 'Listening',
    color: 'text-pink-500',
    description: 'Generate listening exercises with TTS audio',
  },
  reading: {
    icon: FileText,
    label: 'Reading',
    color: 'text-orange-500',
    description: 'Create reading passages with comprehension questions',
  },
};

export default function Creator() {
  const [activeTab, setActiveTab] = useState<ContentType>('kanji');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [shareContent, setShareContent] = useState(false);
  const { toast } = useToast();

  // Form states
  const [grammarForm, setGrammarForm] = useState({ topic: '', count: 5 });
  const [vocabForm, setVocabForm] = useState({ topic: '', count: 5 });
  const [kanjiForm, setKanjiForm] = useState({ characters: '', count: 5 });
  const [readingForm, setReadingForm] = useState<{ topic: string; passageType: ReadingPassageType }>({
    topic: '',
    passageType: 'short',
  });
  const [listeningForm, setListeningForm] = useState<{ topic: string; listeningType: ListeningType; duration: number; ttsProvider: TTSProvider }>({
    topic: '',
    listeningType: 'task_based',
    duration: 60,
    ttsProvider: 'google', // Default to Google since OpenAI quota exceeded
  });

  // Generate mutations
  const generateGrammar = useGenerateGrammar();
  const generateKanji = useGenerateKanji();
  const generateVocabulary = useGenerateVocabulary();
  const generateReading = useGenerateReading();
  const generateListening = useGenerateListening();

  // Save mutations
  const saveGrammar = useSaveGrammar();
  const saveKanji = useSaveKanji();
  const saveVocabulary = useSaveVocabulary();
  const saveReading = useSaveReading();
  const saveListening = useSaveListening();

  const isGenerating =
    generateGrammar.isPending ||
    generateKanji.isPending ||
    generateVocabulary.isPending ||
    generateReading.isPending ||
    generateListening.isPending;

  const isSaving =
    saveGrammar.isPending ||
    saveKanji.isPending ||
    saveVocabulary.isPending ||
    saveReading.isPending ||
    saveListening.isPending;

  const handleSave = async () => {
    if (!generatedContent || isSaved) return;

    try {
      const saveOptions = { isPublic: shareContent };
      switch (generatedContent.type) {
        case 'grammar':
          await saveGrammar.mutateAsync({ grammar: generatedContent.data, ...saveOptions });
          break;
        case 'kanji':
          await saveKanji.mutateAsync({ kanji: generatedContent.data, ...saveOptions });
          break;
        case 'vocabulary':
          await saveVocabulary.mutateAsync({ vocabulary: generatedContent.data, ...saveOptions });
          break;
        case 'reading':
          await saveReading.mutateAsync({ reading: generatedContent.data, ...saveOptions });
          break;
        case 'listening':
          await saveListening.mutateAsync({ listening: generatedContent.data, ...saveOptions });
          break;
      }
      setIsSaved(true);
      toast({
        title: 'Saved!',
        description: shareContent
          ? `${generatedContent.type.charAt(0).toUpperCase() + generatedContent.type.slice(1)} content saved and shared publicly.`
          : `${generatedContent.type.charAt(0).toUpperCase() + generatedContent.type.slice(1)} content saved to your library.`,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async () => {
    // Reset saved state when generating new content
    setIsSaved(false);
    try {
      switch (activeTab) {
        case 'grammar':
          const grammarResult = await generateGrammar.mutateAsync({
            topic: grammarForm.topic || undefined,
            count: grammarForm.count,
          });
          setGeneratedContent({ type: 'grammar', data: grammarResult });
          toast({ title: 'Success', description: `Generated ${grammarResult.length} grammar points` });
          break;

        case 'vocabulary':
          const vocabResult = await generateVocabulary.mutateAsync({
            topic: vocabForm.topic || undefined,
            count: vocabForm.count,
          });
          setGeneratedContent({ type: 'vocabulary', data: vocabResult });
          toast({ title: 'Success', description: `Generated ${vocabResult.length} vocabulary items` });
          break;

        case 'kanji':
          const kanjiChars = kanjiForm.characters.split('').filter((c) => c.trim());
          const kanjiResult = await generateKanji.mutateAsync({
            characters: kanjiChars.length > 0 ? kanjiChars : undefined,
            count: kanjiForm.count,
          });
          setGeneratedContent({ type: 'kanji', data: kanjiResult });
          toast({ title: 'Success', description: `Generated ${kanjiResult.length} kanji items` });
          break;

        case 'reading':
          const readingResult = await generateReading.mutateAsync({
            topic: readingForm.topic || undefined,
            passageType: readingForm.passageType,
          });
          setGeneratedContent({ type: 'reading', data: readingResult });
          toast({ title: 'Success', description: 'Generated reading passage' });
          break;

        case 'listening':
          const listeningResult = await generateListening.mutateAsync({
            topic: listeningForm.topic || undefined,
            listeningType: listeningForm.listeningType,
            durationSeconds: listeningForm.duration,
            generateAudio: true, // Enable TTS audio generation
            ttsProvider: listeningForm.ttsProvider, // Use selected TTS provider
          });
          setGeneratedContent({ type: 'listening', data: listeningResult });
          toast({ title: 'Success', description: `Generated listening exercise with ${listeningForm.ttsProvider} audio` });
          break;
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Content Creator
          </h1>
          <p className="text-muted-foreground">Generate AI-powered JLPT N1 study materials</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel: Generation Form */}
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid grid-cols-5 w-full mb-6">
                {Object.entries(contentTypeInfo).map(([type, info]) => (
                  <TabsTrigger key={type} value={type} className="gap-1">
                    <info.icon className={`w-4 h-4 ${info.color}`} />
                    <span className="hidden sm:inline">{info.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Kanji Form */}
              <TabsContent value="kanji" className="space-y-4">
                <p className="text-sm text-muted-foreground">{contentTypeInfo.kanji.description}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="kanji-chars">Specific kanji (optional)</Label>
                    <Input
                      id="kanji-chars"
                      placeholder="e.g., 憂鬱躊躇"
                      value={kanjiForm.characters}
                      onChange={(e) => setKanjiForm((f) => ({ ...f, characters: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter specific kanji characters or leave empty for random N1 kanji
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="kanji-count">Number of kanji</Label>
                    <Select
                      value={kanjiForm.count.toString()}
                      onValueChange={(v) => setKanjiForm((f) => ({ ...f, count: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 15, 20].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} kanji
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Vocabulary Form */}
              <TabsContent value="vocabulary" className="space-y-4">
                <p className="text-sm text-muted-foreground">{contentTypeInfo.vocabulary.description}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vocab-topic">Topic (optional)</Label>
                    <Input
                      id="vocab-topic"
                      placeholder="e.g., business, technology, emotions"
                      value={vocabForm.topic}
                      onChange={(e) => setVocabForm((f) => ({ ...f, topic: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vocab-count">Number of words</Label>
                    <Select
                      value={vocabForm.count.toString()}
                      onValueChange={(v) => setVocabForm((f) => ({ ...f, count: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 15, 20].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} words
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Grammar Form */}
              <TabsContent value="grammar" className="space-y-4">
                <p className="text-sm text-muted-foreground">{contentTypeInfo.grammar.description}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="grammar-topic">Topic (optional)</Label>
                    <Input
                      id="grammar-topic"
                      placeholder="e.g., conditionals, causative, honorifics"
                      value={grammarForm.topic}
                      onChange={(e) => setGrammarForm((f) => ({ ...f, topic: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="grammar-count">Number of grammar points</Label>
                    <Select
                      value={grammarForm.count.toString()}
                      onValueChange={(v) => setGrammarForm((f) => ({ ...f, count: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 15, 20].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} points
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Listening Form */}
              <TabsContent value="listening" className="space-y-4">
                <p className="text-sm text-muted-foreground">{contentTypeInfo.listening.description}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="listening-topic">Topic (optional)</Label>
                    <Input
                      id="listening-topic"
                      placeholder="e.g., workplace, travel, daily life"
                      value={listeningForm.topic}
                      onChange={(e) => setListeningForm((f) => ({ ...f, topic: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="listening-type">Exercise Type</Label>
                    <Select
                      value={listeningForm.listeningType}
                      onValueChange={(v: ListeningType) => setListeningForm((f) => ({ ...f, listeningType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task_based">Task-Based (Understand a task)</SelectItem>
                        <SelectItem value="point_comprehension">Point Comprehension</SelectItem>
                        <SelectItem value="quick_response">Quick Response</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="listening-duration">Duration</Label>
                    <Select
                      value={listeningForm.duration.toString()}
                      onValueChange={(v) => setListeningForm((f) => ({ ...f, duration: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">~30 seconds</SelectItem>
                        <SelectItem value="60">~1 minute</SelectItem>
                        <SelectItem value="120">~2 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tts-provider">TTS Voice Provider</Label>
                    <Select
                      value={listeningForm.ttsProvider}
                      onValueChange={(v: TTSProvider) => setListeningForm((f) => ({ ...f, ttsProvider: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Cloud TTS (Recommended)</SelectItem>
                        <SelectItem value="openai">OpenAI TTS</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs (Premium)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select which AI service generates the audio
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Reading Form */}
              <TabsContent value="reading" className="space-y-4">
                <p className="text-sm text-muted-foreground">{contentTypeInfo.reading.description}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reading-topic">Topic (optional)</Label>
                    <Input
                      id="reading-topic"
                      placeholder="e.g., environment, culture, science"
                      value={readingForm.topic}
                      onChange={(e) => setReadingForm((f) => ({ ...f, topic: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reading-type">Passage Type</Label>
                    <Select
                      value={readingForm.passageType}
                      onValueChange={(v: ReadingPassageType) => setReadingForm((f) => ({ ...f, passageType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (~200 chars)</SelectItem>
                        <SelectItem value="medium">Medium (~500 chars)</SelectItem>
                        <SelectItem value="long">Long (~1000 chars)</SelectItem>
                        <SelectItem value="comparison">Comparison (2 passages)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {contentTypeInfo[activeTab].label}
                </>
              )}
            </Button>
          </Card>

          {/* Right Panel: Preview */}
          <Card className="p-6 min-h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                Preview
                {generatedContent && <Check className="w-4 h-4 text-green-500" />}
              </h3>
              {generatedContent && (
                <div className="flex items-center gap-4">
                  {/* Sharing Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="share-toggle"
                      checked={shareContent}
                      onCheckedChange={setShareContent}
                      disabled={isSaved}
                    />
                    <Label
                      htmlFor="share-toggle"
                      className="text-sm flex items-center gap-1 cursor-pointer"
                    >
                      {shareContent ? (
                        <>
                          <Globe className="w-4 h-4 text-green-500" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          Private
                        </>
                      )}
                    </Label>
                  </div>
                  {/* Save Button */}
                  <Button
                    variant={isSaved ? 'outline' : 'default'}
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save to Library
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isGenerating ? (
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
                    <p className="text-sm text-muted-foreground">Generating {contentTypeInfo[activeTab].label.toLowerCase()}...</p>
                  </div>
                </motion.div>
              ) : generatedContent ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 overflow-auto max-h-[450px]"
                >
                  {generatedContent.type === 'grammar' && (
                    <GrammarPreview items={generatedContent.data} />
                  )}
                  {generatedContent.type === 'vocabulary' && (
                    <VocabularyPreview items={generatedContent.data} />
                  )}
                  {generatedContent.type === 'kanji' && (
                    <KanjiPreview items={generatedContent.data} />
                  )}
                  {generatedContent.type === 'reading' && (
                    <ReadingPreview passage={generatedContent.data} />
                  )}
                  {generatedContent.type === 'listening' && (
                    <ListeningPreview item={generatedContent.data} />
                  )}
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
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-center">
                    Configure your content and click Generate
                    <br />
                    to see a preview here.
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

// Preview Components
function GrammarPreview({ items }: { items: GrammarPoint[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-bold">{item.pattern}</p>
              <p className="text-sm text-muted-foreground">{item.meaning}</p>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
              {item.level}
            </span>
          </div>
          {item.example && (
            <div className="mt-2 text-xs border-l-2 border-blue-500/30 pl-2">
              <p className="text-foreground">{item.example}</p>
            </div>
          )}
          {item.explanation && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              {item.explanation}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function VocabularyPreview({ items }: { items: VocabularyItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xl font-bold">{item.word}</p>
              <p className="text-sm text-muted-foreground">{item.reading}</p>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded">{item.partOfSpeech}</span>
          </div>
          <p className="mt-2 text-sm">{item.meanings.join('; ')}</p>
          {item.examples.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground italic border-l-2 pl-2">
              {item.examples[0].sentence}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function KanjiPreview({ items }: { items: KanjiItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.id} className="p-3 text-center">
          <p className="text-4xl font-bold mb-2">{item.character}</p>
          <div className="text-xs space-y-1">
            <p><span className="text-muted-foreground">On:</span> {item.onyomi.join(', ')}</p>
            <p><span className="text-muted-foreground">Kun:</span> {item.kunyomi.join(', ')}</p>
            <p className="font-medium">{item.meanings.slice(0, 2).join(', ')}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ReadingPreview({ passage }: { passage: ReadingPassage }) {
  return (
    <div className="space-y-4">
      {passage.title && <h4 className="font-semibold text-lg">{passage.title}</h4>}
      <div className="bg-muted/50 p-4 rounded text-sm leading-relaxed">
        {passage.content}
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {passage.wordCount} characters | {passage.estimatedMinutes} min | {passage.questions.length} questions
        </p>
        {passage.keyVocabulary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {passage.keyVocabulary.map((item, i) => {
              // Handle both string and object formats from API
              const word = typeof item === 'string' ? item : (item as { word: string }).word;
              return (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {word}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ListeningPreview({ item }: { item: ListeningItem }) {
  // Get audio source from either audioUrl or audioBase64
  const audioSrc = item.audioUrl || (item.audioBase64 ? `data:audio/mpeg;base64,${item.audioBase64}` : null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium capitalize">{item.listeningType.replace('_', ' ')}</span>
        <span className="text-xs text-muted-foreground">({item.durationSeconds}s)</span>
      </div>

      {audioSrc ? (
        <audio controls className="w-full">
          <source src={audioSrc} type="audio/mpeg" />
        </audio>
      ) : (
        <p className="text-xs text-muted-foreground italic">Audio generating...</p>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Dialogue:</p>
        {item.dialogue.map((line, i) => (
          <div key={i} className="flex gap-2 text-sm">
            <span className="font-medium text-primary">{line.speaker}:</span>
            <span>{line.text}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        {item.questions.length} comprehension questions
      </div>
    </div>
  );
}
