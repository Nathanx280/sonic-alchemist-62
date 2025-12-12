import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { style, tempo, pitch, bass, effects, trackName, autoFeatures, mergeTracks, extractedBeats } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating ultra-intelligent remix for ${trackName} with style: ${style}`);
    console.log(`Auto features:`, autoFeatures);
    console.log(`Merge tracks:`, mergeTracks);
    console.log(`Extracted beats:`, extractedBeats ? 'Available' : 'Not available');

    const systemPrompt = `You are an ELITE AI DJ, Grammy-winning music producer, professional sound engineer, and audio mastering expert combined. You have 30+ years of experience at the highest levels of electronic music production, working with artists like Deadmau5, Skrillex, Daft Punk, and Tiësto.

YOUR EXPERTISE INCLUDES:
- Advanced digital signal processing (DSP) and psychoacoustics
- Professional mixing and mastering for major labels
- Sound design from first principles (FM synthesis, granular, wavetable, subtractive, additive)
- Music theory including harmonic analysis, chord progressions, tension/resolution
- Arrangement psychology and dancefloor dynamics
- Frequency spectrum management and phase coherence
- Stereo imaging and spatial audio design
- Dynamic range optimization and loudness maximization
- Genre-specific production techniques for ALL electronic music styles
- DJ performance integration and mixability optimization

YOUR REMIX PHILOSOPHY:
1. DECONSTRUCT: Analyze the source material's harmonic content, rhythmic patterns, melodic motifs, and emotional arc
2. REIMAGINE: Transform elements through the lens of the target genre while preserving the essence
3. RECONSTRUCT: Build a new arrangement with professional structure, energy management, and dancefloor appeal
4. POLISH: Apply mastering-grade processing for commercial release quality

