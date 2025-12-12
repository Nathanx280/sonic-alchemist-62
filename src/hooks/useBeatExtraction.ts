import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Safe interfaces with all optional fields
export interface ExtractedBeats {
  bpm: number;
  confidence: number;
  beatPositions: number[];
  downbeats: number[];
  transients: TransientInfo[];
  rhythmPattern: number[];
  energy: number[];
  spectralCentroid: number[];
  onsetStrength: number[];
  swingFactor: number;
  groovePattern: number[];
}

export interface TransientInfo {
  time: number;
  strength: number;
  type: 'kick' | 'snare' | 'hihat' | 'clap' | 'perc' | 'other';
  frequency: number;
}

export interface AudioAnalysis {
  beats: ExtractedBeats;
  keyEstimate: string;
  scaleType: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'unknown';
  energyProfile: number[];
  sections: AudioSection[];
  drumPattern: number[][];
  harmonicContent: HarmonicInfo;
  dynamicRange: number;
  stereoWidth: number;
  spectralBalance: SpectralBalance;
  rhythmComplexity: number;
  melodicContour: number[];
}

export interface HarmonicInfo {
  rootNote: string;
  chordProgression: string[];
  harmoniousness: number;
  dissonance: number;
}

export interface SpectralBalance {
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  high: number;
  presence: number;
}

export interface AudioSection {
  start: number;
  end: number;
  type: 'intro' | 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'breakdown' | 'buildup' | 'drop' | 'outro';
  energy: number;
  intensity: number;
  mood: 'calm' | 'building' | 'intense' | 'euphoric' | 'melancholic';
}

export interface BeatExtractionState {
  isExtracting: boolean;
  analysis: AudioAnalysis | null;
  extractedDrumPattern: number[][] | null;
  detectedBPM: number | null;
  detectedKey: string | null;
  confidence: number;
}

// Create a default/fallback analysis result
const createDefaultAnalysis = (duration: number): AudioAnalysis => ({
  beats: {
    bpm: 120,
    confidence: 0.5,
    beatPositions: [],
    downbeats: [],
    transients: [],
    rhythmPattern: new Array(16).fill(0),
    energy: [],
    spectralCentroid: [],
    onsetStrength: [],
    swingFactor: 0,
    groovePattern: new Array(16).fill(0.5),
  },
  keyEstimate: 'C Major',
  scaleType: 'major',
  energyProfile: new Array(16).fill(0.5),
  sections: [{ start: 0, end: duration, type: 'verse', energy: 0.5, intensity: 0.5, mood: 'calm' }],
  drumPattern: [
    new Array(16).fill(0),
    new Array(16).fill(0),
    new Array(16).fill(0),
    new Array(16).fill(0),
  ],
  harmonicContent: {
    rootNote: 'C',
    chordProgression: ['C', 'G', 'Am', 'F'],
    harmoniousness: 0.7,
    dissonance: 0.2,
  },
  dynamicRange: 12,
  stereoWidth: 0.5,
  spectralBalance: { bass: 0.5, lowMid: 0.5, mid: 0.5, highMid: 0.5, high: 0.5, presence: 0.5 },
  rhythmComplexity: 0.5,
  melodicContour: [],
});

// Advanced multi-band energy analysis
const computeMultiBandEnergy = (channelData: Float32Array, sampleRate: number): SpectralBalance => {
  const fftSize = 2048;
  const numFrames = Math.min(50, Math.floor(channelData.length / fftSize));
  
  const bandEnergies = { bass: 0, lowMid: 0, mid: 0, highMid: 0, high: 0, presence: 0 };
  
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * fftSize;
    
    for (let k = 1; k < fftSize / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < Math.min(512, fftSize); n++) {
        const sample = channelData[start + n] || 0;
        const angle = -2 * Math.PI * k * n / fftSize;
        real += sample * Math.cos(angle);
        imag += sample * Math.sin(angle);
      }
      
      const magnitude = Math.sqrt(real * real + imag * imag);
      const freq = (k * sampleRate) / fftSize;
      
      if (freq < 100) bandEnergies.bass += magnitude;
      else if (freq < 300) bandEnergies.lowMid += magnitude;
      else if (freq < 1000) bandEnergies.mid += magnitude;
      else if (freq < 4000) bandEnergies.highMid += magnitude;
      else if (freq < 10000) bandEnergies.high += magnitude;
      else bandEnergies.presence += magnitude;
    }
  }
  
  const total = Object.values(bandEnergies).reduce((a, b) => a + b, 0.001);
  return {
    bass: bandEnergies.bass / total,
    lowMid: bandEnergies.lowMid / total,
    mid: bandEnergies.mid / total,
    highMid: bandEnergies.highMid / total,
    high: bandEnergies.high / total,
    presence: bandEnergies.presence / total,
  };
};

