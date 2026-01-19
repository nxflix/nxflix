import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Search,
  Languages,
  PenTool,
  FileText,
  Headphones,
  BookOpen,
  Play,
  Clock,
  User,
  Heart,
  Eye,
  Filter,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import type { ContentType } from '@/lib/api-types';
import { DiscoverChatbot } from '@/components/discover/chatbot';

// Mock data for demonstration - in production this would come from API
interface ContentCard {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  thumbnailUrl?: string;
  creator: {
    name: string;
    avatar?: string;
  };
  stats: {
    views: number;
    likes: number;
    duration?: string;
  };
  tags: string[];
  createdAt: string;
  level: string;
}

const MOCK_CONTENT: ContentCard[] = [
  {
    id: '1',
    type: 'vocabulary',
    title: 'Business Japanese - Essential Terms',
    description: '20 N1 vocabulary words commonly used in Japanese business settings',
    creator: { name: 'SakuraStudy' },
    stats: { views: 1234, likes: 89 },
    tags: ['business', 'keigo', 'formal'],
    createdAt: '2024-01-15',
    level: 'N1',
  },
  {
    id: '2',
    type: 'kanji',
    title: 'Rare Kanji Collection Vol. 1',
    description: 'Master these 15 rarely used but important N1 kanji characters',
    creator: { name: 'KanjiMaster' },
    stats: { views: 892, likes: 67 },
    tags: ['rare', 'advanced', 'jōyō'],
    createdAt: '2024-01-14',
    level: 'N1',
  },
  {
    id: '3',
    type: 'reading',
    title: 'Environmental Issues - Reading Passage',
    description: 'A challenging article about climate change in Japan with comprehension questions',
    creator: { name: 'ReadingPro' },
    stats: { views: 567, likes: 45, duration: '8 min' },
    tags: ['environment', 'news', 'opinion'],
    createdAt: '2024-01-13',
    level: 'N1',
  },
  {
    id: '4',
    type: 'listening',
    title: 'Office Conversation - Task Based',
    description: 'Listen to a workplace discussion and answer comprehension questions',
    creator: { name: 'ListenJapan' },
    stats: { views: 445, likes: 38, duration: '2 min' },
    tags: ['workplace', 'dialogue', 'task'],
    createdAt: '2024-01-12',
    level: 'N1',
  },
  {
    id: '5',
    type: 'vocabulary',
    title: 'Emotional Expressions Pack',
    description: 'Express complex emotions with these N1 vocabulary words',
    creator: { name: 'EmotionJP' },
    stats: { views: 2103, likes: 156 },
    tags: ['emotions', 'expressions', 'nuance'],
    createdAt: '2024-01-11',
    level: 'N1',
  },
  {
    id: '6',
    type: 'reading',
    title: 'Technology & Society Essay',
    description: 'Long-form reading about AI impact on Japanese society',
    creator: { name: 'TechReader' },
    stats: { views: 789, likes: 62, duration: '12 min' },
    tags: ['technology', 'AI', 'society'],
    createdAt: '2024-01-10',
    level: 'N1',
  },
  {
    id: '7',
    type: 'kanji',
    title: 'Medical Kanji Essentials',
    description: 'Kanji frequently appearing in medical contexts and news',
    creator: { name: 'MedicalJP' },
    stats: { views: 634, likes: 51 },
    tags: ['medical', 'science', 'specialized'],
    createdAt: '2024-01-09',
    level: 'N1',
  },
  {
    id: '8',
    type: 'listening',
    title: 'News Broadcast Comprehension',
    description: 'Practice listening to authentic NHK-style news broadcasts',
    creator: { name: 'NewsListenJP' },
    stats: { views: 1567, likes: 123, duration: '3 min' },
    tags: ['news', 'formal', 'broadcast'],
    createdAt: '2024-01-08',
    level: 'N1',
  },
  {
    id: '9',
    type: 'grammar',
    title: 'Advanced Grammar Patterns',
    description: 'Master these 10 essential N1 grammar patterns through examples',
    creator: { name: 'GrammarGuru' },
    stats: { views: 3456, likes: 234 },
    tags: ['patterns', 'formal', 'written'],
    createdAt: '2024-01-07',
    level: 'N1',
  },
  {
    id: '10',
    type: 'vocabulary',
    title: 'Academic Writing Vocabulary',
    description: 'Essential words for reading and writing academic Japanese',
    creator: { name: 'AcademicJP' },
    stats: { views: 923, likes: 78 },
    tags: ['academic', 'writing', 'formal'],
    createdAt: '2024-01-06',
    level: 'N1',
  },
  {
    id: '11',
    type: 'reading',
    title: 'Japanese Literature Excerpt',
    description: 'Read an excerpt from a famous Japanese novel with analysis',
    creator: { name: 'LitReader' },
    stats: { views: 445, likes: 67, duration: '15 min' },
    tags: ['literature', 'classic', 'analysis'],
    createdAt: '2024-01-05',
    level: 'N1',
  },
  {
    id: '12',
    type: 'listening',
    title: 'Interview Practice',
    description: 'Listen to a mock job interview in Japanese',
    creator: { name: 'CareerJP' },
    stats: { views: 1890, likes: 145, duration: '5 min' },
    tags: ['interview', 'career', 'keigo'],
    createdAt: '2024-01-04',
    level: 'N1',
  },
];