ALWAYS respond with valid JSON in this EXACT expanded format:
{
  "remixName": "string - evocative, marketable name capturing the remix essence",
  "description": "string - 3-4 sentences describing the sonic transformation, target audience, and emotional journey",
  "genreAuthenticity": "string - specific subgenre classification with reference artists",
  
  "musicalAnalysis": {
    "detectedKey": "string - musical key (e.g., 'A minor', 'F# major')",
    "detectedScale": "string - scale type (natural minor, harmonic minor, dorian, etc.)",
    "chordProgression": ["array of chord symbols in the remix"],
    "harmonicDensity": 0-1,
    "melodicComplexity": 0-1,
    "rhythmicComplexity": 0-1,
    "suggestedCamelotKey": "string - Camelot wheel notation for DJ mixing",
    "compatibleKeys": ["array of harmonically compatible keys for layering"]
  },

  "arrangementStructure": {
    "totalDuration": seconds,
    "sections": [
      {
        "name": "string - Intro/Buildup/Drop/Breakdown/Verse/Bridge/Outro",
        "startTime": seconds,
        "duration": seconds,
        "energy": 0-1,
        "elements": ["active elements in this section"],
        "processingNotes": "string - specific processing for this section"
      }
    ],
    "phraseLength": bars,
    "barCount": number
  },

  "rhythmEngine": {
    "primaryBPM": number,
    "grooveTemplate": "string - straight/swing/shuffle/broken/polyrhythmic",
    "swingAmount": 0-100,
    "microTimingVariation": 0-100,
    "beatPattern": [16 numbers 0-1 representing kick pattern with velocity],
    "hiHatPattern": [16 numbers 0-1 for hi-hat groove with velocity],
    "snarePattern": [16 numbers 0-1 for snare/clap pattern],
    "percussionPattern": [16 numbers 0-1 for auxiliary percussion],
    "bassPattern": [16 numbers 0-1 for bass rhythm emphasis],
    "ghostNotes": {
      "enabled": boolean,
      "density": 0-1,
      "velocity": 0-1
    },
    "polyrhythms": [
      { "ratio": "string like 3:2", "element": "string", "intensity": 0-1 }
    ]
  },

  "frequencyManagement": {
    "subBass": { "range": "20-60Hz", "processing": "string", "sidechain": boolean },
    "bass": { "range": "60-250Hz", "processing": "string", "saturation": 0-1 },
    "lowMid": { "range": "250-500Hz", "processing": "string - usually cut for clarity" },
    "mid": { "range": "500-2kHz", "processing": "string" },
    "upperMid": { "range": "2-6kHz", "processing": "string - presence zone" },
    "high": { "range": "6-12kHz", "processing": "string - air and brilliance" },
    "airBand": { "range": "12-20kHz", "processing": "string - sparkle and shimmer" },
    "spectralBalance": "string - overall tonal character description",
    "frequencySlotting": [
      { "element": "string", "primaryRange": "string Hz range", "cutAt": "string Hz ranges to cut" }
    ]
  },

  "dynamicsProcessing": {
    "overallLUFS": number,
    "dynamicRange": number,
    "peakToLoudness": number,
    "compression": {
      "busCompression": { "ratio": number, "threshold": dB, "attack": ms, "release": ms, "knee": dB },
      "parallelCompression": { "blend": 0-1, "ratio": number, "character": "string - punchy/glue/transparent" },
      "multibandCompression": [
        { "band": "low/mid/high", "ratio": number, "threshold": dB, "attack": ms, "release": ms }
      ]
    },
    "limiting": {
      "ceiling": dB,
      "release": ms,
      "lookahead": ms,
      "character": "string - transparent/warm/aggressive"
    },
    "transientDesign": {
      "kickAttack": -100 to 100,
      "snareAttack": -100 to 100,
      "kickSustain": -100 to 100,
      "snareSustain": -100 to 100
    }
  },

  "spatialDesign": {
    "stereoWidth": { "low": 0-2, "mid": 0-2, "high": 0-2 },
    "stereoTechniques": ["array of techniques: mid-side, haas, microshifting, etc."],
    "depthLayers": [
      { "element": "string", "depth": "front/mid/back", "reverbSend": 0-1, "predelay": ms }
    ],
    "panorama": [
      { "element": "string", "position": -100 to 100, "automation": "static/lfo/random" }
    ],
    "monoCompatibility": "string - notes on mono fold-down",
    "surroundHints": "string - potential surround/Atmos expansion notes"
  },

  "effectsArchitecture": {
    "signalFlow": ["ordered array describing complete signal chain"],
    "reverbSettings": {
      "mainReverb": { "type": "plate/hall/room/spring/shimmer", "size": 0-1, "decay": seconds, "wet": 0-1, "predelay": ms, "damping": 0-1, "modulation": 0-1 },
      "sendReverbs": [
        { "name": "string", "type": "string", "settings": "string description" }
      ]
    },
    "delaySettings": {
      "mainDelay": { "type": "ping-pong/tape/digital/analog/granular", "time": "string - note value", "feedback": 0-1, "wet": 0-1, "filterLP": Hz, "filterHP": Hz, "saturation": 0-1 },
      "rhythmicDelays": [
        { "time": "string", "purpose": "string" }
      ]
    },
    "modulation": {
      "chorus": { "rate": Hz, "depth": 0-1, "wet": 0-1 },
      "flanger": { "rate": Hz, "depth": 0-1, "feedback": 0-1 },
      "phaser": { "rate": Hz, "stages": number, "feedback": 0-1 }
    },
    "distortion": {
      "type": "tube/tape/bitcrush/wavefold/overdrive/fuzz",
      "drive": 0-1,
      "mix": 0-1,
      "tone": 0-1
    },
    "filtering": {
      "mainFilter": { "type": "lowpass/highpass/bandpass/notch/comb/formant", "resonance": 0-1, "drive": 0-1 },
      "filterEnvelope": { "attack": ms, "decay": ms, "sustain": 0-1, "release": ms, "amount": -100 to 100 },
      "filterLFO": { "rate": Hz, "depth": 0-1, "shape": "sine/triangle/square/saw/random" }
    },
    "specialEffects": [
      { "name": "string", "parameters": "string description", "usage": "string - when/how to use" }
    ]
  },

  "sidechainMatrix": {
    "kickToBass": { "ratio": number, "attack": ms, "release": ms, "depth": 0-1 },
    "kickToPads": { "ratio": number, "attack": ms, "release": ms, "depth": 0-1 },
    "kickToSynths": { "ratio": number, "attack": ms, "release": ms, "depth": 0-1 },
    "vocalDucking": { "elements": ["array of ducked elements"], "depth": 0-1, "attack": ms, "release": ms },
    "pumping": { "style": "subtle/moderate/extreme/rhythmic", "character": "string description" }
  },

  "synthesizerLayers": [
    {
      "name": "string - layer name like Lead, Pad, Bass, Arp",
      "synthType": "string - supersaw/wavetable/FM/granular/subtractive/pluck/pad/lead",
      "oscillators": "string - osc configuration description",
      "filter": "string - filter type and settings",
      "envelope": "string - ADSR description",
      "modulation": "string - modulation routing",
      "effects": ["array of insert effects"],
      "role": "string - sonic role in the mix",
      "frequencyRange": "string - Hz range occupied"
    }
  ],

  "vocalProcessing": {
    "pitchCorrection": { "speed": "natural/medium/hard", "humanize": 0-1 },
    "pitchShift": semitones,
    "formantShift": semitones,
    "harmonizer": { "voices": number, "intervals": ["array of intervals"] },
    "vocoder": { "carrier": "string", "bands": number },
    "effects": {
      "chopping": { "enabled": boolean, "pattern": "string", "beatSync": boolean },
      "stutter": { "enabled": boolean, "rate": "string", "randomize": 0-1 },
      "reverse": { "enabled": boolean, "sections": ["array of reversed sections"] },
      "delay": { "enabled": boolean, "type": "string", "rhythmic": boolean },
      "reverb": { "enabled": boolean, "size": "string", "predelay": ms },
      "distortion": { "enabled": boolean, "type": "string", "amount": 0-1 },
      "telephone": { "enabled": boolean, "frequency": Hz },
      "doubling": { "enabled": boolean, "detuneAmount": cents, "timing": ms }
    },
    "automations": ["array of vocal parameter automations"]
  },

  "drumProcessing": {
    "kick": {
      "layering": "string - sub + click + body description",
      "tuning": Hz,
      "boost": dB,
      "compression": { "ratio": number, "attack": ms, "release": ms },
      "saturation": 0-1,
      "transientShaping": "string",
      "sidechain": "string - what it controls"
    },
    "snare": {
      "layering": "string - crack + body + room description",
      "tuning": Hz,
      "compression": { "ratio": number, "attack": ms, "release": ms },
      "reverb": { "type": "string", "decay": seconds, "predelay": ms },
      "parallel": "string - parallel processing description"
    },
    "hats": {
      "filtering": { "highpass": Hz, "lowpass": Hz },
      "stereoWidth": 0-2,
      "groove": "string - timing/feel description",
      "variations": number
    },
    "percussion": {
      "elements": ["array of percussion elements"],
      "panning": "string - stereo placement strategy",
      "processing": "string"
    },
    "drumBus": {
      "compression": "string",
      "saturation": "string",
      "eq": "string"
    }
  },

  "automationTimeline": [
    {
      "parameter": "string - full parameter path",
      "startValue": number,
      "endValue": number,
      "startTime": seconds,
      "duration": seconds,
      "curve": "linear/exponential/logarithmic/s-curve/step",
      "purpose": "string - what this automation achieves"
    }
  ],

  "transitionDesign": [
    {
      "type": "string - riser/impact/sweep/fill/silence/reverse/tape-stop/stutter/filter-sweep/white-noise/sub-drop/snare-roll/drum-fill",
      "time": seconds,
      "duration": seconds,
      "intensity": 0-1,
      "elements": ["array of elements involved"],
      "processing": "string - specific processing applied"
    }
  ],

  "energyProfile": {
    "overallArc": "string - description of energy journey",
    "sectionEnergies": [number array 0-1 for each section],
    "climaxPoints": [seconds array of peak energy moments],
    "tensionCurve": [8 numbers 0-1 representing tension across track],
    "releasePoints": [seconds array of tension release moments],
    "dancefloorAppeal": 0-10
  },

  "dropDesign": [
    {
      "time": seconds,
      "type": "string - main/mini/fake/double",
      "buildupDuration": seconds,
      "preSilence": ms,
      "impactElements": ["array of elements hitting at drop"],
      "filterReset": boolean,
      "bassEntry": "string - instant/swell/slide",
      "energyBoost": percentage,
      "specialEffects": ["array of impact effects"]
    }
  ],

  "buildupDesign": [
    {
      "time": seconds,
      "duration": seconds,
      "techniques": ["array of buildup techniques used"],
      "snareRoll": { "enabled": boolean, "startRate": "string", "endRate": "string", "pitchRise": boolean },
      "filterSweep": { "start": Hz, "end": Hz, "resonance": 0-1 },
      "whiteNoise": { "enabled": boolean, "swell": 0-1 },
      "pitchRiser": { "enabled": boolean, "semitones": number },
      "tensionElements": ["array of tension-building elements"]
    }
  ],

  "breakdownDesign": [
    {
      "time": seconds,
      "duration": seconds,
      "strippedElements": ["array of elements removed"],
      "maintainedElements": ["array of elements kept"],
      "atmosphere": "string - mood description",
      "processing": "string - breakdown-specific processing"
    }
  ],

  "mixdownNotes": {
    "headroom": dB,
    "gainStaging": "string - gain staging strategy",
    "problemFrequencies": ["array of frequencies to watch"],
    "referenceTrack": "string - suggested reference track",
    "mixingOrder": ["array of elements in suggested mixing order"],
    "criticalBalances": [
      { "element1": "string", "element2": "string", "relationship": "string" }
    ]
  },

  "masteringChain": [
    { "plugin": "string", "purpose": "string", "settings": "string" }
  ],

  "djIntegration": {
    "introType": "string - 32-bar/16-bar/8-bar/ambient",
    "outroType": "string - 32-bar/16-bar/8-bar/breakdown",
    "mixInPoint": seconds,
    "mixOutPoint": seconds,
    "energyMatch": "string - what tracks this mixes well with",
    "beatGridConfidence": 0-1,
    "cuePoints": [
      { "time": seconds, "label": "string", "color": "string" }
    ]
  },

  "recommendations": "string - 8-10 detailed professional tips for using, performing, and mixing this remix, including specific techniques and creative suggestions"
}

