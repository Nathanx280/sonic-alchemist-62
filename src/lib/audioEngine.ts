export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  waveformData: number[];
}

export interface RemixSettings {
  tempo: number;
  pitch: number;
  bass: number;
  effects: number;
  reverbEnabled?: boolean;
  delayEnabled?: boolean;
  exciterEnabled?: boolean;
  compressionEnabled?: boolean;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // EQ nodes
  private subBassFilter: BiquadFilterNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private lowMidFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highMidFilter: BiquadFilterNode | null = null;
  private highShelfFilter: BiquadFilterNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  
  // Advanced remastering EQ
  private subHarmonicFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private brillianceFilter: BiquadFilterNode | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
  
  // Dynamics
  private compressor: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  
  // Advanced dynamics - multiband compression simulation
  private lowBandCompressor: DynamicsCompressorNode | null = null;
  private midBandCompressor: DynamicsCompressorNode | null = null;
  private highBandCompressor: DynamicsCompressorNode | null = null;
  private transientShaper: DynamicsCompressorNode | null = null;
  
  // Effects
  private convolver: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private reverbWet: GainNode | null = null;
  private dryGain: GainNode | null = null;
  
  // Advanced effects
  private chorusDelayL: DelayNode | null = null;
  private chorusDelayR: DelayNode | null = null;
  private chorusLFO: OscillatorNode | null = null;
  private chorusDepth: GainNode | null = null;
  private chorusWet: GainNode | null = null;
  private flangerDelay: DelayNode | null = null;
  private flangerLFO: OscillatorNode | null = null;
  private flangerDepth: GainNode | null = null;
  private flangerFeedback: GainNode | null = null;
  private flangerWet: GainNode | null = null;
  
  // Stereo enhancement
  private stereoSplitter: ChannelSplitterNode | null = null;
  private stereoMerger: ChannelMergerNode | null = null;
  private stereoDelayL: DelayNode | null = null;
  private stereoDelayR: DelayNode | null = null;
  private midGain: GainNode | null = null;
  private sideGain: GainNode | null = null;
  
  // Harmonic processing
  private exciterFilter: BiquadFilterNode | null = null;
  private exciterDistortion: WaveShaperNode | null = null;
  private exciterGain: GainNode | null = null;
  
  // Advanced harmonic processing
  private tapeSaturation: WaveShaperNode | null = null;
  private tapeSaturationGain: GainNode | null = null;
  private tubeWarmth: WaveShaperNode | null = null;
  private tubeWarmthGain: GainNode | null = null;
  private subHarmonicSynth: WaveShaperNode | null = null;
  private subHarmonicGain: GainNode | null = null;
  private harmonicEnhancer: WaveShaperNode | null = null;
  private harmonicEnhancerGain: GainNode | null = null;
  
  // Transient processing
  private transientAttackGain: GainNode | null = null;
  private transientSustainGain: GainNode | null = null;
  private transientEnvelope: GainNode | null = null;
  
  // Psychoacoustic processing
  private psychoacousticLowBoost: BiquadFilterNode | null = null;
  private psychoacousticHighBoost: BiquadFilterNode | null = null;
  private loudnessContour: BiquadFilterNode | null = null;
  
  private isPlaying = false;
  private startTime = 0;
  private pausedAt = 0;
  private playbackRate = 1;
  private onStateChange: ((state: AudioEngineState) => void) | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  async loadFile(file: File): Promise<number[]> {
    this.initContext();
    
    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    
    // Generate waveform data
    const waveformData = this.generateWaveformData(this.audioBuffer);
    
    return waveformData;
  }

  private generateWaveformData(buffer: AudioBuffer): number[] {
    const rawData = buffer.getChannelData(0);
    const samples = 128;
    const blockSize = Math.floor(rawData.length / samples);
    const waveformData: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      waveformData.push(sum / blockSize);
    }

