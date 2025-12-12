import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Github, Twitter, Heart, Disc3, Headphones, Music2, Zap } from "lucide-react";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="py-10 px-4 border-t border-border/20 mt-16 bg-gradient-to-t from-background to-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Brand */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
            >
              <Disc3 className="w-5 h-5 text-primary-foreground relative z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <span className="font-display text-sm text-gradient">REMIX.AI</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Professional AI Sound Creation</p>
            </div>
          </motion.div>

          {/* Features list */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-4"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Headphones className="w-3.5 h-3.5 text-neon-cyan" />
              <span>Beat Extraction</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Music2 className="w-3.5 h-3.5 text-neon-pink" />
              <span>AI Remixing</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-neon-green" />
              <span>Pro Export</span>
            </div>
          </motion.div>

          {/* Social */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <motion.a 
              href="#" 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-border/20"
            >
              <Twitter className="w-4 h-4" />
            </motion.a>
            <motion.a 
              href="#" 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-border/20"
            >
              <Github className="w-4 h-4" />
            </motion.a>
          </motion.div>
        </div>

        {/* Bottom */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pt-6 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground"
        >
          <p className="opacity-60">© 2024 REMIX.AI. All rights reserved.</p>
          <motion.p 
            className="flex items-center gap-1.5"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Made with <Heart className="w-3 h-3 text-neon-pink fill-neon-pink" /> for music creators
          </motion.p>
        </motion.div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