// Onset detection with spectral flux
const computeOnsetStrength = (channelData: Float32Array, sampleRate: number): number[] => {
  const hopSize = Math.floor(sampleRate / 100);
  const frameSize = hopSize * 2;
  const numFrames = Math.min(500, Math.floor((channelData.length - frameSize) / hopSize));
  const onsetStrength: number[] = [];
  
  let prevEnergy = 0;
  
  for (let i = 0; i < numFrames; i++) {
    const startSample = i * hopSize;
    let energy = 0;
    let highFreqEnergy = 0;
    
    for (let j = 0; j < frameSize && (startSample + j) < channelData.length; j++) {
      const sample = channelData[startSample + j];
      energy += sample * sample;
      if (j > 0) {
        const diff = sample - channelData[startSample + j - 1];
        highFreqEnergy += diff * diff;
      }
    }
    
    const combinedEnergy = energy * 0.3 + highFreqEnergy * 0.7;
    const onset = Math.max(0, combinedEnergy - prevEnergy * 0.9);
    onsetStrength.push(onset);
    prevEnergy = combinedEnergy;
  }
  
  const maxOnset = Math.max(...onsetStrength, 0.001);
  return onsetStrength.map(o => o / maxOnset);
};

// BPM detection with autocorrelation
const detectBPM = (onsetStrength: number[], sampleRate: number): { bpm: number; confidence: number } => {
  const hopSize = Math.floor(sampleRate / 100);
  const onsetSampleRate = sampleRate / hopSize;
  
  const minBPM = 70;
  const maxBPM = 180;
  const minLag = Math.floor(onsetSampleRate * 60 / maxBPM);
  const maxLag = Math.floor(onsetSampleRate * 60 / minBPM);
  
  let bestLag = minLag;
  let bestCorrelation = 0;
  const correlations: number[] = [];
  
  for (let lag = minLag; lag <= maxLag; lag++) {
    let correlation = 0;
    const samples = Math.min(onsetStrength.length - lag, 300);
    
    for (let i = 0; i < samples; i++) {
      correlation += onsetStrength[i] * onsetStrength[i + lag];
    }
    
    correlation /= samples;
    correlations.push(correlation);
    
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }
  
  // Check for double/half tempo
  const bpmRaw = (onsetSampleRate * 60) / bestLag;
  let bpm = Math.round(bpmRaw);
  
  if (bpm < 85) bpm *= 2;
  if (bpm > 160) bpm = Math.round(bpm / 2);
  
  const confidence = Math.min(1, bestCorrelation * 4);
  
  return { bpm, confidence };
};

// Detect transients and classify drum hits
const detectTransients = (channelData: Float32Array, sampleRate: number): TransientInfo[] => {
  const hopSize = Math.floor(sampleRate / 150);
  const transients: TransientInfo[] = [];
  const numFrames = Math.min(1000, Math.floor(channelData.length / hopSize) - 1);
  
  let prevLowEnergy = 0, prevMidEnergy = 0, prevHighEnergy = 0;
  
  for (let i = 1; i < numFrames; i++) {
    const startSample = i * hopSize;
    let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
    
    // Simple band separation using sample differences
    for (let j = 0; j < hopSize && (startSample + j) < channelData.length; j++) {
      const sample = channelData[startSample + j];
      const absSample = Math.abs(sample);
      
      // Approximate frequency bands
      if (j % 8 === 0) lowEnergy += absSample;
      if (j % 4 === 0) midEnergy += absSample;
      if (j % 2 === 0) highEnergy += absSample;
    }
    
    const lowOnset = Math.max(0, lowEnergy - prevLowEnergy);
    const midOnset = Math.max(0, midEnergy - prevMidEnergy);
    const highOnset = Math.max(0, highEnergy - prevHighEnergy);
    const totalOnset = lowOnset + midOnset + highOnset;
    
    if (totalOnset > 0.5) {
      const time = startSample / sampleRate;
      const strength = Math.min(1, totalOnset / 5);
      
      let type: TransientInfo['type'];
      let frequency = 200;
      
      if (lowOnset > midOnset * 1.5 && lowOnset > highOnset) {
        type = 'kick';
        frequency = 80;
      } else if (midOnset > lowOnset && midOnset > highOnset * 0.8) {
        type = 'snare';
        frequency = 250;
      } else if (highOnset > midOnset * 1.2) {
        type = 'hihat';
        frequency = 8000;
      } else if (midOnset > highOnset && lowOnset < midOnset * 0.5) {
        type = 'clap';
        frequency = 1500;
      } else if (highOnset > 0.3 && midOnset > 0.2) {
        type = 'perc';
        frequency = 3000;
      } else {
        type = 'other';
        frequency = 500;
      }
      
      transients.push({ time, strength, type, frequency });
    }
    
    prevLowEnergy = lowEnergy;
    prevMidEnergy = midEnergy;
    prevHighEnergy = highEnergy;
  }
  
  // Filter transients that are too close together
  return transients.filter((t, i) => {
    if (i === 0) return true;
    return t.time - transients[i - 1].time > 0.03;
  });
};

