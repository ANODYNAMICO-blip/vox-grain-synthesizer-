/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QubitType = 'HADAMARD' | 'PAULI_X' | 'PHASE_S' | 'ENTANGLEMENT' | 'TELEPORTER' | 'DECOHERENCE';

export interface QubitNode {
  id: string;
  type: QubitType;
  name: string;
  symbol: string;
  description: string;
  active: boolean;
  color: string;
  // Specific quantum parameters
  params: {
    superpositionAngle?: number; // 0 to 180 degrees for Hadamard
    spinFlipRate?: number;       // 0 to 100 for Pauli-X distortion
    phaseShift?: number;         // -180 to 180 degrees for Phase Gate
    resonance?: number;          // 0 to 99% for feedback/resonance
    entangleFrequency?: number;  // 1 to 1000 Hz for ring mod
    teleportDelay?: number;      // 0 to 2000 ms
    teleportJitter?: number;     // 0 to 100
    decoherenceNoise?: number;   // 0 to 100%
  };
}

export interface GranularParams {
  grainSize: number;      // in ms, e.g. 50 - 500
  overlap: number;        // overlap factor
  pitchRatio: number;     // pitch speed multiplier, e.g. 0.5 - 2.0
  jitter: number;         // random playback margin
  spray: number;          // random position variation
  feedback: number;       // feedback loop strength
}

export interface VoiceGateParams {
  threshold: number;      // dB threshold for noise gate, e.g. -60 to -20
  gain: number;           // gate input scale
  pitchShift: number;     // initial pitch multiplier, semitones e.g. -12 to 12
  attack?: number;        // ms attack time, e.g. 2 to 100ms
  release?: number;       // ms release time, e.g. 10 to 1000ms
  hold?: number;          // ms hold time, e.g. 0 to 500ms
  attenuation?: number;   // dB attenuation floor, e.g. -80dB (silent) to -12dB (partial gate)
  hysteresis?: number;    // dB hysteresis offset for closing, e.g. 0 to 12dB
  bypass?: boolean;       // gate bypassed status
  pitchTrackByKeyboard?: boolean; // active pitch track toggle connected to keyboard
  vibratoToggle?: boolean;       // vibrato/modulation performance toggle
  granularBypass?: boolean;      // granular engine active toggle
  filterFreq?: number;           // dedicated resonant filter frequency
  filterQ?: number;              // dedicated resonance quality (Q)

  // ADVANCED AUTO-TUNE & SPACE SUITE PARAMETERS
  autoTuneActive?: boolean;
  autoTunePitchControl?: number;      // correction speed or pitch depth
  autoTuneSpaceControl?: number;      // overall space/reverb width slider
  autoTuneResolution?: number;        // scale snapping resolution
  autoTuneScale?: string;             // Scale, e.g. "CHROMATIC", "MAJOR", "MINOR"
  
  // Squeeze and Cutoff Master sweep filter
  filterSqueezeCutoff?: number;       // peak/bandpass center cutoff frequency (Hz)
  filterSqueezeWidth?: number;        // bandpass squeeze width (resonance Q factor)

  // Chorus & Detuning
  chorusActive?: boolean;
  chorusDrive?: number;               // drive saturation level built into choruser
  chorusVoices?: number;              // voice multiplier: 1, 2, or 3 (voices 123)

  // Crunch / Grit & Color warm tape tone
  crunchActive?: boolean;
  crunchGritSound?: number;           // distortion grit level
  tapeWarpPercent?: number;           // tape flutter flutter amount
  tapeFlutterFreq?: number;           // tape flutter speed
  colorTone?: number;                 // warm vs bright color model dial
  presenceDb?: number;                // clear high boost (dB)

  // Compression
  compressorActive?: boolean;
  compressorWarmth?: number;          // analog soft-knee saturation depth

  // Space Reverb & Reflections (Vocal Hall Ambience, Spring, Plate, Tank)
  reverbActive?: boolean;
  reverbType?: 'hall' | 'plate' | 'spring' | 'tank'; // high definition algorithms
  reverbRoomSize?: number;            // room size decay
  reverbResonance?: number;           // feedback resonance
  reverbReflectionsDryWet?: number;   // reflections density level
  reverbSlapTime?: number;            // slap back time (ms)

  // Space Echo & Delays
  delayActive?: boolean;
  delayTime?: number;                 // Echo duration (seconds)
  delayFeedback?: number;             // echo decay level
  tapeDelayActive?: boolean;          // warm tape modulation filter toggle

  // Detuned Formant Delay
  formantDelayActive?: boolean;
  formantDelayShift?: number;         // formant filter shift offset semitones

  // Vocal Thickeners (independent voice layer counts 1st, 2nd, 3rd)
  vocalThickeningActive?: boolean;
  vocalThickeningVoicesCount?: number; // count: 1, 2, or 3 (voices 123)

  // Tremolo Volume LFO
  tremoloActive?: boolean;
  tremoloRate?: number;               // tremolo rate speed (Hz)
  tremoloDepth?: number;              // tremolo depth amplitude (%)

  // Lo-Fi Bitcrusher
  loFiActive?: boolean;
  loFiResolutionBit?: number;         // quantize bits (e.g. 4 to 16)
}

export interface AudioSystemState {
  micAuthorized: boolean;
  micActive: boolean;
  isProcessing: boolean;
  isRecording: boolean;
  outputVolume: number;
}

export interface QuantumPreset {
  id: string;
  name: string;
  description: string;
  isFactory?: boolean;
  category?: string;
  tags?: string[];
  qubits: QubitNode[];
  granularParams: GranularParams;
  voiceParams: VoiceGateParams;
  waveformMorph?: number;
  wavetableTransducer?: number;
  transducerFormulation?: string;
  synthBlend?: number;
}

export interface CymaticSnapshot {
  id: string;
  timestamp: string;
  tag: string;
  n: number;
  m: number;
  reactivity: number;
  colorScheme: string;
  imgDataUrl?: string; // canvas snapshot thumbnail base64
}

