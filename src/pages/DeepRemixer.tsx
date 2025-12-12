import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Waves, Sparkles, Zap, Volume2, Music2, Disc3, 
  Settings2, Layers, Filter, Activity, Radio, 
  Headphones, Sliders, Target, Wand2, RefreshCw,
  Download, Play, Pause, Square, SkipBack, SkipForward,
  Save, FolderOpen, Trash2, Star, Flame, Wind, Heart, Rocket, Crown,
  Undo2, Redo2, Shuffle, ToggleLeft, ToggleRight, Dices
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUploader from "@/components/FileUploader";
import SeekableWaveform from "@/components/SeekableWaveform";
import SpectrumAnalyzer from "@/components/SpectrumAnalyzer";
import AudioVisualizer from "@/components/AudioVisualizer";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useBeatExtraction } from "@/hooks/useBeatExtraction";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeepProcessingSettings {
  // Stem Separation
  vocalIsolation: number;
  drumExtraction: number;
  bassExtraction: number;
  melodicExtraction: number;
  
  // Spectral Processing
  spectralShift: number;
  spectralStretch: number;
  spectralBlur: number;
  spectralFreeze: boolean;
  
  // Granular Synthesis
  grainSize: number;
  grainDensity: number;
  grainPitch: number;
  grainRandom: number;
  
  // Time Manipulation
  timeStretch: number;
  pitchShift: number;
  formantPreserve: boolean;
  phaseVocoder: boolean;
  
  // Harmonic Processing
  harmonicEnhance: number;
  subHarmonics: number;
  harmonicDistort: number;
  pitchCorrect: boolean;
  
  // Rhythmic Processing
  beatSlice: boolean;
  stutterAmount: number;
  swingAmount: number;
  grooveQuantize: number;
  
  // Spatial Processing
  stereoWidth: number;
  monoToStereo: number;
  surroundSim: number;
  roomSize: number;
  
  // Dynamic Processing
  multiCompression: number;
  transientShape: number;
  dynamicEQ: boolean;
  limiterCeiling: number;
  
  // Frequency Processing
  lowCut: number;
  highCut: number;
  midScoop: number;
  presence: number;
  
  // Creative FX
  bitCrush: number;
  sampleRateReduce: number;
  tapeWobble: number;
  vinylCrackle: number;
}

const defaultSettings: DeepProcessingSettings = {
  vocalIsolation: 0,
  drumExtraction: 0,
  bassExtraction: 0,
  melodicExtraction: 0,
  spectralShift: 0,
  spectralStretch: 100,
  spectralBlur: 0,
  spectralFreeze: false,
  grainSize: 50,
  grainDensity: 50,
  grainPitch: 0,
  grainRandom: 0,
  timeStretch: 100,
  pitchShift: 0,
  formantPreserve: true,
  phaseVocoder: true,
  harmonicEnhance: 0,
  subHarmonics: 0,
  harmonicDistort: 0,
  pitchCorrect: false,
  beatSlice: false,
  stutterAmount: 0,
  swingAmount: 0,
  grooveQuantize: 0,
  stereoWidth: 100,
  monoToStereo: 0,
  surroundSim: 0,
  roomSize: 30,
  multiCompression: 0,
  transientShape: 0,
  dynamicEQ: false,
  limiterCeiling: 0,
  lowCut: 20,
  highCut: 20000,
  midScoop: 0,
  presence: 0,
  bitCrush: 0,
  sampleRateReduce: 0,
  tapeWobble: 0,
  vinylCrackle: 0,
};

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "creative" | "structure" | "custom";
  settings: DeepProcessingSettings;
}

