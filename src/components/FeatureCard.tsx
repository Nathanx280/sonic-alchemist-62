import { forwardRef } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(({ title, description, icon: Icon, gradient, delay = 0 }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.03, y: -8 }}
      className="glass-panel p-6 group cursor-pointer relative overflow-hidden border border-border/30 hover:border-primary/30 transition-all duration-500"
    >
      {/* Background glow effect */}
      <motion.div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br ${gradient}`}
        initial={false}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["-200% 0", "200% 0"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Icon */}
      <motion.div 
        className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5`}
        whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
        transition={{ duration: 0.6 }}
      >
        <Icon className="w-7 h-7 text-primary-foreground relative z-10" />
        <motion.div 
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} blur-xl opacity-50`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Content */}
      <h4 className="font-display text-lg text-foreground mb-2 group-hover:text-gradient transition-all duration-300">
        {title}
      </h4>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>

      {/* Bottom accent */}
      <motion.div 
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} origin-left`}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Corner decoration */}
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full`} />
    </motion.div>
  );
});

FeatureCard.displayName = "FeatureCard";

export default FeatureCard;
