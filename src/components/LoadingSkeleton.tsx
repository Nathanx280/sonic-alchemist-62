import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  type: "waveform" | "card" | "controls";
}

const LoadingSkeleton = ({ type }: LoadingSkeletonProps) => {
  if (type === "waveform") {
    return (
      <div className="w-full h-32 flex items-end justify-center gap-[2px] px-4">
        {Array(64).fill(0).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-muted/40 rounded-full"
            initial={{ height: 20 }}
            animate={{ 
              height: [20, 40, 20],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.02,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 rounded-full bg-muted/40"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="space-y-2 flex-1">
            <motion.div 
              className="h-4 w-2/3 bg-muted/40 rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            />
            <motion.div 
              className="h-3 w-1/2 bg-muted/40 rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </div>
        </div>
        <motion.div 
          className="h-24 bg-muted/40 rounded-lg"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
      </div>
    );
  }

  if (type === "controls") {
    return (
      <div className="glass-panel p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <motion.div 
              className="h-3 w-16 bg-muted/40 rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
            <motion.div 
              className="h-2 w-full bg-muted/40 rounded-full"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.05 }}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