const contentTypeConfig: Record<ContentType, { icon: typeof BookOpen; label: string; color: string; bgColor: string }> = {
  grammar: { icon: BookOpen, label: 'Grammar', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  vocabulary: { icon: Languages, label: 'Vocabulary', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  kanji: { icon: PenTool, label: 'Kanji', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  reading: { icon: FileText, label: 'Reading', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  listening: { icon: Headphones, label: 'Listening', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
};

const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'vocabulary', label: 'Vocabulary', icon: Languages },
  { id: 'kanji', label: 'Kanji', icon: PenTool },
  { id: 'reading', label: 'Reading', icon: FileText },
  { id: 'listening', label: 'Listening', icon: Headphones },
  { id: 'grammar', label: 'Grammar', icon: BookOpen },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function ContentCardComponent({ content }: { content: ContentCard }) {
  const config = contentTypeConfig[content.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden group cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all border-border/50 hover:border-primary/30">
        {/* Thumbnail */}
        <div className={`aspect-video relative ${config.bgColor}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`w-16 h-16 ${config.color} opacity-30 group-hover:opacity-50 transition-opacity`} />
          </div>
          {content.stats.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {content.stats.duration}
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className={`${config.bgColor} ${config.color} border-0`}>
              {config.label}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
          </div>
        </div>

        {/* Content Info */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Creator Avatar */}
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {content.creator.avatar ? (
                <img src={content.creator.avatar} alt={content.creator.name} className="w-full h-full rounded-full" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {content.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{content.creator.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatNumber(content.stats.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {formatNumber(content.stats.likes)}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {content.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ContentSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video" />
      <div className="p-4">
        <div className="flex gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Discover() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredContent = useMemo(() => {
    let filtered = MOCK_CONTENT;

    // Filter by category
    if (selectedCategory !== 'all' && selectedCategory !== 'trending') {
      filtered = filtered.filter((c) => c.type === selectedCategory);
    }

    // Sort by trending (views + likes)
    if (selectedCategory === 'trending') {
      filtered = [...filtered].sort((a, b) => (b.stats.views + b.stats.likes * 10) - (a.stats.views + a.stats.likes * 10));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query)) ||
          c.creator.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen pb-40">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Discover
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                {MOCK_CONTENT.length} items
              </Badge>
            </div>
          </div>

          {/* Category Pills */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2 rounded-full"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <ContentSkeleton key={i} />
              ))}
            </div>
          ) : filteredContent.length > 0 ? (
            <motion.div
              key={selectedCategory + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredContent.map((content) => (
                <ContentCardComponent key={content.id} content={content} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No content found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Search Bar */}
      <div className="fixed bottom-20 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 p-4 z-30">
        <div className="container mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search content by title, tag, or creator..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 h-12 rounded-full bg-muted/50 border-border/50 focus:border-primary"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <DiscoverChatbot onSearch={handleSearch} />
    </div>
  );
}