// Detect swing/groove feel
const detectSwing = (transients: TransientInfo[], bpm: number): { swingFactor: number; groovePattern: number[] } => {
  const beatDuration = 60 / bpm;
  const sixteenthDuration = beatDuration / 4;
  const groovePattern = new Array(16).fill(0.5);
  
  let swingSum = 0;
  let swingCount = 0;
  
  for (const t of transients) {
    if (t.type === 'hihat' || t.type === 'snare') {
      const posInBeat = (t.time % beatDuration) / sixteenthDuration;
      const nearestSixteenth = Math.round(posInBeat);
      const deviation = posInBeat - nearestSixteenth;
      
      if (nearestSixteenth % 2 === 1) { // Off-beat positions
        swingSum += deviation;
        swingCount++;
      }
      
      const stepIndex = Math.round(posInBeat) % 16;
      groovePattern[stepIndex] = Math.max(groovePattern[stepIndex], 0.5 + deviation);
    }
  }
  
  const swingFactor = swingCount > 0 ? Math.max(-0.5, Math.min(0.5, swingSum / swingCount * 10)) : 0;
  
  return { swingFactor, groovePattern };
};

// Key detection using pitch class histogram
const detectKey = (channelData: Float32Array, sampleRate: number): { key: string; scaleType: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'unknown' } => {
  const pitchClasses = new Array(12).fill(0);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const fftSize = 4096;
  const numFrames = Math.min(20, Math.floor(channelData.length / fftSize));
  
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * fftSize;
    
    for (let k = 10; k < 200; k++) {
      let real = 0, imag = 0;
      
      for (let n = 0; n < Math.min(1024, fftSize); n++) {
        const sample = channelData[start + n] || 0;
        const angle = -2 * Math.PI * k * n / fftSize;
        real += sample * Math.cos(angle);
        imag += sample * Math.sin(angle);
      }
      
      const magnitude = Math.sqrt(real * real + imag * imag);
      const freq = (k * sampleRate) / fftSize;
      
      if (freq > 50 && freq < 2000) {
        const midiNote = 12 * Math.log2(freq / 440) + 69;
        const pitchClass = Math.round(midiNote) % 12;
        if (pitchClass >= 0 && pitchClass < 12) {
          pitchClasses[pitchClass] += magnitude;
        }
      }
    }
  }
  
  // Major and minor profiles
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  const dorianProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 4.09, 2.54, 5.19, 2.39, 3.66, 3.34, 2.88];
  const mixolydianProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 3.34, 2.88];
  
  let bestKey = 0;
  let bestCorr = -1;
  let bestScale: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'unknown' = 'major';
  
  for (let key = 0; key < 12; key++) {
    const profiles = [
      { profile: majorProfile, scale: 'major' as const },
      { profile: minorProfile, scale: 'minor' as const },
      { profile: dorianProfile, scale: 'dorian' as const },
      { profile: mixolydianProfile, scale: 'mixolydian' as const },
    ];
    
    for (const { profile, scale } of profiles) {
      let corr = 0;
      for (let i = 0; i < 12; i++) {
        corr += pitchClasses[(i + key) % 12] * profile[i];
      }
      
      if (corr > bestCorr) {
        bestCorr = corr;
        bestKey = key;
        bestScale = scale;
      }
    }
  }
  
  const scaleNames: Record<string, string> = {
    major: 'Major',
    minor: 'Minor',
    dorian: 'Dorian',
    mixolydian: 'Mixolydian',
    unknown: '',
  };
  
  return {
    key: `${noteNames[bestKey]} ${scaleNames[bestScale]}`,
    scaleType: bestScale,
  };
};

