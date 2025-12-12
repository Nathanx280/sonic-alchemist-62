import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface BeatSequencerProps {
  isPlaying: boolean;
  tempo: number;
  onPatternChange: (pattern: DrumPattern) => void;
}

export interface DrumPattern {
  kick: boolean[];
  snare: boolean[];
  hihat: boolean[];
  clap: boolean[];
}

const STEPS = 16;
const DRUM_LABELS = [
  { key: "kick", label: "Kick", color: "from-neon-pink to-neon-purple" },
  { key: "snare", label: "Snare", color: "from-neon-cyan to-neon-blue" },
  { key: "hihat", label: "Hi-Hat", color: "from-neon-green to-neon-cyan" },
  { key: "clap", label: "Clap", color: "from-neon-orange to-neon-pink" },
] as const;

const BeatSequencer = ({ isPlaying, tempo, onPatternChange }: BeatSequencerProps) => {
  const [pattern, setPattern] = useState<DrumPattern>({
    kick: Array(STEPS).fill(false),
    snare: Array(STEPS).fill(false),
    hihat: Array(STEPS).fill(false),
    clap: Array(STEPS).fill(false),
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Drum synthesis functions
  const playKick = useCallback((ctx: AudioContext, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const playSnare = useCallback((ctx: AudioContext, vol: number) => {
    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.8, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.2);
  }, []);

  const playHihat = useCallback((ctx: AudioContext, vol: number) => {
    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.05);
  }, []);

  const playClap = useCallback((ctx: AudioContext, vol: number) => {
    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2500;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol * 0.6, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.15);
  }, []);

  const playStep = useCallback((step: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const vol = volume / 100;
    
    if (pattern.kick[step]) playKick(ctx, vol);
    if (pattern.snare[step]) playSnare(ctx, vol);
    if (pattern.hihat[step]) playHihat(ctx, vol);
    if (pattern.clap[step]) playClap(ctx, vol);
  }, [pattern, volume, playKick, playSnare, playHihat, playClap]);

  // Sequencer playback
  useEffect(() => {
    if (isSequencerPlaying) {
      const stepDuration = (60 / tempo / 4) * 1000; // 16th notes
      
      intervalRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          const nextStep = (prev + 1) % STEPS;
          playStep(nextStep);
          return nextStep;
        });
      }, stepDuration);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentStep(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSequencerPlaying, tempo, playStep]);

  // Notify parent of pattern changes
  useEffect(() => {
    onPatternChange(pattern);
  }, [pattern, onPatternChange]);

  const toggleCell = (drum: keyof DrumPattern, step: number) => {
    setPattern((prev) => ({
      ...prev,
      [drum]: prev[drum].map((v, i) => (i === step ? !v : v)),
    }));
  };

  const clearPattern = () => {
    setPattern({
      kick: Array(STEPS).fill(false),
      snare: Array(STEPS).fill(false),
      hihat: Array(STEPS).fill(false),
      clap: Array(STEPS).fill(false),
    });
  };

  const loadPreset = (preset: string) => {
    const presets: Record<string, DrumPattern> = {
      basic: {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      },
      trap: {
        kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true],
      },
      house: {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      },
      dnb: {
        kick: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, true, false],
        hihat: [true, false, true, true, true, false, true, true, true, false, true, true, true, false, true, true],
        clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      },
      techno: {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      },
      dubstep: {
        kick: [true, false, false, false, false, false, false, false, true, false, false, true, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        clap: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, true, false],
      },
      bassdrop: {
        // Buildup pattern: sparse kicks building tension, then heavy drop in second half
        kick: [false, false, false, false, false, false, true, false, true, true, true, false, true, true, true, true],
        snare: [false, false, false, true, false, false, true, true, false, false, false, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, false, false, true, false, false, false, true, true],
        clap: [false, false, false, false, false, true, false, true, false, false, false, true, true, true, true, true],
      },
      heavydrop: {
        // Intense buildup with rolling snares, massive drop with syncopated kicks
        kick: [false, false, false, false, false, false, false, true, true, false, true, true, true, true, false, true],
        snare: [false, true, false, true, true, true, true, true, false, false, false, false, true, false, true, false],
        hihat: [true, false, true, false, true, false, true, false, false, false, false, false, false, false, false, false],
        clap: [false, false, true, false, true, true, true, true, true, false, false, true, true, false, true, true],
      },
    };
    if (presets[preset]) {
      setPattern(presets[preset]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
          Beat Sequencer
        </h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSequencerPlaying(!isSequencerPlaying)}
            className={`p-2.5 rounded-xl transition-all ${
              isSequencerPlaying
                ? "bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30"
                : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            }`}
          >
            {isSequencerPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearPattern}
            className="p-2.5 rounded-xl bg-muted/20 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all border border-border/20"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["basic", "trap", "house", "dnb", "techno", "dubstep", "bassdrop", "heavydrop"].map((preset) => (
          <motion.button
            key={preset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadPreset(preset)}
            className={`px-3 py-1.5 text-[10px] rounded-lg transition-all capitalize font-medium ${
              preset === "bassdrop" 
                ? "bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-neon-pink hover:from-neon-pink/30 hover:to-neon-purple/30 border border-neon-pink/30" 
                : preset === "heavydrop"
                ? "bg-gradient-to-r from-neon-orange/20 to-neon-pink/20 text-neon-orange hover:from-neon-orange/30 hover:to-neon-pink/30 border border-neon-orange/30"
                : "bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/20"
            }`}
          >
            {preset === "bassdrop" ? "🔊 Bass Drop" : preset === "heavydrop" ? "💥 Heavy Drop" : preset}
          </motion.button>
        ))}
      </div>

      {/* Sequencer Grid */}
      <div className="space-y-2 bg-background/30 rounded-xl p-3 border border-border/20">
        {DRUM_LABELS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 text-xs text-muted-foreground font-medium">{label}</span>
            <div className="flex gap-0.5 flex-1">
              {pattern[key].map((active, step) => (
                <motion.button
                  key={step}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleCell(key, step)}
                  className={`
                    flex-1 aspect-square rounded-md transition-all duration-150 relative
                    ${step % 4 === 0 ? "ring-1 ring-primary/20" : ""}
                    ${
                      active
                        ? `bg-gradient-to-br ${color} shadow-lg`
                        : "bg-muted/20 hover:bg-muted/40 border border-border/10"
                    }
                    ${currentStep === step && isSequencerPlaying ? "ring-2 ring-white shadow-lg shadow-white/30" : ""}
                  `}
                >
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-md bg-white/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mt-3">
        <span className="w-14" />
        <div className="flex gap-0.5 flex-1">
          {Array(STEPS)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className={`flex-1 text-center text-[10px] ${
                  i % 4 === 0 ? "text-primary font-medium" : "text-muted-foreground/40"
                }`}
              >
                {i % 4 === 0 ? i / 4 + 1 : "·"}
              </div>
            ))}
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/20">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={(v) => setVolume(v[0])}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-10 text-right font-mono">{volume}%</span>
      </div>
    </motion.div>
  );
};

export default BeatSequencer;
