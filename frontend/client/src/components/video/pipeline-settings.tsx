import { useState, useEffect } from 'react';
import { Cpu, Mic2, Image, Film, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Types matching backend models
export interface PipelineConfig {
  scriptProvider: 'claude' | 'openai' | 'gemini';
  ttsProvider: 'elevenlabs' | 'openai' | 'google' | 'azure';
  imageProvider: 'dalle' | 'gemini' | 'stable_diffusion' | 'static';
  videoProvider: 'ffmpeg' | 'gemini_veo' | 'runway' | 'pika';
  ttsSettings: {
    voice?: string;
    speed: number;
    pitch: number;
  };
  imageSettings: {
    style?: string;
    generateBackground: boolean;
    generateCharacter: boolean;
  };
  videoSettings: {
    resolution: '720p' | '1080p' | '4k';
    fps: number;
    format: 'mp4' | 'webm';
  };
}

interface ProviderStatus {
  id: string;
  name: string;
  available: boolean;
  reason?: string;
  voices?: Array<{
    id: string;
    name: string;
    gender: string;
    language: string;
  }>;
}

interface ProvidersResponse {
  script: ProviderStatus[];
  tts: ProviderStatus[];
  image: ProviderStatus[];
  video: ProviderStatus[];
}

interface PipelineSettingsProps {
  config: PipelineConfig;
  onConfigChange: (config: PipelineConfig) => void;
  providers?: ProvidersResponse;
  isLoading?: boolean;
}

const DEFAULT_CONFIG: PipelineConfig = {
  scriptProvider: 'claude',
  ttsProvider: 'openai',
  imageProvider: 'static',
  videoProvider: 'ffmpeg',
  ttsSettings: {
    speed: 1.0,
    pitch: 0,
  },
  imageSettings: {
    generateBackground: false,
    generateCharacter: false,
  },
  videoSettings: {
    resolution: '1080p',
    fps: 30,
    format: 'mp4',
  },
};

export function PipelineSettings({
  config,
  onConfigChange,
  providers,
  isLoading = false,
}: PipelineSettingsProps) {
  const updateConfig = <K extends keyof PipelineConfig>(
    key: K,
    value: PipelineConfig[K]
  ) => {
    onConfigChange({ ...config, [key]: value });
  };

  const ProviderStatusIcon = ({ available }: { available: boolean }) => (
    available ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-400">Loading providers...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Info className="w-4 h-4" />
          <span>Configure which AI services to use for each step</span>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {/* Script Generation */}
          <AccordionItem value="script" className="border-white/10">
            <AccordionTrigger className="hover:bg-white/5 px-3 rounded">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Script Generation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pt-2">
              <div className="space-y-3">
                <Label className="text-xs text-gray-400">Provider</Label>
                <Select
                  value={config.scriptProvider}
                  onValueChange={(v) =>
                    updateConfig('scriptProvider', v as PipelineConfig['scriptProvider'])
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {providers?.script.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        disabled={!p.available}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <ProviderStatusIcon available={p.available} />
                          <span>{p.name}</span>
                          {p.id === 'claude' && (
                            <span className="text-xs text-purple-400">(Recommended)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Text-to-Speech */}
          <AccordionItem value="tts" className="border-white/10">
            <AccordionTrigger className="hover:bg-white/5 px-3 rounded">
              <div className="flex items-center gap-3">
                <Mic2 className="w-4 h-4 text-green-400" />
                <span>Voice Generation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Provider</Label>
                  <Select
                    value={config.ttsProvider}
                    onValueChange={(v) =>
                      updateConfig('ttsProvider', v as PipelineConfig['ttsProvider'])
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {providers?.tts.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={!p.available}
                        >
                          <div className="flex items-center gap-2">
                            <ProviderStatusIcon available={p.available} />
                            <span>{p.name}</span>
                            {p.id === 'elevenlabs' && (
                              <span className="text-xs text-yellow-400">(Premium)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Selection */}
                {providers?.tts.find((p) => p.id === config.ttsProvider)?.voices && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Voice</Label>
                    <Select
                      value={config.ttsSettings.voice}
                      onValueChange={(v) =>
                        updateConfig('ttsSettings', { ...config.ttsSettings, voice: v })
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        {providers.tts
                          .find((p) => p.id === config.ttsProvider)
                          ?.voices?.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.gender})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Image Generation */}
          <AccordionItem value="image" className="border-white/10">
            <AccordionTrigger className="hover:bg-white/5 px-3 rounded">
              <div className="flex items-center gap-3">
                <Image className="w-4 h-4 text-orange-400" />
                <span>Visual Generation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Provider</Label>
                  <Select
                    value={config.imageProvider}
                    onValueChange={(v) =>
                      updateConfig('imageProvider', v as PipelineConfig['imageProvider'])
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {providers?.image.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={!p.available}
                        >
                          <div className="flex items-center gap-2">
                            <ProviderStatusIcon available={p.available} />
                            <span>{p.name}</span>
                            {p.id === 'static' && (
                              <span className="text-xs text-gray-400">(Fast)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {config.imageProvider !== 'static' && (
                  <div className="space-y-3 p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">
                        Generate custom background
                      </Label>
                      <Switch
                        checked={config.imageSettings.generateBackground}
                        onCheckedChange={(checked) =>
                          updateConfig('imageSettings', {
                            ...config.imageSettings,
                            generateBackground: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">
                        Generate custom character
                      </Label>
                      <Switch
                        checked={config.imageSettings.generateCharacter}
                        onCheckedChange={(checked) =>
                          updateConfig('imageSettings', {
                            ...config.imageSettings,
                            generateCharacter: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Video Composition */}
          <AccordionItem value="video" className="border-white/10">
            <AccordionTrigger className="hover:bg-white/5 px-3 rounded">
              <div className="flex items-center gap-3">
                <Film className="w-4 h-4 text-purple-400" />
                <span>Video Rendering</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Provider</Label>
                  <Select
                    value={config.videoProvider}
                    onValueChange={(v) =>
                      updateConfig('videoProvider', v as PipelineConfig['videoProvider'])
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {providers?.video.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={!p.available}
                        >
                          <div className="flex items-center gap-2">
                            <ProviderStatusIcon available={p.available} />
                            <span>{p.name}</span>
                            {p.id === 'ffmpeg' && (
                              <span className="text-xs text-gray-400">(Fast, Local)</span>
                            )}
                            {p.id === 'gemini_veo' && (
                              <span className="text-xs text-purple-400">(AI Video)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Resolution</Label>
                  <Select
                    value={config.videoSettings.resolution}
                    onValueChange={(v) =>
                      updateConfig('videoSettings', {
                        ...config.videoSettings,
                        resolution: v as '720p' | '1080p' | '4k',
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Format</Label>
                  <Select
                    value={config.videoSettings.format}
                    onValueChange={(v) =>
                      updateConfig('videoSettings', {
                        ...config.videoSettings,
                        format: v as 'mp4' | 'webm',
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                      <SelectItem value="webm">WebM (VP9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  );
}

export { DEFAULT_CONFIG };
export type { ProvidersResponse };
