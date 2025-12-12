import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Music, Waves, Zap, Target, Activity, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioAnalysis } from "@/hooks/useBeatExtraction";

interface BeatExtractionDisplayProps {
  analysis: AudioAnalysis | null;
  isExtracting: boolean;
  onApplyPattern?: (pattern: number[][]) => void;
}

const BeatExtractionDisplay = forwardRef<HTMLDivElement, BeatExtractionDisplayProps>(({
  analysis,
  isExtracting,
  onApplyPattern,
}, ref) => {
  if (!analysis && !isExtracting) return null;

  const rowLabels = ['Kick', 'Snare', 'Hi-Hat', 'Clap'];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-panel p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-foreground flex items-center gap-2">
          <Waves className="w-5 h-5 text-neon-cyan" />
          Extracted Beats
        </h3>
        {analysis && onApplyPattern && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onApplyPattern(analysis.drumPattern)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-blue text-white text-sm font-medium"
          >
            Apply to Sequencer
          </motion.button>
        )}
      </div>

      {isExtracting ? (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary"
            />
            <Activity className="absolute inset-0 m-auto w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Analyzing audio for beats and rhythm...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/20 rounded-lg p-3 text-center">
              <Music className="w-4 h-4 mx-auto mb-1 text-neon-pink" />
              <div className="text-lg font-display text-foreground">{analysis.beats?.bpm || 0}</div>
              <div className="text-xs text-muted-foreground">BPM</div>
            </div>
            <div className="bg-muted/20 rounded-lg p-3 text-center">
              <Target className="w-4 h-4 mx-auto mb-1 text-neon-green" />
              <div className="text-lg font-display text-foreground">{analysis.keyEstimate || 'N/A'}</div>
              <div className="text-xs text-muted-foreground">Key</div>
            </div>
            <div className="bg-muted/20 rounded-lg p-3 text-center">
              <Zap className="w-4 h-4 mx-auto mb-1 text-neon-orange" />
              <div className="text-lg font-display text-foreground">{Math.round((analysis.beats?.confidence || 0) * 100)}%</div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
            <div className="bg-muted/20 rounded-lg p-3 text-center">
              <Volume2 className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
              <div className="text-lg font-display text-foreground">{analysis.beats?.beatPositions?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Beats Found</div>
            </div>
          </div>

          {/* Extracted Pattern Grid */}
          {analysis.drumPattern && analysis.drumPattern.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Extracted Drum Pattern</h4>
              <div className="bg-background/40 rounded-lg p-3">
                {analysis.drumPattern.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2 mb-1 last:mb-0">
                    <span className="w-14 text-xs text-muted-foreground truncate">{rowLabels[rowIndex] || `Row ${rowIndex}`}</span>
                    <div className="flex gap-0.5 flex-1">
                      {(row || []).map((step, stepIndex) => (
                        <motion.div
                          key={stepIndex}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: stepIndex * 0.02 + rowIndex * 0.1 }}
                          className={cn(
                            "flex-1 h-4 rounded-sm transition-all",
                            step > 0 
                              ? rowIndex === 0 ? "bg-neon-pink/80" 
                                : rowIndex === 1 ? "bg-neon-cyan/80"
                                : rowIndex === 2 ? "bg-neon-green/80"
                                : "bg-neon-orange/80"
                              : "bg-muted/30",
                            stepIndex % 4 === 0 && "ring-1 ring-primary/20"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Energy Profile */}
          {analysis.energyProfile && analysis.energyProfile.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Energy Profile</h4>
              <div className="flex items-end gap-0.5 h-12 bg-background/40 rounded-lg p-2">
                {analysis.energyProfile.map((energy, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(energy || 0) * 100}%` }}
                    transition={{ delay: i * 0.02 }}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-neon-purple to-neon-pink"
                    style={{ minHeight: '2px' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {analysis.sections.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Detected Sections</h4>
              <div className="flex gap-1 flex-wrap">
                {analysis.sections.map((section, i) => (
                  <span
                    key={i}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      section.type === 'drop' && "bg-neon-pink/20 text-neon-pink",
                      section.type === 'breakdown' && "bg-neon-cyan/20 text-neon-cyan",
                      section.type === 'chorus' && "bg-neon-green/20 text-neon-green",
                      section.type === 'verse' && "bg-muted text-muted-foreground",
                      section.type === 'intro' && "bg-neon-purple/20 text-neon-purple",
                      section.type === 'outro' && "bg-neon-orange/20 text-neon-orange"
                    )}
                  >
                    {section.type} ({Math.round(section.start)}s - {Math.round(section.end)}s)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
});

BeatExtractionDisplay.displayName = "BeatExtractionDisplay";

export default BeatExtractionDisplay;
