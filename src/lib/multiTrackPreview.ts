import { TrackItem } from '@/components/MultiTrackMerge';

export class MultiTrackPreviewEngine {
  private audioContext: AudioContext | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private gains: GainNode[] = [];
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private isPlaying = false;
  private startTime = 0;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;

  async loadTracks(tracks: TrackItem[]): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    for (const track of tracks) {
      if (!this.buffers.has(track.id)) {
        const arrayBuffer = await track.file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers.set(track.id, audioBuffer);
      }
    }
  }

  play(tracks: TrackItem[]) {
    if (!this.audioContext || tracks.length === 0) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stop();

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    let maxDuration = 0;

    tracks.forEach((track) => {
      const buffer = this.buffers.get(track.id);
      if (!buffer) return;

      const source = this.audioContext!.createBufferSource();
      source.buffer = buffer;

      const gain = this.audioContext!.createGain();
      gain.gain.value = track.volume / 100;

      source.connect(gain);
      gain.connect(this.masterGain!);

      const trackDuration = buffer.duration + track.startOffset;
      if (trackDuration > maxDuration) maxDuration = trackDuration;

      source.start(this.audioContext!.currentTime + track.startOffset);
      
      this.sources.push(source);
      this.gains.push(gain);
    });

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
    this.onStateChange?.(true);

    // Auto-stop after longest track finishes
    setTimeout(() => {
      if (this.isPlaying) {
        this.stop();
      }
    }, maxDuration * 1000);
  }

  stop() {
    this.sources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.gains.forEach(gain => gain.disconnect());
    this.sources = [];
    this.gains = [];
    this.isPlaying = false;
    this.onStateChange?.(false);
  }

  togglePlayPause(tracks: TrackItem[]) {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play(tracks);
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setOnStateChange(callback: (isPlaying: boolean) => void) {
    this.onStateChange = callback;
  }

  destroy() {
    this.stop();
    this.buffers.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

let previewEngineInstance: MultiTrackPreviewEngine | null = null;

export const getMultiTrackPreviewEngine = (): MultiTrackPreviewEngine => {
  if (!previewEngineInstance) {
    previewEngineInstance = new MultiTrackPreviewEngine();
  }
  return previewEngineInstance;
};
