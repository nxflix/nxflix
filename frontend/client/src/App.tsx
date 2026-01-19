import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { Nav } from "@/components/nav";
import { FloatingFocusButton } from "@/components/focus";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import RoleSelection from "@/pages/role-selection";
import Creator from "@/pages/creator";
import Watcher from "@/pages/watcher";
import Discover from "@/pages/discover";
import Focus from "@/pages/focus";
import StudyDashboard from "@/pages/study-dashboard";
import {
  GrammarStudy,
  VocabularyStudy,
  KanjiStudy,
  ReadingStudy,
  ListeningStudy,
} from "@/pages/study";
import Subscription from "@/pages/subscription";
import VideoStudio from "@/pages/video-studio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/role" component={RoleSelection} />
      <Route path="/discover" component={Discover} />
      <Route path="/focus" component={Focus} />
      <Route path="/create" component={Creator} />
      <Route path="/studio" component={VideoStudio} />
      <Route path="/watch" component={Watcher} />
      <Route path="/study" component={StudyDashboard} />
      <Route path="/study/grammar" component={GrammarStudy} />
      <Route path="/study/vocabulary" component={VocabularyStudy} />
      <Route path="/study/kanji" component={KanjiStudy} />
      <Route path="/study/reading" component={ReadingStudy} />
      <Route path="/study/listening" component={ListeningStudy} />
      <Route path="/subscribe" component={Subscription} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen font-sans bg-background text-foreground selection:bg-primary/30 selection:text-white">
          <Nav />
          <main>
            <Router />
          </main>
          <FloatingFocusButton />
          <Toaster />
        </div>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
