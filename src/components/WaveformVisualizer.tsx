import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WaveformVisualizerProps {
  isPlaying: boolean;
  audioData?: number[];
  staticWaveform?: number[];
}

const WaveformVisualizer = ({ isPlaying, audioData, staticWaveform }: WaveformVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(Array(64).fill(20));

  useEffect(() => {
    if (audioData && audioData.length > 0 && isPlaying) {
      // Use real audio data when playing
      setBars(audioData.map(v => Math.max(v, 5)));
    } else if (staticWaveform && staticWaveform.length > 0) {
      // Use static waveform when not playing
      setBars(staticWaveform.slice(0, 64).map(v => Math.max(v * 0.8, 10)));
    } else if (!isPlaying) {
      // Default idle animation
      const interval = setInterval(() => {
        setBars(prev => prev.map((_, i) => 15 + Math.sin(Date.now() / 500 + i * 0.2) * 10));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, audioData, staticWaveform]);

  return (
    <div className="w-full h-32 flex items-end justify-center gap-[2px] px-4">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="waveform-bar w-1.5 min-h-[4px]"
          initial={{ height: 20 }}
          animate={{ 
            height: height,
            backgroundColor: isPlaying 
              ? index % 3 === 0 
                ? "hsl(185 100% 50%)" 
                : index % 3 === 1 
                  ? "hsl(270 100% 65%)" 
                  : "hsl(320 100% 60%)"
              : "hsl(185 100% 50% / 0.5)"
          }}
          transition={{ 
            duration: 0.05,
            ease: "linear"
          }}
          style={{
            boxShadow: isPlaying 
              ? `0 0 8px ${index % 3 === 0 ? "hsl(185 100% 50% / 0.6)" : index % 3 === 1 ? "hsl(270 100% 65% / 0.6)" : "hsl(320 100% 60% / 0.6)"}`
              : "none"
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
