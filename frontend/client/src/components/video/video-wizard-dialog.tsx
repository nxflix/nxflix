import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Mic,
  FileText,
  Image,
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CharacterStyle, VideoStyle, VideoCreateRequest } from '@/lib/api-types';

interface VideoWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (request: VideoCreateRequest) => Promise<void>;
  isGenerating: boolean;
  voices?: Array<{ id: string; name: string; gender: string }>;
}

// Avatar data
const avatars = [
  { id: 'angela', name: 'Angela', style: 'anime_female' as CharacterStyle },
  { id: 'marcus', name: 'Marcus', style: 'anime_male' as CharacterStyle },
  { id: 'yuki', name: 'Yuki', style: 'realistic_female' as CharacterStyle },
  { id: 'david', name: 'David', style: 'realistic_male' as CharacterStyle },
  { id: 'sarah', name: 'Sarah', style: 'chibi' as CharacterStyle },
];

const avatarStyles = ['Professional', 'Casual', 'Animated'];

// Background scenes
const scenes: { id: VideoStyle; name: string; gradient: string }[] = [
  { id: 'classroom', name: 'Office', gradient: 'from-slate-700 to-slate-800' },
  { id: 'abstract', name: 'Studio', gradient: 'from-purple-900/50 to-slate-800' },
  { id: 'cafe', name: 'Home', gradient: 'from-amber-900/30 to-slate-800' },
  { id: 'nature', name: 'Outdoor', gradient: 'from-emerald-900/30 to-slate-800' },
];

const steps = [
  { id: 1, title: 'Avatar', icon: User, description: 'Choose your presenter' },
  { id: 2, title: 'Voice', icon: Mic, description: 'Select voice & language' },
  { id: 3, title: 'Script', icon: FileText, description: 'Write your content' },
  { id: 4, title: 'Scene', icon: Image, description: 'Pick a background' },
];

export function VideoWizardDialog({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  voices = [],
}: VideoWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [avatarStyle, setAvatarStyle] = useState('Professional');
  const [voice, setVoice] = useState('shimmer');
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [script, setScript] = useState('');
  const [selectedScene, setSelectedScene] = useState(scenes[0]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedAvatar;
      case 2:
        return !!voice;
      case 3:
        return script.trim().length > 0;
      case 4:
        return !!selectedScene;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    await onGenerate({
      prompt: script,
      userId: 'demo-user',
      characterStyle: selectedAvatar.style,
      videoStyle: selectedScene.id,
      voice,
      maxDurationSeconds: 60,
    });
    onOpenChange(false);
    // Reset to first step for next time
    setCurrentStep(1);
  };

  const resetAndClose = () => {
    setCurrentStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#12121f] border-white/10 text-white p-0 gap-0">
        {/* Header with Steps */}
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <DialogTitle className="text-xl font-semibold">Create Video</DialogTitle>
          <DialogDescription className="text-gray-400">
            Follow the steps to create your AI-powered video
          </DialogDescription>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-colors',
                    currentStep === step.id
                      ? 'text-purple-400'
                      : currentStep > step.id
                      ? 'text-green-400'
                      : 'text-gray-500'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      currentStep === step.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : currentStep > step.id
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-gray-600 bg-gray-800'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 mx-2 transition-colors',
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="p-6 min-h-[320px]">
          {/* Step 1: Avatar Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Choose Your Avatar</h3>
              <p className="text-sm text-gray-400">
                Select a character to present your video content
              </p>

              <div className="grid grid-cols-5 gap-3 mt-4">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={cn(
                      'relative rounded-xl overflow-hidden aspect-square bg-gradient-to-br from-purple-900/30 to-slate-800 border-2 transition-all',
                      selectedAvatar.id === avatar.id
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-transparent hover:border-white/20'
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-purple-300" />
                      </div>
                    </div>
                    {selectedAvatar.id === avatar.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-center gap-2 text-xs text-gray-400">
                {avatars.map((avatar) => (
                  <span
                    key={avatar.id}
                    className={cn(
                      'w-16 text-center truncate',
                      selectedAvatar.id === avatar.id && 'text-white font-medium'
                    )}
                  >
                    {avatar.name}
                  </span>
                ))}
              </div>

              {/* Avatar Style */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400 mb-3">Avatar Style</p>
                <div className="flex gap-2">
                  {avatarStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setAvatarStyle(style)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        avatarStyle === style
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Voice Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Voice & Language</h3>
              <p className="text-sm text-gray-400">
                Choose a voice for your video narration
              </p>

              <div className="mt-4">
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-12">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {voices.length > 0 ? (
                      voices.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="text-white hover:bg-white/10">
                          {v.name} ({v.gender})
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="shimmer" className="text-white hover:bg-white/10">
                          Shimmer (Female)
                        </SelectItem>
                        <SelectItem value="alloy" className="text-white hover:bg-white/10">
                          Alloy (Neutral)
                        </SelectItem>
                        <SelectItem value="echo" className="text-white hover:bg-white/10">
                          Echo (Male)
                        </SelectItem>
                        <SelectItem value="nova" className="text-white hover:bg-white/10">
                          Nova (Female)
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Preview */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Voice Preview</span>
                  <button className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors">
                    <Play className="w-5 h-5 ml-0.5" />
                  </button>
                </div>
                <div className="h-1 bg-white/10 rounded-full">
                  <div className="h-full w-0 bg-purple-500 rounded-full" />
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">0:00</div>
              </div>

              {/* Speed & Pitch */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Speed</span>
                    <span className="text-sm text-white">{speed[0].toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="[&_[role=slider]]:bg-purple-500"
                  />
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Pitch</span>
                    <span className="text-sm text-white">{pitch[0]}</span>
                  </div>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    min={-10}
                    max={10}
                    step={1}
                    className="[&_[role=slider]]:bg-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Script */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Write Your Script</h3>
              <p className="text-sm text-gray-400">
                Enter the text content for your video
              </p>

              <div className="relative mt-4">
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Enter your script here... AI will help optimize it for better delivery."
                  className="min-h-[180px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none pr-20"
                  maxLength={500}
                />
                <button className="absolute bottom-3 right-3 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Enhance
                </button>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{script.length} / 500 characters</span>
                <span>~{Math.min(Math.ceil(script.length / 10), 60)}s duration</span>
              </div>
            </div>
          )}

          {/* Step 4: Scene Selection */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Choose Your Scene</h3>
              <p className="text-sm text-gray-400">
                Select a background for your video
              </p>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(scene)}
                    className={cn(
                      'relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br border-2 transition-all p-4 flex items-end',
                      scene.gradient,
                      selectedScene.id === scene.id
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-transparent hover:border-white/20'
                    )}
                  >
                    <span className="text-sm font-medium">{scene.name}</span>
                    {selectedScene.id === scene.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl">
                <h4 className="text-sm font-medium mb-3">Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avatar:</span>
                    <span>{selectedAvatar.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Voice:</span>
                    <span className="capitalize">{voice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scene:</span>
                    <span>{selectedScene.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span>~{Math.min(Math.ceil(script.length / 10), 60)}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="p-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-purple-600 hover:bg-purple-500"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!canProceed() || isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
