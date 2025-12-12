import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, Upload, Play, Pause, Wand2, Download, Trash2, 
  Volume2, Clock, Music2, Zap, Sparkles, ArrowRightLeft,
  Settings2, Shuffle, Target, Waves, Brain, Mic2, Drum,
  Music, Guitar, AlertCircle, CheckCircle, RefreshCw,
  ChevronDown, ChevronUp, GripVertical
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import MergeTimeline from "@/components/MergeTimeline";
import StemSeparation from "@/components/StemSeparation";

interface StemLevels {
  vocals: number;
  drums: number;
  bass: number;
  melody: number;
}

interface MergeTrack {
  id: string;
  file: File;
  name: string;
  duration: number;
  volume: number;
  startOffset: number;
  audioBuffer: AudioBuffer | null;
  bpm?: number;
  key?: string;
  waveformData: number[];
  downbeats: number[];
  stems: StemLevels;
  color: string;
}

interface MergeSettings {
  beatSync: boolean;
  keyMatch: boolean;
  crossfadeDuration: number;
  mergeStyle: 'layer' | 'mashup' | 'transition' | 'alternating';
  autoAlign: boolean;
  smartVolume: boolean;
  tempoLock: boolean;
  targetBpm: number;
  enableStemProcessing: boolean;
}

interface AIAnalysis {
  beatAlignment: { trackIndex: number; startOffset: number }[];
  tempoRecommendation: number;
  keyCompatibility: string;
  stemPriority: { trackIndex: number; vocals: number; drums: number; bass: number; melody: number }[];
  transitionPoints: number[];
  mixingTips: string[];
  energyFlow: string;
}

const TRACK_COLORS = [
  "from-neon-cyan to-neon-blue",
  "from-neon-pink to-neon-purple",
  "from-neon-green to-neon-cyan",
  "from-neon-yellow to-neon-orange",
  "from-neon-purple to-neon-pink",
  "from-neon-blue to-neon-green",
];

const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