Be EXTREMELY thorough, creative, and genre-authentic. This should read like a professional studio session file from a top-tier producer. Every parameter should be intentional and interconnected.`;

    const styleDescriptions: Record<string, string> = {
      edm: `EUPHORIC EDM / BIG ROOM - Reference: Martin Garrix, Avicii, Swedish House Mafia, Tiësto
        - 126-132 BPM, 4/4 time signature, 8/16/32 bar phrases
        - Massive supersaw stacks (7+ voices, detuned 15-35 cents, spread 100%)
        - White noise risers with 12dB/octave highpass automation
        - Layered kick: sub (40-60Hz sine) + punch (100-200Hz) + click (2-4kHz transient)
        - Sidechain everything to kick (-6 to -12dB, 50ms attack, 200ms release)
        - FX: Long reverb tails (3-5s), ping-pong delays (1/8 dotted), stereo widening
        - Buildups: Snare roll acceleration, filter sweeps, pitch risers, pre-drop silence
        - Drops: Full frequency spectrum explosion, bass + supersaw + percussion + FX hits`,

      lofi: `LO-FI HIP HOP / CHILLHOP - Reference: Nujabes, J Dilla, Tomppabeats, idealism
        - 70-90 BPM, swing 55-70%, dusty vinyl texture throughout
        - Heavily sidechain-pumped Rhodes/EP with tape saturation
        - Vinyl crackle and tape hiss (-18 to -24dB constant)
        - Mellow jazz chord voicings (7ths, 9ths, 11ths, altered dominants)
        - SP-1200/MPC-style drums with bit reduction and lowpass at 8kHz
        - Pitched-down soul/jazz vocal samples with wow and flutter
        - Gentle sidechain (-3 to -6dB) for breathing rhythm
        - Heavy low-end roll-off below 30Hz, warm midrange saturation`,

      trap: `TRAP / 808 BASS - Reference: Metro Boomin, Lex Luger, TM88, Southside
        - 130-170 BPM (half-time feel at 65-85 BPM), triplet hi-hat flows
        - Massive 808 bass with sustain decay, pitch slides, distortion harmonics
        - Crisp trap hi-hats with triplet rolls, velocity variations, panning automation
        - Hard-hitting snares with heavy compression and plate reverb
        - Brass stabs and orchestra hits pitched for impact
        - Vocal chops: pitched, chopped, with autotune artifacts
        - Sparse arrangements with strategic element placement
        - Heavy low-end emphasis 40-100Hz, aggressive limiting`,

      house: `DEEP HOUSE / TECH HOUSE - Reference: Disclosure, Duke Dumont, Fisher, Chris Lake
        - 120-128 BPM, steady four-on-the-floor, groove-based
        - Rolling basslines with filter modulation and subtle pitch slides
        - Warm analog-style pads with long attack and release
        - Soulful vocal chops and spoken word samples
        - Shuffled hi-hats with 10-15% swing, ghost notes
        - Subtle sidechain pumping (-3 to -6dB) for groove
        - Deep reverb sends (hall reverb 2-3s decay)
        - Frequency focus: warm low-mids, smooth highs`,

      dubstep: `DUBSTEP / RIDDIM - Reference: Skrillex, Excision, Virtual Riot, SVDDEN DEATH
        - 140-150 BPM, half-time feel with syncopated rhythms
        - Massive wobble bass (LFO-controlled filters at 1/4 to 1/16 rates)
        - Aggressive FM growls with frequency modulation and waveshaping
        - Metallic screeches with formant filtering and ring modulation
        - Heavy snares with gated reverb and distortion
        - Extreme dynamic contrast between breakdown and drop
        - Layered bass: sub (pure sine 30-60Hz) + mid growl + high screech
        - Sidechain triggers from snare for rhythmic pumping`,

      dnb: `DRUM AND BASS / LIQUID - Reference: Netsky, Sub Focus, Pendulum, Wilkinson
        - 170-180 BPM, rolling breaks with Amen-style complexity
        - Reese bass with unison detuning, filter movement, stereo width
        - Chopped vocals with pitch shifting and time-stretching
        - Atmospheric pads with long reverb tails (4-6 seconds)
        - Complex drum patterns with ghost notes and layered breaks
        - Heavy compression on drum bus for glue
        - Energetic but melodic arrangements
        - Wide stereo field on highs, mono bass below 150Hz`,

      synthwave: `SYNTHWAVE / RETROWAVE - Reference: Kavinsky, The Midnight, Gunship, FM-84
        - 100-120 BPM, straight 4/4, driving rhythms
        - Analog-style arpeggios (Juno, Jupiter character)
        - Gated reverb snares with 80s character
        - Lush analog pads with slow attack and chorus
        - Neon-soaked leads with portamento and vibrato
        - Driving bass with octave jumps
        - Cinematic builds with orchestral elements
        - Heavy use of chorus, phaser, and plate reverb`,

      tropical: `TROPICAL HOUSE - Reference: Kygo, Thomas Jack, Sam Feldt, Lost Frequencies
        - 100-115 BPM, bouncy and uplifting feel
        - Steel drums, marimbas, pan flutes as lead elements
        - Bright plucks with fast attack and short decay
        - Airy pads with high frequency shimmer
        - Soft kicks with emphasis on mids, light sidechain
        - Beach-ready positive energy throughout
        - Natural reverbs and organic textures
        - Bright, open mix with emphasis on high-mids`,

      techno: `TECHNO / DARK TECHNO - Reference: Charlotte de Witte, Amelie Lens, Adam Beyer, Enrico Sangiuliano
        - 130-145 BPM, relentless driving rhythm
        - Hypnotic repetition with subtle evolution
        - Industrial textures and metallic percussion
        - Acid basslines with 303-style squelch
        - Modular synth textures with random modulation
        - Minimal but impactful arrangements
        - Dark, warehouse atmosphere
        - Heavy kick with long tail, punchy transient`,

      ambient: `AMBIENT / DOWNTEMPO - Reference: Brian Eno, Tycho, Boards of Canada, Bonobo
        - 60-100 BPM or beatless, free-flowing
        - Ethereal pads with granular processing
        - Spacious reverbs with infinite decay options
        - Subtle evolving drones with slow modulation
        - Field recordings and organic textures
        - Gentle rhythmic elements when present
        - Focus on atmosphere and emotion
        - Wide stereo field, immersive depth`,

      hardstyle: `HARDSTYLE / EUPHORIC HARDSTYLE - Reference: Headhunterz, Wildstylez, D-Block & S-te-Fan
        - 150-160 BPM, powerful and euphoric
        - Signature distorted kick with long pitch tail
        - Reverse bass with 180-degree phase relationship
        - Screeching leads with heavy distortion
        - Dramatic breakdowns with piano/orchestral elements
        - Pitched vocals with emotional lyrics
        - Festival anthem energy and crowd appeal
        - Extreme loudness with careful limiting`,

      future: `FUTURE BASS - Reference: Flume, ODESZA, San Holo, Illenium, Porter Robinson
        - 130-160 BPM, emotional and wobbly
        - Pitched vocal chops with heavy processing
        - Wobbly supersaws with LFO-controlled filters
        - Emotional chord progressions (major 7ths, add9)
        - Heavy compression for that squashed character
        - Lush reverbs with long tails
        - Sidechained pads creating breathing effect
        - Emphasis on emotion and melody over aggression`
    };

    const styleDesc = styleDescriptions[style] || styleDescriptions.edm;

    // Build auto features section with all 16 smart features
    const autoFeaturesEnabled = autoFeatures ? Object.entries(autoFeatures)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature) : [];
    
    const autoFeaturesText = autoFeaturesEnabled.length > 0 
      ? `\n═══════════════════════════════════════════════════════════════
