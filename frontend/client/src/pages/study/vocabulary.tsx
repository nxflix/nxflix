import { useState } from 'react';
import { Link } from 'wouter';
import { useVocabulary, useVocabularySearch, useSynthesizeSpeech } from '@/lib/api';
import type { VocabularyItem } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Languages,
  Search,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VocabularyStudy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  const { data: vocabulary, isLoading } = useVocabulary();
  const { data: searchResults } = useVocabularySearch(searchQuery);
  const synthesize = useSynthesizeSpeech();

  const items = searchQuery ? searchResults : vocabulary;
  const currentItem = items?.[currentIndex];

  const handleNext = () => {
    setShowMeaning(false);
    setCurrentIndex((prev) => (prev + 1) % (items?.length || 1));
  };

  const handlePrev = () => {
    setShowMeaning(false);
    setCurrentIndex((prev) => (prev - 1 + (items?.length || 1)) % (items?.length || 1));
  };

  const handlePlayAudio = async () => {
    if (!currentItem || playingAudio) return;

    setPlayingAudio(true);
    try {
      const result = await synthesize.mutateAsync({ text: currentItem.word });
      const audio = new Audio(result.audioUrl);
      audio.onended = () => setPlayingAudio(false);
      audio.onerror = () => setPlayingAudio(false);
      await audio.play();
    } catch {
      setPlayingAudio(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/study">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
                <Languages className="w-6 h-6 text-green-500" />
                Vocabulary Study
              </h1>
              <p className="text-sm text-muted-foreground">
                {items?.length ?? 0} words available
              </p>
            </div>
          </div>
          <Link href="/create">
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate More
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
            className="pl-10"
          />
        </div>

        {/* Flashcard */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !currentItem ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No vocabulary items yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate some vocabulary to start studying
            </p>
            <Link href="/create">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Vocabulary
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card
              className="p-8 min-h-[400px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={() => setShowMeaning(!showMeaning)}
            >
              <AnimatePresence mode="wait">
                {!showMeaning ? (
                  <motion.div
                    key="front"
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <p className="text-5xl font-bold mb-4">{currentItem.word}</p>
                    <p className="text-2xl text-muted-foreground">{currentItem.reading}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio();
                      }}
                      disabled={playingAudio}
                    >
                      {playingAudio ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-6">Click to reveal meaning</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center max-w-lg"
                  >
                    <span className="text-xs bg-muted px-2 py-1 rounded mb-4 inline-block">
                      {currentItem.partOfSpeech}
                    </span>
                    <p className="text-2xl font-semibold mb-4">
                      {currentItem.meanings.join('; ')}
                    </p>
                    {currentItem.examples.length > 0 && (
                      <div className="mt-6 text-left border-l-2 border-primary pl-4">
                        <p className="text-lg">{currentItem.examples[0].sentence}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentItem.examples[0].translation}
                        </p>
                      </div>
                    )}
                    {currentItem.synonyms.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className="text-xs text-muted-foreground">Synonyms:</span>
                        {currentItem.synonyms.map((syn, i) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {syn}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handlePrev} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {items?.length ?? 0}
              </span>
              <Button variant="outline" onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
