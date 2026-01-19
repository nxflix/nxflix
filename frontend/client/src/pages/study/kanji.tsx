import { useState } from 'react';
import { Link } from 'wouter';
import { useKanji, useKanjiSearch } from '@/lib/api';
import type { KanjiItem } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PenTool,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KanjiStudy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');

  const { data: kanji, isLoading } = useKanji();
  const { data: searchResults } = useKanjiSearch(searchQuery);

  const items = searchQuery ? searchResults : kanji;
  const currentItem = items?.[currentIndex];

  const handleNext = () => {
    setShowDetails(false);
    setCurrentIndex((prev) => (prev + 1) % (items?.length || 1));
  };

  const handlePrev = () => {
    setShowDetails(false);
    setCurrentIndex((prev) => (prev - 1 + (items?.length || 1)) % (items?.length || 1));
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
                <PenTool className="w-6 h-6 text-purple-500" />
                Kanji Study
              </h1>
              <p className="text-sm text-muted-foreground">
                {items?.length ?? 0} kanji available
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="card">Card</TabsTrigger>
                <TabsTrigger value="grid">Grid</TabsTrigger>
              </TabsList>
            </Tabs>
            <Link href="/create">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search kanji by character or meaning..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !items?.length ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No kanji items yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate some kanji to start studying
            </p>
            <Link href="/create">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Kanji
              </Button>
            </Link>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {items.map((item, idx) => (
              <Card
                key={item.id}
                className={`p-3 text-center cursor-pointer hover:border-primary/50 transition-colors ${
                  idx === currentIndex ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => {
                  setCurrentIndex(idx);
                  setViewMode('card');
                }}
              >
                <p className="text-3xl font-bold">{item.character}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {item.meanings[0]}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          /* Card View */
          <div className="space-y-4">
            {currentItem && (
              <Card
                className="p-8 min-h-[450px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
                onClick={() => setShowDetails(!showDetails)}
              >
                <AnimatePresence mode="wait">
                  {!showDetails ? (
                    <motion.div
                      key="front"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <p className="text-8xl font-bold mb-6">{currentItem.character}</p>
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span>{currentItem.strokeCount} strokes</span>
                        <span>|</span>
                        <span>JLPT {currentItem.level}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-6">Click to reveal details</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-md"
                    >
                      <div className="text-center mb-6">
                        <p className="text-5xl font-bold mb-2">{currentItem.character}</p>
                        <p className="text-lg font-semibold">{currentItem.meanings.join(', ')}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-muted/50 p-3 rounded">
                          <p className="text-xs text-muted-foreground mb-1">On'yomi (音読み)</p>
                          <p className="font-medium">{currentItem.onyomi.join('、') || '—'}</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Kun'yomi (訓読み)</p>
                          <p className="font-medium">{currentItem.kunyomi.join('、') || '—'}</p>
                        </div>
                      </div>

                      {currentItem.radicals.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-1">Radicals</p>
                          <div className="flex flex-wrap gap-2">
                            {currentItem.radicals.map((r, i) => (
                              <span key={i} className="text-lg bg-muted px-2 py-1 rounded">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentItem.compoundWords.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            Compound Words
                          </p>
                          <div className="space-y-2">
                            {currentItem.compoundWords.slice(0, 3).map((compound, i) => (
                              <div key={i} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                <span className="font-medium">{compound.word}</span>
                                <span className="text-muted-foreground">{compound.reading}</span>
                                <span className="text-xs">{compound.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentItem.mnemonics && (
                        <div className="mt-4 text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
                          {currentItem.mnemonics}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}

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
