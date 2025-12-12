import { forwardRef, useCallback } from "react";
import { motion } from "framer-motion";

interface SeekableWaveformProps {
  isPlaying: boolean;
  audioData?: number[];
  staticWaveform?: number[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const SeekableWaveform = forwardRef<HTMLDivElement, SeekableWaveformProps>(({ 
  isPlaying, 
  audioData, 
  staticWaveform, 
  currentTime, 
  duration,
  onSeek 
}, ref) => {
  const bars = audioData && audioData.length > 0 && isPlaying
    ? audioData.map(v => Math.max(v, 5))
    : staticWaveform && staticWaveform.length > 0
      ? staticWaveform.slice(0, 64).map(v => Math.max(v * 0.8, 10))
      : Array(64).fill(20);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressBarIndex = Math.floor((currentTime / duration) * bars.length) || 0;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  }, [duration, onSeek]);

  return (
    <div ref={ref} className="relative">
      <div 
        className="w-full h-32 flex items-end justify-center gap-[2px] px-4 cursor-pointer group"
        onClick={handleClick}
      >
        {bars.map((height, index) => {
          const isPast = index < progressBarIndex;
          const isCurrent = index === progressBarIndex;
          
          return (
            <motion.div
              key={index}
              className="waveform-bar w-1.5 min-h-[4px] transition-colors duration-150"
              initial={{ height: 20 }}
              animate={{ 
                height: height,
                backgroundColor: isCurrent
                  ? "hsl(50 100% 55%)"
                  : isPast 
                    ? isPlaying
                      ? index % 3 === 0 
                        ? "hsl(185 100% 50%)" 
                        : index % 3 === 1 
                          ? "hsl(270 100% 65%)" 
                          : "hsl(320 100% 60%)"
                      : "hsl(185 100% 50%)"
                    : "hsl(185 100% 50% / 0.3)"
              }}
              transition={{ 
                duration: 0.05,
                ease: "linear"
              }}
              style={{
                boxShadow: isCurrent
                  ? "0 0 12px hsl(50 100% 55% / 0.8)"
                  : isPast && isPlaying 
                    ? `0 0 8px ${index % 3 === 0 ? "hsl(185 100% 50% / 0.6)" : index % 3 === 1 ? "hsl(270 100% 65% / 0.6)" : "hsl(320 100% 60% / 0.6)"}`
                    : "none"
              }}
            />
          );
        })}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
      </div>

      {/* Progress indicator line */}
      <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary via-accent to-secondary"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
});

SeekableWaveform.displayName = "SeekableWaveform";

export default SeekableWaveform;
