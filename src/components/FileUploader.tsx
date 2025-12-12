import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Music, X, FileAudio, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const FileUploader = ({ onFileSelect, selectedFile, onClear }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) {
      onFileSelect(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              relative glass-panel p-8 cursor-pointer transition-all duration-300 group
              ${isDragging ? "border-primary neon-glow-cyan scale-[1.02]" : "border-border/30 hover:border-primary/50"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-border/30"
                animate={{ 
                  boxShadow: isDragging 
                    ? "0 0 40px hsl(185 100% 50% / 0.5)" 
                    : "0 0 0px transparent",
                  scale: isDragging ? 1.1 : 1,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ y: isDragging ? -5 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Upload className="w-8 h-8 text-primary" />
                </motion.div>
                
                {/* Animated rings */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-primary/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-primary/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
              </motion.div>
              
              <div className="text-center">
                <h3 className="font-display text-lg text-foreground mb-1.5 flex items-center justify-center gap-2">
                  Drop your track here
                  <FileAudio className="w-4 h-4 text-primary/70" />
                </h3>
                <p className="text-muted-foreground text-sm">
                  or click to browse
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">MP3</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">WAV</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">FLAC</span>
                </div>
              </div>
            </div>

            {isDragging && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-primary bg-primary/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-5 hover-lift"
          >
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden border border-border/30"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Music className="w-6 h-6 text-primary relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"
                  animate={{ y: ["100%", "-100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate flex items-center gap-2">
                  {selectedFile.name}
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Waves className="w-3.5 h-3.5 text-neon-green" />
                  </motion.span>
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">Ready</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
