import { movieClips, grammarPoints } from "@/lib/mock-data";
import { Play, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Watcher() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-glow mb-2">Watch Feed</h1>
          <p className="text-muted-foreground">Curated clips from the community.</p>
        </div>
        <div className="font-mono text-xs text-secondary animate-pulse">
          LIVE FEED ACTIVE
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {movieClips.map((clip) => (
          <div key={clip.id} className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
            {/* Video Thumbnail Area */}
            <div className="aspect-video relative overflow-hidden">
               <img 
                 src={clip.thumbnail} 
                 alt={clip.title} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80" />
               
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button size="icon" className="w-16 h-16 rounded-full bg-primary/90 hover:bg-primary text-white border-2 border-white/20">
                   <Play className="w-8 h-8 ml-1" />
                 </Button>
               </div>
               
               <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                 <div>
                   <h3 className="font-bold text-white text-lg font-serif leading-tight mb-1">{clip.title}</h3>
                   <div className="flex gap-2">
                     {clip.grammarIds.map(gid => {
                       const g = grammarPoints.find(p => p.id === gid);
                       return g ? (
                         <span key={gid} className="text-[10px] uppercase tracking-wider bg-white/20 backdrop-blur text-white px-2 py-0.5 rounded">
                           {g.pattern}
                         </span>
                       ) : null;
                     })}
                   </div>
                 </div>
                 <span className="font-mono text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                   {clip.duration}
                 </span>
               </div>
            </div>

            {/* Info / Interaction Area */}
            <div className="p-4 bg-card">
              <div className="flex justify-between items-start mb-4">
                 <p className="text-sm text-muted-foreground line-clamp-2">
                   {clip.description}
                 </p>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                      <Info className="w-4 h-4 mr-2" />
                      Analysis
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-2xl mb-4 border-b border-border pb-2">Grammar Analysis</DialogTitle>
                      <div className="space-y-6">
                        {clip.grammarIds.map(gid => {
                          const g = grammarPoints.find(p => p.id === gid);
                          return g ? (
                            <div key={gid} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-primary">{g.pattern}</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{g.category}</span>
                              </div>
                              <p className="font-medium text-foreground">{g.meaning}</p>
                              <div className="bg-muted/30 p-3 rounded border-l-2 border-secondary italic text-sm text-muted-foreground">
                                {g.example}
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
