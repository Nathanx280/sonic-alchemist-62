import { motion } from "framer-motion";
import { Disc3, Keyboard, HelpCircle, Sparkles, Zap, Video, Layers } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Header = () => {
  const showShortcuts = () => {
    toast.info(
      <div className="space-y-2">
        <p className="font-semibold">Keyboard Shortcuts</p>
        <div className="text-xs space-y-1 text-muted-foreground">
          <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Space</kbd> Play/Pause</p>
          <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">⌘/Ctrl+G</kbd> Generate Remix</p>
          <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">⌘/Ctrl+D</kbd> Download</p>
          <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Shift+?</kbd> Show Shortcuts</p>
        </div>
      </div>,
      { duration: 5000 }
    );
  };
  const location = useLocation();
  const currentPath = location.pathname;
  const isQuickRemix = currentPath === "/";
  const isDeepRemixer = currentPath === "/deep-remixer";
  const isAudioToVideo = currentPath === "/audio-to-video";
  const isRemixMerge = currentPath === "/remix-merge";

  return (
    <header className="py-4 px-4 sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center relative overflow-hidden">
              <Disc3 className="w-6 h-6 text-primary-foreground relative z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary via-accent to-secondary blur-lg opacity-40"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
          
          <div>
            <h1 className="font-display text-xl tracking-wider text-gradient flex items-center gap-1.5">
              REMIX.AI
              <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Professional AI Sound Creation
            </p>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-muted/20 rounded-xl p-1 border border-border/20">
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isQuickRemix
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quick Remix
              </motion.button>
            </Link>
            <Link to="/deep-remixer">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isDeepRemixer
                    ? "bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-neon-pink"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Deep Rework
              </motion.button>
            </Link>
            <Link to="/audio-to-video">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isAudioToVideo
                    ? "bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 text-neon-cyan"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Audio to Video
              </motion.button>
            </Link>
            <Link to="/remix-merge">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isRemixMerge
                    ? "bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 text-neon-green"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Remix Merge
              </motion.button>
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={showShortcuts}
                  className="w-9 h-9 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-border/20"
                >
                  <Keyboard className="w-4 h-4" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Keyboard shortcuts (Shift+?)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-border/20"
                >
                  <HelpCircle className="w-4 h-4" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Help & Support</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:flex items-center gap-2 text-xs bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 px-3 py-2 rounded-xl border border-neon-green/20"
          >
            <motion.span 
              className="w-2 h-2 rounded-full bg-neon-green"
              animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-neon-green font-medium">AI Active</span>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