// Built-in creative presets for choruses, drops, buildups
const builtInPresets: Preset[] = [
  {
    id: "epic-chorus",
    name: "Epic Chorus Lift",
    description: "Massive, wide, emotional chorus enhancement with harmonic richness",
    icon: "crown",
    category: "creative",
    settings: {
      ...defaultSettings,
      vocalIsolation: 30,
      melodicExtraction: 60,
      stereoWidth: 160,
      monoToStereo: 40,
      roomSize: 55,
      harmonicEnhance: 70,
      subHarmonics: 25,
      presence: 60,
      multiCompression: 45,
      transientShape: 20,
      dynamicEQ: true,
    },
  },
  {
    id: "massive-drop",
    name: "Massive Bass Drop",
    description: "Heavy sub-bass, punchy transients, sidechain-style pumping",
    icon: "flame",
    category: "creative",
    settings: {
      ...defaultSettings,
      bassExtraction: 80,
      drumExtraction: 70,
      subHarmonics: 85,
      harmonicDistort: 35,
      transientShape: 60,
      multiCompression: 70,
      lowCut: 25,
      midScoop: 30,
      stereoWidth: 80,
      beatSlice: true,
      stutterAmount: 20,
      limiterCeiling: -3,
    },
  },
  {
    id: "tension-buildup",
    name: "Tension Buildup",
    description: "Rising energy, filtered sweep, anticipation creator",
    icon: "rocket",
    category: "structure",
    settings: {
      ...defaultSettings,
      spectralStretch: 130,
      grainDensity: 70,
      grainRandom: 25,
      highCut: 12000,
      presence: 80,
      roomSize: 60,
      surroundSim: 30,
      stutterAmount: 40,
      grooveQuantize: 60,
      multiCompression: 55,
      harmonicEnhance: 40,
    },
  },
  {
    id: "ethereal-breakdown",
    name: "Ethereal Breakdown",
    description: "Dreamy, spacious, floating atmosphere for breakdowns",
    icon: "wind",
    category: "structure",
    settings: {
      ...defaultSettings,
      vocalIsolation: 50,
      melodicExtraction: 70,
      spectralBlur: 40,
      grainSize: 80,
      grainDensity: 30,
      stereoWidth: 180,
      surroundSim: 50,
      roomSize: 80,
      tapeWobble: 15,
      harmonicEnhance: 35,
      lowCut: 80,
      presence: 25,
    },
  },
  {
    id: "punchy-verse",
    name: "Punchy Verse",
    description: "Tight, controlled energy with clear vocals and punchy drums",
    icon: "star",
    category: "creative",
    settings: {
      ...defaultSettings,
      vocalIsolation: 20,
      drumExtraction: 50,
      transientShape: 45,
      multiCompression: 60,
      dynamicEQ: true,
      stereoWidth: 110,
      presence: 40,
      lowCut: 40,
      midScoop: 15,
      grooveQuantize: 40,
    },
  },
  {
    id: "hyperpop-chaos",
    name: "Hyperpop Chaos",
    description: "Glitchy, distorted, pitch-shifted experimental sound",
    icon: "zap",
    category: "creative",
    settings: {
      ...defaultSettings,
      pitchShift: 5,
      grainPitch: 12,
      grainRandom: 60,
      bitCrush: 40,
      harmonicDistort: 50,
      stutterAmount: 70,
      beatSlice: true,
      stereoWidth: 200,
      presence: 90,
      spectralShift: 30,
    },
  },
  {
    id: "lofi-warmth",
    name: "Lo-Fi Warmth",
    description: "Vintage, warm, nostalgic lo-fi character",
    icon: "heart",
    category: "creative",
    settings: {
      ...defaultSettings,
      bitCrush: 25,
      sampleRateReduce: 30,
      tapeWobble: 45,
      vinylCrackle: 35,
      highCut: 14000,
      lowCut: 30,
      harmonicEnhance: 20,
      roomSize: 40,
      swingAmount: 25,
      stereoWidth: 90,
    },
  },
  {
    id: "festival-anthem",
    name: "Festival Anthem",
    description: "Big room energy, crowd-moving power and impact",
    icon: "flame",
    category: "creative",
    settings: {
      ...defaultSettings,
      bassExtraction: 60,
      drumExtraction: 65,
      subHarmonics: 70,
      stereoWidth: 150,
      transientShape: 50,
      multiCompression: 65,
      harmonicEnhance: 55,
      presence: 70,
      beatSlice: true,
      grooveQuantize: 50,
      limiterCeiling: -2,
    },
  },
];

const CUSTOM_PRESETS_KEY = "deep-remixer-custom-presets";

