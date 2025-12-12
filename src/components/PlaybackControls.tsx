import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isShuffled: boolean;
  isRepeating: boolean;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

const PlaybackControls = ({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  isShuffled,
  isRepeating,
  onToggleShuffle,
  onToggleRepeat,
}: PlaybackControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleShuffle}
        className={`w-10 h-10 ${isShuffled ? "text-primary" : "text-muted-foreground"}`}
      >
        <Shuffle className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        className="w-12 h-12 text-foreground hover:text-primary"
      >
        <SkipBack className="w-5 h-5" />
      </Button>
      
      <motion.button
        onClick={onPlayPause}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center relative"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        {isPlaying && (
          <>
            <span className="pulse-ring" />
            <span className="pulse-ring" style={{ animationDelay: "0.5s" }} />
          </>
        )}
        <motion.div
          initial={false}
          animate={{ rotate: isPlaying ? 0 : 0 }}
          className="text-primary-foreground"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-1" />
          )}
        </motion.div>
      </motion.button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        className="w-12 h-12 text-foreground hover:text-primary"
      >
        <SkipForward className="w-5 h-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleRepeat}
        className={`w-10 h-10 ${isRepeating ? "text-primary" : "text-muted-foreground"}`}
      >
        <Repeat className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default PlaybackControls;
