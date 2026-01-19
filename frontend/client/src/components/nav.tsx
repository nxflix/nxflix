import { Link, useLocation } from "wouter";
import { Zap, Film, Menu, BookOpen, Sparkles, Crown, Compass, Target } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth";

export function Nav() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Zap },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/focus", label: "Focus", icon: Target },
    { href: "/study", label: "Study", icon: BookOpen },
    { href: "/create", label: "Create", icon: Sparkles },
    { href: "/studio", label: "Studio", icon: Film },
    { href: "/subscribe", label: "Premium", icon: Crown },
  ];

  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm group-hover:bg-primary/90 transition-colors">
              <span className="font-mono font-bold text-primary-foreground text-lg">N1</span>
            </div>
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:block">
              Agentic Study
            </span>
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </a>
            </Link>
          ))}
          <LoginButton />
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2">
          <LoginButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card border-l-border">
              <div className="flex flex-col gap-6 mt-8">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 text-lg font-medium ${
                        location === item.href ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