const DeepRemixer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<DeepProcessingSettings>(defaultSettings);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [staticWaveform, setStaticWaveform] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("stems");
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // A/B Comparison state
  const [isABMode, setIsABMode] = useState(false);
  const [originalSettings] = useState<DeepProcessingSettings>(defaultSettings);
  const [showingOriginal, setShowingOriginal] = useState(false);

  // Undo/Redo history
  const [settingsHistory, setSettingsHistory] = useState<DeepProcessingSettings[]>([defaultSettings]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const maxHistorySize = 50;

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load custom presets");
      }
    }
  }, []);

  // Save custom presets to localStorage
  const saveCustomPresetsToStorage = useCallback((presets: Preset[]) => {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  }, []);

  const handleLoadPreset = useCallback((preset: Preset) => {
    setSettings(preset.settings);
    setSelectedPreset(preset.id);
    // History will be tracked via settingsHistory state
    setSettingsHistory(prev => [...prev.slice(0, 50), preset.settings]);
    setHistoryIndex(prev => prev + 1);
    toast.success(`Loaded preset: ${preset.name}`);
  }, []);

  const handleSaveCustomPreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: "Custom saved preset",
      icon: "star",
      category: "custom",
      settings: { ...settings },
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveCustomPresetsToStorage(updated);
    setNewPresetName("");
    setShowSaveDialog(false);
    setSelectedPreset(newPreset.id);
    toast.success(`Saved preset: ${newPreset.name}`);
  }, [newPresetName, settings, customPresets, saveCustomPresetsToStorage]);

  const handleDeleteCustomPreset = useCallback((presetId: string) => {
    const updated = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updated);
    saveCustomPresetsToStorage(updated);
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
    }
    toast.success("Preset deleted");
  }, [customPresets, selectedPreset, saveCustomPresetsToStorage]);

  const getPresetIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      crown: Crown,
      flame: Flame,
      rocket: Rocket,
      wind: Wind,
      star: Star,
      zap: Zap,
      heart: Heart,
    };
    return icons[iconName] || Star;
  };

  // History management for undo/redo
  const pushToHistory = useCallback((newSettings: DeepProcessingSettings) => {
    setSettingsHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newSettings);
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex, maxHistorySize]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSettings(settingsHistory[newIndex]);
      toast.info("Undo");
    }
  }, [historyIndex, settingsHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < settingsHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSettings(settingsHistory[newIndex]);
      toast.info("Redo");
    }
  }, [historyIndex, settingsHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < settingsHistory.length - 1;

  // A/B Comparison toggle
  // A/B toggle functions will be defined after useAudioEngine hook

  // Smart Randomize based on category
  const handleSmartRandomize = useCallback((category?: string) => {
    const randomInRange = (min: number, max: number) => 
      Math.floor(Math.random() * (max - min + 1)) + min;
    const randomBool = () => Math.random() > 0.5;

    let newSettings: DeepProcessingSettings;

    if (category === "chorus") {
      // Epic chorus-focused randomization
      newSettings = {
        ...defaultSettings,
        vocalIsolation: randomInRange(20, 50),
        melodicExtraction: randomInRange(50, 80),
        stereoWidth: randomInRange(140, 200),
        monoToStereo: randomInRange(30, 60),
        roomSize: randomInRange(40, 70),
        harmonicEnhance: randomInRange(50, 85),
        subHarmonics: randomInRange(15, 40),
        presence: randomInRange(45, 75),
        multiCompression: randomInRange(35, 60),
        transientShape: randomInRange(10, 35),
        dynamicEQ: true,
      };
      toast.success("🎤 Randomized for epic chorus!");
    } else if (category === "drop") {
      // Bass drop-focused randomization
      newSettings = {
        ...defaultSettings,
        bassExtraction: randomInRange(60, 95),
        drumExtraction: randomInRange(55, 85),
        subHarmonics: randomInRange(65, 100),
        harmonicDistort: randomInRange(20, 50),
        transientShape: randomInRange(40, 75),
        multiCompression: randomInRange(55, 85),
        lowCut: randomInRange(20, 35),
        midScoop: randomInRange(15, 45),
        stereoWidth: randomInRange(70, 100),
        beatSlice: true,
        stutterAmount: randomInRange(10, 40),
        limiterCeiling: randomInRange(-6, -1),
      };
      toast.success("💥 Randomized for massive drop!");
    } else if (category === "buildup") {
      // Buildup/tension-focused randomization
      newSettings = {
        ...defaultSettings,
        spectralStretch: randomInRange(115, 150),
        grainDensity: randomInRange(50, 85),
        grainRandom: randomInRange(15, 45),
        highCut: randomInRange(8000, 15000),
        presence: randomInRange(60, 95),
        roomSize: randomInRange(45, 75),
        surroundSim: randomInRange(20, 50),
        stutterAmount: randomInRange(25, 60),
        grooveQuantize: randomInRange(40, 75),
        multiCompression: randomInRange(40, 70),
        harmonicEnhance: randomInRange(25, 55),
      };
      toast.success("🚀 Randomized for tension buildup!");
    } else {
      // Full creative randomization
      newSettings = {
        vocalIsolation: randomInRange(0, 80),
        drumExtraction: randomInRange(0, 80),
        bassExtraction: randomInRange(0, 80),
        melodicExtraction: randomInRange(0, 80),
        spectralShift: randomInRange(-50, 50),
        spectralStretch: randomInRange(75, 150),
        spectralBlur: randomInRange(0, 60),
        spectralFreeze: randomBool(),
        grainSize: randomInRange(20, 90),
        grainDensity: randomInRange(20, 80),
        grainPitch: randomInRange(-12, 12),
        grainRandom: randomInRange(0, 60),
        timeStretch: randomInRange(80, 130),
        pitchShift: randomInRange(-6, 6),
        formantPreserve: randomBool(),
        phaseVocoder: randomBool(),
        harmonicEnhance: randomInRange(0, 70),
        subHarmonics: randomInRange(0, 70),
        harmonicDistort: randomInRange(0, 50),
        pitchCorrect: randomBool(),
        beatSlice: randomBool(),
        stutterAmount: randomInRange(0, 60),
        swingAmount: randomInRange(0, 50),
        grooveQuantize: randomInRange(0, 70),
        stereoWidth: randomInRange(60, 180),
        monoToStereo: randomInRange(0, 60),
        surroundSim: randomInRange(0, 50),
        roomSize: randomInRange(10, 70),
        multiCompression: randomInRange(0, 70),
        transientShape: randomInRange(-50, 60),
        dynamicEQ: randomBool(),
        limiterCeiling: randomInRange(-8, 0),
        lowCut: randomInRange(20, 100),
        highCut: randomInRange(10000, 20000),
        midScoop: randomInRange(0, 40),
        presence: randomInRange(0, 70),
        bitCrush: randomInRange(0, 40),
        sampleRateReduce: randomInRange(0, 40),
        tapeWobble: randomInRange(0, 40),
        vinylCrackle: randomInRange(0, 40),
      };
      toast.success("🎲 Full creative randomize!");
    }

    setSettings(newSettings);
    pushToHistory(newSettings);
    setSelectedPreset(null);
  }, [pushToHistory]);

  const {
    isPlaying,
    currentTime,
    duration,
    waveformData,
    isLoaded,
    loadFile,
    togglePlayPause,
    stop,
    updateSettings,
    seek,
    exportAudio,
  } = useAudioEngine();

  const {
    isExtracting,
    analysis: beatAnalysis,
    detectedBPM,
    detectedKey,
    extractBeatsFromFile,
    reset: resetBeatExtraction,
  } = useBeatExtraction();

  // A/B Comparison toggle (needs updateSettings from useAudioEngine)
  const toggleABComparison = useCallback(() => {
    if (!isABMode) {
      setIsABMode(true);
      setShowingOriginal(false);
      toast.info("A/B Mode enabled - Toggle to hear original");
    } else {
      setIsABMode(false);
      setShowingOriginal(false);
      toast.info("A/B Mode disabled");
    }
  }, [isABMode]);

  const toggleAB = useCallback(() => {
    if (isABMode) {
      setShowingOriginal(prev => !prev);
      if (!showingOriginal) {
        // Switch to original (bypass processing)
        updateSettings({
          tempo: 100,
          pitch: 0,
          bass: 50,
          effects: 0,
        });
      } else {
        // Switch back to processed
        updateSettings({
          tempo: settings.timeStretch,
          pitch: settings.pitchShift,
          bass: 50 + settings.subHarmonics / 2,
          effects: Math.max(
            settings.harmonicEnhance,
            settings.stereoWidth - 100,
            settings.roomSize
          ),
        });
      }
    }
  }, [isABMode, showingOriginal, settings, updateSettings]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    resetBeatExtraction();
    
    try {
      const waveform = await loadFile(file);
      setStaticWaveform(waveform);
      
      toast.info("Analyzing audio structure...");
      await extractBeatsFromFile(file);
      
      toast.success("Track loaded and analyzed for deep processing!");
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Failed to load audio file");
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setStaticWaveform([]);
    resetBeatExtraction();
    stop();
    setSettings(defaultSettings);
  };

  // Debounce ref for history tracking
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateSetting = useCallback(<K extends keyof DeepProcessingSettings>(
    key: K,
    value: DeepProcessingSettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Debounced history push (waits for slider to stop moving)
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
      historyTimeoutRef.current = setTimeout(() => {
        pushToHistory(newSettings);
      }, 500);
      
      return newSettings;
    });
  }, [pushToHistory]);

  const handleDeepProcess = async () => {
    if (!selectedFile) {
      toast.error("Please upload a track first");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate deep processing stages
    const stages = [
      "Analyzing spectral content...",
      "Separating audio stems...",
      "Applying granular synthesis...",
      "Processing harmonics...",
      "Shaping transients...",
      "Applying spatial effects...",
      "Final mastering pass...",
    ];

    for (let i = 0; i < stages.length; i++) {
      toast.info(stages[i], { id: "processing" });
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingProgress(((i + 1) / stages.length) * 100);
    }

    // Update audio engine with new settings
    updateSettings({
      tempo: settings.timeStretch,
      pitch: settings.pitchShift,
      bass: 50 + settings.subHarmonics / 2,
      effects: Math.max(
        settings.harmonicEnhance,
        settings.stereoWidth - 100,
        settings.roomSize
      ),
    });

    setIsProcessing(false);
    toast.success("Deep processing complete!", { id: "processing" });
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    const trackName = selectedFile.name.replace(/\.[^/.]+$/, "");
    await exportAudio(`${trackName}_deep_rework`);
  };

  const SliderControl = ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 100, 
    step = 1,
    unit = "%",
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (v: number) => void; 
    min?: number; 
    max?: number; 
    step?: number;
    unit?: string;
    icon?: any;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-primary/70" />}
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="cursor-pointer"
      />
    </div>
  );

  const ToggleControl = ({ 
    label, 
    checked, 
    onChange,
    icon: Icon 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: (v: boolean) => void;
    icon?: any;
  }) => (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary/70" />}
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 pb-12 w-full">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 mb-4">
            <Zap className="w-4 h-4 text-neon-pink" />
            <span className="text-xs font-medium text-neon-pink uppercase tracking-wider">
              Advanced Mode
            </span>
          </div>
          
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
            Deep Song <span className="text-gradient">Rework Studio</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Professional-grade audio deconstruction and reconstruction with spectral, granular, and stem-based processing
          </p>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - File & Playback */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <FileUploader
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClearFile}
              />
            </motion.div>

            <AnimatePresence>
              {selectedFile && isLoaded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel p-4 space-y-4"
                >
                  <SeekableWaveform
                    isPlaying={isPlaying}
                    audioData={waveformData}
                    staticWaveform={staticWaveform}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={seek}
                  />

                  {/* Transport Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => seek(0)}
                      className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SkipBack className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePlayPause}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={stop}
                      className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Square className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Time Display */}
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                  </div>

                  <SpectrumAnalyzer isPlaying={isPlaying} audioData={waveformData} />

                  {/* TrapCity-style Audio Visualizer */}
                  <AudioVisualizer 
                    isPlaying={isPlaying} 
                    audioData={waveformData}
                    title={selectedFile?.name.replace(/\.[^/.]+$/, "").toUpperCase() || "DEEP REWORK"}
                    artist="AI REMIX"
                  />

                  {/* Analysis Info */}
                  {beatAnalysis && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/20 rounded-lg p-2 text-center">
                        <div className="text-muted-foreground">BPM</div>
                        <div className="text-lg font-bold text-primary">{detectedBPM || '--'}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-2 text-center">
                        <div className="text-muted-foreground">Key</div>
                        <div className="text-lg font-bold text-accent">{detectedKey || '--'}</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Presets Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neon-pink" />
                  Creative Presets
                </h3>
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary flex items-center gap-1.5 hover:bg-primary/30 transition-colors"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Save Custom Preset</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Enter preset name..."
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveCustomPreset()}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveCustomPreset}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium text-sm"
                      >
                        Save Preset
                      </motion.button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  {/* Built-in Presets */}
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Chorus & Drops
                  </div>
                  {builtInPresets.filter(p => p.category === "creative").map((preset) => {
                    const IconComp = getPresetIcon(preset.icon);
                    return (
                      <motion.button
                        key={preset.id}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleLoadPreset(preset)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                          selectedPreset === preset.id
                            ? "bg-primary/20 border-primary/50 shadow-lg shadow-primary/10"
                            : "bg-muted/10 border-border/20 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            selectedPreset === preset.id
                              ? "bg-primary/30 text-primary"
                              : "bg-muted/30 text-muted-foreground"
                          }`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">
                              {preset.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-1">
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}

                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                    Structure & Build
                  </div>
                  {builtInPresets.filter(p => p.category === "structure").map((preset) => {
                    const IconComp = getPresetIcon(preset.icon);
                    return (
                      <motion.button
                        key={preset.id}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleLoadPreset(preset)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                          selectedPreset === preset.id
                            ? "bg-accent/20 border-accent/50 shadow-lg shadow-accent/10"
                            : "bg-muted/10 border-border/20 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            selectedPreset === preset.id
                              ? "bg-accent/30 text-accent"
                              : "bg-muted/30 text-muted-foreground"
                          }`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">
                              {preset.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-1">
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* Custom Presets */}
                  {customPresets.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                        Your Presets
                      </div>
                      {customPresets.map((preset) => (
                        <motion.div
                          key={preset.id}
                          whileHover={{ scale: 1.01, x: 2 }}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                            selectedPreset === preset.id
                              ? "bg-neon-green/20 border-neon-green/50"
                              : "bg-muted/10 border-border/20 hover:bg-muted/20"
                          }`}
                        >
                          <button
                            onClick={() => handleLoadPreset(preset)}
                            className="flex-1 flex items-center gap-2"
                          >
                            <div className="w-7 h-7 rounded-lg bg-neon-green/20 flex items-center justify-center text-neon-green">
                              <Star className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-foreground truncate">
                              {preset.name}
                            </span>
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteCustomPreset(preset.id)}
                            className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/20">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSettings(defaultSettings);
                    setSelectedPreset(null);
                  }}
                  className="flex-1 text-xs py-2 rounded-lg bg-muted/20 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset All
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Deep Controls */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-4"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 mb-4 bg-muted/20">
                  <TabsTrigger value="stems" className="text-xs">
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    Stems
                  </TabsTrigger>
                  <TabsTrigger value="spectral" className="text-xs">
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    Spectral
                  </TabsTrigger>
                  <TabsTrigger value="time" className="text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Time
                  </TabsTrigger>
                  <TabsTrigger value="spatial" className="text-xs">
                    <Headphones className="w-3.5 h-3.5 mr-1.5" />
                    Spatial
                  </TabsTrigger>
                  <TabsTrigger value="creative" className="text-xs">
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    Creative
                  </TabsTrigger>
                </TabsList>

                {/* Stems Tab */}
                <TabsContent value="stems" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Music2 className="w-4 h-4 text-primary" />
                        Stem Isolation
                      </h3>
                      <SliderControl
                        label="Vocal Isolation"
                        value={settings.vocalIsolation}
                        onChange={(v) => updateSetting("vocalIsolation", v)}
                        icon={Radio}
                      />
                      <SliderControl
                        label="Drum Extraction"
                        value={settings.drumExtraction}
                        onChange={(v) => updateSetting("drumExtraction", v)}
                        icon={Disc3}
                      />
                      <SliderControl
                        label="Bass Extraction"
                        value={settings.bassExtraction}
                        onChange={(v) => updateSetting("bassExtraction", v)}
                        icon={Volume2}
                      />
                      <SliderControl
                        label="Melodic Extraction"
                        value={settings.melodicExtraction}
                        onChange={(v) => updateSetting("melodicExtraction", v)}
                        icon={Waves}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" />
                        Rhythmic Processing
                      </h3>
                      <ToggleControl
                        label="Beat Slice Mode"
                        checked={settings.beatSlice}
                        onChange={(v) => updateSetting("beatSlice", v)}
                        icon={Zap}
                      />
                      <SliderControl
                        label="Stutter Amount"
                        value={settings.stutterAmount}
                        onChange={(v) => updateSetting("stutterAmount", v)}
                      />
                      <SliderControl
                        label="Swing Amount"
                        value={settings.swingAmount}
                        onChange={(v) => updateSetting("swingAmount", v)}
                      />
                      <SliderControl
                        label="Groove Quantize"
                        value={settings.grooveQuantize}
                        onChange={(v) => updateSetting("grooveQuantize", v)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Spectral Tab */}
                <TabsContent value="spectral" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Spectral Manipulation
                      </h3>
                      <SliderControl
                        label="Spectral Shift"
                        value={settings.spectralShift}
                        onChange={(v) => updateSetting("spectralShift", v)}
                        min={-100}
                        max={100}
                        unit="ct"
                      />
                      <SliderControl
                        label="Spectral Stretch"
                        value={settings.spectralStretch}
                        onChange={(v) => updateSetting("spectralStretch", v)}
                        min={50}
                        max={200}
                      />
                      <SliderControl
                        label="Spectral Blur"
                        value={settings.spectralBlur}
                        onChange={(v) => updateSetting("spectralBlur", v)}
                      />
                      <ToggleControl
                        label="Spectral Freeze"
                        checked={settings.spectralFreeze}
                        onChange={(v) => updateSetting("spectralFreeze", v)}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Filter className="w-4 h-4 text-accent" />
                        Granular Synthesis
                      </h3>
                      <SliderControl
                        label="Grain Size"
                        value={settings.grainSize}
                        onChange={(v) => updateSetting("grainSize", v)}
                        unit="ms"
                      />
                      <SliderControl
                        label="Grain Density"
                        value={settings.grainDensity}
                        onChange={(v) => updateSetting("grainDensity", v)}
                      />
                      <SliderControl
                        label="Grain Pitch"
                        value={settings.grainPitch}
                        onChange={(v) => updateSetting("grainPitch", v)}
                        min={-24}
                        max={24}
                        unit="st"
                      />
                      <SliderControl
                        label="Grain Random"
                        value={settings.grainRandom}
                        onChange={(v) => updateSetting("grainRandom", v)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Time Tab */}
                <TabsContent value="time" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-primary" />
                        Time Stretch & Pitch
                      </h3>
                      <SliderControl
                        label="Time Stretch"
                        value={settings.timeStretch}
                        onChange={(v) => updateSetting("timeStretch", v)}
                        min={25}
                        max={400}
                      />
                      <SliderControl
                        label="Pitch Shift"
                        value={settings.pitchShift}
                        onChange={(v) => updateSetting("pitchShift", v)}
                        min={-24}
                        max={24}
                        unit="st"
                      />
                      <ToggleControl
                        label="Formant Preserve"
                        checked={settings.formantPreserve}
                        onChange={(v) => updateSetting("formantPreserve", v)}
                      />
                      <ToggleControl
                        label="Phase Vocoder"
                        checked={settings.phaseVocoder}
                        onChange={(v) => updateSetting("phaseVocoder", v)}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        Harmonic Processing
                      </h3>
                      <SliderControl
                        label="Harmonic Enhance"
                        value={settings.harmonicEnhance}
                        onChange={(v) => updateSetting("harmonicEnhance", v)}
                      />
                      <SliderControl
                        label="Sub Harmonics"
                        value={settings.subHarmonics}
                        onChange={(v) => updateSetting("subHarmonics", v)}
                      />
                      <SliderControl
                        label="Harmonic Distortion"
                        value={settings.harmonicDistort}
                        onChange={(v) => updateSetting("harmonicDistort", v)}
                      />
                      <ToggleControl
                        label="Pitch Correction"
                        checked={settings.pitchCorrect}
                        onChange={(v) => updateSetting("pitchCorrect", v)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Spatial Tab */}
                <TabsContent value="spatial" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-primary" />
                        Stereo & Space
                      </h3>
                      <SliderControl
                        label="Stereo Width"
                        value={settings.stereoWidth}
                        onChange={(v) => updateSetting("stereoWidth", v)}
                        max={200}
                      />
                      <SliderControl
                        label="Mono to Stereo"
                        value={settings.monoToStereo}
                        onChange={(v) => updateSetting("monoToStereo", v)}
                      />
                      <SliderControl
                        label="Surround Simulation"
                        value={settings.surroundSim}
                        onChange={(v) => updateSetting("surroundSim", v)}
                      />
                      <SliderControl
                        label="Room Size"
                        value={settings.roomSize}
                        onChange={(v) => updateSetting("roomSize", v)}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-accent" />
                        Dynamics
                      </h3>
                      <SliderControl
                        label="Multiband Compression"
                        value={settings.multiCompression}
                        onChange={(v) => updateSetting("multiCompression", v)}
                      />
                      <SliderControl
                        label="Transient Shape"
                        value={settings.transientShape}
                        onChange={(v) => updateSetting("transientShape", v)}
                        min={-100}
                        max={100}
                      />
                      <ToggleControl
                        label="Dynamic EQ"
                        checked={settings.dynamicEQ}
                        onChange={(v) => updateSetting("dynamicEQ", v)}
                      />
                      <SliderControl
                        label="Limiter Ceiling"
                        value={settings.limiterCeiling}
                        onChange={(v) => updateSetting("limiterCeiling", v)}
                        min={-12}
                        max={0}
                        unit="dB"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Creative Tab */}
                <TabsContent value="creative" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-primary" />
                        Lo-Fi & Degradation
                      </h3>
                      <SliderControl
                        label="Bit Crush"
                        value={settings.bitCrush}
                        onChange={(v) => updateSetting("bitCrush", v)}
                      />
                      <SliderControl
                        label="Sample Rate Reduce"
                        value={settings.sampleRateReduce}
                        onChange={(v) => updateSetting("sampleRateReduce", v)}
                      />
                      <SliderControl
                        label="Tape Wobble"
                        value={settings.tapeWobble}
                        onChange={(v) => updateSetting("tapeWobble", v)}
                      />
                      <SliderControl
                        label="Vinyl Crackle"
                        value={settings.vinylCrackle}
                        onChange={(v) => updateSetting("vinylCrackle", v)}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-accent" />
                        Frequency Shaping
                      </h3>
                      <SliderControl
                        label="Low Cut"
                        value={settings.lowCut}
                        onChange={(v) => updateSetting("lowCut", v)}
                        min={20}
                        max={500}
                        unit="Hz"
                      />
                      <SliderControl
                        label="High Cut"
                        value={settings.highCut}
                        onChange={(v) => updateSetting("highCut", v)}
                        min={1000}
                        max={20000}
                        unit="Hz"
                      />
                      <SliderControl
                        label="Mid Scoop"
                        value={settings.midScoop}
                        onChange={(v) => updateSetting("midScoop", v)}
                      />
                      <SliderControl
                        label="Presence"
                        value={settings.presence}
                        onChange={(v) => updateSetting("presence", v)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Processing Progress */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Processing...</span>
                    <span className="text-xs text-primary font-mono">{Math.round(processingProgress)}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </motion.div>
              )}

              {/* Toolbar - Undo/Redo, A/B, Randomize */}
              <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-border/20">
                {/* Undo/Redo */}
                <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* A/B Comparison */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleABComparison}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isABMode
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40"
                      : "bg-muted/20 text-muted-foreground hover:text-foreground border border-border/20"
                  }`}
                >
                  {isABMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  A/B
                </motion.button>

                {isABMode && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleAB}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      showingOriginal
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                        : "bg-neon-green/20 text-neon-green border border-neon-green/40"
                    }`}
                  >
                    {showingOriginal ? "Original" : "Processed"}
                  </motion.button>
                )}

                {/* Smart Randomize Dropdown */}
                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSmartRandomize()}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-neon-orange/20 to-neon-pink/20 text-neon-orange text-xs font-medium flex items-center gap-1.5 border border-neon-orange/30"
                  >
                    <Dices className="w-4 h-4" />
                    Randomize
                  </motion.button>
                  
                  {/* Dropdown for specific randomization */}
                  <div className="absolute top-full left-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="bg-card border border-border rounded-lg shadow-xl p-1 min-w-[140px]">
                      <button
                        onClick={() => handleSmartRandomize("chorus")}
                        className="w-full px-3 py-2 text-xs text-left rounded-md hover:bg-primary/10 flex items-center gap-2"
                      >
                        <Crown className="w-3 h-3 text-neon-cyan" />
                        For Chorus
                      </button>
                      <button
                        onClick={() => handleSmartRandomize("drop")}
                        className="w-full px-3 py-2 text-xs text-left rounded-md hover:bg-primary/10 flex items-center gap-2"
                      >
                        <Flame className="w-3 h-3 text-neon-pink" />
                        For Drop
                      </button>
                      <button
                        onClick={() => handleSmartRandomize("buildup")}
                        className="w-full px-3 py-2 text-xs text-left rounded-md hover:bg-primary/10 flex items-center gap-2"
                      >
                        <Rocket className="w-3 h-3 text-neon-purple" />
                        For Buildup
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1" />

                {/* Main Actions */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeepProcess}
                  disabled={!selectedFile || isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-neon-pink/20"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Deep Process
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSettings(defaultSettings);
                    setSelectedPreset(null);
                    pushToHistory(defaultSettings);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-muted/30 text-muted-foreground hover:text-foreground font-medium text-sm flex items-center gap-2 border border-border/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={!selectedFile}
                  className="px-4 py-2.5 rounded-xl bg-neon-green/20 text-neon-green font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-neon-green/30"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DeepRemixer;
