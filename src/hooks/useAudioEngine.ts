import { useState, useEffect, useCallback, useRef } from 'react';
import { getAudioEngine, AudioEngineState, RemixSettings } from '@/lib/audioEngine';
import { toast } from 'sonner';

export const useAudioEngine = () => {
  const engineRef = useRef(getAudioEngine());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const settingsRef = useRef<RemixSettings>({ tempo: 120, pitch: 0, bass: 50, effects: 30 });

  useEffect(() => {
    const engine = engineRef.current;
    
    engine.setOnStateChange((state: AudioEngineState) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      setDuration(state.duration);
      setWaveformData(state.waveformData);
    });

    return () => {
      engine.destroy();
    };
  }, []);

  const loadFile = useCallback(async (file: File) => {
    const engine = engineRef.current;
    const staticWaveform = await engine.loadFile(file);
    setWaveformData(staticWaveform);
    setIsLoaded(true);
    setDuration(engine.getState().duration);
    return staticWaveform;
  }, []);

  const play = useCallback(() => {
    engineRef.current.play(settingsRef.current);
  }, []);

  const pause = useCallback(() => {
    engineRef.current.pause();
  }, []);

  const stop = useCallback(() => {
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const updateSettings = useCallback((settings: RemixSettings) => {
    settingsRef.current = settings;
    engineRef.current.applySettings(settings);
  }, []);

  const seek = useCallback((time: number) => {
    engineRef.current.seek(time);
  }, []);

  const exportAudio = useCallback(async (fileName: string) => {
    try {
      const blob = await engineRef.current.exportAudio(settingsRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}_remix.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Remix downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export audio');
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    waveformData,
    isLoaded,
    loadFile,
    play,
    pause,
    stop,
    togglePlayPause,
    updateSettings,
    seek,
    exportAudio,
  };
};
