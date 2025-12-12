// Advanced Beat Extraction and Audio Analysis Engine

export interface ExtractedBeats {
  bpm: number;
  confidence: number;
  beatPositions: number[]; // timestamps in seconds
  downbeats: number[]; // first beat of each bar
  transients: TransientInfo[];
  rhythmPattern: number[]; // 16-step pattern derived from audio
  energy: number[];
  spectralCentroid: number[];
  onsetStrength: number[];
}

export interface TransientInfo {
  time: number;
  strength: number;
  type: 'kick' | 'snare' | 'hihat' | 'other';
}

export interface AudioAnalysis {
  beats: ExtractedBeats;
  keyEstimate: string;
  energyProfile: number[];
  sections: AudioSection[];
  drumPattern: number[][];
}

export interface AudioSection {
  start: number;
  end: number;
  type: 'intro' | 'verse' | 'chorus' | 'breakdown' | 'drop' | 'outro';
  energy: number;
}

export class BeatExtractor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async extractBeatsFromBuffer(audioBuffer: AudioBuffer): Promise<ExtractedBeats> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Perform onset detection
    const onsetStrength = this.computeOnsetStrength(channelData, sampleRate);
    
    // Detect tempo using autocorrelation
    const { bpm, confidence } = this.detectTempo(onsetStrength, sampleRate);
    
    // Find beat positions
    const beatPositions = this.findBeatPositions(onsetStrength, bpm, sampleRate);
    
    // Identify downbeats (first beat of each bar)
    const downbeats = this.findDownbeats(beatPositions, bpm);
    
    // Detect transients and classify them
    const transients = this.detectTransients(channelData, sampleRate);
    
    // Extract rhythm pattern from beats
    const rhythmPattern = this.extractRhythmPattern(beatPositions, bpm, audioBuffer.duration);
    
    // Compute energy envelope
    const energy = this.computeEnergyEnvelope(channelData, sampleRate);
    
    // Compute spectral centroid over time
    const spectralCentroid = this.computeSpectralCentroid(channelData, sampleRate);
    
    return {
      bpm,
      confidence,
      beatPositions,
      downbeats,
      transients,
      rhythmPattern,
      energy,
      spectralCentroid,
      onsetStrength,
    };
  }

  async analyzeAudio(audioBuffer: AudioBuffer): Promise<AudioAnalysis> {
    const beats = await this.extractBeatsFromBuffer(audioBuffer);
    
    // Estimate key using spectral analysis
    const keyEstimate = this.estimateKey(audioBuffer);
    
    // Build energy profile
    const energyProfile = this.buildEnergyProfile(audioBuffer, 32);
    
    // Detect sections
    const sections = this.detectSections(beats, energyProfile, audioBuffer.duration);
    
    // Extract multi-track drum pattern
    const drumPattern = this.extractDrumPattern(beats.transients, beats.bpm, audioBuffer.duration);
    
    return {
      beats,
      keyEstimate,
      energyProfile,
      sections,
      drumPattern,
    };
  }

  private computeOnsetStrength(channelData: Float32Array, sampleRate: number): number[] {
    const hopSize = Math.floor(sampleRate / 100); // 10ms hop
    const frameSize = hopSize * 4;
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
    const onsetStrength: number[] = [];
    
    let prevEnergy = 0;
    
    for (let i = 0; i < numFrames; i++) {
      const startSample = i * hopSize;
      let energy = 0;
      
      // Compute high-frequency energy (more important for onset detection)
      for (let j = 0; j < frameSize; j++) {
        const sample = channelData[startSample + j];
        // Apply simple high-pass emphasis
        if (j > 0) {
          const diff = sample - channelData[startSample + j - 1];
          energy += diff * diff;
        }
      }
      
      // Onset = positive energy difference
      const onset = Math.max(0, energy - prevEnergy);
      onsetStrength.push(onset);
      prevEnergy = energy;
    }
    
    // Normalize
    const maxOnset = Math.max(...onsetStrength);
    return onsetStrength.map(o => o / (maxOnset + 0.001));
  }

  private detectTempo(onsetStrength: number[], sampleRate: number): { bpm: number; confidence: number } {
    const hopSize = Math.floor(sampleRate / 100);
    const onsetSampleRate = sampleRate / hopSize;
    
    // Autocorrelation for tempo detection
    const minBPM = 60;
    const maxBPM = 180;
    const minLag = Math.floor(onsetSampleRate * 60 / maxBPM);
    const maxLag = Math.floor(onsetSampleRate * 60 / minBPM);
    
    let bestLag = minLag;
    let bestCorrelation = 0;
    
    for (let lag = minLag; lag <= maxLag; lag++) {
      let correlation = 0;
      const samples = Math.min(onsetStrength.length - lag, 1000);
      
      for (let i = 0; i < samples; i++) {
        correlation += onsetStrength[i] * onsetStrength[i + lag];
      }
      
      correlation /= samples;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    const bpm = Math.round((onsetSampleRate * 60) / bestLag);
    const confidence = Math.min(1, bestCorrelation * 3);
    
    return { bpm, confidence };
  }

  private findBeatPositions(onsetStrength: number[], bpm: number, sampleRate: number): number[] {
    const hopSize = Math.floor(sampleRate / 100);
    const beatInterval = (60 / bpm) * (sampleRate / hopSize); // in onset frames
    const beatPositions: number[] = [];
    
    // Find strong onsets that align with expected beat grid
    const threshold = 0.3;
    
    for (let i = 0; i < onsetStrength.length; i++) {
      if (onsetStrength[i] > threshold) {
        // Check if this is near an expected beat position
        const timeSeconds = (i * hopSize) / sampleRate;
        beatPositions.push(timeSeconds);
        
        // Skip ahead to avoid detecting the same beat twice
        i += Math.floor(beatInterval * 0.5);
      }
    }
    
    // Refine to grid
    return this.quantizeToBeatGrid(beatPositions, bpm);
  }

  private quantizeToBeatGrid(positions: number[], bpm: number): number[] {
    const beatDuration = 60 / bpm;
    const quantized: number[] = [];
    
    for (const pos of positions) {
      const nearestBeat = Math.round(pos / beatDuration) * beatDuration;
      if (!quantized.includes(nearestBeat)) {
        quantized.push(nearestBeat);
      }
    }
    
    return quantized.sort((a, b) => a - b);
  }

  private findDownbeats(beatPositions: number[], bpm: number): number[] {
    const beatsPerBar = 4;
    const beatDuration = 60 / bpm;
    const barDuration = beatDuration * beatsPerBar;
    
    // Assume first strong beat is downbeat
    if (beatPositions.length === 0) return [];
    
    const firstDownbeat = beatPositions[0];
    const downbeats: number[] = [];
    
    for (let t = firstDownbeat; t < beatPositions[beatPositions.length - 1]; t += barDuration) {
      downbeats.push(t);
    }
    
    return downbeats;
  }

  private detectTransients(channelData: Float32Array, sampleRate: number): TransientInfo[] {
    const hopSize = Math.floor(sampleRate / 200); // 5ms hop for transients
    const transients: TransientInfo[] = [];
    
    const lowPassData = this.lowPassFilter(channelData, sampleRate, 200);
    const midPassData = this.bandPassFilter(channelData, sampleRate, 200, 2000);
    const highPassData = this.highPassFilter(channelData, sampleRate, 5000);
    
    const numFrames = Math.floor(channelData.length / hopSize) - 1;
    
    for (let i = 1; i < numFrames; i++) {
      const startSample = i * hopSize;
      
      // Compute energy in different bands
      let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
      
      for (let j = 0; j < hopSize; j++) {
        lowEnergy += lowPassData[startSample + j] ** 2;
        midEnergy += midPassData[startSample + j] ** 2;
        highEnergy += highPassData[startSample + j] ** 2;
      }
      
      const prevStart = (i - 1) * hopSize;
      let prevLowEnergy = 0, prevMidEnergy = 0, prevHighEnergy = 0;
      
      for (let j = 0; j < hopSize; j++) {
        prevLowEnergy += lowPassData[prevStart + j] ** 2;
        prevMidEnergy += midPassData[prevStart + j] ** 2;
        prevHighEnergy += highPassData[prevStart + j] ** 2;
      }
      
      // Detect transient spikes
      const lowOnset = lowEnergy - prevLowEnergy;
      const midOnset = midEnergy - prevMidEnergy;
      const highOnset = highEnergy - prevHighEnergy;
      
      const totalOnset = lowOnset + midOnset + highOnset;
      
      if (totalOnset > 0.001) {
        const time = startSample / sampleRate;
        const strength = Math.min(1, totalOnset * 100);
        
        // Classify based on frequency content
        let type: TransientInfo['type'];
        if (lowOnset > midOnset && lowOnset > highOnset) {
          type = 'kick';
        } else if (midOnset > lowOnset && midOnset > highOnset) {
          type = 'snare';
        } else if (highOnset > lowOnset && highOnset > midOnset) {
          type = 'hihat';
        } else {
          type = 'other';
        }
        
        transients.push({ time, strength, type });
      }
    }
    
    return this.filterCloseTransients(transients, 0.05);
  }

  private filterCloseTransients(transients: TransientInfo[], minGap: number): TransientInfo[] {
    const filtered: TransientInfo[] = [];
    
    for (const t of transients) {
      const lastT = filtered[filtered.length - 1];
      if (!lastT || t.time - lastT.time > minGap) {
        filtered.push(t);
      } else if (t.strength > lastT.strength) {
        filtered[filtered.length - 1] = t;
      }
    }
    
    return filtered;
  }

  private extractRhythmPattern(beatPositions: number[], bpm: number, duration: number): number[] {
    const pattern = new Array(16).fill(0);
    const beatDuration = 60 / bpm;
    const barDuration = beatDuration * 4;
    const stepDuration = barDuration / 16;
    
    // Count beats per step position across all bars
    for (const beat of beatPositions) {
      const posInBar = (beat % barDuration) / stepDuration;
      const stepIndex = Math.round(posInBar) % 16;
      pattern[stepIndex]++;
    }
    
    // Normalize to 0-1
    const maxCount = Math.max(...pattern);
    return pattern.map(p => p / (maxCount + 0.001));
  }

  private computeEnergyEnvelope(channelData: Float32Array, sampleRate: number): number[] {
    const hopSize = Math.floor(sampleRate / 20); // 50ms hop
    const numFrames = Math.floor(channelData.length / hopSize);
    const energy: number[] = [];
    
    for (let i = 0; i < numFrames; i++) {
      const start = i * hopSize;
      const end = Math.min(start + hopSize, channelData.length);
      let sum = 0;
      
      for (let j = start; j < end; j++) {
        sum += channelData[j] ** 2;
      }
      
      energy.push(Math.sqrt(sum / (end - start)));
    }
    
    // Normalize
    const maxEnergy = Math.max(...energy);
    return energy.map(e => e / (maxEnergy + 0.001));
  }

  private computeSpectralCentroid(channelData: Float32Array, sampleRate: number): number[] {
    const fftSize = 2048;
    const hopSize = fftSize / 2;
    const numFrames = Math.floor((channelData.length - fftSize) / hopSize);
    const centroids: number[] = [];
    
    for (let i = 0; i < numFrames; i++) {
      const start = i * hopSize;
      let weightedSum = 0;
      let totalEnergy = 0;
      
      // Simple DFT for spectral centroid estimation
      for (let k = 0; k < fftSize / 2; k++) {
        let real = 0, imag = 0;
        
        for (let n = 0; n < fftSize; n++) {
          const sample = channelData[start + n] || 0;
          const angle = -2 * Math.PI * k * n / fftSize;
          real += sample * Math.cos(angle);
          imag += sample * Math.sin(angle);
        }
        
        const magnitude = Math.sqrt(real * real + imag * imag);
        const frequency = (k * sampleRate) / fftSize;
        
        weightedSum += frequency * magnitude;
        totalEnergy += magnitude;
      }
      
      const centroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
      centroids.push(centroid);
    }
    
    return centroids;
  }

  private buildEnergyProfile(audioBuffer: AudioBuffer, numSegments: number): number[] {
    const channelData = audioBuffer.getChannelData(0);
    const segmentSize = Math.floor(channelData.length / numSegments);
    const profile: number[] = [];
    
    for (let i = 0; i < numSegments; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, channelData.length);
      let rms = 0;
      
      for (let j = start; j < end; j++) {
        rms += channelData[j] ** 2;
      }
      
      profile.push(Math.sqrt(rms / (end - start)));
    }
    
    // Normalize
    const max = Math.max(...profile);
    return profile.map(p => p / (max + 0.001));
  }

  private detectSections(beats: ExtractedBeats, energyProfile: number[], duration: number): AudioSection[] {
    const sections: AudioSection[] = [];
    const segmentDuration = duration / energyProfile.length;
    
    let currentType: AudioSection['type'] = 'intro';
    let sectionStart = 0;
    
    for (let i = 1; i < energyProfile.length; i++) {
      const energy = energyProfile[i];
      const prevEnergy = energyProfile[i - 1];
      const energyChange = energy - prevEnergy;
      
      // Detect section changes based on energy transitions
      let newType: AudioSection['type'] | null = null;
      
      if (i < energyProfile.length * 0.1) {
        newType = 'intro';
      } else if (i > energyProfile.length * 0.9) {
        newType = 'outro';
      } else if (energyChange > 0.3) {
        newType = 'drop';
      } else if (energyChange < -0.3) {
        newType = 'breakdown';
      } else if (energy > 0.7) {
        newType = 'chorus';
      } else {
        newType = 'verse';
      }
      
      if (newType && newType !== currentType) {
        sections.push({
          start: sectionStart,
          end: i * segmentDuration,
          type: currentType,
          energy: energyProfile.slice(Math.floor(sectionStart / segmentDuration), i).reduce((a, b) => a + b, 0) / (i - Math.floor(sectionStart / segmentDuration) + 1),
        });
        sectionStart = i * segmentDuration;
        currentType = newType;
      }
    }
    
    // Add final section
    sections.push({
      start: sectionStart,
      end: duration,
      type: currentType,
      energy: energyProfile.slice(Math.floor(sectionStart / segmentDuration)).reduce((a, b) => a + b, 0) / (energyProfile.length - Math.floor(sectionStart / segmentDuration)),
    });
    
    return sections;
  }

  private extractDrumPattern(transients: TransientInfo[], bpm: number, duration: number): number[][] {
    const beatDuration = 60 / bpm;
    const barDuration = beatDuration * 4;
    const stepDuration = barDuration / 16;
    
    // 4 rows: kick, snare, hihat, other
    const patterns: number[][] = [
      new Array(16).fill(0), // kick
      new Array(16).fill(0), // snare
      new Array(16).fill(0), // hihat
      new Array(16).fill(0), // clap/other
    ];
    
    const rowMap: Record<TransientInfo['type'], number> = {
      kick: 0,
      snare: 1,
      hihat: 2,
      other: 3,
    };
    
    for (const t of transients) {
      const posInBar = (t.time % barDuration) / stepDuration;
      const stepIndex = Math.round(posInBar) % 16;
      const row = rowMap[t.type];
      patterns[row][stepIndex] = Math.max(patterns[row][stepIndex], t.strength);
    }
    
    // Threshold to binary
    return patterns.map(row => row.map(v => v > 0.3 ? 1 : 0));
  }

  private estimateKey(audioBuffer: AudioBuffer): string {
    // Simplified key estimation using spectral analysis
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Compute pitch class histogram
    const pitchClasses = new Array(12).fill(0);
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Simple frequency analysis
    const fftSize = 4096;
    for (let start = 0; start < channelData.length - fftSize; start += fftSize) {
      for (let k = 1; k < fftSize / 2; k++) {
        let real = 0, imag = 0;
        
        for (let n = 0; n < fftSize; n++) {
          const sample = channelData[start + n];
          const angle = -2 * Math.PI * k * n / fftSize;
          real += sample * Math.cos(angle);
          imag += sample * Math.sin(angle);
        }
        
        const magnitude = Math.sqrt(real * real + imag * imag);
        const frequency = (k * sampleRate) / fftSize;
        
        if (frequency > 80 && frequency < 2000 && magnitude > 0.01) {
          // Map frequency to pitch class
          const midiNote = 12 * Math.log2(frequency / 440) + 69;
          const pitchClass = Math.round(midiNote) % 12;
          pitchClasses[pitchClass] += magnitude;
        }
      }
    }
    
    // Find strongest pitch class
    const maxIndex = pitchClasses.indexOf(Math.max(...pitchClasses));
    
    // Determine major or minor based on relative strength of third
    const majorThird = pitchClasses[(maxIndex + 4) % 12];
    const minorThird = pitchClasses[(maxIndex + 3) % 12];
    
    const mode = majorThird > minorThird ? 'major' : 'minor';
    
    return `${noteNames[maxIndex]} ${mode}`;
  }

  // Filter helpers
  private lowPassFilter(data: Float32Array, sampleRate: number, cutoff: number): Float32Array {
    const rc = 1 / (2 * Math.PI * cutoff);
    const dt = 1 / sampleRate;
    const alpha = dt / (rc + dt);
    
    const filtered = new Float32Array(data.length);
    filtered[0] = data[0];
    
    for (let i = 1; i < data.length; i++) {
      filtered[i] = filtered[i - 1] + alpha * (data[i] - filtered[i - 1]);
    }
    
    return filtered;
  }

  private highPassFilter(data: Float32Array, sampleRate: number, cutoff: number): Float32Array {
    const lowPass = this.lowPassFilter(data, sampleRate, cutoff);
    const filtered = new Float32Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      filtered[i] = data[i] - lowPass[i];
    }
    
    return filtered;
  }

  private bandPassFilter(data: Float32Array, sampleRate: number, lowCutoff: number, highCutoff: number): Float32Array {
    const highPassed = this.highPassFilter(data, sampleRate, lowCutoff);
    return this.lowPassFilter(highPassed, sampleRate, highCutoff);
  }

  destroy() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Singleton
let extractorInstance: BeatExtractor | null = null;

export const getBeatExtractor = (): BeatExtractor => {
  if (!extractorInstance) {
    extractorInstance = new BeatExtractor();
  }
  return extractorInstance;
};
