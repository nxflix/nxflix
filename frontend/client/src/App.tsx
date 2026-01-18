import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Nav } from "@/components/nav";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import RoleSelection from "@/pages/role-selection";
import Creator from "@/pages/creator";
import Watcher from "@/pages/watcher";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/role" component={RoleSelection} />
      <Route path="/create" component={Creator} />
      <Route path="/watch" component={Watcher} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen font-sans bg-background text-foreground selection:bg-primary/30 selection:text-white">
        <Nav />
        <main>
          <Router />
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