SMART REMIX FEATURES ENABLED - APPLY THESE WITH PROFESSIONAL PRECISION:
═══════════════════════════════════════════════════════════════

${autoFeaturesEnabled.includes('autoEQ') ? `🎛️ AUTO EQ (SURGICAL FREQUENCY MANAGEMENT):
   - Perform full spectrum analysis, identify problem frequencies (muddy 200-400Hz, harsh 2-4kHz, boxy 400-800Hz)
   - Apply surgical cuts with narrow Q (6-12) on resonances
   - Boost presence (2-5kHz) and air (10-16kHz) with wide Q (0.5-1.5)
   - Create frequency slots for each element using complementary cuts/boosts
   - Apply high-pass filters: kick 30Hz, bass 35Hz, synths 80Hz, vocals 100Hz, hats 300Hz
   - Use dynamic EQ for frequency-dependent compression on problem areas
   - Reference against commercial tracks in same genre` : ''}

${autoFeaturesEnabled.includes('autoBass') ? `🔊 AUTO BASS (LOW-END MASTERY):
   - Layer sub-bass (pure sine 30-60Hz) with mid-bass (saturated 60-150Hz) and top-bass (harmonics 150-300Hz)
   - Apply multiband saturation: gentle on sub, heavy on mids, light on top
   - Use sidechain compression from kick: -6 to -12dB, 5ms attack, 150-200ms release
   - Add subtle pitch modulation/vibrato for movement (0.5-2Hz rate, 5-15 cents depth)
   - Implement bass glide/portamento on note transitions (50-150ms)
   - Ensure mono compatibility below 150Hz with stereo widening above
   - Apply limiting on bass bus to control peaks while maintaining punch` : ''}

${autoFeaturesEnabled.includes('autoEffects') ? `✨ AUTO EFFECTS (CREATIVE SOUND DESIGN):
   - White noise risers: 4-16 bars, 12dB/oct highpass sweep from 200Hz to 12kHz
   - Impact samples: layered sub-drop + reverb hit + vinyl scratch at drops
   - Filter sweeps: tempo-synced lowpass/highpass with resonance automation
   - Stutter edits: beat-repeat at 1/16, 1/32, 1/64 rates with decay
   - Granular textures: freeze moments, time-stretch artifacts, pitch-shifted clouds
   - Tape stop effects: pitch dive with wow/flutter at transitions
   - Glitch processing: buffer repeat, bitcrush sweeps, sample-rate reduction
   - Atmospheric textures: convolution reverbs, shimmer delays, spectral freezing` : ''}

${autoFeaturesEnabled.includes('autoMaster') ? `🏆 AUTO MASTER (RELEASE-READY PROCESSING):
   - Gain staging: -6dB headroom on mix bus before mastering chain
   - EQ: gentle low-end tilt (+1-2dB below 100Hz), presence boost (+1dB at 3kHz), air (+2dB at 12kHz)
   - Multiband compression: control low-end (2:1), glue mids (1.5:1), tame highs (1.5:1)
   - Stereo imaging: narrow below 150Hz, widen 2-8kHz by 10-20%
   - Harmonic excitement: add subtle harmonics to bass (2nd) and highs (odd harmonics)
   - Limiting: -0.3dB ceiling, 150ms release, 5ms lookahead for transparency
   - Target loudness: -8 to -6 LUFS integrated for streaming, -3 to -1 LUFS for club
   - Check mono compatibility, reference against genre leaders` : ''}

${autoFeaturesEnabled.includes('autoDrop') ? `💥 AUTO DROP (MAXIMUM IMPACT ENGINEERING):
   - Create 4-8 strategic drop points with varying intensity levels
   - Pre-drop processing: 1-2 bar silence, filter fully closed, all elements muted
   - Impact layering: sub-drop (pitched 808 hit) + reverb crash + white noise burst + distorted hit
   - Bass entry: instant full-frequency bass explosion OR 1-bar pitch slide up
   - Synth explosion: full supersaw stack with filter fully open, maximum voices
   - Drum fill leading into drop: snare roll accelerating from 1/4 to 1/64 notes
   - Post-drop: immediately introduce all high-energy elements simultaneously
   - Energy spike: drop sections should be 20-30% louder than buildups` : ''}

${autoFeaturesEnabled.includes('autoTransition') ? `🔄 AUTO TRANSITION (DJ-QUALITY SEGUES):
   - Filter sweeps: 4-8 bar lowpass from 12kHz to 200Hz (or reverse for energy lift)
   - Drum fills: genre-appropriate fills using toms, snares, cymbals (1-2 bars)
   - Tape stops: pitch dive from normal to -12 semitones over 0.5-2 seconds
   - Reverse reverb: bounce element to reverb, reverse, align tail to transition point
   - Beat repeat: 1/8 to 1/32 stutter on last beat before transition
   - White noise: burst (short) for energy, swell (long) for buildup
   - Volume automation: subtle dips (-2 to -4dB) before lifts
   - Arrangement pauses: brief silence (250-500ms) before major section changes` : ''}

${autoFeaturesEnabled.includes('autoBuild') ? `📈 AUTO BUILD (TENSION ARCHITECTURE):
   - Duration: 8-32 bars depending on genre and drop intensity
   - Snare roll: start at 1/4 notes, accelerate to 1/8, 1/16, 1/32, end on 1/64
   - Pitch automation: all melodic elements rise 1-4 semitones over buildup
   - Filter automation: lowpass opens from 400Hz to 12kHz, resonance peak at end
   - Volume swell: overall level increases 3-6dB, driven by white noise layer
   - High-frequency addition: introduce shimmering highs, cymbals, risers
   - Bass dropout: remove sub-bass 2-4 bars before drop for contrast
   - Sidechain intensification: increase depth from 3dB to 12dB through buildup
   - Rhythmic intensification: double hi-hat rate, add percussion layers` : ''}

${autoFeaturesEnabled.includes('autoChop') ? `✂️ AUTO CHOP (RHYTHMIC SLICING):
   - Intelligent slice points: detect transients and zero-crossings for clean cuts
   - Beat-synced chopping: align chops to 1/4, 1/8, 1/16, 1/32 grid with swing
   - Glitch patterns: random slice reordering, reverse sections, micro-loops
   - Stutter effects: repeat 1/16 to 1/64 notes with pitch/filter decay
   - Vocal chopping: isolate syllables, rearrange melodically, layer harmonies
   - Granular processing: freeze moments, create textures from slices
   - Pattern variations: create 4-8 chop patterns, alternate throughout track
   - Fill generation: drum fill variations using chopped elements` : ''}

${autoFeaturesEnabled.includes('autoTempoMatch') ? `⏱️ TEMPO MATCH (TIMING INTELLIGENCE):
   - Detect source BPM using transient analysis and autocorrelation
   - Calculate optimal target BPM for selected genre (±10% of genre standard)
   - Time-stretch algorithm: elastique for quality, repitch for artifacts as effect
   - Preserve transient sharpness: use transient-preserving stretch modes
   - Handle tempo changes: create automation curves for gradual BPM shifts
   - Quantize to grid: align beats while preserving micro-timing groove
   - Half-time / double-time suggestions based on genre conventions
   - Cross-reference with Camelot wheel for harmonic mixing compatibility` : ''}

