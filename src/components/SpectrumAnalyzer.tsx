import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface SpectrumAnalyzerProps {
  isPlaying: boolean;
  audioData?: number[];
}

const SpectrumAnalyzer = ({ isPlaying, audioData }: SpectrumAnalyzerProps) => {
  const [bars, setBars] = useState<number[]>(Array(32).fill(5));
  const animationRef = useRef<number>();

  useEffect(() => {
    if (audioData && audioData.length > 0 && isPlaying) {
      // Sample frequency bands from audio data
      const numBars = 32;
      const step = Math.floor(audioData.length / numBars);
      const newBars = [];
      
      for (let i = 0; i < numBars; i++) {
        const start = i * step;
        const end = start + step;
        let sum = 0;
        for (let j = start; j < end && j < audioData.length; j++) {
          sum += audioData[j];
        }
        const avg = sum / step;
        // Scale and add some minimum height
        newBars.push(Math.max(avg * 0.8, 3));
      }
      setBars(newBars);
    } else if (!isPlaying) {
      // Idle animation
      const animate = () => {
        setBars(prev => prev.map((_, i) => 
          3 + Math.sin(Date.now() / 800 + i * 0.3) * 2
        ));
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, audioData]);

  // Color gradient based on frequency (low = cyan, mid = purple, high = pink)
  const getBarColor = (index: number, total: number) => {
    const position = index / total;
    if (position < 0.33) {
      return "hsl(185 100% 50%)"; // Cyan for bass
    } else if (position < 0.66) {
      return "hsl(270 100% 65%)"; // Purple for mids
    } else {
      return "hsl(320 100% 60%)"; // Pink for highs
    }
  };

  const getBarGlow = (index: number, total: number) => {
    const position = index / total;
    if (position < 0.33) {
      return "hsl(185 100% 50% / 0.6)";
    } else if (position < 0.66) {
      return "hsl(270 100% 65% / 0.6)";
    } else {
      return "hsl(320 100% 60% / 0.6)";
    }
  };

  return (
    <div className="w-full p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Spectrum Analyzer
        </span>
      </div>
      
      <div className="h-24 flex items-end justify-center gap-[3px]">
        {bars.map((height, index) => (
          <motion.div
            key={index}
            className="w-2 rounded-t-sm"
            initial={{ height: 5 }}
            animate={{ 
              height: height * 2.5,
              backgroundColor: isPlaying 
                ? getBarColor(index, bars.length) 
                : "hsl(185 100% 50% / 0.3)"
            }}
            transition={{ 
              duration: 0.05,
              ease: "linear"
            }}
            style={{
              boxShadow: isPlaying 
                ? `0 0 10px ${getBarGlow(index, bars.length)}, 0 0 20px ${getBarGlow(index, bars.length)}`
                : "none",
              minHeight: "4px"
            }}
          />
        ))}
      </div>

      {/* Frequency labels */}
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[10px] text-cyan-400/70">Bass</span>
        <span className="text-[10px] text-purple-400/70">Mids</span>
        <span className="text-[10px] text-pink-400/70">Highs</span>
      </div>
    </div>
  );
};

export default SpectrumAnalyzer;
