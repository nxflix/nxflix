import { useState as useReactState } from "react";
import { grammarPoints, movieClips } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Creator() {
  const [selectedGrammar, setSelectedGrammar] = useReactState<string[]>([]);
  const [isGenerating, setIsGenerating] = useReactState(false);
  const [generatedClips, setGeneratedClips] = useReactState<any[]>([]);
  const { toast } = useToast();

  const toggleGrammar = (id: string) => {
    if (selectedGrammar.includes(id)) {
      setSelectedGrammar(prev => prev.filter(g => g !== id));
    } else {
      if (selectedGrammar.length >= 3) {
        toast({
          title: "Limit Reached",
          description: "You can only focus on 3 grammar patterns at a time.",
          variant: "destructive",
        });
        return;
      }
      setSelectedGrammar(prev => [...prev, id]);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI Agent work
    setTimeout(() => {
      setIsGenerating(false);
      // Filter mock clips that match selected grammar (or just random ones for demo)
      const matches = movieClips.filter(c => 
        c.grammarIds.some(gid => selectedGrammar.includes(gid))
      );
      // If no matches found in mock data, just show some random ones for the prototype feel
      setGeneratedClips(matches.length > 0 ? matches : [movieClips[0]]);
      
      toast({
        title: "Mission Complete",
        description: `Agents found ${matches.length || 1} relevant clips.`,
      });
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Panel: Grammar Selection */}
        <div className="md:w-1/3 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Select Patterns
            </h2>
            <p className="text-sm text-muted-foreground">Choose max 3 patterns to target.</p>
          </div>

          <div className="grid gap-3">
            {grammarPoints.map((grammar) => (
              <Card 
                key={grammar.id}
                className={`p-4 cursor-pointer transition-all border-l-4 ${
                  selectedGrammar.includes(grammar.id) 
                    ? "border-l-primary bg-primary/5 shadow-lg shadow-primary/10" 
                    : "border-l-transparent hover:border-l-primary/30"
                }`}
                onClick={() => toggleGrammar(grammar.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={selectedGrammar.includes(grammar.id)} 
                    className="mt-1"
                  />
                  <div>
                    <h3 className="font-bold text-lg font-serif">{grammar.pattern}</h3>
                    <p className="text-sm text-muted-foreground">{grammar.meaning}</p>
                    <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border pl-2">
                      "{grammar.example}"
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button 
            size="lg" 
            className="w-full font-mono text-lg h-14 bg-primary hover:bg-primary/90 relative overflow-hidden"
            disabled={selectedGrammar.length === 0 || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                AGENTS SEARCHING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                DEPLOY AGENTS
                <span className="absolute right-0 top-0 bottom-0 w-2 bg-accent opacity-50" />
              </span>
            )}
          </Button>
        </div>

        {/* Right Panel: Results / Terminal */}
        <div className="md:w-2/3">
          <div className="bg-black/40 rounded-lg border border-border min-h-[600px] p-6 relative overflow-hidden">
            {/* Scanline effect */}
            <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />

            {!isGenerating && generatedClips.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center">
                  <Bot className="w-8 h-8" />
                </div>
                <p className="font-mono text-sm">AWAITING TARGET PARAMETERS...</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                 <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs font-mono text-primary mb-2">
                      <span>SCANNING DATABASE...</span>
                      <span>45%</span>
                    </div>
                    <div className="h-1 bg-muted w-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, ease: "linear" }}
                      />
                    </div>
                 </div>
                 <div className="font-mono text-xs text-green-400 space-y-1 opacity-70">
                   <p>&gt; Accessing localized archives...</p>
                   <p>&gt; Analyzing audio waveforms...</p>
                   <p>&gt; Matching grammar pattern '～なり'...</p>
                 </div>
              </div>
            )}

            {generatedClips.length > 0 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <h3 className="font-mono text-green-400">SEARCH RESULTS COMPLETE</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    {generatedClips.length} FOUND
                  </span>
                </div>
                
                <div className="grid gap-6">
                  {generatedClips.map((clip) => (
                    <div key={clip.id} className="group relative bg-card/50 border border-border hover:border-primary/50 transition-colors rounded overflow-hidden">
                      <div className="aspect-video w-full relative">
                        <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 text-white ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
                          {clip.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg line-clamp-1">{clip.title}</h4>
                          <span className="text-xs font-mono text-muted-foreground border border-border px-1 rounded">
                            {clip.agentName}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {clip.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {clip.grammarIds.map((gid: string) => {
                             const g = grammarPoints.find(p => p.id === gid);
                             return g ? (
                               <span key={gid} className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded font-serif">
                                 {g.pattern}
                               </span>
                             ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bot({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
