import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Music, 
  Waves, 
  Zap, 
  ArrowRightLeft, 
  Crown,
  Gauge,
  Key,
  Grid3X3,
  Mic2,
  Layers,
  Music2,
  Activity,
  TrendingUp,
  Scissors,
  Blend,
  Radio,
  Headphones,
  Volume2,
  Timer,
  Wand2,
  Shuffle,
  Disc,
  AudioLines,
  Vibrate,
  ScanLine,
  Flame,
  Coffee,
  Target,
  Drum,
  Piano,
  PartyPopper,
  Leaf
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface AutoFeatures {
  // Core Auto
  autoEQ: boolean;
  autoBass: boolean;
  autoEffects: boolean;
  autoMaster: boolean;
  // Structure
  autoDrop: boolean;
  autoTransition: boolean;
  autoBuild: boolean;
  autoChop: boolean;
  // Analysis
  autoTempoMatch: boolean;
  autoKeyDetect: boolean;
  autoBeatGrid: boolean;
  autoGroove: boolean;
  // Advanced AI
  autoVocalIsolate: boolean;
  autoStemSplit: boolean;
  autoSidechain: boolean;
  autoHarmonize: boolean;
  // NEW: Dynamic Processing
  autoCompression: boolean;
  autoLimiter: boolean;
  autoDeEss: boolean;
  autoGate: boolean;
  // NEW: Creative Effects
  autoStutter: boolean;
  autoGlitch: boolean;
  autoTapeStop: boolean;
  autoRiser: boolean;
  // NEW: Spatial & Texture
  autoReverb: boolean;
  autoStereoWidth: boolean;
  autoAmbience: boolean;
  autoTexture: boolean;
}

interface AutoRemixFeaturesProps {
  features: AutoFeatures;
  onFeaturesChange: (features: AutoFeatures) => void;
}

type PresetConfig = {
  name: string;
  icon: typeof Sparkles;
  color: string;
  description: string;
  features: Partial<AutoFeatures>;
};

