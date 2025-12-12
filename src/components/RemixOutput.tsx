import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Download, Share2, Heart, RotateCcw, Clock, Zap, Waves, Music, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import WaveformVisualizer from "./WaveformVisualizer";
import PlaybackControls from "./PlaybackControls";

interface RemixData {
  remixName?: string;
  description?: string;
  beatPattern?: number[];
  hiHatPattern?: number[];
  bassPattern?: number[];
  dropPoints?: number[];
  buildupPoints?: number[];
  breakdownPoints?: number[];
  effectChain?: string[];
  effectsArchitecture?: { signalFlow?: string[] };
  filterSweep?: { start: number; end: number; duration: number; type?: string };
  reverbSettings?: { size: number; decay: number; wet: number; predelay: number };
  delaySettings?: { time: string; feedback: number; wet: number; pingPong: boolean };
  compressionSettings?: { threshold: number; ratio: number; attack: number; release: number; makeupGain: number };
  sidechain?: { intensity: number; rate: number; attack?: number; release?: number };
  sidechainMatrix?: { kickToBass?: { depth: number } };
  stereoWidth?: { low: number; mid: number; high: number };
  vocalProcessing?: { pitch?: number; formant?: number; chop?: boolean; stutter?: boolean; reverse?: boolean; delay?: boolean; pitchShift?: number; formantShift?: number };
  synthLayers?: string[] | { name?: string; synthType?: string }[];
  synthesizerLayers?: { name?: string; synthType?: string }[];
  drumProcessing?: { kick?: { boost: number; distortion?: number }; snare?: { reverb: number; compression: number }; hats?: { filter: number; pan: number } };
  automations?: { parameter: string; startValue: number; endValue: number; startTime: number; duration: number }[];
  automationTimeline?: { parameter: string; startValue: number; endValue: number; startTime: number; duration: number }[];
  transitions?: { type: string; time: number; duration: number }[];
  transitionDesign?: { type: string; time: number; duration: number }[];
  energyProfile?: number[] | { sectionEnergies?: number[]; overallArc?: string };
  recommendations?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Helper to extract energy profile array from various formats
const getEnergyProfileArray = (energyProfile: RemixData['energyProfile']): number[] | null => {
  if (!energyProfile) return null;
  if (Array.isArray(energyProfile)) return energyProfile;
  if (typeof energyProfile === 'object' && energyProfile.sectionEnergies) {
    return energyProfile.sectionEnergies;
  }
  return null;
};

// Helper to extract synth layer names from various formats
const getSynthLayerNames = (data: RemixData): string[] => {
  const synthLayers = data.synthLayers || data.synthesizerLayers;
  if (!synthLayers || synthLayers.length === 0) return [];
  if (typeof synthLayers[0] === 'string') return synthLayers as string[];
  return (synthLayers as { name?: string; synthType?: string }[]).map(s => s.name || s.synthType || 'Unknown');
};

// Helper to get effect chain from various formats
const getEffectChain = (data: RemixData): string[] => {
  if (data.effectChain && Array.isArray(data.effectChain)) return data.effectChain;
  if (data.effectsArchitecture?.signalFlow) return data.effectsArchitecture.signalFlow;
  return [];
};

// Helper to get transitions from various formats
const getTransitions = (data: RemixData): { type: string; time: number; duration: number }[] => {
  if (data.transitions && Array.isArray(data.transitions)) return data.transitions;
  if (data.transitionDesign && Array.isArray(data.transitionDesign)) return data.transitionDesign;
  return [];
};

// Helper to get sidechain intensity
const getSidechainIntensity = (data: RemixData): number | null => {
  if (data.sidechain?.intensity !== undefined) return data.sidechain.intensity;
  if (data.sidechainMatrix?.kickToBass?.depth !== undefined) return data.sidechainMatrix.kickToBass.depth;
  return null;
};

interface RemixOutputProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownload: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  remixName: string;
  style: string;
  remixData?: RemixData;
  waveformData?: number[];
  currentTime: number;
  duration: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const RemixOutput = forwardRef<HTMLDivElement, RemixOutputProps>(({
  isPlaying,
  onPlayPause,
  onDownload,
  onShare,
  onRegenerate,
  remixName,
  style,
  remixData,
  waveformData,
  currentTime,
  duration,
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-panel p-6 space-y-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl text-foreground mb-1">
            {remixData?.remixName || "Your Remix is Ready"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {remixData?.description || `${remixName} • ${style} Remix`}
          </p>
        </div>
        
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: isPlaying ? 2 : 0, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-accent to-secondary opacity-80"
        />
      </div>
      
      {/* Waveform */}
      <div className="bg-muted/30 rounded-xl p-4">
        <WaveformVisualizer isPlaying={isPlaying} audioData={waveformData} />
        
        {/* Time display */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(currentTime)}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* AI Remix Details */}
      {remixData && (
        <div className="space-y-4">
          {/* Energy Profile */}
          {(() => {
            const energyArray = getEnergyProfileArray(remixData.energyProfile);
            return energyArray && energyArray.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3 text-primary" />
                  <span>Energy Profile</span>
                </div>
                <div className="flex gap-1 h-6 items-end">
                  {energyArray.map((energy, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${energy * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="flex-1 bg-gradient-to-t from-neon-cyan via-primary to-neon-pink rounded-sm"
                      style={{ opacity: 0.5 + energy * 0.5 }}
                    />
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Beat Patterns */}
          {remixData.beatPattern && remixData.beatPattern.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {/* Kick Pattern */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Kick</span>
                <div className="flex gap-0.5 h-4 items-end">
                  {remixData.beatPattern.slice(0, 16).map((intensity, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-neon-pink rounded-sm"
                      style={{ height: `${(intensity || 0) * 100}%`, opacity: 0.4 + (intensity || 0) * 0.6 }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Hi-Hat Pattern */}
              {remixData.hiHatPattern && remixData.hiHatPattern.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Hi-Hat</span>
                  <div className="flex gap-0.5 h-4 items-end">
                    {remixData.hiHatPattern.slice(0, 16).map((intensity, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-neon-cyan rounded-sm"
                        style={{ height: `${(intensity || 0) * 100}%`, opacity: 0.4 + (intensity || 0) * 0.6 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bass Pattern */}
              {remixData.bassPattern && remixData.bassPattern.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Bass</span>
                  <div className="flex gap-0.5 h-4 items-end">
                    {remixData.bassPattern.slice(0, 16).map((intensity, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-neon-purple rounded-sm"
                        style={{ height: `${(intensity || 0) * 100}%`, opacity: 0.4 + (intensity || 0) * 0.6 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Effect Chain */}
          {(() => {
            const effects = getEffectChain(remixData);
            return effects.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Settings2 className="w-3 h-3 text-primary" />
                  <span>Effect Chain</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {effects.map((effect, i) => (
                    <motion.span 
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary border border-primary/30"
                    >
                      {effect}
                    </motion.span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Synth Layers */}
          {(() => {
            const synthNames = getSynthLayerNames(remixData);
            return synthNames.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Music className="w-3 h-3 text-secondary" />
                  <span>Synth Layers</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {synthNames.map((synth, i) => (
                    <span 
                      key={i}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-secondary/20 text-secondary border border-secondary/30"
                    >
                      {synth}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Transitions */}
          {(() => {
            const transitions = getTransitions(remixData);
            return transitions.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Waves className="w-3 h-3 text-accent" />
                  <span>Transitions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {transitions.slice(0, 6).map((trans, i) => (
                    <span 
                      key={i}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-accent/20 text-accent border border-accent/30"
                    >
                      {trans.type} @ {formatTime(trans.time)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Key Processing Info */}
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            {remixData.reverbSettings && (
              <div className="bg-muted/20 rounded-lg p-2">
                <span className="text-muted-foreground">Reverb</span>
                <p className="text-foreground font-medium">{Math.round((remixData.reverbSettings.wet || 0) * 100)}% wet</p>
              </div>
            )}
            {remixData.delaySettings && (
              <div className="bg-muted/20 rounded-lg p-2">
                <span className="text-muted-foreground">Delay</span>
                <p className="text-foreground font-medium">{remixData.delaySettings.time} {remixData.delaySettings.pingPong ? 'P-P' : ''}</p>
              </div>
            )}
            {(() => {
              const sidechainIntensity = getSidechainIntensity(remixData);
              return sidechainIntensity !== null ? (
                <div className="bg-muted/20 rounded-lg p-2">
                  <span className="text-muted-foreground">Sidechain</span>
                  <p className="text-foreground font-medium">{Math.round(sidechainIntensity * 100)}%</p>
                </div>
              ) : null;
            })()}
          </div>
          
          {/* Recommendations */}
          {remixData.recommendations && (
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 {remixData.recommendations}
              </p>
            </div>
          )}
        </div>
      )}
      
      <PlaybackControls
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onPrevious={() => {}}
        onNext={() => {}}
        isShuffled={false}
        isRepeating={false}
        onToggleShuffle={() => {}}
        onToggleRepeat={() => {}}
      />
      
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={onDownload}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        
        <Button
          onClick={onShare}
          variant="outline"
          className="flex-1 border-border hover:border-primary hover:text-primary"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        
        <Button
          onClick={onRegenerate}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-secondary"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
        >
          <Heart className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
});

RemixOutput.displayName = "RemixOutput";

export default RemixOutput;
