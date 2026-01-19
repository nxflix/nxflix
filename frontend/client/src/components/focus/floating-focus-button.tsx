import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

export function FloatingFocusButton() {
  const [location] = useLocation();

  // Don't show on the focus page itself
  if (location === '/focus') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <Link href="/focus">
          <Button
            size="lg"
            className="h-14 px-6 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all gap-2 bg-primary text-primary-foreground"
          >
            <Target className="w-5 h-5" />
            <span className="font-medium">Focus</span>
          </Button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