const presets: PresetConfig[] = [
  {
    name: "EDM Producer",
    icon: Flame,
    color: "from-orange-500 to-red-500",
    description: "High energy drops & builds",
    features: {
      autoEQ: true, autoBass: true, autoEffects: true, autoMaster: true,
      autoDrop: true, autoTransition: true, autoBuild: true, autoChop: false,
      autoTempoMatch: true, autoKeyDetect: true, autoBeatGrid: true, autoGroove: true,
      autoVocalIsolate: false, autoStemSplit: false, autoSidechain: true, autoHarmonize: false,
      autoCompression: true, autoLimiter: true, autoDeEss: false, autoGate: false,
      autoStutter: true, autoGlitch: false, autoTapeStop: false, autoRiser: true,
      autoReverb: true, autoStereoWidth: true, autoAmbience: false, autoTexture: false,
    }
  },
  {
    name: "Lo-Fi Chill",
    icon: Coffee,
    color: "from-amber-500 to-yellow-600",
    description: "Warm, relaxed vibes",
    features: {
      autoEQ: true, autoBass: true, autoEffects: true, autoMaster: true,
      autoDrop: false, autoTransition: true, autoBuild: false, autoChop: true,
      autoTempoMatch: true, autoKeyDetect: true, autoBeatGrid: false, autoGroove: true,
      autoVocalIsolate: false, autoStemSplit: false, autoSidechain: false, autoHarmonize: true,
      autoCompression: true, autoLimiter: false, autoDeEss: false, autoGate: false,
      autoStutter: false, autoGlitch: false, autoTapeStop: true, autoRiser: false,
      autoReverb: true, autoStereoWidth: false, autoAmbience: true, autoTexture: true,
    }
  },
  {
    name: "Trap Heavy",
    icon: Target,
    color: "from-purple-500 to-pink-500",
    description: "Hard 808s & hi-hats",
    features: {
      autoEQ: true, autoBass: true, autoEffects: true, autoMaster: true,
      autoDrop: true, autoTransition: true, autoBuild: true, autoChop: true,
      autoTempoMatch: true, autoKeyDetect: true, autoBeatGrid: true, autoGroove: true,
      autoVocalIsolate: false, autoStemSplit: false, autoSidechain: true, autoHarmonize: false,
      autoCompression: true, autoLimiter: true, autoDeEss: false, autoGate: true,
      autoStutter: true, autoGlitch: true, autoTapeStop: false, autoRiser: true,
      autoReverb: false, autoStereoWidth: true, autoAmbience: false, autoTexture: false,
    }
  },
  {
    name: "House Groove",
    icon: Drum,
    color: "from-cyan-500 to-blue-500",
    description: "Punchy kicks & flow",
    features: {
      autoEQ: true, autoBass: true, autoEffects: true, autoMaster: true,
      autoDrop: true, autoTransition: true, autoBuild: true, autoChop: false,
      autoTempoMatch: true, autoKeyDetect: true, autoBeatGrid: true, autoGroove: true,
      autoVocalIsolate: false, autoStemSplit: false, autoSidechain: true, autoHarmonize: false,
      autoCompression: true, autoLimiter: true, autoDeEss: false, autoGate: false,
      autoStutter: false, autoGlitch: false, autoTapeStop: false, autoRiser: true,
      autoReverb: true, autoStereoWidth: true, autoAmbience: false, autoTexture: false,
    }
  },
  {
    name: "Melodic",
    icon: Piano,
    color: "from-emerald-500 to-teal-500",
    description: "Harmonic & emotional",
    features: {
      autoEQ: true, autoBass: true, autoEffects: true, autoMaster: true,
      autoDrop: false, autoTransition: true, autoBuild: true, autoChop: false,
      autoTempoMatch: true, autoKeyDetect: true, autoBeatGrid: true, autoGroove: true,
      autoVocalIsolate: true, autoStemSplit: false, autoSidechain: false, autoHarmonize: true,
      autoCompression: true, autoLimiter: true, autoDeEss: true, autoGate: false,
      autoStutter: false, autoGlitch: false, autoTapeStop: false, autoRiser: true,
      autoReverb: true, autoStereoWidth: true, autoAmbience: true, autoTexture: false,
    }
  },
  {
    name: "Festival",
    icon: PartyPopper,
    color: "from-fuchsia-500 to-violet-500",
    description: "Big room & anthems",
    features: {
      autoEQ: true, autoBass: true, autoEffects: true, autoMaster: true,
      autoDrop: true, autoTransition: true, autoBuild: true, autoChop: false,
      autoTempoMatch: true, autoKeyDetect: true, autoBeatGrid: true, autoGroove: true,
      autoVocalIsolate: true, autoStemSplit: false, autoSidechain: true, autoHarmonize: false,
      autoCompression: true, autoLimiter: true, autoDeEss: false, autoGate: false,
      autoStutter: true, autoGlitch: false, autoTapeStop: false, autoRiser: true,
      autoReverb: true, autoStereoWidth: true, autoAmbience: false, autoTexture: false,
    }
  },
  {
    name: "Ambient",
    icon: Leaf,
    color: "from-sky-500 to-indigo-500",
    description: "Atmospheric & spacious",
    features: {
      autoEQ: true, autoBass: false, autoEffects: true, autoMaster: true,
      autoDrop: false, autoTransition: true, autoBuild: false, autoChop: false,
      autoTempoMatch: false, autoKeyDetect: true, autoBeatGrid: false, autoGroove: false,
      autoVocalIsolate: false, autoStemSplit: false, autoSidechain: false, autoHarmonize: true,
      autoCompression: false, autoLimiter: true, autoDeEss: false, autoGate: false,
      autoStutter: false, autoGlitch: false, autoTapeStop: false, autoRiser: false,
      autoReverb: true, autoStereoWidth: true, autoAmbience: true, autoTexture: true,
    }
  },
];

