import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Clock, Zap, Music2, Waves, KeyRound } from "lucide-react";

interface StatsDisplayProps {
  duration: number;
  tempo: number;
  style: string;
  effects: number;
  detectedKey?: string | null;
}

const StatsDisplay = forwardRef<HTMLDivElement, StatsDisplayProps>(({ duration, tempo, style, effects, detectedKey }, ref) => {
  const stats = [
    {
      icon: Clock,
      label: "Duration",
      value: `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`,
      color: "text-neon-cyan",
      bgColor: "bg-neon-cyan/10",
    },
    {
      icon: Zap,
      label: "Tempo",
      value: `${tempo} BPM`,
      color: "text-neon-pink",
      bgColor: "bg-neon-pink/10",
    },
    ...(detectedKey ? [{
      icon: KeyRound,
      label: "Key",
      value: detectedKey,
      color: "text-neon-green",
      bgColor: "bg-neon-green/10",
    }] : []),
    {
      icon: Music2,
      label: "Style",
      value: style,
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/10",
    },
    {
      icon: Waves,
      label: "Effects",
      value: `${effects}%`,
      color: "text-neon-orange",
      bgColor: "bg-neon-orange/10",
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`${stat.bgColor} rounded-xl p-3 border border-border/20`}
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`font-display text-lg ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
});

StatsDisplay.displayName = "StatsDisplay";

export default StatsDisplay;