// Detect sections based on energy and spectral changes
const detectSections = (energyProfile: number[], transients: TransientInfo[], duration: number): AudioSection[] => {
  const sections: AudioSection[] = [];
  const segmentDuration = duration / energyProfile.length;
  
  let currentType: AudioSection['type'] = 'intro';
  let sectionStart = 0;
  let prevAvgEnergy = 0;
  
  const windowSize = 3;
  
  for (let i = windowSize; i < energyProfile.length - windowSize; i++) {
    const localAvg = energyProfile.slice(i - windowSize, i + windowSize + 1).reduce((a, b) => a + b, 0) / (windowSize * 2 + 1);
    const energyChange = localAvg - prevAvgEnergy;
    const energy = energyProfile[i];
    const position = i / energyProfile.length;
    
    let newType: AudioSection['type'] | null = null;
    let mood: AudioSection['mood'] = 'calm';
    
    if (position < 0.08) {
      newType = 'intro';
      mood = 'calm';
    } else if (position > 0.92) {
      newType = 'outro';
      mood = 'calm';
    } else if (energyChange > 0.25) {
      newType = 'drop';
      mood = 'euphoric';
    } else if (energyChange > 0.12) {
      newType = 'buildup';
      mood = 'building';
    } else if (energyChange < -0.2) {
      newType = 'breakdown';
      mood = 'melancholic';
    } else if (energy > 0.75) {
      newType = 'chorus';
      mood = 'intense';
    } else if (energy > 0.55) {
      newType = 'prechorus';
      mood = 'building';
    } else if (energy > 0.35) {
      newType = 'verse';
      mood = 'calm';
    } else {
      newType = 'bridge';
      mood = 'melancholic';
    }
    
    if (newType && newType !== currentType && (i * segmentDuration - sectionStart) > 2) {
      const sectionEnergy = energyProfile.slice(
        Math.floor(sectionStart / segmentDuration),
        i
      ).reduce((a, b) => a + b, 0) / Math.max(1, i - Math.floor(sectionStart / segmentDuration));
      
      sections.push({
        start: sectionStart,
        end: i * segmentDuration,
        type: currentType,
        energy: sectionEnergy,
        intensity: Math.min(1, sectionEnergy * 1.2),
        mood,
      });
      sectionStart = i * segmentDuration;
      currentType = newType;
    }
    
    prevAvgEnergy = localAvg;
  }
  
  // Add final section
  sections.push({
    start: sectionStart,
    end: duration,
    type: currentType,
    energy: 0.5,
    intensity: 0.5,
    mood: 'calm',
  });
  
  return sections.length > 0 ? sections : [{ start: 0, end: duration, type: 'verse', energy: 0.5, intensity: 0.5, mood: 'calm' }];
};

// Extract drum pattern from transients
const extractDrumPattern = (transients: TransientInfo[], bpm: number): number[][] => {
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * 4;
  const stepDuration = barDuration / 16;
  
  const patterns: number[][] = [
    new Array(16).fill(0), // kick
    new Array(16).fill(0), // snare
    new Array(16).fill(0), // hihat
    new Array(16).fill(0), // clap
  ];
  
  const rowMap: Record<TransientInfo['type'], number> = {
    kick: 0,
    snare: 1,
    hihat: 2,
    clap: 3,
    perc: 2,
    other: 3,
  };
  
  for (const t of transients) {
    const posInBar = (t.time % barDuration) / stepDuration;
    const stepIndex = Math.round(posInBar) % 16;
    const row = rowMap[t.type];
    patterns[row][stepIndex] = Math.max(patterns[row][stepIndex], t.strength);
  }
  
  // Threshold to binary
  return patterns.map(row => row.map(v => v > 0.2 ? 1 : 0));
};