    // Normalize
    const max = Math.max(...waveformData);
    return waveformData.map(v => (v / max) * 100);
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext!.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with some randomness for natural sound
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  private createExciterCurve(): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Soft saturation curve that adds harmonics
      curve[i] = Math.tanh(x * 2) * 0.7 + x * 0.3;
    }
    return curve;
  }

  // Advanced saturation curves for remastering
  private createTapeSaturationCurve(): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Tape-style soft clipping with asymmetric harmonic generation
      const k = 1.5;
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
      // Add slight asymmetry for even harmonics (tape character)
      curve[i] += 0.05 * Math.sin(x * Math.PI);
    }
    return curve;
  }

  private createTubeWarmthCurve(): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Tube-style saturation with 2nd and 3rd harmonic emphasis
      const tube = Math.tanh(x * 1.5);
      const secondHarmonic = 0.1 * Math.sin(2 * x * Math.PI);
      const thirdHarmonic = 0.05 * Math.sin(3 * x * Math.PI);
      curve[i] = tube * 0.85 + secondHarmonic + thirdHarmonic;
    }
    return curve;
  }

  private createSubHarmonicCurve(): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Generate sub-harmonics through octave division
      const fundamental = x;
      const subOctave = 0.3 * Math.sin(Math.asin(Math.max(-1, Math.min(1, x))) / 2);
      curve[i] = fundamental + subOctave;
    }
    return curve;
  }

  private createHarmonicEnhancerCurve(): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Multi-harmonic enhancement
      const clean = x * 0.7;
      const h2 = 0.15 * Math.sin(2 * x * Math.PI);
      const h3 = 0.08 * Math.sin(3 * x * Math.PI);
      const h4 = 0.04 * Math.sin(4 * x * Math.PI);
      const h5 = 0.03 * Math.sin(5 * x * Math.PI);
      curve[i] = clean + h2 + h3 + h4 + h5;
    }
    return curve;
  }

  private setupNodes() {
    if (!this.audioContext || !this.audioBuffer) return;

    // Create gain nodes
    this.gainNode = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.reverbWet = this.audioContext.createGain();
    this.delayWet = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // === MULTI-BAND EQ ===
    // Sub bass (20-60Hz) - warmth and rumble
    this.subBassFilter = this.audioContext.createBiquadFilter();
    this.subBassFilter.type = 'lowshelf';
    this.subBassFilter.frequency.value = 60;
    this.subBassFilter.gain.value = 0;

    // Bass (60-250Hz) - punch and body
    this.bassFilter = this.audioContext.createBiquadFilter();
    this.bassFilter.type = 'peaking';
    this.bassFilter.frequency.value = 100;
    this.bassFilter.Q.value = 1.0;
    this.bassFilter.gain.value = 0;

    // Low mids (250-500Hz) - warmth, can get muddy
    this.lowMidFilter = this.audioContext.createBiquadFilter();
    this.lowMidFilter.type = 'peaking';
    this.lowMidFilter.frequency.value = 350;
    this.lowMidFilter.Q.value = 1.0;
    this.lowMidFilter.gain.value = -1; // Slight cut for clarity

    // Mids (500-2kHz) - presence and clarity
    this.midFilter = this.audioContext.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 0.8;
    this.midFilter.gain.value = 0;

    // High mids (2-4kHz) - presence and bite
    this.highMidFilter = this.audioContext.createBiquadFilter();
    this.highMidFilter.type = 'peaking';
    this.highMidFilter.frequency.value = 3000;
    this.highMidFilter.Q.value = 1.0;
    this.highMidFilter.gain.value = 0;

    // High shelf (4kHz+) - brightness
    this.highShelfFilter = this.audioContext.createBiquadFilter();
    this.highShelfFilter.type = 'highshelf';
    this.highShelfFilter.frequency.value = 4000;
    this.highShelfFilter.gain.value = 0;

    // Air (10kHz+) - sparkle and openness
    this.airFilter = this.audioContext.createBiquadFilter();
    this.airFilter.type = 'highshelf';
    this.airFilter.frequency.value = 10000;
    this.airFilter.gain.value = 0;

    // === ADVANCED REMASTERING EQ ===
    // Sub-harmonic resonance (30Hz) - deep bass enhancement
    this.subHarmonicFilter = this.audioContext.createBiquadFilter();
    this.subHarmonicFilter.type = 'peaking';
    this.subHarmonicFilter.frequency.value = 30;
    this.subHarmonicFilter.Q.value = 2.0;
    this.subHarmonicFilter.gain.value = 0;

    // Presence boost (4-5kHz) - vocal and lead clarity
    this.presenceFilter = this.audioContext.createBiquadFilter();
    this.presenceFilter.type = 'peaking';
    this.presenceFilter.frequency.value = 4500;
    this.presenceFilter.Q.value = 1.2;
    this.presenceFilter.gain.value = 0;

    // Brilliance (12kHz+) - ultra highs shimmer
    this.brillianceFilter = this.audioContext.createBiquadFilter();
    this.brillianceFilter.type = 'highshelf';
    this.brillianceFilter.frequency.value = 12000;
    this.brillianceFilter.gain.value = 0;

    // Warmth (200-400Hz) - body and fullness
    this.warmthFilter = this.audioContext.createBiquadFilter();
    this.warmthFilter.type = 'peaking';
    this.warmthFilter.frequency.value = 280;
    this.warmthFilter.Q.value = 0.7;
    this.warmthFilter.gain.value = 0;

    // === DYNAMICS ===
    // Main compressor - glue and punch
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.15;

    // Limiter - safety and loudness
    this.limiter = this.audioContext.createDynamicsCompressor();
    this.limiter.threshold.value = -3;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.05;

    // === MULTIBAND COMPRESSION SIMULATION ===
    // Low band compressor (bass control)
    this.lowBandCompressor = this.audioContext.createDynamicsCompressor();
    this.lowBandCompressor.threshold.value = -24;
    this.lowBandCompressor.knee.value = 10;
    this.lowBandCompressor.ratio.value = 4;
    this.lowBandCompressor.attack.value = 0.02;
    this.lowBandCompressor.release.value = 0.25;

    // Mid band compressor (punch and clarity)
    this.midBandCompressor = this.audioContext.createDynamicsCompressor();
    this.midBandCompressor.threshold.value = -20;
    this.midBandCompressor.knee.value = 8;
    this.midBandCompressor.ratio.value = 3;
    this.midBandCompressor.attack.value = 0.008;
    this.midBandCompressor.release.value = 0.12;

    // High band compressor (sparkle control)
    this.highBandCompressor = this.audioContext.createDynamicsCompressor();
    this.highBandCompressor.threshold.value = -22;
    this.highBandCompressor.knee.value = 6;
    this.highBandCompressor.ratio.value = 2.5;
    this.highBandCompressor.attack.value = 0.003;
    this.highBandCompressor.release.value = 0.08;

    // Transient shaper (beat enhancement)
    this.transientShaper = this.audioContext.createDynamicsCompressor();
    this.transientShaper.threshold.value = -30;
    this.transientShaper.knee.value = 0;
    this.transientShaper.ratio.value = 8;
    this.transientShaper.attack.value = 0.0005; // Very fast attack
    this.transientShaper.release.value = 0.02;

    // === REVERB ===
    this.convolver = this.audioContext.createConvolver();
    this.convolver.buffer = this.createImpulseResponse(1.5, 2.5);
    this.reverbWet.gain.value = 0;

    // === DELAY ===
    this.delayNode = this.audioContext.createDelay(1.0);
    this.delayNode.delayTime.value = 0.25;
    this.delayFeedback = this.audioContext.createGain();
    this.delayFeedback.gain.value = 0.3;
    this.delayWet.gain.value = 0;

    // Delay feedback loop
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // === CHORUS EFFECT ===
    this.chorusDelayL = this.audioContext.createDelay(0.1);
    this.chorusDelayR = this.audioContext.createDelay(0.1);
    this.chorusDelayL.delayTime.value = 0.025;
    this.chorusDelayR.delayTime.value = 0.027;
    this.chorusLFO = this.audioContext.createOscillator();
    this.chorusLFO.type = 'sine';
    this.chorusLFO.frequency.value = 0.5;
    this.chorusDepth = this.audioContext.createGain();
    this.chorusDepth.gain.value = 0.002;
    this.chorusWet = this.audioContext.createGain();
    this.chorusWet.gain.value = 0;
    this.chorusLFO.connect(this.chorusDepth);
    this.chorusDepth.connect(this.chorusDelayL.delayTime);
    this.chorusDepth.connect(this.chorusDelayR.delayTime);
    this.chorusLFO.start();

    // === FLANGER EFFECT ===
    this.flangerDelay = this.audioContext.createDelay(0.02);
    this.flangerDelay.delayTime.value = 0.005;
    this.flangerLFO = this.audioContext.createOscillator();
    this.flangerLFO.type = 'sine';
    this.flangerLFO.frequency.value = 0.25;
    this.flangerDepth = this.audioContext.createGain();
    this.flangerDepth.gain.value = 0.003;
    this.flangerFeedback = this.audioContext.createGain();
    this.flangerFeedback.gain.value = 0.5;
    this.flangerWet = this.audioContext.createGain();
    this.flangerWet.gain.value = 0;
    this.flangerLFO.connect(this.flangerDepth);
    this.flangerDepth.connect(this.flangerDelay.delayTime);
    this.flangerDelay.connect(this.flangerFeedback);
    this.flangerFeedback.connect(this.flangerDelay);
    this.flangerLFO.start();

    // === STEREO WIDENING ===
    this.stereoSplitter = this.audioContext.createChannelSplitter(2);
    this.stereoMerger = this.audioContext.createChannelMerger(2);
    this.stereoDelayL = this.audioContext.createDelay(0.05);
    this.stereoDelayR = this.audioContext.createDelay(0.05);
    this.stereoDelayL.delayTime.value = 0;
    this.stereoDelayR.delayTime.value = 0;
    
    // Mid/Side processing gains
    this.midGain = this.audioContext.createGain();
    this.midGain.gain.value = 1.0;
    this.sideGain = this.audioContext.createGain();
    this.sideGain.gain.value = 1.0;

    // === HARMONIC EXCITER ===
    this.exciterFilter = this.audioContext.createBiquadFilter();
    this.exciterFilter.type = 'highpass';
    this.exciterFilter.frequency.value = 3000;
    
    this.exciterDistortion = this.audioContext.createWaveShaper();
    this.exciterDistortion.curve = this.createExciterCurve();
    this.exciterDistortion.oversample = '2x';
    
    this.exciterGain = this.audioContext.createGain();
    this.exciterGain.gain.value = 0;

    // === ADVANCED HARMONIC PROCESSING ===
    // Tape saturation
    this.tapeSaturation = this.audioContext.createWaveShaper();
    this.tapeSaturation.curve = this.createTapeSaturationCurve();
    this.tapeSaturation.oversample = '4x';
    this.tapeSaturationGain = this.audioContext.createGain();
    this.tapeSaturationGain.gain.value = 0;

    // Tube warmth
    this.tubeWarmth = this.audioContext.createWaveShaper();
    this.tubeWarmth.curve = this.createTubeWarmthCurve();
    this.tubeWarmth.oversample = '4x';
    this.tubeWarmthGain = this.audioContext.createGain();
    this.tubeWarmthGain.gain.value = 0;

    // Sub-harmonic synthesizer
    this.subHarmonicSynth = this.audioContext.createWaveShaper();
    this.subHarmonicSynth.curve = this.createSubHarmonicCurve();
    this.subHarmonicSynth.oversample = '2x';
    this.subHarmonicGain = this.audioContext.createGain();
    this.subHarmonicGain.gain.value = 0;

    // Harmonic enhancer
    this.harmonicEnhancer = this.audioContext.createWaveShaper();
    this.harmonicEnhancer.curve = this.createHarmonicEnhancerCurve();
    this.harmonicEnhancer.oversample = '4x';
    this.harmonicEnhancerGain = this.audioContext.createGain();
    this.harmonicEnhancerGain.gain.value = 0;

    // === TRANSIENT PROCESSING ===
    this.transientAttackGain = this.audioContext.createGain();
    this.transientAttackGain.gain.value = 1.0;
    this.transientSustainGain = this.audioContext.createGain();
    this.transientSustainGain.gain.value = 1.0;
    this.transientEnvelope = this.audioContext.createGain();
    this.transientEnvelope.gain.value = 1.0;

    // === PSYCHOACOUSTIC PROCESSING ===
    // Low frequency loudness contour (Fletcher-Munson)
    this.psychoacousticLowBoost = this.audioContext.createBiquadFilter();
    this.psychoacousticLowBoost.type = 'lowshelf';
    this.psychoacousticLowBoost.frequency.value = 80;
    this.psychoacousticLowBoost.gain.value = 0;

    // High frequency presence
    this.psychoacousticHighBoost = this.audioContext.createBiquadFilter();
    this.psychoacousticHighBoost.type = 'peaking';
    this.psychoacousticHighBoost.frequency.value = 3500;
    this.psychoacousticHighBoost.Q.value = 0.5;
    this.psychoacousticHighBoost.gain.value = 0;

    // Overall loudness contour
    this.loudnessContour = this.audioContext.createBiquadFilter();
    this.loudnessContour.type = 'peaking';
    this.loudnessContour.frequency.value = 2500;
    this.loudnessContour.Q.value = 0.4;
    this.loudnessContour.gain.value = 0;
  }

  applySettings(settings: RemixSettings) {
    if (!this.audioContext) return;

    // Effect toggles (default to true for backward compatibility)
    const reverbOn = settings.reverbEnabled ?? true;
    const delayOn = settings.delayEnabled ?? true;
    const exciterOn = settings.exciterEnabled ?? true;
    const compressionOn = settings.compressionEnabled ?? true;

    // Calculate playback rate from tempo (assuming original is 120 BPM)
    this.playbackRate = settings.tempo / 120;

    // Apply to source if playing
    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = this.playbackRate;
    }

    const bassAmount = (settings.bass - 50) / 50; // -1 to 1
    const effectsAmount = settings.effects / 100; // 0 to 1
    const remasterIntensity = effectsAmount; // Use effects as remaster intensity

    // === EQ based on bass and effects ===
    if (this.subBassFilter) {
      this.subBassFilter.gain.value = bassAmount * 6; // Up to ±6dB
    }
    if (this.bassFilter) {
      this.bassFilter.gain.value = bassAmount * 8; // Up to ±8dB for punch
    }
    if (this.lowMidFilter) {
      // Cut muddiness more as effects increase
      this.lowMidFilter.gain.value = -1 - (effectsAmount * 2);
    }
    if (this.midFilter) {
      // Slight presence boost
      this.midFilter.gain.value = effectsAmount * 2;
    }
    if (this.highMidFilter) {
      // Presence and bite
      this.highMidFilter.gain.value = effectsAmount * 3;
    }
    if (this.highShelfFilter) {
      // Brightness scales with effects
      this.highShelfFilter.gain.value = effectsAmount * 4;
    }
    if (this.airFilter) {
      // Air/sparkle
      this.airFilter.gain.value = effectsAmount * 3;
    }

    // === ADVANCED REMASTERING EQ ===
    if (this.subHarmonicFilter) {
      // Deep bass resonance for powerful low end
      this.subHarmonicFilter.gain.value = remasterIntensity * 4 + bassAmount * 3;
    }
    if (this.presenceFilter) {
      // Vocal/lead presence enhancement
      this.presenceFilter.gain.value = remasterIntensity * 3.5;
    }
    if (this.brillianceFilter) {
      // Ultra-high shimmer and air
      this.brillianceFilter.gain.value = remasterIntensity * 2.5;
    }
    if (this.warmthFilter) {
      // Body and fullness - subtle warmth
      this.warmthFilter.gain.value = remasterIntensity * 2;
    }

    // === DYNAMICS (respects compressionOn toggle) ===
    if (this.compressor) {
      if (compressionOn) {
        this.compressor.threshold.value = -18 - (effectsAmount * 8);
        this.compressor.ratio.value = 3 + (effectsAmount * 2);
      } else {
        this.compressor.threshold.value = 0;
        this.compressor.ratio.value = 1;
      }
    }

    // === MULTIBAND COMPRESSION ===
    if (this.lowBandCompressor && compressionOn) {
      // Tighter bass control at higher intensity
      this.lowBandCompressor.threshold.value = -24 - (remasterIntensity * 6);
      this.lowBandCompressor.ratio.value = 4 + (remasterIntensity * 2);
    }
    if (this.midBandCompressor && compressionOn) {
      // Punch and sustain control
      this.midBandCompressor.threshold.value = -20 - (remasterIntensity * 5);
      this.midBandCompressor.ratio.value = 3 + (remasterIntensity * 1.5);
    }
    if (this.highBandCompressor && compressionOn) {
      // Sparkle control without harshness
      this.highBandCompressor.threshold.value = -22 - (remasterIntensity * 4);
      this.highBandCompressor.ratio.value = 2.5 + (remasterIntensity * 1);
    }

    // === TRANSIENT SHAPING (Beat Enhancement) ===
    if (this.transientShaper) {
      // Fast attack for transient enhancement
      this.transientShaper.threshold.value = -30 + (remasterIntensity * 10);
      this.transientShaper.attack.value = 0.0005;
      this.transientShaper.release.value = 0.02 + (remasterIntensity * 0.03);
    }
    if (this.transientAttackGain) {
      // Boost attack transients for punchier beats
      this.transientAttackGain.gain.value = 1.0 + (remasterIntensity * 0.3);
    }
    if (this.transientSustainGain) {
      // Control sustain for tighter sound
      this.transientSustainGain.gain.value = 1.0 - (remasterIntensity * 0.1);
    }

    // === REVERB (respects reverbOn toggle) ===
    if (this.reverbWet) {
      this.reverbWet.gain.value = reverbOn ? effectsAmount * 0.2 : 0;
    }

    // === DELAY (respects delayOn toggle) ===
    if (this.delayNode && this.delayWet && this.delayFeedback) {
      // Tempo-synced delay time (1/4 note at current tempo)
      const quarterNote = 60 / settings.tempo;
      this.delayNode.delayTime.value = Math.min(quarterNote, 0.5);
      this.delayFeedback.gain.value = delayOn ? 0.25 + (effectsAmount * 0.15) : 0;
      this.delayWet.gain.value = delayOn ? effectsAmount * 0.18 : 0;
    }

    // === CHORUS EFFECT ===
    if (this.chorusWet && this.chorusDepth) {
      this.chorusWet.gain.value = remasterIntensity * 0.15;
      this.chorusDepth.gain.value = 0.002 + (remasterIntensity * 0.001);
    }

    // === FLANGER EFFECT ===
    if (this.flangerWet && this.flangerFeedback) {
      this.flangerWet.gain.value = remasterIntensity * 0.08;
      this.flangerFeedback.gain.value = 0.4 + (remasterIntensity * 0.2);
    }

    // === STEREO WIDENING ===
    if (this.stereoDelayL && this.stereoDelayR) {
      // Subtle Haas effect for width
      const widthAmount = effectsAmount * 0.012; // Max 12ms
      this.stereoDelayL.delayTime.value = 0;
      this.stereoDelayR.delayTime.value = widthAmount;
    }
    if (this.midGain && this.sideGain) {
      // Mid/Side balance for stereo enhancement
      this.midGain.gain.value = 1.0 - (remasterIntensity * 0.05);
      this.sideGain.gain.value = 1.0 + (remasterIntensity * 0.2);
    }

    // === HARMONIC EXCITER (respects exciterOn toggle) ===
    if (this.exciterGain) {
      this.exciterGain.gain.value = exciterOn ? effectsAmount * 0.2 : 0;
    }

    // === ADVANCED HARMONIC PROCESSING ===
    // Tape saturation - warm analog character
    if (this.tapeSaturationGain) {
      this.tapeSaturationGain.gain.value = remasterIntensity * 0.25;
    }
    // Tube warmth - even harmonics for richness
    if (this.tubeWarmthGain) {
      this.tubeWarmthGain.gain.value = remasterIntensity * 0.2;
    }
    // Sub-harmonic synthesis - deep bass enhancement
    if (this.subHarmonicGain) {
      this.subHarmonicGain.gain.value = bassAmount > 0 ? bassAmount * remasterIntensity * 0.15 : 0;
    }
    // Harmonic enhancer - overall tonal richness
    if (this.harmonicEnhancerGain) {
      this.harmonicEnhancerGain.gain.value = remasterIntensity * 0.18;
    }

    // === PSYCHOACOUSTIC PROCESSING ===
    if (this.psychoacousticLowBoost) {
      // Fletcher-Munson low frequency compensation
      this.psychoacousticLowBoost.gain.value = remasterIntensity * 3;
    }
    if (this.psychoacousticHighBoost) {
      // Presence region enhancement
      this.psychoacousticHighBoost.gain.value = remasterIntensity * 2.5;
    }
    if (this.loudnessContour) {
      // Overall loudness perception enhancement
      this.loudnessContour.gain.value = remasterIntensity * 2;
    }

    // === OUTPUT GAIN ===
    if (this.gainNode) {
      // Compensate for added energy from processing
      const compensation = 1 - (effectsAmount * 0.15);
      this.gainNode.gain.value = compensation;
    }
  }

  play(settings: RemixSettings) {
    if (!this.audioContext || !this.audioBuffer) return;

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Stop existing source
    this.stop();

    // Setup fresh nodes
    this.setupNodes();

    // Create new source
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    // Apply settings
    this.applySettings(settings);

    // Build the comprehensive signal chain
    // Source -> EQ chain
    this.sourceNode.connect(this.subBassFilter!);
    this.subBassFilter!.connect(this.bassFilter!);
    this.bassFilter!.connect(this.lowMidFilter!);
    this.lowMidFilter!.connect(this.midFilter!);
    this.midFilter!.connect(this.highMidFilter!);
    this.highMidFilter!.connect(this.highShelfFilter!);
    this.highShelfFilter!.connect(this.airFilter!);

    // -> Advanced remastering EQ
    this.airFilter!.connect(this.subHarmonicFilter!);
    this.subHarmonicFilter!.connect(this.warmthFilter!);
    this.warmthFilter!.connect(this.presenceFilter!);
    this.presenceFilter!.connect(this.brillianceFilter!);

    // -> Multiband compression chain
    this.brillianceFilter!.connect(this.lowBandCompressor!);
    this.lowBandCompressor!.connect(this.midBandCompressor!);
    this.midBandCompressor!.connect(this.highBandCompressor!);

    // -> Main compressor
    this.highBandCompressor!.connect(this.compressor!);

    // -> Transient shaping
    this.compressor!.connect(this.transientShaper!);

    // -> Stereo processing
    this.transientShaper!.connect(this.stereoSplitter!);
    this.stereoSplitter!.connect(this.stereoDelayL!, 0);
    this.stereoSplitter!.connect(this.stereoDelayR!, 1);
    this.stereoDelayL!.connect(this.stereoMerger!, 0, 0);
    this.stereoDelayR!.connect(this.stereoMerger!, 0, 1);

    // Stereo -> Dry path
    this.stereoMerger!.connect(this.dryGain!);

    // Stereo -> Reverb wet path
    this.stereoMerger!.connect(this.convolver!);
    this.convolver!.connect(this.reverbWet!);

    // Stereo -> Delay wet path
    this.stereoMerger!.connect(this.delayNode!);
    this.delayNode!.connect(this.delayWet!);

    // Stereo -> Harmonic exciter path
    this.stereoMerger!.connect(this.exciterFilter!);
    this.exciterFilter!.connect(this.exciterDistortion!);
    this.exciterDistortion!.connect(this.exciterGain!);

    // Stereo -> Tape saturation path
    this.stereoMerger!.connect(this.tapeSaturation!);
    this.tapeSaturation!.connect(this.tapeSaturationGain!);

    // Stereo -> Tube warmth path
    this.stereoMerger!.connect(this.tubeWarmth!);
    this.tubeWarmth!.connect(this.tubeWarmthGain!);

    // Stereo -> Sub-harmonic synthesis path
    this.stereoMerger!.connect(this.subHarmonicSynth!);
    this.subHarmonicSynth!.connect(this.subHarmonicGain!);

    // Stereo -> Harmonic enhancer path
    this.stereoMerger!.connect(this.harmonicEnhancer!);
    this.harmonicEnhancer!.connect(this.harmonicEnhancerGain!);

    // Stereo -> Chorus path
    this.stereoMerger!.connect(this.chorusDelayL!);
    this.stereoMerger!.connect(this.chorusDelayR!);
    this.chorusDelayL!.connect(this.chorusWet!);
    this.chorusDelayR!.connect(this.chorusWet!);

    // Stereo -> Flanger path
    this.stereoMerger!.connect(this.flangerDelay!);
    this.flangerDelay!.connect(this.flangerWet!);

    // Mix all paths -> Psychoacoustic processing
    const mixBus = this.audioContext.createGain();
    mixBus.gain.value = 1.0;
    
    this.dryGain!.connect(mixBus);
    this.reverbWet!.connect(mixBus);
    this.delayWet!.connect(mixBus);
    this.exciterGain!.connect(mixBus);
    this.tapeSaturationGain!.connect(mixBus);
    this.tubeWarmthGain!.connect(mixBus);
    this.subHarmonicGain!.connect(mixBus);
    this.harmonicEnhancerGain!.connect(mixBus);
    this.chorusWet!.connect(mixBus);
    this.flangerWet!.connect(mixBus);

    // -> Psychoacoustic chain
    mixBus.connect(this.psychoacousticLowBoost!);
    this.psychoacousticLowBoost!.connect(this.psychoacousticHighBoost!);
    this.psychoacousticHighBoost!.connect(this.loudnessContour!);

    // -> Final output chain
    this.loudnessContour!.connect(this.gainNode!);
    this.gainNode!.connect(this.limiter!);
    this.limiter!.connect(this.analyser!);
    this.analyser!.connect(this.audioContext.destination);

    // Start playback
    const offset = this.pausedAt;
    this.sourceNode.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlaying = true;

    // Handle end of playback
    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pausedAt = 0;
        this.notifyStateChange();
      }
    };

    // Start animation loop
    this.startAnimationLoop();
    this.notifyStateChange();
  }

  pause() {
    if (!this.audioContext || !this.isPlaying) return;

    this.pausedAt = this.audioContext.currentTime - this.startTime;
    this.sourceNode?.stop();
    this.isPlaying = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.notifyStateChange();
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Source might already be stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.pausedAt = 0;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  seek(time: number) {
    this.pausedAt = time;
    if (this.isPlaying) {
      // Restart playback from new position
      const wasPlaying = this.isPlaying;
      this.stop();
      if (wasPlaying) {
        // We'll need settings to restart, so just update pausedAt for now
      }
    }
  }

  getAnalyserData(): number[] {
    if (!this.analyser) return Array(64).fill(20);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Convert to percentages and take subset
    const subset = Array.from(dataArray.slice(0, 64)).map(v => (v / 255) * 100);
    return subset;
  }

  private startAnimationLoop() {
    const update = () => {
      if (!this.isPlaying) return;
      this.notifyStateChange();
      this.animationFrameId = requestAnimationFrame(update);
    };
    update();
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: this.isPlaying,
        currentTime: this.getCurrentTime(),
        duration: this.audioBuffer?.duration || 0,
        waveformData: this.getAnalyserData(),
      });
    }
  }

  private getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) return this.pausedAt;
    return (this.audioContext.currentTime - this.startTime) * this.playbackRate;
  }

  setOnStateChange(callback: (state: AudioEngineState) => void) {
    this.onStateChange = callback;
  }

  getState(): AudioEngineState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.getCurrentTime(),
      duration: this.audioBuffer?.duration || 0,
      waveformData: this.getAnalyserData(),
    };
  }

  async exportAudio(settings: RemixSettings): Promise<Blob> {
    if (!this.audioBuffer) {
      throw new Error("No audio loaded");
    }

    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      this.audioBuffer.length,
      this.audioBuffer.sampleRate
    );

    const bassAmount = (settings.bass - 50) / 50;
    const effectsAmount = settings.effects / 100;
    const remasterIntensity = effectsAmount;

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.playbackRate.value = settings.tempo / 120;

    // === EQ CHAIN ===
    const subBassFilter = offlineContext.createBiquadFilter();
    subBassFilter.type = 'lowshelf';
    subBassFilter.frequency.value = 60;
    subBassFilter.gain.value = bassAmount * 6;

    const bassFilter = offlineContext.createBiquadFilter();
    bassFilter.type = 'peaking';
    bassFilter.frequency.value = 100;
    bassFilter.Q.value = 1.0;
    bassFilter.gain.value = bassAmount * 8;

    const lowMidFilter = offlineContext.createBiquadFilter();
    lowMidFilter.type = 'peaking';
    lowMidFilter.frequency.value = 350;
    lowMidFilter.Q.value = 1.0;
    lowMidFilter.gain.value = -1 - (effectsAmount * 2);

    const midFilter = offlineContext.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 0.8;
    midFilter.gain.value = effectsAmount * 2;

    const highMidFilter = offlineContext.createBiquadFilter();
    highMidFilter.type = 'peaking';
    highMidFilter.frequency.value = 3000;
    highMidFilter.Q.value = 1.0;
    highMidFilter.gain.value = effectsAmount * 3;

    const highShelfFilter = offlineContext.createBiquadFilter();
    highShelfFilter.type = 'highshelf';
    highShelfFilter.frequency.value = 4000;
    highShelfFilter.gain.value = effectsAmount * 4;

    const airFilter = offlineContext.createBiquadFilter();
    airFilter.type = 'highshelf';
    airFilter.frequency.value = 10000;
    airFilter.gain.value = effectsAmount * 3;

    // === ADVANCED REMASTERING EQ ===
    const subHarmonicFilter = offlineContext.createBiquadFilter();
    subHarmonicFilter.type = 'peaking';
    subHarmonicFilter.frequency.value = 30;
    subHarmonicFilter.Q.value = 2.0;
    subHarmonicFilter.gain.value = remasterIntensity * 4 + bassAmount * 3;

    const warmthFilter = offlineContext.createBiquadFilter();
    warmthFilter.type = 'peaking';
    warmthFilter.frequency.value = 280;
    warmthFilter.Q.value = 0.7;
    warmthFilter.gain.value = remasterIntensity * 2;

    const presenceFilter = offlineContext.createBiquadFilter();
    presenceFilter.type = 'peaking';
    presenceFilter.frequency.value = 4500;
    presenceFilter.Q.value = 1.2;
    presenceFilter.gain.value = remasterIntensity * 3.5;

    const brillianceFilter = offlineContext.createBiquadFilter();
    brillianceFilter.type = 'highshelf';
    brillianceFilter.frequency.value = 12000;
    brillianceFilter.gain.value = remasterIntensity * 2.5;

    // === MULTIBAND COMPRESSION ===
    const lowBandCompressor = offlineContext.createDynamicsCompressor();
    lowBandCompressor.threshold.value = -24 - (remasterIntensity * 6);
    lowBandCompressor.knee.value = 10;
    lowBandCompressor.ratio.value = 4 + (remasterIntensity * 2);
    lowBandCompressor.attack.value = 0.02;
    lowBandCompressor.release.value = 0.25;

    const midBandCompressor = offlineContext.createDynamicsCompressor();
    midBandCompressor.threshold.value = -20 - (remasterIntensity * 5);
    midBandCompressor.knee.value = 8;
    midBandCompressor.ratio.value = 3 + (remasterIntensity * 1.5);
    midBandCompressor.attack.value = 0.008;
    midBandCompressor.release.value = 0.12;

    const highBandCompressor = offlineContext.createDynamicsCompressor();
    highBandCompressor.threshold.value = -22 - (remasterIntensity * 4);
    highBandCompressor.knee.value = 6;
    highBandCompressor.ratio.value = 2.5 + remasterIntensity;
    highBandCompressor.attack.value = 0.003;
    highBandCompressor.release.value = 0.08;

    // === TRANSIENT SHAPER ===
    const transientShaper = offlineContext.createDynamicsCompressor();
    transientShaper.threshold.value = -30 + (remasterIntensity * 10);
    transientShaper.knee.value = 0;
    transientShaper.ratio.value = 8;
    transientShaper.attack.value = 0.0005;
    transientShaper.release.value = 0.02 + (remasterIntensity * 0.03);

    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -18 - (effectsAmount * 8);
    compressor.knee.value = 6;
    compressor.ratio.value = 3 + (effectsAmount * 2);
    compressor.attack.value = 0.005;
    compressor.release.value = 0.15;

    const limiter = offlineContext.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.05;

    const gainNode = offlineContext.createGain();
    gainNode.gain.value = 1 - (effectsAmount * 0.15);

    // === REVERB ===
    const convolver = offlineContext.createConvolver();
    const impulseLength = offlineContext.sampleRate * 1.5;
    const impulse = offlineContext.createBuffer(2, impulseLength, offlineContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2.5);
      }
    }
    convolver.buffer = impulse;

    const reverbWet = offlineContext.createGain();
    reverbWet.gain.value = effectsAmount * 0.15;

    const dryGain = offlineContext.createGain();
    dryGain.gain.value = 1;

    // === DELAY ===
    const delayNode = offlineContext.createDelay(1.0);
    const quarterNote = 60 / settings.tempo;
    delayNode.delayTime.value = Math.min(quarterNote, 0.5);

    const delayFeedback = offlineContext.createGain();
    delayFeedback.gain.value = 0.25 + (effectsAmount * 0.15);

    const delayWet = offlineContext.createGain();
    delayWet.gain.value = effectsAmount * 0.12;

    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    // === HARMONIC PROCESSING ===
    // Exciter
    const exciterFilter = offlineContext.createBiquadFilter();
    exciterFilter.type = 'highpass';
    exciterFilter.frequency.value = 3000;

    const exciterDistortion = offlineContext.createWaveShaper();
    const curveLength = 44100;
    const exciterCurve = new Float32Array(curveLength);
    for (let i = 0; i < curveLength; i++) {
      const x = (i * 2) / curveLength - 1;
      exciterCurve[i] = Math.tanh(x * 2) * 0.7 + x * 0.3;
    }
    exciterDistortion.curve = exciterCurve as Float32Array<ArrayBuffer>;
    exciterDistortion.oversample = '2x';

    const exciterGain = offlineContext.createGain();
    exciterGain.gain.value = effectsAmount * 0.15;

    // Tape saturation
    const tapeSaturation = offlineContext.createWaveShaper();
    const tapeCurve = new Float32Array(curveLength);
    for (let i = 0; i < curveLength; i++) {
      const x = (i * 2) / curveLength - 1;
      const k = 1.5;
      tapeCurve[i] = (1 + k) * x / (1 + k * Math.abs(x)) + 0.05 * Math.sin(x * Math.PI);
    }
    tapeSaturation.curve = tapeCurve as Float32Array<ArrayBuffer>;
    tapeSaturation.oversample = '4x';

    const tapeSaturationGain = offlineContext.createGain();
    tapeSaturationGain.gain.value = remasterIntensity * 0.25;

    // Tube warmth
    const tubeWarmth = offlineContext.createWaveShaper();
    const tubeCurve = new Float32Array(curveLength);
    for (let i = 0; i < curveLength; i++) {
      const x = (i * 2) / curveLength - 1;
      const tube = Math.tanh(x * 1.5);
      const h2 = 0.1 * Math.sin(2 * x * Math.PI);
      const h3 = 0.05 * Math.sin(3 * x * Math.PI);
      tubeCurve[i] = tube * 0.85 + h2 + h3;
    }
    tubeWarmth.curve = tubeCurve as Float32Array<ArrayBuffer>;
    tubeWarmth.oversample = '4x';

    const tubeWarmthGain = offlineContext.createGain();
    tubeWarmthGain.gain.value = remasterIntensity * 0.2;

    // Harmonic enhancer
    const harmonicEnhancer = offlineContext.createWaveShaper();
    const harmonicCurve = new Float32Array(curveLength);
    for (let i = 0; i < curveLength; i++) {
      const x = (i * 2) / curveLength - 1;
      const clean = x * 0.7;
      harmonicCurve[i] = clean + 0.15 * Math.sin(2 * x * Math.PI) + 0.08 * Math.sin(3 * x * Math.PI) + 0.04 * Math.sin(4 * x * Math.PI);
    }
    harmonicEnhancer.curve = harmonicCurve as Float32Array<ArrayBuffer>;
    harmonicEnhancer.oversample = '4x';

    const harmonicEnhancerGain = offlineContext.createGain();
    harmonicEnhancerGain.gain.value = remasterIntensity * 0.18;

    // === PSYCHOACOUSTIC PROCESSING ===
    const psychoacousticLowBoost = offlineContext.createBiquadFilter();
    psychoacousticLowBoost.type = 'lowshelf';
    psychoacousticLowBoost.frequency.value = 80;
    psychoacousticLowBoost.gain.value = remasterIntensity * 3;

    const psychoacousticHighBoost = offlineContext.createBiquadFilter();
    psychoacousticHighBoost.type = 'peaking';
    psychoacousticHighBoost.frequency.value = 3500;
    psychoacousticHighBoost.Q.value = 0.5;
    psychoacousticHighBoost.gain.value = remasterIntensity * 2.5;

    const loudnessContour = offlineContext.createBiquadFilter();
    loudnessContour.type = 'peaking';
    loudnessContour.frequency.value = 2500;
    loudnessContour.Q.value = 0.4;
    loudnessContour.gain.value = remasterIntensity * 2;

    // === CONNECT SIGNAL CHAIN ===
    // Source -> Basic EQ
    source.connect(subBassFilter);
    subBassFilter.connect(bassFilter);
    bassFilter.connect(lowMidFilter);
    lowMidFilter.connect(midFilter);
    midFilter.connect(highMidFilter);
    highMidFilter.connect(highShelfFilter);
    highShelfFilter.connect(airFilter);

    // -> Advanced Remastering EQ
    airFilter.connect(subHarmonicFilter);
    subHarmonicFilter.connect(warmthFilter);
    warmthFilter.connect(presenceFilter);
    presenceFilter.connect(brillianceFilter);

    // -> Multiband compression
    brillianceFilter.connect(lowBandCompressor);
    lowBandCompressor.connect(midBandCompressor);
    midBandCompressor.connect(highBandCompressor);

    // -> Compressor chain
    highBandCompressor.connect(compressor);
    compressor.connect(transientShaper);

    // Split to parallel processing paths
    transientShaper.connect(dryGain);
    transientShaper.connect(convolver);
    convolver.connect(reverbWet);
    transientShaper.connect(delayNode);
    delayNode.connect(delayWet);
    transientShaper.connect(exciterFilter);
    exciterFilter.connect(exciterDistortion);
    exciterDistortion.connect(exciterGain);
    transientShaper.connect(tapeSaturation);
    tapeSaturation.connect(tapeSaturationGain);
    transientShaper.connect(tubeWarmth);
    tubeWarmth.connect(tubeWarmthGain);
    transientShaper.connect(harmonicEnhancer);
    harmonicEnhancer.connect(harmonicEnhancerGain);

    // Mix all paths -> Psychoacoustic -> Output
    const mixBus = offlineContext.createGain();
    dryGain.connect(mixBus);
    reverbWet.connect(mixBus);
    delayWet.connect(mixBus);
    exciterGain.connect(mixBus);
    tapeSaturationGain.connect(mixBus);
    tubeWarmthGain.connect(mixBus);
    harmonicEnhancerGain.connect(mixBus);

    mixBus.connect(psychoacousticLowBoost);
    psychoacousticLowBoost.connect(psychoacousticHighBoost);
    psychoacousticHighBoost.connect(loudnessContour);
    loudnessContour.connect(gainNode);
    gainNode.connect(limiter);
    limiter.connect(offlineContext.destination);

    // Start and render
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();

    // Convert to WAV
    return this.audioBufferToWav(renderedBuffer);
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Interleave channels and write samples
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let engineInstance: AudioEngine | null = null;

export const getAudioEngine = (): AudioEngine => {
  if (!engineInstance) {
    engineInstance = new AudioEngine();
  }
  return engineInstance;
};
