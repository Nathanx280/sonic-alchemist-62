import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, Music, X, GripVertical, Layers, Plus, Crown, Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { getMultiTrackPreviewEngine } from "@/lib/multiTrackPreview";

export interface TrackItem {
  id: string;
  file: File;
  volume: number;
  startOffset: number;
}

interface MultiTrackMergeProps {
  tracks: TrackItem[];
  onTracksChange: (tracks: TrackItem[]) => void;
  onAddTrack: (file: File) => void;
  onRemoveTrack: (id: string) => void;
  onMerge: () => void;
  isMerging?: boolean;
  maxTracks?: number;
}

const MultiTrackMerge = ({ 
  tracks, 
  onTracksChange, 
  onAddTrack, 
  onRemoveTrack,
  onMerge,
  isMerging = false,
  maxTracks = 4 
}: MultiTrackMergeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewEngine = useRef(getMultiTrackPreviewEngine());

  useEffect(() => {
    previewEngine.current.setOnStateChange(setIsPreviewPlaying);
    return () => {
      previewEngine.current.stop();
    };
  }, []);

  const handlePreviewToggle = useCallback(async () => {
    if (isPreviewPlaying) {
      previewEngine.current.stop();
    } else {
      setIsLoadingPreview(true);
      try {
        await previewEngine.current.loadTracks(tracks);
        previewEngine.current.play(tracks);
      } finally {
        setIsLoadingPreview(false);
      }
    }
  }, [isPreviewPlaying, tracks]);

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
    if (file && file.type.startsWith("audio/") && tracks.length < maxTracks) {
      onAddTrack(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && tracks.length < maxTracks) {
      onAddTrack(file);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleVolumeChange = (id: string, volume: number) => {
    onTracksChange(tracks.map(t => t.id === id ? { ...t, volume } : t));
  };

  const handleOffsetChange = (id: string, startOffset: number) => {
    onTracksChange(tracks.map(t => t.id === id ? { ...t, startOffset } : t));
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-secondary" />
          <h3 className="font-display text-sm text-foreground">Multi-Track Merge</h3>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Crown className="w-3 h-3" /> PRO
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{tracks.length}/{maxTracks} tracks</span>
      </div>

      <AnimatePresence>
        {tracks.length > 0 && (
          <Reorder.Group 
            axis="y" 
            values={tracks} 
            onReorder={onTracksChange}
            className="space-y-2 mb-3"
          >
            {tracks.map((track, index) => (
              <Reorder.Item key={track.id} value={track}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {index === 0 && <span className="text-primary">Main: </span>}
                      {track.file.name}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] text-muted-foreground w-8">Vol</span>
                        <Slider
                          value={[track.volume]}
                          onValueChange={([v]) => handleVolumeChange(track.id, v)}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground w-6">{track.volume}%</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] text-muted-foreground w-8">Start</span>
                        <Slider
                          value={[track.startOffset]}
                          onValueChange={([v]) => handleOffsetChange(track.id, v)}
                          max={30}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground w-6">{track.startOffset}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveTrack(track.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </AnimatePresence>

      {tracks.length < maxTracks && (
        <motion.div
          className={`
            relative p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all
            ${isDragging 
              ? 'border-secondary bg-secondary/10' 
              : 'border-border/30 hover:border-secondary/50 bg-muted/20'
            }
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
          
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4 text-secondary" />
            <span className="text-sm text-muted-foreground">
              {tracks.length === 0 ? 'Add tracks to merge' : 'Add another track'}
            </span>
          </div>
        </motion.div>
      )}
      
      {tracks.length >= 2 && (
        <>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Drag tracks to reorder • First track is the main track
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handlePreviewToggle}
              disabled={isLoadingPreview || isMerging}
              variant="outline"
              className="flex-1 border-secondary/50 hover:bg-secondary/10"
            >
              {isLoadingPreview ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : isPreviewPlaying ? (
                <span className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Stop Preview
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Preview Mix
                </span>
              )}
            </Button>
            <Button
              onClick={onMerge}
              disabled={isMerging || isPreviewPlaying}
              className="flex-1 bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-primary-foreground font-display"
            >
              {isMerging ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Layers className="w-4 h-4" />
                  </motion.div>
                  Merging...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Merge
                </span>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MultiTrackMerge;