const AutoRemixFeatures = ({ features, onFeaturesChange }: AutoRemixFeaturesProps) => {
  const handleToggle = (feature: keyof AutoFeatures) => {
    onFeaturesChange({
      ...features,
      [feature]: !features[feature]
    });
  };

  const applyPreset = (preset: PresetConfig) => {
    const newFeatures = Object.keys(features).reduce((acc, key) => {
      acc[key as keyof AutoFeatures] = preset.features[key as keyof AutoFeatures] ?? false;
      return acc;
    }, {} as AutoFeatures);
    onFeaturesChange(newFeatures);
  };

  const featureGroups = [
    {
      title: "Core Auto",
      features: [
        { key: 'autoEQ' as keyof AutoFeatures, label: 'Auto EQ', icon: Waves, description: 'AI frequency balancing' },
        { key: 'autoBass' as keyof AutoFeatures, label: 'Auto Bass', icon: Music, description: 'Smart bass enhancement' },
        { key: 'autoEffects' as keyof AutoFeatures, label: 'Auto FX', icon: Sparkles, description: 'Dynamic effect chains' },
        { key: 'autoMaster' as keyof AutoFeatures, label: 'Master', icon: Crown, description: 'Final loudness & polish' },
      ]
    },
    {
      title: "Structure",
      features: [
        { key: 'autoDrop' as keyof AutoFeatures, label: 'Auto Drop', icon: Zap, description: 'Generate epic drops' },
        { key: 'autoTransition' as keyof AutoFeatures, label: 'Transition', icon: ArrowRightLeft, description: 'Smooth section blends' },
        { key: 'autoBuild' as keyof AutoFeatures, label: 'Build', icon: TrendingUp, description: 'Create tension buildups' },
        { key: 'autoChop' as keyof AutoFeatures, label: 'Chop', icon: Scissors, description: 'Intelligent sample slicing' },
      ]
    },
    {
      title: "Analysis",
      features: [
        { key: 'autoTempoMatch' as keyof AutoFeatures, label: 'Tempo Match', icon: Gauge, description: 'Sync BPM across tracks' },
        { key: 'autoKeyDetect' as keyof AutoFeatures, label: 'Key Detect', icon: Key, description: 'Harmonic key analysis' },
        { key: 'autoBeatGrid' as keyof AutoFeatures, label: 'Beat Grid', icon: Grid3X3, description: 'Auto beat alignment' },
        { key: 'autoGroove' as keyof AutoFeatures, label: 'Groove', icon: Activity, description: 'Apply swing & feel' },
      ]
    },
    {
      title: "Separation AI",
      features: [
        { key: 'autoVocalIsolate' as keyof AutoFeatures, label: 'Vocal Iso', icon: Mic2, description: 'AI vocal separation' },
        { key: 'autoStemSplit' as keyof AutoFeatures, label: 'Stem Split', icon: Layers, description: 'Separate instruments' },
        { key: 'autoSidechain' as keyof AutoFeatures, label: 'Sidechain', icon: Music2, description: 'Pumping compression' },
        { key: 'autoHarmonize' as keyof AutoFeatures, label: 'Harmonize', icon: Blend, description: 'Add harmonic layers' },
      ]
    },
    {
      title: "Dynamics",
      features: [
        { key: 'autoCompression' as keyof AutoFeatures, label: 'Compress', icon: AudioLines, description: 'Dynamic range control' },
        { key: 'autoLimiter' as keyof AutoFeatures, label: 'Limiter', icon: Volume2, description: 'Peak protection' },
        { key: 'autoDeEss' as keyof AutoFeatures, label: 'De-Ess', icon: Radio, description: 'Reduce sibilance' },
        { key: 'autoGate' as keyof AutoFeatures, label: 'Gate', icon: Timer, description: 'Noise gate & cleanup' },
      ]
    },
    {
      title: "Creative FX",
      features: [
        { key: 'autoStutter' as keyof AutoFeatures, label: 'Stutter', icon: Vibrate, description: 'Rhythmic stutters' },
        { key: 'autoGlitch' as keyof AutoFeatures, label: 'Glitch', icon: ScanLine, description: 'Digital artifacts' },
        { key: 'autoTapeStop' as keyof AutoFeatures, label: 'Tape Stop', icon: Disc, description: 'Vinyl slowdown FX' },
        { key: 'autoRiser' as keyof AutoFeatures, label: 'Riser', icon: Wand2, description: 'Tension builders' },
      ]
    },
    {
      title: "Spatial",
      features: [
        { key: 'autoReverb' as keyof AutoFeatures, label: 'Reverb', icon: Headphones, description: 'Space & depth' },
        { key: 'autoStereoWidth' as keyof AutoFeatures, label: 'Width', icon: Shuffle, description: 'Stereo enhancement' },
        { key: 'autoAmbience' as keyof AutoFeatures, label: 'Ambience', icon: Sparkles, description: 'Atmospheric layers' },
        { key: 'autoTexture' as keyof AutoFeatures, label: 'Texture', icon: Layers, description: 'Grain & character' },
      ]
    }
  ];

  const totalFeatures = Object.keys(features).length;
  const enabledCount = Object.values(features).filter(Boolean).length;

  const enableAll = () => {
    const allEnabled = Object.keys(features).reduce((acc, key) => {
      acc[key as keyof AutoFeatures] = true;
      return acc;
    }, {} as AutoFeatures);
    onFeaturesChange(allEnabled);
  };

  const disableAll = () => {
    const allDisabled = Object.keys(features).reduce((acc, key) => {
      acc[key as keyof AutoFeatures] = false;
      return acc;
    }, {} as AutoFeatures);
    onFeaturesChange(allDisabled);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Smart Remix AI
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
          {enabledCount}/{totalFeatures} Active
        </span>
      </div>

      {/* Preset Bundles */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Quick Presets
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <motion.button
                key={preset.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyPreset(preset)}
                className="group relative flex flex-col items-center p-2 rounded-lg bg-card/30 border border-border/30 hover:border-primary/50 transition-all"
              >
                <div className={`p-1.5 rounded-md bg-gradient-to-br ${preset.color} mb-1`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-[8px] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                  {preset.name}
                </span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <ScrollArea className="h-[260px] pr-2">
        <div className="space-y-4">
          {featureGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
              className="space-y-2"
            >
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.features.map((feature) => {
                  const Icon = feature.icon;
                  const isEnabled = features[feature.key];
                  
                  return (
                    <motion.div
                      key={feature.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggle(feature.key)}
                      className={`
                        relative p-2 rounded-lg cursor-pointer transition-all duration-200
                        ${isEnabled 
                          ? 'bg-primary/20 border border-primary/40 shadow-[0_0_10px_rgba(var(--primary),0.2)]' 
                          : 'bg-card/30 border border-border/30 hover:border-border/50'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`
                          p-1 rounded-md transition-colors
                          ${isEnabled ? 'bg-primary/30 text-primary' : 'bg-muted/30 text-muted-foreground'}
                        `}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium cursor-pointer truncate">
                              {feature.label}
                            </Label>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleToggle(feature.key)}
                              className="scale-50 -mr-1"
                            />
                          </div>
                          <p className="text-[8px] text-muted-foreground truncate">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      
                      {isEnabled && (
                        <motion.div
                          layoutId={`glow-${feature.key}`}
                          className="absolute inset-0 rounded-lg bg-primary/5 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="flex gap-2 pt-2 border-t border-border/30">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={enableAll}
          className="flex-1 text-[10px] py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        >
          Enable All
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={disableAll}
          className="flex-1 text-[10px] py-1.5 rounded-md bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          Disable All
        </motion.button>
      </div>
    </div>
  );
};

export default AutoRemixFeatures;