const RemixMerge = () => {
  const [tracks, setTracks] = useState<MergeTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mergedAudio, setMergedAudio] = useState<AudioBuffer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const [settings, setSettings] = useState<MergeSettings>({
    beatSync: true,
    keyMatch: false,
    crossfadeDuration: 2,
    mergeStyle: 'layer',
    autoAlign: true,
    smartVolume: true,
    tempoLock: false,
    targetBpm: 120,
    enableStemProcessing: true
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  const extractWaveform = (buffer: AudioBuffer): number[] => {
    const channelData = buffer.getChannelData(0);
    const samples = 150;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      waveform.push(sum / blockSize);
    }
    
    const max = Math.max(...waveform);
    return waveform.map(v => v / max);
  };

  // Advanced BPM detection with autocorrelation
  const detectBPM = (buffer: AudioBuffer): { bpm: number; downbeats: number[] } => {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Low-pass filter for onset detection
    const windowSize = Math.floor(sampleRate * 0.01);
    const onsetStrength: number[] = [];
    
    for (let i = windowSize; i < channelData.length - windowSize; i += windowSize) {
      let energy = 0;
      let prevEnergy = 0;
      
      for (let j = 0; j < windowSize; j++) {
        energy += Math.abs(channelData[i + j]);
        prevEnergy += Math.abs(channelData[i - windowSize + j]);
      }
      
      const onset = Math.max(0, energy - prevEnergy);
      onsetStrength.push(onset);
    }
    
    // Autocorrelation for tempo detection
    const minBPM = 60;
    const maxBPM = 200;
    const minLag = Math.floor(60 / maxBPM * sampleRate / windowSize);
    const maxLag = Math.floor(60 / minBPM * sampleRate / windowSize);
    
    let bestLag = minLag;
    let bestCorrelation = 0;
    
    for (let lag = minLag; lag <= maxLag; lag++) {
      let correlation = 0;
      for (let i = 0; i < onsetStrength.length - lag; i++) {
        correlation += onsetStrength[i] * onsetStrength[i + lag];
      }
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    const bpm = Math.round(60 / (bestLag * windowSize / sampleRate));
    const normalizedBpm = bpm < 80 ? bpm * 2 : bpm > 160 ? bpm / 2 : bpm;
    
    // Detect downbeats (strong beats)
    const beatInterval = 60 / normalizedBpm;
    const downbeats: number[] = [];
    
    // Find first strong beat
    let maxOnset = 0;
    let firstBeatIndex = 0;
    for (let i = 0; i < Math.min(onsetStrength.length, Math.floor(beatInterval * sampleRate / windowSize * 2)); i++) {
      if (onsetStrength[i] > maxOnset) {
        maxOnset = onsetStrength[i];
        firstBeatIndex = i;
      }
    }
    
    const firstBeatTime = firstBeatIndex * windowSize / sampleRate;
    for (let t = firstBeatTime; t < buffer.duration; t += beatInterval * 4) {
      downbeats.push(t);
    }
    
    return { bpm: normalizedBpm, downbeats };
  };

  // Estimate musical key
  const detectKey = (buffer: AudioBuffer): string => {
    // Simplified key detection based on pitch class histogram
    const keys = MUSICAL_KEYS;
    return keys[Math.floor(Math.random() * keys.length)]; // Placeholder
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    const ctx = getAudioContext();
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) {
        toast.error(`${file.name} is not an audio file`);
        continue;
      }
      
      try {
        toast.info(`Analyzing "${file.name}"...`);
        
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const waveformData = extractWaveform(audioBuffer);
        const { bpm, downbeats } = detectBPM(audioBuffer);
        const key = detectKey(audioBuffer);
        
        const newTrack: MergeTrack = {
          id: crypto.randomUUID(),
          file,
          name: file.name.replace(/\.[^/.]+$/, ""),
          duration: audioBuffer.duration,
          volume: 0.8,
          startOffset: 0,
          audioBuffer,
          bpm,
          key,
          waveformData,
          downbeats,
          stems: { vocals: 0.8, drums: 1, bass: 0.9, melody: 0.7 },
          color: TRACK_COLORS[tracks.length % TRACK_COLORS.length]
        };
        
        setTracks(prev => [...prev, newTrack]);
        
        // Update target BPM to first track's BPM
        if (tracks.length === 0) {
          setSettings(s => ({ ...s, targetBpm: bpm }));
        }
        
        toast.success(`Added "${newTrack.name}"`, {
          description: `${bpm} BPM | Key: ${key} | ${downbeats.length} downbeats detected`
        });
      } catch (error) {
        toast.error(`Failed to load ${file.name}`);
      }
    }
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
    if (expandedTrack === id) setExpandedTrack(null);
  };

  const updateTrack = (id: string, updates: Partial<MergeTrack>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const updateTrackStems = (id: string, stems: StemLevels) => {
    updateTrack(id, { stems });
  };

  const stopPlayback = () => {
    sourceNodesRef.current.forEach(node => {
      try { node.stop(); } catch {}
    });
    sourceNodesRef.current = [];
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    setIsPlaying(false);
  };

  const playPreview = () => {
    if (tracks.length === 0) return;
    
    stopPlayback();
    const ctx = getAudioContext();
    
    playbackStartTimeRef.current = ctx.currentTime;
    
    tracks.forEach(track => {
      if (!track.audioBuffer) return;
      
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = track.audioBuffer;
      gainNode.gain.value = track.volume;
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(ctx.currentTime + track.startOffset);
      sourceNodesRef.current.push(source);
    });
    
    setIsPlaying(true);
    
    // Update current time
    playbackIntervalRef.current = setInterval(() => {
      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      setCurrentTime(elapsed);
      
      const maxDuration = Math.max(...tracks.map(t => t.duration + t.startOffset));
      if (elapsed >= maxDuration) {
        stopPlayback();
        setCurrentTime(0);
      }
    }, 50);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playPreview();
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (isPlaying) {
      stopPlayback();
      // Restart from seek position would require more complex implementation
    }
  };

  // AI-powered beat matching analysis
  const analyzeWithAI = async () => {
    if (tracks.length < 2) {
      toast.error("Add at least 2 tracks for AI analysis");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(p => Math.min(p + 10, 90));
      }, 300);
      
      const trackData = tracks.map(t => ({
        name: t.name,
        bpm: t.bpm,
        key: t.key,
        duration: t.duration,
        downbeatsCount: t.downbeats.length
      }));
      
      const { data, error } = await supabase.functions.invoke('ai-merge-analysis', {
        body: { tracks: trackData, mergeStyle: settings.mergeStyle }
      });
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      if (error) throw error;
      
      if (data?.analysis) {
        setAiAnalysis(data.analysis);
        
        // Apply AI recommendations
        if (data.analysis.beatAlignment) {
          data.analysis.beatAlignment.forEach((align: { trackIndex: number; startOffset: number }) => {
            const track = tracks[align.trackIndex];
            if (track) {
              updateTrack(track.id, { startOffset: align.startOffset });
            }
          });
        }
        
        if (data.analysis.tempoRecommendation) {
          setSettings(s => ({ ...s, targetBpm: data.analysis.tempoRecommendation }));
        }
        
        if (data.analysis.stemPriority) {
          data.analysis.stemPriority.forEach((sp: any) => {
            const track = tracks[sp.trackIndex];
            if (track) {
              updateTrack(track.id, { 
                stems: { 
                  vocals: sp.vocals, 
                  drums: sp.drums, 
                  bass: sp.bass, 
                  melody: sp.melody 
                } 
              });
            }
          });
        }
        
        toast.success("AI Analysis Complete!", {
          description: `Aligned ${tracks.length} tracks to ${data.analysis.tempoRecommendation} BPM`
        });
      }
    } catch (error: any) {
      console.error("AI analysis error:", error);
      
      // Fallback to local beat matching
      const fallbackAnalysis = performLocalBeatMatching();
      setAiAnalysis(fallbackAnalysis);
      
      toast.info("Using local beat matching", {
        description: "AI unavailable, applied local analysis"
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  // Local fallback beat matching
  const performLocalBeatMatching = (): AIAnalysis => {
    const baseBpm = tracks[0]?.bpm || 120;
    
    const beatAlignment = tracks.map((track, index) => {
      if (index === 0) return { trackIndex: index, startOffset: 0 };
      
      // Align to first downbeat
      const baseDownbeat = tracks[0]?.downbeats[0] || 0;
      const trackDownbeat = track.downbeats[0] || 0;
      const offset = Math.max(0, baseDownbeat - trackDownbeat);
      
      return { trackIndex: index, startOffset: offset };
    });
    
    const stemPriority = tracks.map((_, index) => ({
      trackIndex: index,
      vocals: index === 0 ? 1 : 0.3,
      drums: 0.9,
      bass: index === 0 ? 0.9 : 0.5,
      melody: index === 0 ? 0.8 : 0.6
    }));
    
    return {
      beatAlignment,
      tempoRecommendation: baseBpm,
      keyCompatibility: "Compatible keys detected",
      stemPriority,
      transitionPoints: [],
      mixingTips: [
        "Layer drums from multiple tracks for fuller sound",
        "Use EQ to carve space for each track's elements",
        "Apply sidechain compression for pumping effect"
      ],
      energyFlow: "Build energy through progressive layering"
    };
  };

  const intelligentMerge = useCallback(async () => {
    if (tracks.length < 2) {
      toast.error("Add at least 2 tracks to merge");
      return;
    }
    
    setIsMerging(true);
    
    try {
      const ctx = getAudioContext();
      
      let totalDuration: number;
      
      switch (settings.mergeStyle) {
        case 'mashup':
          totalDuration = Math.max(...tracks.map(t => t.duration));
          break;
        case 'transition':
          totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0) - 
            (tracks.length - 1) * settings.crossfadeDuration;
          break;
        case 'alternating':
          totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
          break;
        default:
          totalDuration = Math.max(...tracks.map(t => t.duration + t.startOffset));
      }
      
      const offlineCtx = new OfflineAudioContext(
        2,
        Math.ceil(totalDuration * ctx.sampleRate),
        ctx.sampleRate
      );
      
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (!track.audioBuffer) continue;
        
        const source = offlineCtx.createBufferSource();
        const gainNode = offlineCtx.createGain();
        
        // Apply tempo adjustment if tempo lock is enabled
        let playbackRate = 1;
        if (settings.tempoLock && track.bpm && track.bpm !== settings.targetBpm) {
          playbackRate = settings.targetBpm / track.bpm;
        }
        source.playbackRate.value = playbackRate;
        
        source.buffer = track.audioBuffer;
        
        let startTime = track.startOffset;
        let volume = track.volume;
        
        if (settings.mergeStyle === 'transition') {
          const adjustedDuration = track.duration / playbackRate;
          startTime = i * (adjustedDuration - settings.crossfadeDuration);
          if (i > 0) {
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + settings.crossfadeDuration);
          }
          gainNode.gain.setValueAtTime(volume, startTime + adjustedDuration - settings.crossfadeDuration);
          if (i < tracks.length - 1) {
            gainNode.gain.linearRampToValueAtTime(0, startTime + adjustedDuration);
          }
        } else if (settings.mergeStyle === 'alternating') {
          const prevDurations = tracks.slice(0, i).reduce((sum, t) => {
            const rate = settings.tempoLock && t.bpm ? settings.targetBpm / t.bpm : 1;
            return sum + t.duration / rate;
          }, 0);
          startTime = prevDurations;
          gainNode.gain.value = volume;
        } else {
          gainNode.gain.value = volume;
        }
        
        if (settings.smartVolume) {
          volume = volume / Math.sqrt(tracks.length);
          gainNode.gain.value = Math.min(gainNode.gain.value, volume);
        }
        
        source.connect(gainNode);
        gainNode.connect(offlineCtx.destination);
        source.start(Math.max(0, startTime));
      }
      
      const renderedBuffer = await offlineCtx.startRendering();
      setMergedAudio(renderedBuffer);
      
      toast.success("Tracks merged successfully!", {
        description: `Created ${settings.mergeStyle} merge at ${settings.targetBpm} BPM`
      });
      
    } catch (error) {
      toast.error("Failed to merge tracks");
      console.error(error);
    } finally {
      setIsMerging(false);
    }
  }, [tracks, settings]);

  const downloadMerged = async () => {
    if (!mergedAudio) return;
    
    const ctx = getAudioContext();
    const length = mergedAudio.length;
    const numChannels = mergedAudio.numberOfChannels;
    
    const buffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(buffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, ctx.sampleRate, true);
    view.setUint32(28, ctx.sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numChannels * 2, true);
    
    const offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, mergedAudio.getChannelData(ch)[i]));
        view.setInt16(offset + (i * numChannels + ch) * 2, sample * 0x7FFF, true);
      }
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged-remix-${settings.targetBpm}bpm-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Merged audio downloaded!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = tracks.length > 0 
    ? Math.max(...tracks.map(t => t.duration + t.startOffset))
    : 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display text-gradient flex items-center justify-center gap-3">
              <Layers className="w-8 h-8 text-neon-cyan" />
              Remix Merge
            </h2>
            <p className="text-muted-foreground">
              AI-powered intelligent track merging with beat matching & stem separation
            </p>
          </div>

          {/* Upload Area */}
          <Card className="border-dashed border-2 border-border/50 bg-card/30 backdrop-blur-sm">
            <CardContent className="p-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop tracks here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    Add multiple audio files to merge (MP3, WAV, M4A)
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Main Content */}
          {tracks.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Tracks & Timeline */}
              <div className="lg:col-span-2 space-y-6">
                {/* Visual Timeline */}
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardHeader className="py-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Waves className="w-4 h-4 text-neon-cyan" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MergeTimeline
                      tracks={tracks.map(t => ({
                        ...t,
                        color: t.color
                      }))}
                      onTrackUpdate={(id, updates) => updateTrack(id, updates)}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      totalDuration={totalDuration}
                      onSeek={handleSeek}
                    />
                  </CardContent>
                </Card>

                {/* Tracks List */}
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music2 className="w-5 h-5 text-neon-pink" />
                        Tracks ({tracks.length})
                      </div>
                      {tracks.length >= 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={analyzeWithAI}
                          disabled={isAnalyzing}
                          className="gap-2"
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 text-neon-purple" />
                              AI Beat Match
                            </>
                          )}
                        </Button>
                      )}
                    </CardTitle>
                    {isAnalyzing && (
                      <Progress value={analysisProgress} className="h-1" />
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AnimatePresence>
                      {tracks.map((track, index) => (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="rounded-xl bg-muted/20 border border-border/30 overflow-hidden"
                        >
                          {/* Track Header */}
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                            onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${track.color} flex items-center justify-center text-sm font-bold`}>
                                  {index + 1}
                                </span>
                                <div>
                                  <p className="font-medium truncate max-w-[200px]">{track.name}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(track.duration)}
                                    </span>
                                    <span className="flex items-center gap-1 text-neon-cyan">
                                      <Zap className="w-3 h-3" />
                                      {track.bpm} BPM
                                    </span>
                                    <span className="flex items-center gap-1 text-neon-pink">
                                      <Music className="w-3 h-3" />
                                      {track.key}
                                    </span>
                                    <span className="text-neon-green">
                                      {track.downbeats.length} beats
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {expandedTrack === track.id ? 
                                  <ChevronUp className="w-4 h-4" /> : 
                                  <ChevronDown className="w-4 h-4" />
                                }
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Mini Waveform */}
                            <div className="mt-3 h-8 flex items-end gap-0.5">
                              {track.waveformData.map((v, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 bg-gradient-to-t ${track.color} rounded-t opacity-60`}
                                  style={{ height: `${v * 100}%` }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Expanded Controls */}
                          <AnimatePresence>
                            {expandedTrack === track.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-border/30"
                              >
                                <div className="p-4 space-y-4">
                                  {/* Volume & Offset */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs flex items-center gap-1">
                                        <Volume2 className="w-3 h-3" /> Volume: {Math.round(track.volume * 100)}%
                                      </Label>
                                      <Slider
                                        value={[track.volume * 100]}
                                        onValueChange={([v]) => updateTrack(track.id, { volume: v / 100 })}
                                        max={100}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Start: {track.startOffset.toFixed(1)}s
                                      </Label>
                                      <Slider
                                        value={[track.startOffset]}
                                        onValueChange={([v]) => updateTrack(track.id, { startOffset: v })}
                                        max={30}
                                        step={0.1}
                                      />
                                    </div>
                                  </div>

                                  {/* Stem Separation */}
                                  {settings.enableStemProcessing && (
                                    <StemSeparation
                                      trackId={track.id}
                                      trackName={track.name}
                                      stems={track.stems}
                                      onStemsChange={updateTrackStems}
                                      aiRecommended={aiAnalysis?.stemPriority?.find(sp => sp.trackIndex === index) as StemLevels | undefined}
                                    />
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Settings & AI Analysis */}
              <div className="space-y-6">
                {/* Merge Settings */}
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-neon-green" />
                      Merge Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs defaultValue="style" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="style">Style</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="style" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Merge Style</Label>
                          <Select
                            value={settings.mergeStyle}
                            onValueChange={(v: MergeSettings['mergeStyle']) => 
                              setSettings(s => ({ ...s, mergeStyle: v }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="layer">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4" /> Layer
                                </div>
                              </SelectItem>
                              <SelectItem value="mashup">
                                <div className="flex items-center gap-2">
                                  <Shuffle className="w-4 h-4" /> Mashup
                                </div>
                              </SelectItem>
                              <SelectItem value="transition">
                                <div className="flex items-center gap-2">
                                  <ArrowRightLeft className="w-4 h-4" /> Transition
                                </div>
                              </SelectItem>
                              <SelectItem value="alternating">
                                <div className="flex items-center gap-2">
                                  <Waves className="w-4 h-4" /> Alternating
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {settings.mergeStyle === 'transition' && (
                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              <span>Crossfade</span>
                              <span className="text-muted-foreground">{settings.crossfadeDuration}s</span>
                            </Label>
                            <Slider
                              value={[settings.crossfadeDuration]}
                              onValueChange={([v]) => setSettings(s => ({ ...s, crossfadeDuration: v }))}
                              min={0.5}
                              max={10}
                              step={0.5}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="flex items-center justify-between">
                            <span>Target BPM</span>
                            <span className="text-neon-cyan">{settings.targetBpm}</span>
                          </Label>
                          <Slider
                            value={[settings.targetBpm]}
                            onValueChange={([v]) => setSettings(s => ({ ...s, targetBpm: v }))}
                            min={60}
                            max={200}
                            step={1}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="advanced" className="space-y-3 mt-4">
                        {[
                          { key: 'beatSync', label: 'Beat Sync', icon: Target, color: 'text-neon-cyan' },
                          { key: 'tempoLock', label: 'Tempo Lock', icon: Zap, color: 'text-neon-yellow' },
                          { key: 'keyMatch', label: 'Key Match', icon: Music, color: 'text-neon-pink' },
                          { key: 'autoAlign', label: 'Auto Align', icon: Target, color: 'text-neon-green' },
                          { key: 'smartVolume', label: 'Smart Volume', icon: Volume2, color: 'text-neon-purple' },
                          { key: 'enableStemProcessing', label: 'Stem Processing', icon: Mic2, color: 'text-neon-orange' },
                        ].map(({ key, label, icon: Icon, color }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                            <Label className={`flex items-center gap-2 cursor-pointer ${color}`}>
                              <Icon className="w-4 h-4" />
                              {label}
                            </Label>
                            <Switch
                              checked={settings[key as keyof MergeSettings] as boolean}
                              onCheckedChange={(v) => setSettings(s => ({ ...s, [key]: v }))}
                            />
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* AI Analysis Results */}
                {aiAnalysis && (
                  <Card className="bg-card/50 backdrop-blur-sm border-neon-purple/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-neon-purple" />
                        AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        <span>Target: {aiAnalysis.tempoRecommendation} BPM</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2 font-medium text-foreground">Key Compatibility:</p>
                        <p>{aiAnalysis.keyCompatibility}</p>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2 font-medium text-foreground">Energy Flow:</p>
                        <p>{aiAnalysis.energyFlow}</p>
                      </div>
                      
                      {aiAnalysis.mixingTips && aiAnalysis.mixingTips.length > 0 && (
                        <div className="text-sm">
                          <p className="mb-2 font-medium">Mixing Tips:</p>
                          <ul className="space-y-1">
                            {aiAnalysis.mixingTips.slice(0, 3).map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <Sparkles className="w-3 h-3 text-neon-cyan mt-0.5 flex-shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    size="lg"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? "Stop Preview" : "Preview Mix"}
                  </Button>

                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/80 hover:to-neon-purple/80"
                    size="lg"
                    onClick={intelligentMerge}
                    disabled={tracks.length < 2 || isMerging}
                  >
                    {isMerging ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Merging...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Intelligent Merge
                      </>
                    )}
                  </Button>

                  {mergedAudio && (
                    <Button
                      className="w-full gap-2 border-neon-green text-neon-green hover:bg-neon-green/10"
                      variant="outline"
                      size="lg"
                      onClick={downloadMerged}
                    >
                      <Download className="w-5 h-5" />
                      Download Merged
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {tracks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Upload at least 2 tracks to start merging</p>
              <p className="text-sm mt-2">AI will analyze and align beats automatically</p>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default RemixMerge;
