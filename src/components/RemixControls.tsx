import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Zap, Music2, Waves, Volume2, Radio, Timer, Sparkles, Gauge } from "lucide-react";

export interface EffectToggles {
  reverb: boolean;
  delay: boolean;
  exciter: boolean;
  compression: boolean;
}

interface RemixControlsProps {
  tempo: number;
  pitch: number;
  bass: number;
  effects: number;
  effectToggles: EffectToggles;
  onTempoChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onBassChange: (value: number) => void;
  onEffectsChange: (value: number) => void;
  onEffectToggle: (effect: keyof EffectToggles) => void;
}

const defaultToggles: EffectToggles = {
  reverb: true,
  delay: true,
  exciter: true,
  compression: true,
};

const RemixControls = ({
  tempo,
  pitch,
  bass,
  effects,
  effectToggles = defaultToggles,
  onTempoChange,
  onPitchChange,
  onBassChange,
  onEffectsChange,
  onEffectToggle,
}: RemixControlsProps) => {
  const toggles = effectToggles ?? defaultToggles;
  const controls = [
    { 
      label: "Tempo", 
      value: tempo, 
      onChange: onTempoChange, 
      icon: Zap,
      gradient: "from-neon-cyan to-primary",
      min: 50,
      max: 200,
      unit: "BPM"
    },
    { 
      label: "Pitch", 
      value: pitch, 
      onChange: onPitchChange, 
      icon: Music2,
      gradient: "from-neon-purple to-violet-500",
      min: -12,
      max: 12,
      unit: "st"
    },
    { 
      label: "Bass Boost", 
      value: bass, 
      onChange: onBassChange, 
      icon: Volume2,
      gradient: "from-neon-pink to-rose-500",
      min: 0,
      max: 100,
      unit: "%"
    },
    { 
      label: "FX Intensity", 
      value: effects, 
      onChange: onEffectsChange, 
      icon: Waves,
      gradient: "from-amber-400 to-orange-500",
      min: 0,
      max: 100,
      unit: "%"
    },
  ];

  const toggleEffects = [
    { 
      label: "Reverb", 
      icon: Radio, 
      key: "reverb" as keyof EffectToggles,
      active: toggles.reverb, 
      color: "text-neon-cyan",
      description: "Spatial depth"
    },
    { 
      label: "Delay", 
      icon: Timer, 
      key: "delay" as keyof EffectToggles,
      active: toggles.delay, 
      color: "text-neon-purple",
      description: "Echo effect"
    },
    { 
      label: "Exciter", 
      icon: Sparkles, 
      key: "exciter" as keyof EffectToggles,
      active: toggles.exciter, 
      color: "text-neon-pink",
      description: "Harmonic boost"
    },
    { 
      label: "Compress", 
      icon: Gauge, 
      key: "compression" as keyof EffectToggles,
      active: toggles.compression, 
      color: "text-amber-400",
      description: "Punch & glue"
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {controls.map((control, index) => (
          <motion.div
            key={control.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-4 group hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${control.gradient} flex items-center justify-center shadow-lg`}>
                <control.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-foreground">{control.label}</span>
              </div>
              <span className="font-display text-sm text-primary tabular-nums">
                {control.value > 0 && control.label === "Pitch" ? "+" : ""}{control.value}{control.unit}
              </span>
            </div>
            
            <Slider
              value={[control.value]}
              onValueChange={(val) => control.onChange(val[0])}
              min={control.min}
              max={control.max}
              step={1}
              className="w-full"
            />
          </motion.div>
        ))}
      </div>

      {/* Toggle Effects */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-4"
      >
        <h4 className="text-xs font-medium text-muted-foreground mb-3">Effect Toggles</h4>
        <div className="grid grid-cols-4 gap-2">
          {toggleEffects.map((effect) => (
            <button
              key={effect.label}
              onClick={() => onEffectToggle(effect.key)}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200
                ${effect.active 
                  ? "bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                  : "bg-muted/20 border border-transparent hover:bg-muted/30 opacity-60"
                }
              `}
            >
              <effect.icon className={`w-5 h-5 transition-colors ${effect.active ? effect.color : "text-muted-foreground"}`} />
              <span className={`text-[11px] font-medium transition-colors ${effect.active ? "text-foreground" : "text-muted-foreground"}`}>
                {effect.label}
              </span>
              <span className={`text-[9px] transition-colors ${effect.active ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                {effect.description}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RemixControls;
