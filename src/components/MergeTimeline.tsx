import { motion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { Clock, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineTrack {
  id: string;
  name: string;
  duration: number;
  startOffset: number;
  volume: number;
  waveformData: number[];
  color: string;
  bpm?: number;
  downbeats?: number[];
  stems?: {
    vocals: number;
    drums: number;
    bass: number;
    melody: number;
  };
}

interface MergeTimelineProps {
  tracks: TimelineTrack[];
  onTrackUpdate: (id: string, updates: Partial<TimelineTrack>) => void;
  currentTime: number;
  isPlaying: boolean;
  totalDuration: number;
  onSeek: (time: number) => void;
}

const TRACK_COLORS = [
  "from-neon-cyan to-neon-blue",
  "from-neon-pink to-neon-purple",
  "from-neon-green to-neon-cyan",
  "from-neon-yellow to-neon-orange",
  "from-neon-purple to-neon-pink",
  "from-neon-blue to-neon-green",
];

const MergeTimeline = ({
  tracks,
  onTrackUpdate,
  currentTime,
  isPlaying,
  totalDuration,
  onSeek,
}: MergeTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = Math.max(totalDuration * pixelsPerSecond, 800);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
    const time = x / pixelsPerSecond;
    onSeek(Math.max(0, Math.min(time, totalDuration)));
  };

  const handleTrackDragStart = (e: React.MouseEvent, trackId: string, currentOffset: number) => {
    e.stopPropagation();
    setIsDragging(trackId);
    setDragStartX(e.clientX);
    setDragStartOffset(currentOffset);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / pixelsPerSecond;
    const newOffset = Math.max(0, dragStartOffset + deltaTime);
    onTrackUpdate(isDragging, { startOffset: newOffset });
  }, [isDragging, dragStartX, dragStartOffset, pixelsPerSecond, onTrackUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Generate time markers
  const markers: number[] = [];
  const markerInterval = zoom > 1.5 ? 1 : zoom > 0.5 ? 5 : 10;
  for (let t = 0; t <= totalDuration; t += markerInterval) {
    markers.push(t);
  }

  return (
    <div className="space-y-3">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
            className="h-8 w-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(z => Math.min(4, z + 0.25))}
            className="h-8 w-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(1)}
            className="h-8 w-8"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="relative overflow-x-auto bg-muted/10 rounded-xl border border-border/30 cursor-crosshair"
        onClick={handleTimelineClick}
        style={{ maxHeight: '400px' }}
      >
        {/* Time Ruler */}
        <div
          className="sticky top-0 z-20 h-8 bg-background/80 backdrop-blur-sm border-b border-border/30"
          style={{ width: timelineWidth }}
        >
          {markers.map((time) => (
            <div
              key={time}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: time * pixelsPerSecond }}
            >
              <div className="h-3 w-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {formatTime(time)}
              </span>
            </div>
          ))}
        </div>

        {/* Tracks */}
        <div className="relative" style={{ width: timelineWidth, minHeight: tracks.length * 80 + 20 }}>
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              className={`absolute h-16 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border-2 ${
                isDragging === track.id ? 'border-primary shadow-lg shadow-primary/30' : 'border-transparent hover:border-primary/50'
              }`}
              style={{
                top: index * 80 + 10,
                left: track.startOffset * pixelsPerSecond,
                width: track.duration * pixelsPerSecond,
              }}
              onMouseDown={(e) => handleTrackDragStart(e, track.id, track.startOffset)}
              whileHover={{ scale: 1.01 }}
              layout
            >
              {/* Track Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${TRACK_COLORS[index % TRACK_COLORS.length]} opacity-30`} />
              
              {/* Waveform */}
              <div className="absolute inset-0 flex items-end px-1 py-1">
                {track.waveformData.map((v, i) => (
                  <div
                    key={i}
                    className={`flex-1 bg-gradient-to-t ${TRACK_COLORS[index % TRACK_COLORS.length]} rounded-t opacity-70`}
                    style={{ height: `${v * 90}%`, minWidth: '1px' }}
                  />
                ))}
              </div>

              {/* Downbeat Markers */}
              {track.downbeats?.map((beat, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full w-0.5 bg-white/60"
                  style={{ left: `${(beat / track.duration) * 100}%` }}
                />
              ))}

              {/* Track Label */}
              <div className="absolute top-1 left-2 right-2 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground/90 truncate max-w-[150px] bg-background/50 px-1 rounded">
                  {track.name}
                </span>
                {track.bpm && (
                  <span className="text-[10px] text-neon-cyan bg-background/50 px-1 rounded">
                    {track.bpm} BPM
                  </span>
                )}
              </div>

              {/* Volume Indicator */}
              <div 
                className="absolute bottom-1 left-2 h-1 bg-neon-green/60 rounded"
                style={{ width: `${track.volume * 50}%` }}
              />

              {/* Stem Priority Bars */}
              {track.stems && (
                <div className="absolute bottom-1 right-2 flex gap-0.5">
                  <div className="w-1 bg-neon-pink/60 rounded" style={{ height: `${track.stems.vocals * 12}px` }} title="Vocals" />
                  <div className="w-1 bg-neon-cyan/60 rounded" style={{ height: `${track.stems.drums * 12}px` }} title="Drums" />
                  <div className="w-1 bg-neon-purple/60 rounded" style={{ height: `${track.stems.bass * 12}px` }} title="Bass" />
                  <div className="w-1 bg-neon-green/60 rounded" style={{ height: `${track.stems.melody * 12}px` }} title="Melody" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Playhead */}
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-30 pointer-events-none"
            style={{ left: currentTime * pixelsPerSecond }}
            animate={{ left: currentTime * pixelsPerSecond }}
            transition={{ duration: isPlaying ? 0.1 : 0 }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
          </motion.div>
        </div>
      </div>

      {/* Track Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {tracks.map((track, index) => (
          <div key={track.id} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded bg-gradient-to-r ${TRACK_COLORS[index % TRACK_COLORS.length]}`} />
            <span className="text-muted-foreground truncate max-w-[100px]">{track.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MergeTimeline;
