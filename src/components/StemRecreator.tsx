import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wand2, Sparkles, Mic2, Drum, Music, Guitar, 
  Loader2, Check, RefreshCw, Zap, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StemRecreation {
  variationName: string;
  description: string;
  techniques: string[];
  effects: string[];
  interactionNotes: string;
  energyLevel: number;
  complexity: number;
}

interface StemRecreatorProps {
  trackId: string;
  trackName: string;
  originalBpm?: number;
  originalKey?: string;
  onRecreationComplete?: (stemType: string, recreation: StemRecreation) => void;
}

const STEM_TYPES = [
  { key: 'vocals', label: 'Vocals', icon: Mic2, color: 'text-neon-pink', bgColor: 'bg-neon-pink/20' },
  { key: 'drums', label: 'Drums', icon: Drum, color: 'text-neon-cyan', bgColor: 'bg-neon-cyan/20' },
  { key: 'bass', label: 'Bass', icon: Music, color: 'text-neon-purple', bgColor: 'bg-neon-purple/20' },
  { key: 'melody', label: 'Melody', icon: Guitar, color: 'text-neon-green', bgColor: 'bg-neon-green/20' },
] as const;

const REMIX_STYLES = [
  { value: 'electronic', label: 'Electronic' },
  { value: 'acoustic', label: 'Acoustic' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'rock', label: 'Rock' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
  { value: 'lo-fi', label: 'Lo-Fi' },
  { value: 'future-bass', label: 'Future Bass' },
  { value: 'trap', label: 'Trap' },
  { value: 'ambient', label: 'Ambient' },
];

const StemRecreator = ({
  trackId,
  trackName,
  originalBpm,
  originalKey,
  onRecreationComplete,
}: StemRecreatorProps) => {
  const [selectedStem, setSelectedStem] = useState<typeof STEM_TYPES[number]['key']>('vocals');
  const [style, setStyle] = useState('electronic');
  const [intensity, setIntensity] = useState(50);
  const [isRecreating, setIsRecreating] = useState(false);
  const [recreations, setRecreations] = useState<Record<string, StemRecreation>>({});

  const handleRecreate = async () => {
    setIsRecreating(true);
    
    try {
      toast.info(`Recreating ${selectedStem} stem...`, {
        description: `Applying ${style} style at ${intensity}% intensity`
      });

      const { data, error } = await supabase.functions.invoke('recreate-stems', {
        body: {
          trackName,
          stemType: selectedStem,
          style,
          intensity,
          originalBpm,
          originalKey,
        }
      });

      if (error) throw error;

      if (data?.recreation) {
        setRecreations(prev => ({
          ...prev,
          [selectedStem]: data.recreation
        }));
        
        onRecreationComplete?.(selectedStem, data.recreation);
        
        toast.success(`${selectedStem} stem recreated!`, {
          description: data.recreation.variationName
        });
      }
    } catch (error: any) {
      console.error('Stem recreation error:', error);
      toast.error('Failed to recreate stem', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsRecreating(false);
    }
  };

  const currentRecreation = recreations[selectedStem];

  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/30">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-neon-purple" />
          AI Stem Recreator
          <Badge variant="secondary" className="ml-auto text-[10px]">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-2 px-4">
        {/* Stem Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Select Stem to Recreate</Label>
          <div className="grid grid-cols-4 gap-2">
            {STEM_TYPES.map(({ key, label, icon: Icon, color, bgColor }) => (
              <Button
                key={key}
                variant={selectedStem === key ? "default" : "outline"}
                size="sm"
                className={`flex flex-col h-auto py-2 px-1 gap-1 ${
                  selectedStem === key 
                    ? 'bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border-neon-purple' 
                    : ''
                }`}
                onClick={() => setSelectedStem(key)}
              >
                <div className={`p-1 rounded ${bgColor}`}>
                  <Icon className={`w-3 h-3 ${color}`} />
                </div>
                <span className="text-[10px]">{label}</span>
                {recreations[key] && (
                  <Check className="w-3 h-3 text-neon-green absolute top-1 right-1" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Remix Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REMIX_STYLES.map(s => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Transformation Intensity</Label>
            <span className="text-xs text-neon-cyan">{intensity}%</span>
          </div>
          <Slider
            value={[intensity]}
            onValueChange={([v]) => setIntensity(v)}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Subtle</span>
            <span>Dramatic</span>
          </div>
        </div>

        {/* Recreate Button */}
        <Button
          onClick={handleRecreate}
          disabled={isRecreating}
          className="w-full bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-pink hover:to-neon-purple"
        >
          {isRecreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Recreating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Recreate {STEM_TYPES.find(s => s.key === selectedStem)?.label}
            </>
          )}
        </Button>

        {/* Recreation Result */}
        <AnimatePresence>
          {currentRecreation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-3 border-t border-border/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neon-cyan">
                  {currentRecreation.variationName}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    <Zap className="w-3 h-3 mr-1" />
                    Energy: {currentRecreation.energyLevel}/10
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {currentRecreation.description}
              </p>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Techniques
                </Label>
                <div className="flex flex-wrap gap-1">
                  {currentRecreation.techniques.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Effects
                </Label>
                <div className="flex flex-wrap gap-1">
                  {currentRecreation.effects.map((effect, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-neon-purple/30">
                      {effect}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground italic">
                <Volume2 className="w-3 h-3 inline mr-1" />
                {currentRecreation.interactionNotes}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default StemRecreator;
