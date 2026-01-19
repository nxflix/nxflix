import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Search,
  Sparkles,
  Languages,
  PenTool,
  FileText,
  Headphones,
  BookOpen,
  ArrowRight,
  Bot,
  User,
  Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: {
    type: 'search' | 'create' | 'navigate';
    label: string;
    value: string;
  }[];
}

interface DiscoverChatbotProps {
  onSearch: (query: string) => void;
}

const quickActions = [
  { icon: Languages, label: 'Find Vocabulary', action: 'search', query: 'vocabulary' },
  { icon: PenTool, label: 'Find Kanji', action: 'search', query: 'kanji' },
  { icon: FileText, label: 'Find Reading', action: 'search', query: 'reading' },
  { icon: Headphones, label: 'Find Listening', action: 'search', query: 'listening' },
];

const suggestedPrompts = [
  'Show me business vocabulary',
  'Find kanji about emotions',
  'I want to practice listening',
  'Create a reading passage about technology',
  'Help me study grammar patterns',
];

export function DiscoverChatbot({ onSearch }: DiscoverChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your study assistant. I can help you find content or create new study materials. What would you like to do?",
      actions: [
        { type: 'search', label: 'Search content', value: '' },
        { type: 'create', label: 'Create content', value: '/create' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const generateResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase();

    // Search intents
    if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('show')) {
      let contentType = '';
      if (lowerQuery.includes('vocab')) contentType = 'vocabulary';
      else if (lowerQuery.includes('kanji')) contentType = 'kanji';
      else if (lowerQuery.includes('read')) contentType = 'reading';
      else if (lowerQuery.includes('listen')) contentType = 'listening';
      else if (lowerQuery.includes('grammar')) contentType = 'grammar';

      const searchTerm = contentType || query.replace(/find|search|show|me|the|a|an|some/gi, '').trim();

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: contentType
          ? `I found some ${contentType} content for you. Click below to see the results!`
          : `Let me search for "${searchTerm}" in our content library.`,
        actions: [
          { type: 'search', label: `Search: ${searchTerm}`, value: searchTerm },
        ],
      };
    }

    // Create intents
    if (lowerQuery.includes('create') || lowerQuery.includes('generate') || lowerQuery.includes('make')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Great! Let's create some new study content. I'll take you to the Content Creator where you can generate vocabulary, kanji, reading passages, or listening exercises.",
        actions: [
          { type: 'navigate', label: 'Go to Creator', value: '/create' },
        ],
      };
    }

    // Study/practice intents
    if (lowerQuery.includes('study') || lowerQuery.includes('practice') || lowerQuery.includes('learn')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Ready to study? You can either browse existing content here or go to the Study Dashboard for personalized practice based on your progress.",
        actions: [
          { type: 'navigate', label: 'Study Dashboard', value: '/study' },
          { type: 'search', label: 'Browse content', value: '' },
        ],
      };
    }

    // Help/general
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: "I can help you with:\n\n• **Finding content** - Search for vocabulary, kanji, reading, or listening materials\n• **Creating content** - Generate new AI-powered study materials\n• **Studying** - Go to your personalized study dashboard\n\nWhat would you like to do?",
      actions: [
        { type: 'search', label: 'Search content', value: '' },
        { type: 'navigate', label: 'Create content', value: '/create' },
        { type: 'navigate', label: 'Study', value: '/study' },
      ],
    };
  };

  const handleAction = (action: Message['actions'][0]) => {
    if (action.type === 'search') {
      onSearch(action.value);
      if (action.value) {
        setIsOpen(false);
      }
    }
    // Navigation is handled by Link component
  };

  const handleQuickAction = (query: string) => {
    onSearch(query);
    setIsOpen(false);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <Button
              size="lg"
              className="w-14 h-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)]"
          >
            <Card className="overflow-hidden shadow-2xl border-primary/20">
              {/* Header */}
              <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Study Assistant</h3>
                    <p className="text-xs text-primary-foreground/70">AI-powered help</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="p-3 border-b border-border/50 bg-muted/30">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 gap-1.5 text-xs"
                      onClick={() => handleQuickAction(action.query)}
                    >
                      <action.icon className="w-3 h-3" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-primary-foreground" />
                        ) : (
                          <Bot className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}
                      >
                        <div
                          className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.actions && message.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {message.actions.map((action, i) =>
                              action.type === 'navigate' ? (
                                <Link key={i} href={action.value}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs"
                                    onClick={() => setIsOpen(false)}
                                  >
                                    {action.label}
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                </Link>
                              ) : (
                                <Button
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs"
                                  onClick={() => handleAction(action)}
                                >
                                  <Search className="w-3 h-3" />
                                  {action.label}
                                </Button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Suggested Prompts */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedPrompts.slice(0, 3).map((prompt) => (
                      <Badge
                        key={prompt}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 text-xs"
                        onClick={() => handleSuggestedPrompt(prompt)}
                      >
                        {prompt}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border/50 bg-background">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
