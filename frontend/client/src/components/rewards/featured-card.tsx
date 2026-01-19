import { useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  useTodayFeatured,
  useRecordFeaturedImpression,
  useRecordFeaturedClick,
} from '@/lib/api';
import type { FeaturedContent } from '@/lib/api-types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star,
  TrendingUp,
  Sparkles,
  BookOpen,
  Languages,
  FileText,
  Headphones,
  PenTool,
  ArrowRight,
} from 'lucide-react';

const contentTypeIcons: Record<string, typeof BookOpen> = {
  grammar: BookOpen,
  vocabulary: Languages,
  kanji: PenTool,
  reading: FileText,
  listening: Headphones,
};

const contentTypeColors: Record<string, string> = {
  grammar: 'text-blue-500',
  vocabulary: 'text-green-500',
  kanji: 'text-purple-500',
  reading: 'text-orange-500',
  listening: 'text-pink-500',
};

const contentTypeLinks: Record<string, string> = {
  grammar: '/study/grammar',
  vocabulary: '/study/vocabulary',
  kanji: '/study/kanji',
  reading: '/study/reading',
  listening: '/study/listening',
};

interface FeaturedCardProps {
  variant?: 'default' | 'compact' | 'hero';
  showReason?: boolean;
}

export function FeaturedCard({ variant = 'default', showReason = true }: FeaturedCardProps) {
  const { data: featuredData, isLoading } = useTodayFeatured();
  const recordImpression = useRecordFeaturedImpression();
  const recordClick = useRecordFeaturedClick();

  const featured = featuredData?.featured;

  // Record impression when component mounts and featured content is available
  useEffect(() => {
    if (featured?.id) {
      recordImpression.mutate(featured.id);
    }
  }, [featured?.id]);

  const handleClick = () => {
    if (featured?.id) {
      recordClick.mutate(featured.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!featured) {
    return null;
  }

  const Icon = contentTypeIcons[featured.contentType] || BookOpen;
  const color = contentTypeColors[featured.contentType] || 'text-primary';
  const link = contentTypeLinks[featured.contentType] || '/study';

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <CardContent className="p-8 relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Featured Today
                  </Badge>
                  {showReason && featured.featureReason && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {featured.featureReason}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl bg-background ${color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {featured.contentType}
                    </p>
                    <h3 className="text-2xl font-bold">Featured Content</h3>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 max-w-md">
                  Today's top-picked {featured.contentType} content, selected based on quality and engagement.
                </p>

                <Link href={link} onClick={handleClick}>
                  <Button size="lg" className="group">
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              <div className="hidden lg:block">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sparkles className="h-24 w-24 text-primary/20" />
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={link} onClick={handleClick}>
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-primary/10 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-muted-foreground">Featured</span>
                </div>
                <p className="font-medium truncate capitalize">{featured.contentType}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />

        <CardContent className="p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">Featured Today</span>
            {showReason && featured.featureReason && (
              <Badge variant="outline" className="text-xs">
                {featured.featureReason}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-xl bg-muted ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {featured.contentType}
              </p>
              <h3 className="text-lg font-semibold">Top Pick</h3>
            </div>
          </div>

          <Link href={link} onClick={handleClick}>
            <Button className="w-full group">
              Study Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>{featured.impressions} views</span>
            <span>{featured.clicks} clicks</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function FeaturedBanner() {
  const { data: featuredData, isLoading } = useTodayFeatured();
  const recordClick = useRecordFeaturedClick();

  const featured = featuredData?.featured;

  if (isLoading || !featured) {
    return null;
  }

  const handleClick = () => {
    if (featured?.id) {
      recordClick.mutate(featured.id);
    }
  };

  const link = contentTypeLinks[featured.contentType] || '/study';
  const Icon = contentTypeIcons[featured.contentType] || BookOpen;
  const color = contentTypeColors[featured.contentType] || 'text-primary';

  return (
    <Link href={link} onClick={handleClick}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 cursor-pointer hover:from-primary/15 hover:via-primary/10 transition-colors"
      >
        <div className="container mx-auto flex items-center justify-center gap-4">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm">
            <span className="font-medium">Featured:</span>{' '}
            <span className="capitalize">{featured.contentType}</span>
            {featured.featureReason && (
              <span className="text-muted-foreground"> - {featured.featureReason}</span>
            )}
          </span>
          <Icon className={`h-4 w-4 ${color}`} />
          <ArrowRight className="h-4 w-4" />
        </div>
      </motion.div>
    </Link>
  );
}