${autoFeaturesEnabled.includes('autoKeyDetect') ? `🎵 KEY DETECT (HARMONIC INTELLIGENCE):
   - Analyze harmonic content using FFT and chromagram analysis
   - Identify root note, scale type (major/minor/modal), and chord progression
   - Suggest Camelot key for DJ mixing compatibility
   - List harmonically compatible keys for layering (±1, ±7 in Camelot)
   - Recommend pitch shifts that maintain harmonic integrity
   - Suggest chord substitutions for added tension/color
   - Identify key changes in source material
   - Match synth layers and vocal harmonies to detected key` : ''}

${autoFeaturesEnabled.includes('autoBeatGrid') ? `📊 BEAT GRID (RHYTHM ALIGNMENT):
   - Detect all transients and classify (kick, snare, hat, perc)
   - Build accurate beat grid with downbeat detection
   - Apply quantization with humanization (5-15% random timing variation)
   - Identify and preserve intentional timing variations (swing, push/pull)
   - Align elements to 1/4, 1/8, 1/16, 1/32 subdivisions as appropriate
   - Create polyrhythmic opportunities (3 against 2, 4 against 3)
   - Generate groove template that can be applied to other elements
   - Handle tempo fluctuations in live-recorded source material` : ''}

${autoFeaturesEnabled.includes('autoGroove') ? `🕺 AUTO GROOVE (FEEL ENGINEERING):
   - Apply genre-appropriate swing (house: 54-58%, trap: 50%, dnb: 52%)
   - Add micro-timing variations for human feel (±10-30ms random)
   - Ghost note generation: soft hits between main beats (velocity 30-50%)
   - Velocity humanization: ±15% random variation with accent patterns
   - Groove templates: apply MPC, SP-1200, or custom groove maps
   - Hat groove: leading or lagging against grid for push/pull feel
   - Kick/snare relationship: lock or slight push for energy
   - Create breathing rhythm through coordinated sidechain and timing` : ''}

${autoFeaturesEnabled.includes('autoVocalIsolate') ? `🎤 VOCAL ISOLATE (AI SEPARATION):
   - Separate vocals from instrumental using neural network processing
   - Clean up artifacts and phase issues from separation
   - Process vocal independently: EQ, compression, de-essing, limiting
   - Create vocal chops: syllable isolation, melodic rearrangement
   - Pitch effects: autotune (hard or natural), pitch shifting, harmonization
   - Time effects: vocal stutter, reverse, delay throws, tempo-sync slicing
   - Layer processing: parallel saturation, exciter, stereo widening
   - Blend controls: adjust wet/dry of isolated vs. original vocal treatment` : ''}

${autoFeaturesEnabled.includes('autoStemSplit') ? `🎚️ STEM SPLIT (ELEMENT SEPARATION):
   - Separate into 4-5 stems: drums, bass, vocals, melody/synths, other
   - Process each stem independently with genre-appropriate treatment
   - Re-balance stems for remix (typically: boost drums +2dB, cut original bass)
   - Apply different sidechain relationships between new stems
   - Filter/EQ each stem to create space for new elements
   - Ability to mute/solo any original stem in the remix
   - Time-stretch stems independently for creative effects
   - Re-arrange stems to create new structure from original elements` : ''}

${autoFeaturesEnabled.includes('autoSidechain') ? `⬇️ AUTO SIDECHAIN (DYNAMIC PUMPING):
   - Kick-triggered sidechain on all sustained elements (bass, pads, synths)
   - Settings: -6 to -12dB reduction, 1-10ms attack, 100-300ms release
   - Shape variations: hard pump, soft pump, breathing, rhythmic gate
   - Frequency-selective sidechain: duck only low-mids/bass frequencies
   - Multi-source triggering: from kick and/or snare with different depths
   - Ghost trigger: create sidechain pump without audible kick
   - Automation: increase sidechain depth during buildups, release at breakdowns
   - Tempo-sync release: calculate release time based on BPM for musical pumping` : ''}

${autoFeaturesEnabled.includes('autoHarmonize') ? `🎶 AUTO HARMONIZE (HARMONIC EXPANSION):
   - Add parallel harmonies: thirds, fifths, octaves above/below melodies
   - Create chord stacks from single notes using detected key
   - Counter-melody generation: complementary melodic lines
   - Bass harmonics: add upper harmonics for presence on small speakers
   - Pad layering: additional harmonic support following chord changes
   - Vocal harmonization: 2-4 voice harmony following genre conventions
   - Tension notes: add 7ths, 9ths, 11ths for color at appropriate moments
   - Resolution control: ensure harmonic movements resolve appropriately` : ''}
` 
      : '';

    // Build merge tracks section
    const mergeTracksText = mergeTracks && mergeTracks.length > 0
      ? `\n═══════════════════════════════════════════════════════════════
MULTI-TRACK MASHUP ENGINEERING:
═══════════════════════════════════════════════════════════════
${mergeTracks.map((t: any, i: number) => `
Track ${i + 1}: "${t.name}"
   - Volume: ${t.volume}%
   - Start offset: ${t.startOffset}s
   - Role in mix: ${i === 0 ? 'Primary/Foundation' : 'Secondary/Layer'}`).join('\n')}

