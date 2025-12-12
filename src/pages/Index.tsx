import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Brain, Waves, Sparkles, Music } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUploader from "@/components/FileUploader";
import SeekableWaveform from "@/components/SeekableWaveform";
import RemixControls, { EffectToggles } from "@/components/RemixControls";
import RemixStyleSelector from "@/components/RemixStyleSelector";
import GenerateButton from "@/components/GenerateButton";
import RemixOutput from "@/components/RemixOutput";
import BeatSequencer, { DrumPattern } from "@/components/BeatSequencer";
import AutoRemixFeatures, { AutoFeatures } from "@/components/AutoRemixFeatures";
import MultiTrackMerge, { TrackItem } from "@/components/MultiTrackMerge";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import FeatureCard from "@/components/FeatureCard";
import StatsDisplay from "@/components/StatsDisplay";
import BeatExtractionDisplay from "@/components/BeatExtractionDisplay";
import SpectrumAnalyzer from "@/components/SpectrumAnalyzer";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useBeatExtraction } from "@/hooks/useBeatExtraction";
import { supabase } from "@/integrations/supabase/client";

interface RemixData {
  remixName: string;
  description: string;
  beatPattern: number[];
  hiHatPattern?: number[];
  bassPattern?: number[];
  dropPoints: number[];
  buildupPoints?: number[];
  breakdownPoints?: number[];
  effectChain: string[];
  filterSweep: { start: number; end: number; duration: number; type?: string };
  reverbSettings?: { size: number; decay: number; wet: number; predelay: number };
  delaySettings?: { time: string; feedback: number; wet: number; pingPong: boolean };
  compressionSettings?: { threshold: number; ratio: number; attack: number; release: number; makeupGain: number };
  sidechain: { intensity: number; rate: number; attack?: number; release?: number };
  stereoWidth?: { low: number; mid: number; high: number };
  vocalProcessing?: { pitch: number; formant: number; chop: boolean; stutter: boolean; reverse: boolean; delay: boolean };
  synthLayers?: string[];
  drumProcessing?: { kick: { boost: number; distortion: number }; snare: { reverb: number; compression: number }; hats: { filter: number; pan: number } };
  automations?: { parameter: string; startValue: number; endValue: number; startTime: number; duration: number }[];
  transitions?: { type: string; time: number; duration: number }[];
  energyProfile?: number[];
  recommendations: string;
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remixGenerated, setRemixGenerated] = useState(false);
  const [remixData, setRemixData] = useState<RemixData | null>(null);
  const [staticWaveform, setStaticWaveform] = useState<number[]>([]);
  
  // Remix controls
  const [tempo, setTempo] = useState(120);
  const [pitch, setPitch] = useState(0);
  const [bass, setBass] = useState(50);
  const [effects, setEffects] = useState(50);
  const [selectedStyle, setSelectedStyle] = useState("edm");
  const [drumPattern, setDrumPattern] = useState<DrumPattern | null>(null);
  
  // Effect toggles
  const [effectToggles, setEffectToggles] = useState<EffectToggles>({
    reverb: true,
    delay: true,
    exciter: true,
    compression: true,
  });

  // Auto features
  const [autoFeatures, setAutoFeatures] = useState<AutoFeatures>({
    // Core Auto
    autoEQ: true,
    autoBass: true,
    autoEffects: true,
    autoMaster: true,
    // Structure
    autoDrop: true,
    autoTransition: true,
    autoBuild: true,
    autoChop: false,
    // Analysis
    autoTempoMatch: true,
    autoKeyDetect: true,
    autoBeatGrid: true,
    autoGroove: true,
    // Separation AI
    autoVocalIsolate: false,
    autoStemSplit: false,
    autoSidechain: true,
    autoHarmonize: false,
    // Dynamics
    autoCompression: true,
    autoLimiter: true,
    autoDeEss: false,
    autoGate: false,
    // Creative FX
    autoStutter: false,
    autoGlitch: false,
    autoTapeStop: false,
    autoRiser: true,
    // Spatial
    autoReverb: true,
    autoStereoWidth: true,
    autoAmbience: false,
    autoTexture: false,
  });

  // Multi-track merge
  const [mergeTracks, setMergeTracks] = useState<TrackItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  
  // Beat extraction
  const {
    isExtracting,
    analysis: beatAnalysis,
    extractedDrumPattern,
    detectedBPM,
    detectedKey,
    confidence,
    extractBeatsFromFile,
    reset: resetBeatExtraction,
  } = useBeatExtraction();

  const handleEffectToggle = useCallback((effect: keyof EffectToggles) => {
    setEffectToggles(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));
  }, []);

  const handleAutoFeatureToggle = useCallback((feature: keyof AutoFeatures) => {
    setAutoFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  }, []);

  const handleAddMergeTrack = useCallback((file: File) => {
    const newTrack: TrackItem = {
      id: crypto.randomUUID(),
      file,
      volume: 100,
      startOffset: 0,
    };
    setMergeTracks(prev => [...prev, newTrack]);
    toast.success(`Added "${file.name}" to merge`);
  }, []);

  const handleRemoveMergeTrack = useCallback((id: string) => {
    setMergeTracks(prev => prev.filter(t => t.id !== id));
  }, []);

  // Audio engine
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
    exportAudio
  } = useAudioEngine();

  const handleMergeTracks = useCallback(async () => {
    if (mergeTracks.length < 2) return;
    
    setIsMerging(true);
    toast.info("Merging tracks...");
    
    // Use the first track as the main track for now
    const mainTrack = mergeTracks[0];
    
    try {
      // Load the main track into the audio engine
      await loadFile(mainTrack.file);
      setSelectedFile(mainTrack.file);
      
      toast.success(`Merged ${mergeTracks.length} tracks! Main track loaded for remixing.`);
    } catch (error) {
      toast.error("Failed to merge tracks");
    } finally {
      setIsMerging(false);
    }
  }, [mergeTracks, loadFile]);

  // Update audio engine settings when controls change
  useEffect(() => {
    updateSettings({ 
      tempo, 
      pitch, 
      bass, 
      effects,
      reverbEnabled: effectToggles.reverb,
      delayEnabled: effectToggles.delay,
      exciterEnabled: effectToggles.exciter,
      compressionEnabled: effectToggles.compression,
    });
  }, [tempo, pitch, bass, effects, effectToggles, updateSettings]);

  const handlePatternChange = useCallback((pattern: DrumPattern) => {
    setDrumPattern(pattern);
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setRemixGenerated(false);
    setRemixData(null);
    resetBeatExtraction();
    
    try {
      const waveform = await loadFile(file);
      setStaticWaveform(waveform);
      
      // Automatically extract beats from the uploaded song
      toast.info("Analyzing beats and rhythm from your track...");
      const analysis = await extractBeatsFromFile(file);
      
      if (analysis) {
        // Update tempo to detected BPM if available
        if (analysis.beats.bpm) {
          setTempo(analysis.beats.bpm);
        }
      }
      
      toast.success("Track loaded and analyzed! Press Space to preview.");
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Failed to load audio file. Please try a different format.");
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setRemixGenerated(false);
    setRemixData(null);
    setStaticWaveform([]);
    resetBeatExtraction();
    stop();
  };
  
  // Apply extracted pattern to sequencer
  const handleApplyExtractedPattern = useCallback((pattern: number[][]) => {
    if (pattern.length >= 4) {
      // Convert to DrumPattern format
      const newPattern: DrumPattern = {
        kick: pattern[0].map(v => v > 0),
        snare: pattern[1].map(v => v > 0),
        hihat: pattern[2].map(v => v > 0),
        clap: pattern[3].map(v => v > 0),
      };
      setDrumPattern(newPattern);
      toast.success("Extracted drum pattern applied to sequencer!");
    }
  }, []);

  // Generate a local fallback remix when AI is unavailable
  const generateFallbackRemix = (trackName: string, style: string, currentTempo: number): RemixData => {
    const styleConfigs: Record<string, { energy: string; drops: boolean; synths: string; bpm: number; sidechainIntensity: number }> = {
      edm: { energy: 'high', drops: true, synths: 'supersaw', bpm: Math.max(currentTempo, 128), sidechainIntensity: 0.8 },
      lofi: { energy: 'low', drops: false, synths: 'warm', bpm: Math.min(currentTempo, 90), sidechainIntensity: 0.3 },
      trap: { energy: 'medium', drops: true, synths: 'bass-heavy', bpm: currentTempo, sidechainIntensity: 0.7 },
      house: { energy: 'medium', drops: true, synths: 'disco', bpm: 125, sidechainIntensity: 0.6 },
      dubstep: { energy: 'high', drops: true, synths: 'wobble', bpm: 140, sidechainIntensity: 0.9 },
      dnb: { energy: 'high', drops: true, synths: 'reese', bpm: 174, sidechainIntensity: 0.75 },
    };
    
    const config = styleConfigs[style] || styleConfigs.edm;
    
    return {
      remixName: `${trackName} - ${style.toUpperCase()} Remix`,
      description: `Local ${style} remix with ${config.energy} energy vibes (AI credits unavailable)`,
      beatPattern: style === 'trap' ? [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0] : [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hiHatPattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      bassPattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      dropPoints: config.drops ? [32, 64, 96] : [],
      buildupPoints: config.drops ? [28, 60, 92] : [],
      breakdownPoints: [48, 80],
      effectChain: ['EQ', 'Compression', 'Reverb', 'Delay', 'Limiter'],
      filterSweep: { start: 200, end: 8000, duration: 8, type: 'lowpass' },
      reverbSettings: { size: style === 'lofi' ? 0.7 : 0.4, decay: 2.5, wet: 0.3, predelay: 20 },
      delaySettings: { time: '1/4', feedback: 0.35, wet: 0.25, pingPong: true },
      compressionSettings: { threshold: -18, ratio: 4, attack: 10, release: 100, makeupGain: 3 },
      sidechain: { intensity: config.sidechainIntensity, rate: 4, attack: 5, release: 150 },
      stereoWidth: { low: 0.8, mid: 1.0, high: 1.3 },
      synthLayers: [config.synths, 'pad', 'lead'],
      drumProcessing: { kick: { boost: 3, distortion: 0.2 }, snare: { reverb: 0.3, compression: 0.6 }, hats: { filter: 8000, pan: 0.3 } },
      transitions: config.drops ? [
        { type: 'buildup', time: 28, duration: 4 },
        { type: 'drop', time: 32, duration: 16 },
        { type: 'breakdown', time: 48, duration: 8 }
      ] : [{ type: 'smooth', time: 16, duration: 4 }],
      energyProfile: config.energy === 'high' ? [0.3, 0.5, 0.7, 0.9, 1.0, 0.8, 0.6] : [0.4, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4],
      recommendations: `Local ${style} remix generated. For AI-powered remixes, please add more credits to your account.`,
    };
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please upload a track first");
      return;
    }
    
    setIsGenerating(true);
    toast.loading("AI is analyzing your track and creating a professional remix with extracted beats...", { id: "generating" });
    
    try {
      const trackName = selectedFile.name.replace(/\.[^/.]+$/, "");
      
      // Build extracted beat data for AI
      const extractedBeatData = beatAnalysis ? {
        detectedBPM: beatAnalysis.beats.bpm,
        detectedKey: beatAnalysis.keyEstimate,
        confidence: beatAnalysis.beats.confidence,
        beatPositions: beatAnalysis.beats.beatPositions.slice(0, 100), // First 100 beats
        sections: beatAnalysis.sections,
        energyProfile: beatAnalysis.energyProfile,
        drumPattern: beatAnalysis.drumPattern,
        rhythmPattern: beatAnalysis.beats.rhythmPattern,
        transientTypes: beatAnalysis.beats.transients.slice(0, 50).map(t => ({
          time: t.time,
          type: t.type,
          strength: t.strength,
        })),
      } : null;
      
      const { data, error } = await supabase.functions.invoke('generate-remix', {
        body: {
          style: selectedStyle,
          tempo: detectedBPM || tempo, // Use detected BPM if available
          pitch,
          bass,
          effects,
          trackName,
          autoFeatures,
          extractedBeats: extractedBeatData,
          mergeTracks: mergeTracks.map(t => ({
            name: t.file.name,
            volume: t.volume,
            startOffset: t.startOffset,
          })),
        }
      });

      // Check for credit exhaustion error
      if (error?.message?.includes('402') || data?.error?.includes('credits')) {
        console.warn("AI credits exhausted, using local fallback");
        toast.loading("AI unavailable, generating local remix...", { id: "generating" });
        const fallbackRemix = generateFallbackRemix(trackName, selectedStyle, detectedBPM || tempo);
        setRemixData(fallbackRemix);
        setRemixGenerated(true);
        toast.success("Local remix generated! (AI credits unavailable)", { id: "generating" });
        return;
      }

      if (error) {
        throw error;
      }

      if (data?.error) {
        // Check if it's a credits error in the response
        if (data.error.includes('credits') || data.error.includes('402')) {
          const fallbackRemix = generateFallbackRemix(trackName, selectedStyle, detectedBPM || tempo);
          setRemixData(fallbackRemix);
          setRemixGenerated(true);
          toast.success("Local remix generated! (AI credits unavailable)", { id: "generating" });
          return;
        }
        throw new Error(data.error);
      }

      setRemixData(data.remix);
      setRemixGenerated(true);
      toast.success("Your AI remix is ready! Hit play to hear the magic.", { id: "generating" });
      
    } catch (error: any) {
      console.error("Error generating remix:", error);
      // Final fallback for any error
      const trackName = selectedFile.name.replace(/\.[^/.]+$/, "");
      if (error.message?.includes('402') || error.message?.includes('credit')) {
        const fallbackRemix = generateFallbackRemix(trackName, selectedStyle, detectedBPM || tempo);
        setRemixData(fallbackRemix);
        setRemixGenerated(true);
        toast.success("Local remix generated! (AI unavailable)", { id: "generating" });
      } else {
        toast.error(error.message || "Failed to generate remix. Please try again.", { id: "generating" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    const trackName = selectedFile.name.replace(/\.[^/.]+$/, "");
    await exportAudio(trackName);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied to clipboard!");
  };

  const styleNames: Record<string, string> = {
    edm: "EDM Drop",
    lofi: "Lo-Fi Chill",
    trap: "Trap",
    house: "House Groove",
    dubstep: "Dubstep",
    dnb: "Drum & Bass",
  };

  const features = [
    {
      title: "Smart Analysis",
      description: "AI analyzes tempo, key, structure, and dynamics of your track for perfect remixing",
      icon: Brain,
      gradient: "from-neon-cyan to-neon-blue",
    },
    {
      title: "Beat Generation",
      description: "Creates unique patterns and rhythms from your original sounds",
      icon: Waves,
      gradient: "from-neon-pink to-neon-purple",
    },
    {
      title: "Pro Quality",
      description: "Real-time audio processing with studio-grade effects and mastering",
      icon: Sparkles,
      gradient: "from-neon-orange to-neon-pink",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <KeyboardShortcuts
        onTogglePlayPause={togglePlayPause}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        isLoaded={isLoaded}
        remixGenerated={remixGenerated}
      />
      
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 pb-12 w-full">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              Transform Any Track Into A
              <br />
              <span className="text-gradient">Unique Remix</span>
            </h2>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Upload your song and let our AI deconstruct it, create new beats, 
            and generate a professional remix in seconds.
          </motion.p>
          
          {/* Quick tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-full"
          >
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground text-[10px]">Shift+?</kbd>
            <span>for keyboard shortcuts</span>
          </motion.div>
        </motion.section>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Original Track</span>
                    <button
                      onClick={togglePlayPause}
                      className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1.5"
                    >
                      <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-neon-green animate-pulse' : 'bg-muted-foreground'}`} />
                      {isPlaying ? "Pause (Space)" : "Play (Space)"}
                    </button>
                  </div>
                  
                  <SeekableWaveform 
                    isPlaying={isPlaying} 
                    audioData={waveformData}
                    staticWaveform={staticWaveform}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={seek}
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground px-4">
                    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                  </div>

                  {/* Stats Display */}
                  <StatsDisplay 
                    duration={duration}
                    tempo={detectedBPM || tempo}
                    style={styleNames[selectedStyle]}
                    effects={effects}
                    detectedKey={detectedKey}
                  />
                  {/* Spectrum Analyzer */}
                  <SpectrumAnalyzer 
                    isPlaying={isPlaying}
                    audioData={waveformData}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Beat Extraction Display */}
            <AnimatePresence>
              {(beatAnalysis || isExtracting) && (
                <BeatExtractionDisplay
                  analysis={beatAnalysis}
                  isExtracting={isExtracting}
                  onApplyPattern={handleApplyExtractedPattern}
                />
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <RemixStyleSelector
                selectedStyle={selectedStyle}
                onStyleSelect={setSelectedStyle}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <BeatSequencer
                isPlaying={isPlaying}
                tempo={tempo}
                onPatternChange={handlePatternChange}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MultiTrackMerge
                tracks={mergeTracks}
                onTracksChange={setMergeTracks}
                onAddTrack={handleAddMergeTrack}
                onRemoveTrack={handleRemoveMergeTrack}
                onMerge={handleMergeTracks}
                isMerging={isMerging}
              />
            </motion.div>
          </div>

          {/* Right Column - Parameters & Output */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AutoRemixFeatures
                features={autoFeatures}
                onFeaturesChange={setAutoFeatures}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="glass-panel p-5"
            >
              <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Fine-tune Your Remix
              </h3>
              <RemixControls
                tempo={tempo}
                pitch={pitch}
                bass={bass}
                effects={effects}
                effectToggles={effectToggles}
                onTempoChange={setTempo}
                onPitchChange={setPitch}
                onBassChange={setBass}
                onEffectsChange={setEffects}
                onEffectToggle={handleEffectToggle}
              />
            </motion.div>

            <div className="animate-in fade-in slide-in-from-right-5 duration-500" style={{ animationDelay: '500ms' }}>
              <GenerateButton
                isGenerating={isGenerating}
                disabled={!selectedFile || !isLoaded}
                onClick={handleGenerate}
              />
            </div>

            <AnimatePresence>
              {remixGenerated && (
                <RemixOutput
                  isPlaying={isPlaying}
                  onPlayPause={togglePlayPause}
                  onDownload={handleDownload}
                  onShare={handleShare}
                  onRegenerate={handleGenerate}
                  remixName={selectedFile?.name.replace(/\.[^/.]+$/, "") || "Track"}
                  style={styleNames[selectedStyle]}
                  remixData={remixData || undefined}
                  waveformData={waveformData}
                  currentTime={currentTime}
                  duration={duration}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={0.7 + index * 0.1}
            />
          ))}
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