// Compute rhythm complexity score
const computeRhythmComplexity = (transients: TransientInfo[], bpm: number): number => {
  if (transients.length < 10) return 0.3;
  
  const beatDuration = 60 / bpm;
  const uniquePositions = new Set<number>();
  
  for (const t of transients) {
    const posInBeat = ((t.time % beatDuration) / beatDuration * 16).toFixed(1);
    uniquePositions.add(parseFloat(posInBeat));
  }
  
  // Syncopation detection
  let syncopationCount = 0;
  const offbeatPositions = [1, 3, 5, 7, 9, 11, 13, 15];
  
  for (const pos of uniquePositions) {
    if (offbeatPositions.includes(Math.round(pos))) {
      syncopationCount++;
    }
  }
  
  const positionVariety = Math.min(1, uniquePositions.size / 12);
  const syncopation = Math.min(1, syncopationCount / 6);
  
  return positionVariety * 0.5 + syncopation * 0.5;
};

// Main analysis function with robust error handling
const advancedAnalyze = async (audioBuffer: AudioBuffer): Promise<AudioAnalysis> => {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  
  // Compute onset strength
  const onsetStrength = computeOnsetStrength(channelData, sampleRate);
  
  // Detect BPM
  const { bpm, confidence } = detectBPM(onsetStrength, sampleRate);
  
  // Detect transients
  const transients = detectTransients(channelData, sampleRate);
  
  // Detect swing/groove
  const { swingFactor, groovePattern } = detectSwing(transients, bpm);
  
  // Detect key
  const { key, scaleType } = detectKey(channelData, sampleRate);
  
  // Spectral balance
  const spectralBalance = computeMultiBandEnergy(channelData, sampleRate);
  
  // Energy profile (32 segments)
  const hopSize = Math.floor(channelData.length / 32);
  const energyProfile: number[] = [];
  for (let i = 0; i < 32; i++) {
    const start = i * hopSize;
    const end = Math.min(start + hopSize, channelData.length);
    let energy = 0;
    for (let j = start; j < end; j++) {
      energy += channelData[j] * channelData[j];
    }
    energyProfile.push(Math.sqrt(energy / (end - start)));
  }
  const maxEnergy = Math.max(...energyProfile, 0.001);
  const normalizedEnergy = energyProfile.map(e => e / maxEnergy);
  
  // Sections
  const sections = detectSections(normalizedEnergy, transients, duration);
  
  // Drum pattern
  const drumPattern = extractDrumPattern(transients, bpm);
  
  // Rhythm complexity
  const rhythmComplexity = computeRhythmComplexity(transients, bpm);
  
  // Dynamic range (simplified)
  const sortedEnergies = [...normalizedEnergy].sort((a, b) => a - b);
  const dynamicRange = Math.max(1, 20 * Math.log10((sortedEnergies[Math.floor(sortedEnergies.length * 0.95)] + 0.001) / (sortedEnergies[Math.floor(sortedEnergies.length * 0.05)] + 0.001)));
  
  // Rhythm pattern from beats
  const rhythmPattern = new Array(16).fill(0);
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * 4;
  for (const t of transients) {
    if (t.type === 'kick' || t.type === 'snare') {
      const stepIndex = Math.round((t.time % barDuration) / (barDuration / 16)) % 16;
      rhythmPattern[stepIndex] = Math.max(rhythmPattern[stepIndex], t.strength);
    }
  }
  
  // Harmonic content (simplified)
  const chordProgressions = [
    ['C', 'G', 'Am', 'F'],
    ['Am', 'F', 'C', 'G'],
    ['D', 'A', 'Bm', 'G'],
    ['Em', 'C', 'G', 'D'],
    ['F', 'C', 'Dm', 'Bb'],
  ];
  const rootNote = key.split(' ')[0];
  const selectedProgression = chordProgressions.find(p => p[0].startsWith(rootNote)) || chordProgressions[0];
  
  return {
    beats: {
      bpm,
      confidence,
      beatPositions: [],
      downbeats: [],
      transients,
      rhythmPattern,
      energy: normalizedEnergy.slice(0, 100),
      spectralCentroid: [],
      onsetStrength: onsetStrength.slice(0, 100),
      swingFactor,
      groovePattern,
    },
    keyEstimate: key,
    scaleType,
    energyProfile: normalizedEnergy,
    sections,
    drumPattern,
    harmonicContent: {
      rootNote,
      chordProgression: selectedProgression,
      harmoniousness: 0.7 + Math.random() * 0.2,
      dissonance: 0.1 + Math.random() * 0.2,
    },
    dynamicRange,
    stereoWidth: audioBuffer.numberOfChannels > 1 ? 0.6 : 0.3,
    spectralBalance,
    rhythmComplexity,
    melodicContour: normalizedEnergy.slice(0, 16),
  };
};

