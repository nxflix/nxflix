import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Target, Timer, Film } from "lucide-react";
import heroImage from "@assets/generated_images/futuristic_tokyo_study_environment_with_holographic_japanese_characters.png";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Futuristic Study Room"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-3 py-1 mb-6 border border-primary/50 bg-primary/10 rounded-full">
              <span className="font-mono text-xs text-primary tracking-widest uppercase">
                Project: N1 Mastery
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-serif leading-tight mb-6 text-glow">
              Master Japanese <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Through Cinema
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Pass JLPT N1 in 1 year. Our Agentic AIs curate native movie clips tailored to the grammar patterns you need to learn. No textbooks, just immersion.
            </p>
            <div className="flex gap-4">
              <Link href="/role">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-14 text-lg font-mono rounded-none border-l-4 border-accent">
                  INITIALIZE STUDY
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden md:block relative"
          >
            <div className="glass-panel p-6 rounded-lg border-l-4 border-secondary max-w-md ml-auto">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                <Bot className="w-6 h-6 text-secondary" />
                <span className="font-mono text-sm text-secondary">AGENT: GRAMMAR_SEEKER_09</span>
              </div>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Target:</span>
                  <span className="text-foreground">JLPT N1</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Current Pattern:</span>
                  <span className="text-primary font-bold">～なり (As soon as)</span>
                </div>
                <div className="p-3 bg-black/40 rounded border border-border/50 text-xs">
                  <span className="text-green-400"> Found 3 clips match confidence &gt; 90%</span>
                  <div className="w-full bg-muted h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-green-400 h-full w-[90%]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Target}
              title="Laser Focus"
              desc="Select up to 3 grammar points at a time. Master them deeply before moving on."
            />
            <FeatureCard
              icon={Film}
              title="Native Context"
              desc="Learn from real movies and dramas, not sterile textbook examples."
            />
            <FeatureCard
              icon={Timer}
              title="1 Year Goal"
              desc="Optimized curriculum designed to get you from N2 to N1 passing grade in 365 days."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="p-6 border border-border/30 hover:border-primary/50 transition-colors bg-card/30 rounded-lg group">
      <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center rounded mb-4 group-hover:bg-secondary/20 transition-colors">
        <Icon className="w-6 h-6 text-secondary" />
      </div>
      <h3 className="text-xl font-bold font-serif mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
