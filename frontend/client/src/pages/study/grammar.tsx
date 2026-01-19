import { useState } from 'react';
import { Link } from 'wouter';
import { useGrammar } from '@/lib/api';
import type { GrammarPoint } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GrammarStudy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const { data: grammar, isLoading } = useGrammar();

  // Filter by search
  const items = grammar?.filter(
    (g) =>
      !searchQuery ||
      g.pattern.includes(searchQuery) ||
      g.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );
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
                <BookOpen className="w-6 h-6 text-blue-500" />
                Grammar Study
              </h1>
              <p className="text-sm text-muted-foreground">
                {items?.length ?? 0} patterns available
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
            placeholder="Search grammar patterns..."
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
            <p className="text-lg font-medium">No grammar patterns yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Grammar patterns will appear here once generated
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card
              className="p-8 min-h-[400px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
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
                    <p className="text-4xl font-bold font-serif mb-4">{currentItem.pattern}</p>
                    <p className="text-lg text-muted-foreground">{currentItem.meaning}</p>
                    <p className="text-sm text-muted-foreground mt-6">Click to see example</p>
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
                    <p className="text-2xl font-bold font-serif mb-2">{currentItem.pattern}</p>
                    <p className="text-muted-foreground mb-6">{currentItem.meaning}</p>

                    <div className="bg-muted/50 p-4 rounded text-left">
                      <p className="text-lg">{currentItem.example}</p>
                    </div>

                    {currentItem.explanation && (
                      <div className="mt-4 text-sm text-left border-l-2 border-primary pl-4">
                        <p className="text-muted-foreground">{currentItem.explanation}</p>
                      </div>
                    )}

                    {currentItem.formationRules && currentItem.formationRules.length > 0 && (
                      <div className="mt-4 text-left">
                        <p className="text-xs text-muted-foreground mb-2">Formation:</p>
                        <ul className="text-sm space-y-1">
                          {currentItem.formationRules.map((rule, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {rule}
                            </li>
                          ))}
                        </ul>
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
