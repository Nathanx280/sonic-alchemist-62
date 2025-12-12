import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mic2, Drum, Music, Guitar, Sliders, 
  Volume2, VolumeX, Lock, Unlock, Sparkles 
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StemLevels {
  vocals: number;
  drums: number;
  bass: number;
  melody: number;
}

interface StemSeparationProps {
  trackId: string;
  trackName: string;
  stems: StemLevels;
  onStemsChange: (trackId: string, stems: StemLevels) => void;
  aiRecommended?: StemLevels;
}

const STEM_CONFIG = [
  { 
    key: 'vocals' as keyof StemLevels, 
    label: 'Vocals', 
    icon: Mic2, 
    color: 'text-neon-pink',
    bgColor: 'bg-neon-pink/20',
    gradient: 'from-neon-pink to-neon-purple'
  },
  { 
    key: 'drums' as keyof StemLevels, 
    label: 'Drums', 
    icon: Drum, 
    color: 'text-neon-cyan',
    bgColor: 'bg-neon-cyan/20',
    gradient: 'from-neon-cyan to-neon-blue'
  },
  { 
    key: 'bass' as keyof StemLevels, 
    label: 'Bass', 
    icon: Music, 
    color: 'text-neon-purple',
    bgColor: 'bg-neon-purple/20',
    gradient: 'from-neon-purple to-neon-pink'
  },
  { 
    key: 'melody' as keyof StemLevels, 
    label: 'Melody', 
    icon: Guitar, 
    color: 'text-neon-green',
    bgColor: 'bg-neon-green/20',
    gradient: 'from-neon-green to-neon-cyan'
  },
];

const StemSeparation = ({
  trackId,
  trackName,
  stems,
  onStemsChange,
  aiRecommended,
}: StemSeparationProps) => {
  const [lockedStems, setLockedStems] = useState<Set<keyof StemLevels>>(new Set());
  const [soloStem, setSoloStem] = useState<keyof StemLevels | null>(null);

  const handleStemChange = (key: keyof StemLevels, value: number) => {
    if (lockedStems.has(key)) return;
    onStemsChange(trackId, { ...stems, [key]: value });
  };

  const toggleLock = (key: keyof StemLevels) => {
    setLockedStems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSolo = (key: keyof StemLevels) => {
    if (soloStem === key) {
      setSoloStem(null);
      // Restore all stems
      onStemsChange(trackId, { vocals: 0.8, drums: 1, bass: 0.9, melody: 0.7 });
    } else {
      setSoloStem(key);
      // Solo this stem, mute others
      const newStems: StemLevels = { vocals: 0, drums: 0, bass: 0, melody: 0 };
      newStems[key] = 1;
      onStemsChange(trackId, newStems);
    }
  };

  const applyAIRecommendations = () => {
    if (aiRecommended) {
      onStemsChange(trackId, aiRecommended);
    }
  };

  const resetStems = () => {
    setSoloStem(null);
    onStemsChange(trackId, { vocals: 0.8, drums: 1, bass: 0.9, melody: 0.7 });
  };

  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/30">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neon-cyan" />
            <span className="truncate max-w-[150px]">{trackName}</span>
          </div>
          <div className="flex items-center gap-2">
            {aiRecommended && (
              <Button
                variant="ghost"
                size="sm"
                onClick={applyAIRecommendations}
                className="h-7 text-xs gap-1 text-neon-purple hover:text-neon-purple"
              >
                <Sparkles className="w-3 h-3" />
                AI
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetStems}
              className="h-7 text-xs"
            >
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-2 px-4">
        {STEM_CONFIG.map(({ key, label, icon: Icon, color, bgColor, gradient }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={`text-xs flex items-center gap-2 ${color}`}>
                <div className={`p-1 rounded ${bgColor}`}>
                  <Icon className="w-3 h-3" />
                </div>
                {label}
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(stems[key] * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${soloStem === key ? 'text-neon-green' : 'text-muted-foreground'}`}
                  onClick={() => toggleSolo(key)}
                  title={soloStem === key ? "Unsolo" : "Solo"}
                >
                  {stems[key] > 0 ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${lockedStems.has(key) ? 'text-neon-yellow' : 'text-muted-foreground'}`}
                  onClick={() => toggleLock(key)}
                  title={lockedStems.has(key) ? "Unlock" : "Lock"}
                >
                  {lockedStems.has(key) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Slider
                value={[stems[key] * 100]}
                onValueChange={([v]) => handleStemChange(key, v / 100)}
                max={100}
                disabled={lockedStems.has(key)}
                className="w-full"
              />
              {/* AI Recommendation Marker */}
              {aiRecommended && (
                <motion.div
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-gradient-to-b ${gradient} rounded opacity-60`}
                  style={{ left: `${aiRecommended[key] * 100}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  title={`AI recommends: ${Math.round(aiRecommended[key] * 100)}%`}
                />
              )}
            </div>
          </div>
        ))}

        {/* Visual Stem Mix */}
        <div className="pt-2 border-t border-border/30">
          <Label className="text-xs text-muted-foreground mb-2 block">Stem Mix Preview</Label>
          <div className="flex gap-1 h-8">
            {STEM_CONFIG.map(({ key, gradient }) => (
              <motion.div
                key={key}
                className={`flex-1 bg-gradient-to-t ${gradient} rounded opacity-60`}
                animate={{ 
                  height: `${stems[key] * 100}%`,
                  opacity: stems[key] > 0 ? 0.6 : 0.1 
                }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StemSeparation;