MASHUP REQUIREMENTS:
- Analyze each track for key, BPM, and energy compatibility
- Apply key matching: pitch-shift secondary tracks to match primary's key (or harmonic equivalent)
- Tempo-match all tracks to a unified BPM (typically the primary track's BPM)
- Frequency slot each track: assign primary frequency ranges to avoid masking
- Create call-and-response: alternate prominent elements between tracks
- Design crossover points: smooth transitions when switching focus between tracks
- Layer strategically: combine compatible elements (e.g., one track's vocals + another's instrumental)
- EQ carving: cut conflicting frequencies in each track to create space
- Stereo placement: pan different track elements for width and separation
- Dynamic blending: automate volume crossfades between track elements
- Create unique sections: parts that combine elements from all tracks simultaneously
- Ensure the mashup tells a cohesive story despite multiple sources`
      : '';

    // Build extracted beats section
    const extractedBeatsText = extractedBeats ? `
═══════════════════════════════════════════════════════════════
EXTRACTED BEAT DATA FROM SOURCE TRACK - USE THIS FOR PROFESSIONAL REMIXING:
═══════════════════════════════════════════════════════════════
• Detected BPM: ${extractedBeats.detectedBPM} (${Math.round(extractedBeats.confidence * 100)}% confidence)
• Detected Key: ${extractedBeats.detectedKey}
• Beat Count: ${extractedBeats.beatPositions?.length || 0} beats found
• Sections Detected: ${extractedBeats.sections?.map((s: any) => `${s.type} (${Math.round(s.start)}s-${Math.round(s.end)}s)`).join(', ') || 'None'}

EXTRACTED DRUM PATTERN (use this as foundation for remix):
- Kick Pattern: [${extractedBeats.drumPattern?.[0]?.join(', ') || 'N/A'}]
- Snare Pattern: [${extractedBeats.drumPattern?.[1]?.join(', ') || 'N/A'}]
- HiHat Pattern: [${extractedBeats.drumPattern?.[2]?.join(', ') || 'N/A'}]
- Clap Pattern: [${extractedBeats.drumPattern?.[3]?.join(', ') || 'N/A'}]

ENERGY PROFILE: [${extractedBeats.energyProfile?.map((e: number) => Math.round(e * 100)).join(', ') || 'N/A'}]

REMIX INSTRUCTIONS:
- Base new beat patterns on the extracted drum pattern above
- Enhance and transform the original rhythm while maintaining groove
- Use detected key for all harmonic elements
- Match remix energy profile to source track sections
- Layer new sounds ON TOP of the extracted beat foundation
` : '';

    const userPrompt = `═══════════════════════════════════════════════════════════════
CREATE AN ULTRA-PROFESSIONAL ${style.toUpperCase()} REMIX
═══════════════════════════════════════════════════════════════

TRACK: "${trackName}"
GENRE: ${styleDesc}
${extractedBeatsText}
${autoFeaturesText}
${mergeTracksText}

STARTING PARAMETERS (optimize these for maximum impact):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Base Tempo: ${tempo} BPM (suggest optimal tempo and tempo automations)
• Pitch Shift: ${pitch} semitones (adjust for key compatibility if needed)
• Bass Boost: ${bass}% (design complete low-end architecture)
• FX Intensity: ${effects}% (apply effect depth accordingly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCTION MANDATE - THIS MUST BE:
═══════════════════════════════════════════════════════════════

1. MUSICALLY INTELLIGENT
   - Full harmonic analysis with key, scale, and chord progression
   - Arrangement structure with defined sections and energy arc
   - Genre-authentic compositional elements

2. SONICALLY PRISTINE
   - Professional frequency management with surgical precision
   - Dynamic processing that breathes while maintaining power
   - Spatial design that creates immersive depth and width

3. RHYTHMICALLY COMPELLING
   - Complex groove patterns with micro-timing humanization
   - Polyrhythmic elements where genre-appropriate
   - Ghost notes, swing, and feel that makes people move

4. EMOTIONALLY IMPACTFUL
   - Energy arc that takes listeners on a journey
   - Strategic tension and release throughout
   - Drops that deliver maximum satisfaction

5. MIXDOWN READY
   - Proper gain staging and headroom management
   - Frequency slotting that eliminates masking
   - Professional mastering chain recommendations

6. DJ INTEGRATION OPTIMIZED
   - Clean intro/outro for mixing
   - Clear phrase structure and mix points
   - Camelot-compatible key suggestions

TECHNICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Minimum 5 synthesizer layers with complete specs
✓ Minimum 12 automations with curves and purposes
✓ Minimum 8 transition points with full specifications
✓ Minimum 4 drops with complete impact design
✓ Minimum 3 buildups with full technique breakdowns
✓ Complete drum processing for each element
✓ Full effects architecture with signal flow
✓ Comprehensive vocal processing chain
✓ Professional mastering chain recommendations
✓ 8-10 detailed DJ/producer recommendations

THIS SHOULD BE INDISTINGUISHABLE FROM A TOP-TIER STUDIO PRODUCTION.
MAKE IT LEGENDARY. MAKE IT UNFORGETTABLE. MAKE IT PERFECT.`;

    console.log("Sending ultra-intelligent remix request to AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response received, parsing ultra-intelligent remix data...");

    // Parse the JSON response
    let remixData;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      remixData = JSON.parse(jsonStr);
      console.log("Successfully parsed ultra-intelligent remix data");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Provide comprehensive default remix data if parsing fails
      remixData = {
        remixName: `${trackName} (${style.charAt(0).toUpperCase() + style.slice(1)} Remix)`,
        description: `An intense ${style} transformation featuring layered effects, dynamic buildups, and genre-authentic sound design crafted with professional precision.`,
        genreAuthenticity: `${style.charAt(0).toUpperCase() + style.slice(1)} - Reference: Top producers in the genre`,
        musicalAnalysis: {
          detectedKey: "A minor",
          detectedScale: "Natural minor",
          chordProgression: ["Am", "F", "C", "G"],
          harmonicDensity: 0.7,
          melodicComplexity: 0.6,
          rhythmicComplexity: 0.7,
          suggestedCamelotKey: "8A",
          compatibleKeys: ["7A", "9A", "8B", "5A"]
        },
        arrangementStructure: {
          totalDuration: 210,
          sections: [
            { name: "Intro", startTime: 0, duration: 16, energy: 0.3, elements: ["drums", "atmospherics"], processingNotes: "Filtered, building tension" },
            { name: "Buildup 1", startTime: 16, duration: 16, energy: 0.6, elements: ["snare roll", "synths", "riser"], processingNotes: "Opening filter, rising pitch" },
            { name: "Drop 1", startTime: 32, duration: 32, energy: 1.0, elements: ["full drums", "bass", "lead", "fx"], processingNotes: "Full energy, sidechained" },
            { name: "Breakdown", startTime: 64, duration: 16, energy: 0.4, elements: ["pads", "vocal chops"], processingNotes: "Stripped back, emotional" },
            { name: "Buildup 2", startTime: 80, duration: 16, energy: 0.7, elements: ["snare roll", "synths", "riser"], processingNotes: "More intense than first buildup" },
            { name: "Drop 2", startTime: 96, duration: 32, energy: 1.0, elements: ["full drums", "bass", "lead", "fx", "vocal"], processingNotes: "Maximum energy" },
            { name: "Outro", startTime: 128, duration: 16, energy: 0.3, elements: ["drums", "atmospherics"], processingNotes: "Filtered fadeout" }
          ],
          phraseLength: 8,
          barCount: 56
        },
        rhythmEngine: {
          primaryBPM: tempo,
          grooveTemplate: "straight",
          swingAmount: 0,
          microTimingVariation: 10,
          beatPattern: [1, 0, 0.3, 0, 0.9, 0, 0.4, 0, 1, 0, 0.3, 0, 0.9, 0, 0.5, 0],
          hiHatPattern: [0.6, 0.8, 0.6, 0.9, 0.6, 0.8, 0.6, 1, 0.6, 0.8, 0.6, 0.9, 0.6, 0.8, 0.7, 1],
          snarePattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.3],
          percussionPattern: [0, 0.4, 0.3, 0.5, 0, 0.4, 0.3, 0.6, 0, 0.4, 0.3, 0.5, 0, 0.4, 0.5, 0.7],
          bassPattern: [1, 0, 0.3, 0, 0.8, 0, 0.4, 0.2, 1, 0, 0.3, 0, 0.9, 0, 0.5, 0.3],
          ghostNotes: { enabled: true, density: 0.3, velocity: 0.4 },
          polyrhythms: []
        },
        frequencyManagement: {
          subBass: { range: "20-60Hz", processing: "Clean sine, sidechained to kick", sidechain: true },
          bass: { range: "60-250Hz", processing: "Saturated for harmonics, carved at 200Hz", saturation: 0.4 },
          lowMid: { range: "250-500Hz", processing: "Cut 3dB at 350Hz for clarity", },
          mid: { range: "500-2kHz", processing: "Controlled, space for vocals and leads" },
          upperMid: { range: "2-6kHz", processing: "Presence boost at 3kHz for leads" },
          high: { range: "6-12kHz", processing: "Crisp hats and cymbals, de-essed" },
          airBand: { range: "12-20kHz", processing: "Gentle shelf boost for shimmer" },
          spectralBalance: "Warm low-end, clear mids, sparkling highs",
          frequencySlotting: [
            { element: "Kick", primaryRange: "50-100Hz", cutAt: "250-400Hz" },
            { element: "Bass", primaryRange: "60-200Hz", cutAt: "100Hz (ducked by kick)" },
            { element: "Snare", primaryRange: "200-400Hz, 2-5kHz", cutAt: "below 100Hz" }
          ]
        },
        dynamicsProcessing: {
          overallLUFS: -8,
          dynamicRange: 8,
          peakToLoudness: 2,
          compression: {
            busCompression: { ratio: 2, threshold: -12, attack: 30, release: 100, knee: 6 },
            parallelCompression: { blend: 0.3, ratio: 8, character: "punchy" },
            multibandCompression: [
              { band: "low", ratio: 2, threshold: -15, attack: 20, release: 150 },
              { band: "mid", ratio: 1.5, threshold: -18, attack: 10, release: 80 },
              { band: "high", ratio: 1.5, threshold: -20, attack: 5, release: 50 }
            ]
          },
          limiting: { ceiling: -0.3, release: 150, lookahead: 5, character: "transparent" },
          transientDesign: { kickAttack: 20, snareAttack: 15, kickSustain: -10, snareSustain: 5 }
        },
        spatialDesign: {
          stereoWidth: { low: 0.8, mid: 1.1, high: 1.4 },
          stereoTechniques: ["mid-side EQ", "haas effect on leads", "microshifting on pads"],
          depthLayers: [
            { element: "Kick", depth: "front", reverbSend: 0.05, predelay: 0 },
            { element: "Lead", depth: "mid", reverbSend: 0.2, predelay: 20 },
            { element: "Pads", depth: "back", reverbSend: 0.4, predelay: 40 }
          ],
          panorama: [
            { element: "Hi-hats", position: 25, automation: "static" },
            { element: "Percussion", position: -30, automation: "lfo" }
          ],
          monoCompatibility: "Good - bass and kick centered, width added above 200Hz",
          surroundHints: "Pads could extend to rears, height channel for risers"
        },
        effectsArchitecture: {
          signalFlow: ["High-pass filter", "EQ", "Compression", "Saturation", "Stereo widening", "Reverb send", "Delay send", "Bus compression", "Limiter"],
          reverbSettings: {
            mainReverb: { type: "hall", size: 0.7, decay: 2.5, wet: 0.25, predelay: 20, damping: 0.6, modulation: 0.3 },
            sendReverbs: [
              { name: "Snare plate", type: "plate", settings: "1.5s decay, bright, 30ms predelay" },
              { name: "Vocal hall", type: "hall", settings: "3s decay, warm, 50ms predelay" }
            ]
          },
          delaySettings: {
            mainDelay: { type: "ping-pong", time: "1/8 dotted", feedback: 0.35, wet: 0.2, filterLP: 8000, filterHP: 200, saturation: 0.2 },
            rhythmicDelays: [
              { time: "1/16", purpose: "rhythmic texture on leads" },
              { time: "1/4", purpose: "spacious throws on vocals" }
            ]
          },
          modulation: {
            chorus: { rate: 0.5, depth: 0.4, wet: 0.2 },
            flanger: { rate: 0.2, depth: 0.3, feedback: 0.5 },
            phaser: { rate: 0.3, stages: 6, feedback: 0.4 }
          },
          distortion: { type: "tube", drive: 0.3, mix: 0.15, tone: 0.6 },
          filtering: {
            mainFilter: { type: "lowpass", resonance: 0.4, drive: 0.2 },
            filterEnvelope: { attack: 10, decay: 200, sustain: 0.5, release: 300, amount: 50 },
            filterLFO: { rate: 0.25, depth: 0.3, shape: "sine" }
          },
          specialEffects: [
            { name: "Sidechain pump", parameters: "4:1 ratio, 5ms attack, 200ms release", usage: "On all sustained elements" },
            { name: "Tape saturation", parameters: "Subtle warmth, 10% drive", usage: "On master bus" }
          ]
        },
        sidechainMatrix: {
          kickToBass: { ratio: 4, attack: 5, release: 200, depth: 0.7 },
          kickToPads: { ratio: 3, attack: 10, release: 250, depth: 0.5 },
          kickToSynths: { ratio: 2, attack: 15, release: 200, depth: 0.4 },
          vocalDucking: { elements: ["pads", "leads"], depth: 0.3, attack: 20, release: 150 },
          pumping: { style: "moderate", character: "Rhythmic breathing that enhances groove" }
        },
        synthesizerLayers: [
          { name: "Main Lead", synthType: "supersaw", oscillators: "7 saws, 25 cent detune", filter: "LP 24dB, cutoff 8kHz", envelope: "Fast attack, medium release", modulation: "LFO to filter cutoff", effects: ["reverb", "delay"], role: "Main melodic hook", frequencyRange: "500Hz-8kHz" },
          { name: "Sub Bass", synthType: "subtractive", oscillators: "Pure sine", filter: "LP 24dB, cutoff 100Hz", envelope: "Medium attack, long release", modulation: "Sidechain from kick", effects: ["saturation"], role: "Low-end foundation", frequencyRange: "30-80Hz" },
          { name: "Pads", synthType: "pad", oscillators: "2 saws + 1 square, detuned", filter: "LP 12dB, cutoff 4kHz", envelope: "Slow attack, long release", modulation: "LFO to volume", effects: ["reverb", "chorus"], role: "Harmonic bed", frequencyRange: "200Hz-6kHz" },
          { name: "Pluck", synthType: "pluck", oscillators: "Wavetable", filter: "LP with envelope", envelope: "Instant attack, fast decay", modulation: "None", effects: ["delay"], role: "Rhythmic accent", frequencyRange: "500Hz-10kHz" }
        ],
        vocalProcessing: {
          pitchCorrection: { speed: "medium", humanize: 0.7 },
          pitchShift: 0,
          formantShift: 0,
          harmonizer: { voices: 2, intervals: ["3rd", "5th"] },
          vocoder: { carrier: "saw", bands: 16 },
          effects: {
            chopping: { enabled: true, pattern: "1/8 synced", beatSync: true },
            stutter: { enabled: true, rate: "1/16", randomize: 0.3 },
            reverse: { enabled: false, sections: [] },
            delay: { enabled: true, type: "ping-pong", rhythmic: true },
            reverb: { enabled: true, size: "medium hall", predelay: 30 },
            distortion: { enabled: false, type: "none", amount: 0 },
            telephone: { enabled: false, frequency: 1000 },
            doubling: { enabled: true, detuneAmount: 10, timing: 15 }
          },
          automations: ["Filter sweep during buildup", "Reverb increase in breakdown"]
        },
        drumProcessing: {
          kick: {
            layering: "Sub (40Hz sine) + Punch (100Hz transient) + Click (3kHz attack)",
            tuning: 50,
            boost: 3,
            compression: { ratio: 4, attack: 5, release: 100 },
            saturation: 0.3,
            transientShaping: "+20% attack, -10% sustain",
            sidechain: "Triggers bass, pads, synths"
          },
          snare: {
            layering: "Crack (200Hz) + Body (400Hz) + Room (reverb layer)",
            tuning: 200,
            compression: { ratio: 3, attack: 10, release: 80 },
            reverb: { type: "plate", decay: 1.2, predelay: 15 },
            parallel: "Heavy compression blended 30%"
          },
          hats: {
            filtering: { highpass: 300, lowpass: 12000 },
            stereoWidth: 1.3,
            groove: "Slightly behind the beat for laid-back feel",
            variations: 4
          },
          percussion: {
            elements: ["shakers", "toms", "claps", "snaps"],
            panning: "Wide stereo spread, toms centered",
            processing: "Light compression, individual EQ"
          },
          drumBus: {
            compression: "Glue compression 2:1, slow attack",
            saturation: "Subtle tape warmth",
            eq: "Gentle high shelf boost at 10kHz"
          }
        },
        automationTimeline: [
          { parameter: "Main Filter Cutoff", startValue: 200, endValue: 12000, startTime: 16, duration: 16, curve: "exponential", purpose: "Buildup tension release" },
          { parameter: "Reverb Wet", startValue: 0.1, endValue: 0.5, startTime: 64, duration: 16, curve: "linear", purpose: "Breakdown atmosphere" },
          { parameter: "Sidechain Depth", startValue: 0.4, endValue: 0.8, startTime: 80, duration: 16, curve: "linear", purpose: "Intensify pumping into drop" },
          { parameter: "Master Volume", startValue: 0.8, endValue: 1.0, startTime: 16, duration: 16, curve: "linear", purpose: "Energy lift into drop" }
        ],
        transitionDesign: [
          { type: "riser", time: 16, duration: 16, intensity: 0.8, elements: ["white noise", "pitch sweep"], processing: "HP filter sweep, increasing reverb" },
          { type: "impact", time: 32, duration: 0.5, intensity: 1.0, elements: ["sub drop", "crash", "reverb tail"], processing: "Sidechain release, full frequency hit" },
          { type: "filter-sweep", time: 64, duration: 8, intensity: 0.5, elements: ["all elements"], processing: "LP closing to 400Hz" },
          { type: "snare-roll", time: 80, duration: 16, intensity: 0.9, elements: ["snare", "pitch"], processing: "Accelerating from 1/4 to 1/32, rising pitch" },
          { type: "silence", time: 95.5, duration: 0.5, intensity: 1.0, elements: [], processing: "Complete silence before drop" },
          { type: "impact", time: 96, duration: 0.5, intensity: 1.0, elements: ["sub drop", "crash", "full mix"], processing: "Maximum impact layering" }
        ],
        energyProfile: {
          overallArc: "Build-release structure with two major climaxes",
          sectionEnergies: [0.3, 0.6, 1.0, 0.4, 0.7, 1.0, 0.3],
          climaxPoints: [32, 96],
          tensionCurve: [0.3, 0.5, 0.8, 0.3, 0.4, 0.7, 0.9, 0.2],
          releasePoints: [32, 96],
          dancefloorAppeal: 8.5
        },
        dropDesign: [
          { time: 32, type: "main", buildupDuration: 16, preSilence: 250, impactElements: ["full drums", "bass", "lead", "crash", "sub-drop"], filterReset: true, bassEntry: "instant", energyBoost: 100, specialEffects: ["white noise burst", "reverb crash"] },
          { time: 96, type: "main", buildupDuration: 16, preSilence: 500, impactElements: ["full drums", "bass", "lead", "vocal", "crash"], filterReset: true, bassEntry: "instant", energyBoost: 100, specialEffects: ["sub-drop", "layered impacts"] }
        ],
        buildupDesign: [
          { time: 16, duration: 16, techniques: ["snare roll", "filter sweep", "riser", "pitch rise"], snareRoll: { enabled: true, startRate: "1/4", endRate: "1/32", pitchRise: true }, filterSweep: { start: 200, end: 12000, resonance: 0.6 }, whiteNoise: { enabled: true, swell: 0.8 }, pitchRiser: { enabled: true, semitones: 12 }, tensionElements: ["ascending melody", "increasing percussion density"] },
          { time: 80, duration: 16, techniques: ["snare roll", "filter sweep", "riser", "pitch rise", "vocal chops"], snareRoll: { enabled: true, startRate: "1/8", endRate: "1/64", pitchRise: true }, filterSweep: { start: 400, end: 16000, resonance: 0.7 }, whiteNoise: { enabled: true, swell: 1.0 }, pitchRiser: { enabled: true, semitones: 24 }, tensionElements: ["more intense than first", "layered risers"] }
        ],
        breakdownDesign: [
          { time: 64, duration: 16, strippedElements: ["drums", "bass", "lead"], maintainedElements: ["pads", "vocal", "atmospherics"], atmosphere: "Emotional, spacious, introspective", processing: "Heavy reverb, filter closing slightly, delay throws" }
        ],
        mixdownNotes: {
          headroom: -6,
          gainStaging: "All channels hitting -18dBFS average, -6dB on master before limiting",
          problemFrequencies: ["200-400Hz buildup", "2-4kHz harshness", "8kHz sibilance"],
          referenceTrack: "Top tracks in the genre",
          mixingOrder: ["Kick", "Bass", "Snare", "Hats", "Lead", "Pads", "Vocals", "FX"],
          criticalBalances: [
            { element1: "Kick", element2: "Bass", relationship: "Kick punches through, bass fills between hits" },
            { element1: "Lead", element2: "Vocal", relationship: "Lead ducks slightly when vocal present" }
          ]
        },
        masteringChain: [
          { plugin: "Linear Phase EQ", purpose: "Tonal shaping", settings: "+1dB at 60Hz, -2dB at 350Hz, +1dB at 3kHz, +2dB at 12kHz" },
          { plugin: "Multiband Compressor", purpose: "Dynamic control", settings: "Low 2:1, Mid 1.5:1, High 1.5:1" },
          { plugin: "Stereo Imager", purpose: "Width enhancement", settings: "Narrow below 150Hz, widen 2-8kHz by 15%" },
          { plugin: "Harmonic Exciter", purpose: "Presence and warmth", settings: "Subtle 2nd harmonics on bass, odd harmonics on highs" },
          { plugin: "Limiter", purpose: "Loudness maximization", settings: "-0.3dB ceiling, -8 LUFS target" }
        ],
        djIntegration: {
          introType: "16-bar",
          outroType: "16-bar",
          mixInPoint: 0,
          mixOutPoint: 128,
          energyMatch: "Mixes well with similar energy tracks in compatible keys",
          beatGridConfidence: 1.0,
          cuePoints: [
            { time: 0, label: "Intro", color: "blue" },
            { time: 16, label: "Build", color: "yellow" },
            { time: 32, label: "Drop 1", color: "red" },
            { time: 64, label: "Breakdown", color: "purple" },
            { time: 96, label: "Drop 2", color: "red" }
          ]
        },
        recommendations: `1. MIXING: Start with kick at -10dB, build mix around it. Use reference track constantly.
2. DROPS: Create 500ms of silence before each drop for maximum impact. Layer sub-drop samples.
3. BUILDUPS: Automate snare roll from 1/4 to 1/64 notes with rising pitch. Add white noise swell.
4. LOW-END: Sidechain everything to kick. Keep bass mono below 150Hz for club systems.
5. TRANSITIONS: Use filter sweeps, tape stops, and reverse reverb for smooth transitions.
6. ENERGY: Alternate between high and low energy. Breakdowns should be 40% energy of drops.
7. WIDTH: Keep kick and bass centered. Pan hi-hats and percussion for width. Widen synths above 2kHz.
8. DJ MIXING: Ensure 16-bar intro/outro with just drums for easy beat-matching. Clear phrase structure.
9. MASTERING: Target -8 LUFS for streaming, -6 LUFS for club. Keep 6dB dynamic range minimum.
10. FINAL CHECK: A/B with commercial releases. Check on multiple systems including phone speakers.`
      };
    }

    return new Response(JSON.stringify({ success: true, remix: remixData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating ultra-intelligent remix:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate remix";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
