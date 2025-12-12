import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2, Sparkles, Zap } from "lucide-react";

interface GenerateButtonProps {
  isGenerating: boolean;
  disabled: boolean;
  onClick: () => void;
}

const GenerateButton = forwardRef<HTMLButtonElement, GenerateButtonProps>(({ isGenerating, disabled, onClick }, ref) => {
  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      disabled={disabled || isGenerating}
      className={`
        relative w-full py-4 px-8 rounded-2xl font-display text-lg
        transition-all duration-300 overflow-hidden group
        ${disabled 
          ? "bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/30" 
          : "text-primary-foreground hover:scale-[1.02] active:scale-[0.98]"
        }
      `}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {/* Gradient background */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary"
          animate={!isGenerating ? {
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ backgroundSize: "200% 200%" }}
        />
      )}
      
      {/* Shimmer effect */}
      {!disabled && !isGenerating && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["-200% 0", "200% 0"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {/* Glow effect */}
      {!disabled && (
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary blur-xl opacity-50 -z-10"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <span className="relative flex items-center justify-center gap-3">
        {isGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5" />
            </motion.div>
            <span>Creating Your Remix...</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.span>
          </>
        ) : (
          <>
            <motion.span
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Wand2 className="w-5 h-5" />
            </motion.span>
            <span>Generate AI Remix</span>
            <Zap className="w-4 h-4 opacity-70" />
          </>
        )}
      </span>
      
      {/* Progress bar during generation */}
      {isGenerating && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 12, ease: "linear" }}
        />
      )}
    </motion.button>
  );
});

GenerateButton.displayName = "GenerateButton";

export default GenerateButton;
