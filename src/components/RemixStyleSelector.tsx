import { motion } from "framer-motion";
import { Sparkles, Zap, Coffee, Skull, Heart, Moon, Sun, Flame, Wind, Waves } from "lucide-react";

interface RemixStyle {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: typeof Zap;
}

const styles: RemixStyle[] = [
  { id: "edm", name: "EDM Drop", description: "High energy electronic drops", color: "from-primary to-neon-blue", icon: Zap },
  { id: "lofi", name: "Lo-Fi Chill", description: "Relaxed beats & vinyl crackle", color: "from-amber-500 to-orange-600", icon: Coffee },
  { id: "trap", name: "Trap Remix", description: "Hard-hitting 808s & hi-hats", color: "from-red-500 to-pink-600", icon: Skull },
  { id: "house", name: "House Groove", description: "Deep bass & four-on-the-floor", color: "from-neon-cyan to-primary", icon: Heart },
  { id: "dubstep", name: "Dubstep", description: "Heavy wobbles & bass drops", color: "from-neon-purple to-violet-600", icon: Waves },
  { id: "dnb", name: "Drum & Bass", description: "Fast breaks & rolling bass", color: "from-orange-500 to-red-600", icon: Flame },
  { id: "synthwave", name: "Synthwave", description: "80s retro neon vibes", color: "from-pink-500 to-purple-600", icon: Moon },
  { id: "tropical", name: "Tropical House", description: "Sunny beach vibes & marimbas", color: "from-yellow-400 to-orange-500", icon: Sun },
  { id: "techno", name: "Techno", description: "Dark underground warehouse", color: "from-slate-600 to-zinc-800", icon: Zap },
  { id: "ambient", name: "Ambient", description: "Atmospheric & dreamy textures", color: "from-sky-400 to-indigo-500", icon: Wind },
  { id: "hardstyle", name: "Hardstyle", description: "Euphoric kicks & melodies", color: "from-rose-500 to-red-700", icon: Flame },
  { id: "future", name: "Future Bass", description: "Wobbly chords & big drops", color: "from-violet-500 to-fuchsia-600", icon: Sparkles },
];

interface RemixStyleSelectorProps {
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
}

const RemixStyleSelector = ({ selectedStyle, onStyleSelect }: RemixStyleSelectorProps) => {
  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg text-foreground">Remix Style</h3>
        <span className="text-[10px] text-muted-foreground ml-auto bg-muted/30 px-2 py-0.5 rounded-full">{styles.length} styles</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {styles.map((style, index) => {
          const Icon = style.icon;
          const isSelected = selectedStyle === style.id;
          
          return (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02, type: "spring" }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStyleSelect(style.id)}
              className={`
                relative p-3 rounded-xl text-left transition-all duration-300 group overflow-hidden
                ${isSelected 
                  ? "shadow-lg" 
                  : "bg-muted/20 hover:bg-muted/30 border border-border/20 hover:border-primary/30"
                }
              `}
            >
              {/* Selected gradient background */}
              {isSelected && (
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${style.color}`}
                  layoutId="selected-style-bg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <motion.div
                    animate={isSelected ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-primary"}`} />
                  </motion.div>
                  <h4 className={`font-display text-xs ${isSelected ? "text-white" : "text-foreground"}`}>
                    {style.name}
                  </h4>
                </div>
                <p className={`text-[10px] leading-tight ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                  {style.description}
                </p>
              </div>
              
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-white/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              
              {/* Hover shimmer for non-selected */}
              {!isSelected && (
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)`,
                    backgroundSize: "200% 200%",
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RemixStyleSelector;