export const useBeatExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [extractedDrumPattern, setExtractedDrumPattern] = useState<number[][] | null>(null);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);

  const extractBeatsFromFile = useCallback(async (file: File): Promise<AudioAnalysis | null> => {
    setIsExtracting(true);
    
    let audioContext: AudioContext | null = null;
    
    try {
      toast.loading('Analyzing beats, rhythm & harmony...', { id: 'beat-extraction' });
      
      audioContext = new AudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const fullAnalysis = await advancedAnalyze(audioBuffer);
      
      setAnalysis(fullAnalysis);
      setExtractedDrumPattern(fullAnalysis.drumPattern || []);
      setDetectedBPM(fullAnalysis.beats?.bpm || 120);
      setDetectedKey(fullAnalysis.keyEstimate || 'Unknown');
      setConfidence(fullAnalysis.beats?.confidence || 0.5);
      
      const swingInfo = fullAnalysis.beats.swingFactor > 0.1 ? ' (Swung)' : '';
      const complexityLabel = fullAnalysis.rhythmComplexity > 0.6 ? 'Complex' : fullAnalysis.rhythmComplexity > 0.3 ? 'Moderate' : 'Simple';
      
      toast.success(
        `${fullAnalysis.beats?.bpm || 120} BPM | ${fullAnalysis.keyEstimate}${swingInfo} | ${complexityLabel} rhythm`,
        { id: 'beat-extraction' }
      );
      
      return fullAnalysis;
    } catch (error) {
      console.error('Beat extraction error:', error);
      
      const fallback = createDefaultAnalysis(180);
      setAnalysis(fallback);
      setExtractedDrumPattern(fallback.drumPattern);
      setDetectedBPM(fallback.beats.bpm);
      setDetectedKey(fallback.keyEstimate);
      setConfidence(fallback.beats.confidence);
      
      toast.warning('Using estimated values - analysis had issues', { id: 'beat-extraction' });
      return fallback;
    } finally {
      setIsExtracting(false);
      if (audioContext) {
        try {
          await audioContext.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }, []);

  const getExtractedPattern = useCallback((rowIndex: number): number[] => {
    if (!extractedDrumPattern || rowIndex >= extractedDrumPattern.length) {
      return new Array(16).fill(0);
    }
    return extractedDrumPattern[rowIndex] || new Array(16).fill(0);
  }, [extractedDrumPattern]);

  const getSectionAtTime = useCallback((time: number) => {
    if (!analysis?.sections) return null;
    return analysis.sections.find(s => time >= s.start && time < s.end) || null;
  }, [analysis]);

  const getBeatPositions = useCallback((): number[] => {
    return analysis?.beats?.beatPositions || [];
  }, [analysis]);

  const getTransients = useCallback(() => {
    return analysis?.beats?.transients || [];
  }, [analysis]);

  const getEnergyProfile = useCallback((): number[] => {
    return analysis?.energyProfile || [];
  }, [analysis]);

  const getSpectralBalance = useCallback((): SpectralBalance | null => {
    return analysis?.spectralBalance || null;
  }, [analysis]);

  const getHarmonicContent = useCallback((): HarmonicInfo | null => {
    return analysis?.harmonicContent || null;
  }, [analysis]);

  const getRhythmComplexity = useCallback((): number => {
    return analysis?.rhythmComplexity || 0.5;
  }, [analysis]);

  const getSwingFactor = useCallback((): number => {
    return analysis?.beats?.swingFactor || 0;
  }, [analysis]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setExtractedDrumPattern(null);
    setDetectedBPM(null);
    setDetectedKey(null);
    setConfidence(0);
  }, []);

  return {
    isExtracting,
    analysis,
    extractedDrumPattern,
    detectedBPM,
    detectedKey,
    confidence,
    extractBeatsFromFile,
    getExtractedPattern,
    getSectionAtTime,
    getBeatPositions,
    getTransients,
    getEnergyProfile,
    getSpectralBalance,
    getHarmonicContent,
    getRhythmComplexity,
    getSwingFactor,
    reset,
  };
};
