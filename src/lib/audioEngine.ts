/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QubitNode, GranularParams, VoiceGateParams } from '../types';

export class QuantumAudioEngine {
  public ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private recorderNode: ScriptProcessorNode | null = null;
  private isProcessing: boolean = false;

  // HIGH QUALITY WAV RECORDING STATE
  private outputRecorderNode: ScriptProcessorNode | null = null;
  private recordedChunksLeft: Float32Array[] = [];
  private recordedChunksRight: Float32Array[] = [];
  private isRecordingOutput: boolean = false;
  private recordingStartTime: number = 0;
  private onRecordingProgress: ((seconds: number) => void) | null = null;

  // Visual simulation nodes
  private simOsc: OscillatorNode | null = null;
  private simFilter: BiquadFilterNode | null = null;
  private simLfo: OscillatorNode | null = null;
  private simLfoGain: GainNode | null = null;
  private simAmpLfo: OscillatorNode | null = null;
  private simAmpGain: GainNode | null = null;
  public isSimulatedMode: boolean = false;

  // Analyser nodes
  public inputAnalyser: AnalyserNode | null = null;
  public outputAnalyser: AnalyserNode | null = null;

  // Master nodes
  private gateNode: BiquadFilterNode | null = null; // highpass filter to cut low rumble
  private voiceFilter: BiquadFilterNode | null = null; // sweeping resonant filter
  private micGain: GainNode | null = null;
  private granularInputNode: GainNode | null = null; // Node to accept granular playback
  private qubitInput: GainNode | null = null;        // Input to the qubit chain
  private masterGain: GainNode | null = null;

  // VOCAL EFFECT SUITE DSP & MULTI-FX ROUTING NODES
  private suitePreGain: GainNode | null = null;
  private suiteCompressor: DynamicsCompressorNode | null = null;
  private suiteCrunch: WaveShaperNode | null = null;
  private suitePresenceFilter: BiquadFilterNode | null = null;
  private suiteSqueezeFilter: BiquadFilterNode | null = null;
  
  private suiteChorusDryGain: GainNode | null = null;
  private suiteChorusWetGain: GainNode | null = null;
  private suiteChorusDelay1: DelayNode | null = null;
  private suiteChorusDelay2: DelayNode | null = null;
  private suiteChorusDelay3: DelayNode | null = null;

  private suiteThickenGain1: GainNode | null = null;
  private suiteThickenGain2: GainNode | null = null;
  private suiteThickenGain3: GainNode | null = null;
  private suiteThickenDelay1: DelayNode | null = null;
  private suiteThickenDelay2: DelayNode | null = null;
  private suiteThickenDelay3: DelayNode | null = null;
  
  private suiteReverbConvolver: ConvolverNode | null = null;
  private suiteReverbDryGain: GainNode | null = null;
  private suiteReverbWetGain: GainNode | null = null;

  private suiteDelayNode: DelayNode | null = null;
  private suiteDelayFeedbackNode: GainNode | null = null;
  private suiteDelayFilterNode: BiquadFilterNode | null = null;
  private suiteDelayDryGain: GainNode | null = null;
  private suiteDelayWetGain: GainNode | null = null;

  private suiteFormantDelayNode: DelayNode | null = null;
  private suiteFormantFeedbackGain: GainNode | null = null;
  private suiteFormantFilterNode: BiquadFilterNode | null = null;

  private suiteTremoloGain: GainNode | null = null;
  private suiteTremoloOsc: OscillatorNode | null = null;
  private suiteTremoloMod: GainNode | null = null;

  private suitePostGain: GainNode | null = null;

  // Granular synth variables
  private rollingBuffer: Float32Array | null = null;
  private bufferLength: number = 0;
  private writeIndex: number = 0;
  private sampleRate: number = 44100;
  private schedulerTimerId: any = null;

  // Granular settings (dynamic)
  private granularParams: GranularParams = {
    grainSize: 180,
    overlap: 3,
    pitchRatio: 1.0,
    jitter: 15,
    spray: 20,
    feedback: 0.1,
  };

  // Quantum Waveform Morphing & Wavetable Transducer parameters
  public waveformMorph: number = 0.5; // 0.0 to 3.0 (Sine -> Square -> Saw -> White Noise)
  public wavetableTransducer: number = 0.0; // 0.0 to 1.0 (Transducer strength)
  public transducerFormulation: string = 'spectral'; // 'spectral' | 'fibonacci' | 'quantum-packet' | 'chirp'
  public synthBlend: number = 0.3; // Synth overlay mix ratio

  // Advanced Noise Gate State-tracking variables
  public gateState: 'OPEN' | 'CLOSED' | 'ATTACK' | 'RELEASE' | 'HOLD' = 'CLOSED';
  public liveGateGain: number = 1.0;     // current multiplier [ambient floor, 1.0]
  public liveGateReduction: number = 0;  // reduction in dB (0 to -80dB)
  public liveInputDb: number = -100;     // current peak input level in dB
  private lastHoldTime: number = 0;      // tracks when the hold period started

  private gateParams: VoiceGateParams = {
    threshold: -45,
    gain: 1.0,
    pitchShift: 0,
    attack: 5,        // 5ms fast open
    release: 150,     // 150ms tail release
    hold: 100,        // 100ms hold gate
    attenuation: -80, // -80dB (silent)
    hysteresis: 4,    // 4dB hysteresis
    bypass: false,
    pitchTrackByKeyboard: false,
    vibratoToggle: false,
    granularBypass: false,
    filterFreq: 8000,
    filterQ: 1.0,

    // ADVANCED VOCAL SUITE PRESETS AUTO-TUNE DEFAULT
    autoTuneActive: false,
    autoTunePitchControl: 0.85,
    autoTuneSpaceControl: 0.5,
    autoTuneResolution: 25,
    autoTuneScale: 'CHROMATIC',
    
    filterSqueezeCutoff: 12000,
    filterSqueezeWidth: 1.0,

    chorusActive: false,
    chorusDrive: 0.3,
    chorusVoices: 2,

    crunchActive: false,
    crunchGritSound: 0.25,
    tapeWarpPercent: 20,
    tapeFlutterFreq: 6.0,
    colorTone: 0.4,
    presenceDb: 4.0,

    compressorActive: true, 
    compressorWarmth: 0.5,

    reverbActive: false,
    reverbType: 'hall',
    reverbRoomSize: 0.6,
    reverbResonance: 0.5,
    reverbReflectionsDryWet: 0.35,
    reverbSlapTime: 50,

    delayActive: false,
    delayTime: 0.35,
    delayFeedback: 0.4,
    tapeDelayActive: false,

    formantDelayActive: false,
    formantDelayShift: 0,

    vocalThickeningActive: false,
    vocalThickeningVoicesCount: 2,

    tremoloActive: false,
    tremoloRate: 4.0,
    tremoloDepth: 0.5,

    loFiActive: false,
    loFiResolutionBit: 8,
  };

  // Quantum node maps
  private activeQubits: QubitNode[] = [];
  // Standard Web Audio representations of each Qubit effect
  private qubitAudioNodes: Map<string, {
    input: AudioNode;
    output: AudioNode;
    cleanUp: () => void;
  }> = new Map();

  // Noise Buffer for Decoherence
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Lazy loaded / initialized on user interaction to avoid auto-play limits
  }

  public async initialize(): Promise<void> {
    if (this.ctx) return;
    
    // Create AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
    this.sampleRate = this.ctx.sampleRate;

    // Allocate 4-second rolling buffer
    // At typical 44100Hz, this is ~176,400 samples
    this.bufferLength = this.sampleRate * 4;
    this.rollingBuffer = new Float32Array(this.bufferLength);
    this.writeIndex = 0;

    // Initialize Noise Buffer for Decoherence node
    const bufferSize = this.sampleRate * 2; // 2 seconds of noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Build static nodes
    this.inputAnalyser = this.ctx.createAnalyser();
    this.inputAnalyser.fftSize = 512;

    this.outputAnalyser = this.ctx.createAnalyser();
    this.outputAnalyser.fftSize = 512;

    this.micGain = this.ctx.createGain();
    this.micGain.gain.value = 1.0;

    // Low-cut highpass on mic input to reduce ambient hum
    this.gateNode = this.ctx.createBiquadFilter();
    this.gateNode.type = 'highpass';
    this.gateNode.frequency.value = 80;

    // Resonant voice filter (with sweepable resonance Q)
    this.voiceFilter = this.ctx.createBiquadFilter();
    this.voiceFilter.type = 'peaking';
    this.voiceFilter.frequency.value = 8000;
    this.voiceFilter.Q.value = 1.0;
    this.voiceFilter.gain.value = 6.0; // peaking boost!

    this.granularInputNode = this.ctx.createGain();
    this.granularInputNode.gain.value = 1.0;

    this.qubitInput = this.ctx.createGain();
    this.qubitInput.gain.value = 1.0;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    // Wire up dynamic master vocal suite
    this.initializeVocalSuite();

    // Wire up Analyzer and master connection through the vocal suite
    this.masterGain.connect(this.suitePreGain!);
    this.suitePostGain!.connect(this.outputAnalyser);
    this.outputAnalyser.connect(this.ctx.destination);

    // Apply default effects state immediately
    this.setVoiceGateParams(this.gateParams);
  }

  public async startMic(): Promise<boolean> {
    await this.initialize();
    if (!this.ctx) return false;

    // Halt active simulations
    this.stopSimulation();

    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access (getUserMedia) is not supported or is blocked in this browser context (e.g. within secure cross-origin iframes).');
      }
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        }
      });

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      
      // ScriptProcessor is perfect for recording continuously to a rolling sample buffer in main thread.
      // (Using 2048 buffer size to guarantee low recording latency)
      this.recorderNode = this.ctx.createScriptProcessor(2048, 1, 1);
      
      this.recorderNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.processInputBuffer(inputData);
      };

      // Connect source to analyzer, highpass filter, resonant peaking filter, gain, and recorder
      this.micSource.connect(this.inputAnalyser!);
      this.inputAnalyser!.connect(this.gateNode!);
      this.gateNode!.connect(this.voiceFilter!);
      this.voiceFilter!.connect(this.micGain!);
      this.micGain!.connect(this.recorderNode);
      this.recorderNode.connect(this.ctx.destination); // Required to drive processing

      this.isProcessing = true;
      this.startGranularScheduler();

      // Ensure routing is built
      this.rebuildAudioChain();
      return true;
    } catch (err) {
      console.warn('Microphone access unavailable or denied. Falling back to simulation carrier.', err);
      return false;
    }
  }

  public async startSimulation(): Promise<boolean> {
    await this.initialize();
    if (!this.ctx) return false;

    // Tear down mic first
    this.stopMic();

    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      this.isSimulatedMode = true;

      // Beautiful additive formant oscillator synthesizing complex drone vowel wavepackets
      this.simOsc = this.ctx.createOscillator();
      this.simOsc.type = 'sawtooth';
      this.simOsc.frequency.setValueAtTime(125, this.ctx.currentTime); // male vocal register

      this.simFilter = this.ctx.createBiquadFilter();
      this.simFilter.type = 'bandpass';
      this.simFilter.Q.setValueAtTime(7.5, this.ctx.currentTime); // high formant resonance
      this.simFilter.frequency.setValueAtTime(750, this.ctx.currentTime);

      // Modulating LFO - sweeps back and forth over formant vowel regions
      this.simLfo = this.ctx.createOscillator();
      this.simLfo.frequency.setValueAtTime(0.3, this.ctx.currentTime); // slow speech sweep

      this.simLfoGain = this.ctx.createGain();
      this.simLfoGain.gain.setValueAtTime(450, this.ctx.currentTime); // sweep width

      // Phrasing LFO - triggers talking/pulsing cadence simulating words
      this.simAmpLfo = this.ctx.createOscillator();
      this.simAmpLfo.frequency.setValueAtTime(0.25, this.ctx.currentTime); // talking cadence LFO

      this.simAmpGain = this.ctx.createGain();
      this.simAmpGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      // Connect modulator LFOs
      this.simLfo.connect(this.simLfoGain);
      this.simLfoGain.connect(this.simFilter.frequency);

      // Connect sound generation chain
      this.simOsc.connect(this.simFilter);
      this.simFilter.connect(this.simAmpGain);

      // ScriptProcessor is perfect for recording continuously to a rolling sample buffer in main thread.
      // (Using 2048 buffer size to guarantee low recording latency)
      this.recorderNode = this.ctx.createScriptProcessor(2048, 1, 1);
      
      this.recorderNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.processInputBuffer(inputData);
      };

      // Connect synthetic formant generator to core pipeline
      this.simAmpGain.connect(this.inputAnalyser!);
      this.inputAnalyser!.connect(this.gateNode!);
      this.gateNode!.connect(this.voiceFilter!);
      this.voiceFilter!.connect(this.micGain!);
      this.micGain!.connect(this.recorderNode);
      this.recorderNode.connect(this.ctx.destination); // Required to drive processing

      // Ignite oscillators
      this.simOsc.start();
      this.simLfo.start();
      this.simAmpLfo.start();

      this.isProcessing = true;
      this.startGranularScheduler();

      // Ensure routing is built
      this.rebuildAudioChain();
      return true;
    } catch (err) {
      console.error('Error starting quantum simulation carrier:', err);
      return false;
    }
  }

  public stopSimulation(): void {
    this.isSimulatedMode = false;
    
    if (this.simOsc) {
      try { this.simOsc.stop(); } catch(e){}
      this.simOsc.disconnect();
      this.simOsc = null;
    }
    if (this.simLfo) {
      try { this.simLfo.stop(); } catch(e){}
      this.simLfo.disconnect();
      this.simLfo = null;
    }
    if (this.simAmpLfo) {
      try { this.simAmpLfo.stop(); } catch(e){}
      this.simAmpLfo.disconnect();
      this.simAmpLfo = null;
    }
    if (this.simLfoGain) {
      this.simLfoGain.disconnect();
      this.simLfoGain = null;
    }
    if (this.simAmpGain) {
      this.simAmpGain.disconnect();
      this.simAmpGain = null;
    }
    if (this.simFilter) {
      this.simFilter.disconnect();
      this.simFilter = null;
    }
  }

  public stopMic(): void {
    this.isProcessing = false;
    this.stopGranularScheduler();
    this.stopSimulation();

    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.recorderNode) {
      this.recorderNode.disconnect();
      this.recorderNode = null;
    }
  }

  // --- OUTPUT WAV RECORDING CONTROL PORT ---
  public startRecording(onProgress?: (seconds: number) => void): boolean {
    if (!this.ctx) return false;
    if (this.isRecordingOutput) return false;

    this.recordedChunksLeft = [];
    this.recordedChunksRight = [];
    this.isRecordingOutput = true;
    this.recordingStartTime = this.ctx.currentTime;
    this.onRecordingProgress = onProgress || null;

    try {
      // Connect to outputAnalyser to capture post-all post-qubits live signal
      const sourceNode = this.outputAnalyser || this.suitePostGain;
      if (!sourceNode) return false;

      this.outputRecorderNode = this.ctx.createScriptProcessor(4096, 2, 2);
      sourceNode.connect(this.outputRecorderNode);
      this.outputRecorderNode.connect(this.ctx.destination);

      this.outputRecorderNode.onaudioprocess = (e) => {
        if (!this.isRecordingOutput) return;

        const left = e.inputBuffer.getChannelData(0);
        const right = e.inputBuffer.getChannelData(1);

        this.recordedChunksLeft.push(new Float32Array(left));
        this.recordedChunksRight.push(new Float32Array(right));

        // Output stays quiet so there is absolutely no double-amplification loopback
        const outLeft = e.outputBuffer.getChannelData(0);
        const outRight = e.outputBuffer.getChannelData(1);
        outLeft.fill(0);
        outRight.fill(0);

        if (this.onRecordingProgress && this.ctx) {
          const elapsed = this.ctx.currentTime - this.recordingStartTime;
          this.onRecordingProgress(elapsed);
        }
      };

      return true;
    } catch (e) {
      console.error("Failed to arm high-fidelity quantum recorder:", e);
      this.isRecordingOutput = false;
      return false;
    }
  }

  public stopRecording(): { blob: Blob; url: string; duration: number } | null {
    if (!this.ctx || !this.isRecordingOutput) return null;

    this.isRecordingOutput = false;
    const duration = this.ctx.currentTime - this.recordingStartTime;

    if (this.outputRecorderNode) {
      try {
        this.outputRecorderNode.disconnect();
      } catch (e) {
        console.warn("Disconnection of recorder error:", e);
      }
      this.outputRecorderNode = null;
    }

    if (this.recordedChunksLeft.length === 0) {
      return null;
    }

    try {
      const blob = this.exportWAV(this.recordedChunksLeft, this.recordedChunksRight, this.ctx.sampleRate);
      const url = URL.createObjectURL(blob);
      return {
        blob,
        url,
        duration,
      };
    } catch (e) {
      console.error("WAV render compiler failed:", e);
      return null;
    }
  }

  public getIsRecording(): boolean {
    return this.isRecordingOutput;
  }

  public getRecordingElapsedTime(): number {
    if (!this.ctx || !this.isRecordingOutput) return 0;
    return this.ctx.currentTime - this.recordingStartTime;
  }

  private exportWAV(leftChunks: Float32Array[], rightChunks: Float32Array[], sampleRate: number): Blob {
    const totalSamples = leftChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const leftBuffer = new Float32Array(totalSamples);
    const rightBuffer = new Float32Array(totalSamples);

    let offset = 0;
    for (const chunk of leftChunks) {
      leftBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    offset = 0;
    for (const chunk of rightChunks) {
      rightBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const interleaved = new Float32Array(totalSamples * 2);
    for (let i = 0; i < totalSamples; i++) {
      interleaved[i * 2] = leftBuffer[i];
      interleaved[i * 2 + 1] = rightBuffer[i];
    }

    const buffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    let index = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      index += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Set parameters
  public setGranularParams(params: GranularParams): void {
    this.granularParams = { ...params };
  }

  public setVoiceGateParams(params: VoiceGateParams): void {
    this.gateParams = {
      ...this.gateParams,
      ...params
    };
    if (this.micGain && this.ctx) {
      this.micGain.gain.setValueAtTime(this.gateParams.gain, this.ctx.currentTime);
    }
    if (this.voiceFilter && this.ctx) {
      const freq = this.gateParams.filterFreq ?? 8000;
      const q = this.gateParams.filterQ ?? 1.0;
      this.voiceFilter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.voiceFilter.Q.setValueAtTime(q, this.ctx.currentTime);
    }
    // Handle live routing bypass if granular core toggles
    if (this.micGain && this.qubitInput) {
      try {
        if (this.gateParams.granularBypass) {
          this.micGain.connect(this.qubitInput);
        } else {
          this.micGain.disconnect(this.qubitInput);
        }
      } catch (e) {
        // Safe protection for multiple re-connections
      }
    }

    // --- VOCAL SUITE EFFECTS PARAMETER BINDINGS ---
    if (!this.ctx) return;

    // 1. Studio Compressor
    if (this.suiteCompressor) {
      if (this.gateParams.compressorActive) {
        const thresholdVal = -10 - (this.gateParams.compressorWarmth ?? 0.5) * 22; // -10dB to -32dB
        const ratioVal = 2.0 + (this.gateParams.compressorWarmth ?? 0.5) * 8.0; // 2:1 to 10:1
        this.suiteCompressor.threshold.setValueAtTime(thresholdVal, this.ctx.currentTime);
        this.suiteCompressor.ratio.setValueAtTime(ratioVal, this.ctx.currentTime);
      } else {
        this.suiteCompressor.threshold.setValueAtTime(0, this.ctx.currentTime); // bypass
        this.suiteCompressor.ratio.setValueAtTime(1.0, this.ctx.currentTime);
      }
    }

    // 2. Overdrive / Crunch (asymmetric tube modeling)
    if (this.suiteCrunch) {
      if (this.gateParams.crunchActive) {
        const grit = this.gateParams.crunchGritSound ?? 0.25;
        const tone = this.gateParams.colorTone ?? 0.4;
        this.suiteCrunch.curve = this.makeWarmDistortionCurve(grit * 50.0, tone * 0.35);
      } else {
        this.suiteCrunch.curve = this.makeWarmDistortionCurve(0, 0); // flat bypass
      }
    }

    // 3. Clear High Resonance Vocal Presence Booster
    if (this.suitePresenceFilter) {
      const pres = this.gateParams.presenceDb ?? 4.0;
      this.suitePresenceFilter.gain.setValueAtTime(pres, this.ctx.currentTime);
    }

    // 4. Master Coherence Filter Squeeze & Cutoff Sweep
    if (this.suiteSqueezeFilter) {
      const cut = this.gateParams.filterSqueezeCutoff ?? 12000;
      const width = this.gateParams.filterSqueezeWidth ?? 1.0;
      
      if (cut >= 11500) {
        this.suiteSqueezeFilter.type = 'peaking';
        this.suiteSqueezeFilter.frequency.setValueAtTime(8000, this.ctx.currentTime);
        this.suiteSqueezeFilter.gain.setValueAtTime(0.0, this.ctx.currentTime);
      } else {
        this.suiteSqueezeFilter.type = 'bandpass';
        this.suiteSqueezeFilter.frequency.setValueAtTime(cut, this.ctx.currentTime);
        this.suiteSqueezeFilter.Q.setValueAtTime(1.0 / Math.max(0.1, width), this.ctx.currentTime);
      }
    }

    // 5. Volume Tremolo (LFO modulation)
    if (this.suiteTremoloMod) {
      const active = this.gateParams.tremoloActive;
      const rate = this.gateParams.tremoloRate ?? 4.0;
      const depth = this.gateParams.tremoloDepth ?? 0.5;

      if (this.suiteTremoloOsc) {
        this.suiteTremoloOsc.frequency.setValueAtTime(rate, this.ctx.currentTime);
      }
      this.suiteTremoloMod.gain.setValueAtTime(active ? depth * 0.8 : 0.0, this.ctx.currentTime);
    }

    // 6. Stereo Chorus Ensemble (Voices 1, 2, or 3)
    if (this.suiteChorusDryGain && this.suiteChorusWetGain) {
      if (this.gateParams.chorusActive) {
        const drive = this.gateParams.chorusDrive ?? 0.3;
        const wetAmt = 0.35 + drive * 0.45;
        this.suiteChorusWetGain.gain.setValueAtTime(wetAmt, this.ctx.currentTime);
        this.suiteChorusDryGain.gain.setValueAtTime(Math.max(0.2, 1.0 - wetAmt * 0.6), this.ctx.currentTime);

        const vCount = this.gateParams.chorusVoices ?? 2;
        if (this.suiteChorusDelay1 && this.suiteChorusDelay2 && this.suiteChorusDelay3) {
          this.suiteChorusDelay1.delayTime.setValueAtTime(vCount >= 1 ? 0.020 : 0.0, this.ctx.currentTime);
          this.suiteChorusDelay2.delayTime.setValueAtTime(vCount >= 2 ? 0.038 : 0.0, this.ctx.currentTime);
          this.suiteChorusDelay3.delayTime.setValueAtTime(vCount >= 3 ? 0.055 : 0.0, this.ctx.currentTime);
        }
      } else {
        this.suiteChorusWetGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.suiteChorusDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      }
    }

    // 7. Vocal Multi-Voice Thickener Unison Layout (Voices 1, 2, or 3)
    if (this.suiteThickenGain1 && this.suiteThickenGain2 && this.suiteThickenGain3) {
      if (this.gateParams.vocalThickeningActive) {
        const vCount = this.gateParams.vocalThickeningVoicesCount ?? 2;
        this.suiteThickenGain1.gain.setValueAtTime(vCount >= 1 ? 0.50 : 0.0, this.ctx.currentTime);
        this.suiteThickenGain2.gain.setValueAtTime(vCount >= 2 ? 0.45 : 0.0, this.ctx.currentTime);
        this.suiteThickenGain3.gain.setValueAtTime(vCount >= 3 ? 0.35 : 0.0, this.ctx.currentTime);
      } else {
        this.suiteThickenGain1.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.suiteThickenGain2.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.suiteThickenGain3.gain.setValueAtTime(0.0, this.ctx.currentTime);
      }
    }

    // 8. Formant Shift Feedback Delay
    if (this.suiteFormantDelayNode && this.suiteFormantFeedbackGain && this.suiteFormantFilterNode) {
      if (this.gateParams.formantDelayActive) {
        const shift = this.gateParams.formantDelayShift ?? 0;
        const centerFreq = 1200 + shift * 100;
        this.suiteFormantFilterNode.frequency.setValueAtTime(Math.max(250, Math.min(5000, centerFreq)), this.ctx.currentTime);
        this.suiteFormantFeedbackGain.gain.setValueAtTime(0.40, this.ctx.currentTime);
      } else {
        this.suiteFormantFeedbackGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      }
    }

    // 9. Feedback Echo Delays & Dusty Warming Tape Head Filters
    if (this.suiteDelayNode && this.suiteDelayFeedbackNode && this.suiteDelayFilterNode && this.suiteDelayDryGain && this.suiteDelayWetGain) {
      if (this.gateParams.delayActive) {
        const dTime = this.gateParams.delayTime ?? 0.35;
        const dFeedback = this.gateParams.delayFeedback ?? 0.4;

        this.suiteDelayNode.delayTime.setValueAtTime(dTime, this.ctx.currentTime);
        this.suiteDelayFeedbackNode.gain.setValueAtTime(dFeedback, this.ctx.currentTime);

        if (this.gateParams.tapeDelayActive) {
          this.suiteDelayFilterNode.frequency.setValueAtTime(1400, this.ctx.currentTime);
        } else {
          this.suiteDelayFilterNode.frequency.setValueAtTime(18000, this.ctx.currentTime);
        }

        this.suiteDelayWetGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
        this.suiteDelayDryGain.gain.setValueAtTime(0.90, this.ctx.currentTime);
      } else {
        this.suiteDelayWetGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.suiteDelayDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      }
    }

    // 10. Convolution Space Reverb (Hall, Plate, Spring, Tank, Room size, and reflections density)
    if (this.suiteReverbConvolver && this.suiteReverbDryGain && this.suiteReverbWetGain) {
      if (this.gateParams.reverbActive) {
        const rSize = this.gateParams.reverbRoomSize ?? 0.6;
        const rRes = this.gateParams.reverbResonance ?? 0.5;
        const dryWet = this.gateParams.reverbReflectionsDryWet ?? 0.35;
        const type = this.gateParams.reverbType ?? 'hall';

        try {
          const bufferResponse = this.createReverbImpulseResponse(type, rSize, rRes, dryWet);
          this.suiteReverbConvolver.buffer = bufferResponse;
        } catch (e) {
          console.error("Impulse generator trace error:", e);
        }

        this.suiteReverbWetGain.gain.setValueAtTime(dryWet * 0.8, this.ctx.currentTime);
        this.suiteReverbDryGain.gain.setValueAtTime(Math.max(0.1, 1.0 - dryWet * 0.4), this.ctx.currentTime);
      } else {
        this.suiteReverbWetGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.suiteReverbDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      }
    }
  }

  private processInputBuffer(inputData: Float32Array): void {
    if (!this.isProcessing || !this.rollingBuffer) return;

    // Calculate peaks & Root-Mean-Square (RMS) for signal meter in dB
    let rmsSum = 0;
    for (let i = 0; i < inputData.length; i++) {
      rmsSum += inputData[i] * inputData[i];
    }
    const rms = Math.sqrt(rmsSum / inputData.length);
    const inputDb = rms > 0.0001 ? 20 * Math.log10(rms) : -100;
    
    // Smooth the live input dB metering slightly so it doesn't flutter too wildly
    const alpha = 0.25;
    this.liveInputDb = this.liveInputDb * (1 - alpha) + Math.max(-100, Math.min(10, inputDb)) * alpha;

    // Retrieve active Gate params
    const threshold = this.gateParams.threshold ?? -45;
    const attackMs = this.gateParams.attack ?? 5;
    const releaseMs = this.gateParams.release ?? 150;
    const holdMs = this.gateParams.hold ?? 100;
    const attenuationDb = this.gateParams.attenuation ?? -80;
    const hysteresis = this.gateParams.hysteresis ?? 4;
    const isBypass = this.gateParams.bypass ?? false;

    const maxGain = 1.0;
    const minGain = Math.pow(10, attenuationDb / 20);

    if (isBypass) {
      this.gateState = 'OPEN';
      this.liveGateGain = 1.0;
      this.liveGateReduction = 0;
    } else {
      const openThreshold = threshold;
      const closeThreshold = threshold - hysteresis;

      const now = Date.now();

      // Core Hysteretic Finite State Machine
      if (this.liveInputDb >= openThreshold) {
        if (this.gateState === 'CLOSED' || this.gateState === 'RELEASE') {
          this.gateState = 'ATTACK';
        } else if (this.gateState === 'HOLD') {
          this.gateState = 'OPEN';
        }
      } else if (this.liveInputDb < closeThreshold) {
        if (this.gateState === 'OPEN' || this.gateState === 'ATTACK') {
          this.gateState = 'HOLD';
          this.lastHoldTime = now;
        } else if (this.gateState === 'HOLD') {
          if (now - this.lastHoldTime >= holdMs) {
            this.gateState = 'RELEASE';
          }
        } else if (this.gateState === 'RELEASE') {
          if (this.liveGateGain <= minGain * 1.02) {
            this.gateState = 'CLOSED';
          }
        }
      }

      // Compute interpolation coefficient based on active state timing
      let targetGain = minGain;
      let coeff = 0.25;

      if (this.gateState === 'OPEN' || this.gateState === 'HOLD') {
        targetGain = maxGain;
        coeff = 1.0; // Maintain fully open immediately
      } else if (this.gateState === 'ATTACK') {
        targetGain = maxGain;
        // attackMs converted to equivalent filter smoothing coefficient
        const attackSamples = (attackMs / 1000) * this.sampleRate;
        coeff = attackSamples > 0 ? 1 - Math.exp(-inputData.length / attackSamples) : 1.0;
      } else if (this.gateState === 'RELEASE') {
        targetGain = minGain;
        const releaseSamples = (releaseMs / 1000) * this.sampleRate;
        coeff = releaseSamples > 0 ? 1 - Math.exp(-inputData.length / releaseSamples) : 0.05;
      } else {
        // CLOSED
        targetGain = minGain;
        coeff = 0.3;
      }

      // Ensure coefficient doesn't choke or blow up
      coeff = Math.max(0.005, Math.min(1.0, coeff));

      // Slew the gain factor smoothly
      this.liveGateGain = this.liveGateGain + (targetGain - this.liveGateGain) * coeff;
      
      // Clamp boundaries
      if (this.liveGateGain < minGain) this.liveGateGain = minGain;
      if (this.liveGateGain > maxGain) this.liveGateGain = maxGain;

      // Compute dynamic reduction gauge
      this.liveGateReduction = 20 * Math.log10(this.liveGateGain);
    }

    // Write processed (attenuated) input signals into the rolling buffer, applying the liveGateGain
    for (let i = 0; i < inputData.length; i++) {
      const sample = inputData[i] * this.liveGateGain;
      
      this.rollingBuffer[this.writeIndex] = sample;
      this.writeIndex = (this.writeIndex + 1) % this.bufferLength;
    }
  }

  public setMasterVolume(vol: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  // Dynamic Qubit processing loop
  private startGranularScheduler(): void {
    this.stopGranularScheduler();

    // Schedule grains aggressively using short timer interval
    // to build high overlaps (perfect continuous grains!)
    const scheduleIntervalMs = 25; // schedule grains frequently
    this.schedulerTimerId = setInterval(() => {
      this.scheduleNextGrains();
    }, scheduleIntervalMs);
  }

  private stopGranularScheduler(): void {
    if (this.schedulerTimerId) {
      clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
  }

  // Keep track of the timeline to avoid overlap issues
  private lastScheduledTime: number = 0;

  private scheduleNextGrains(): void {
    if (!this.ctx || !this.isProcessing || !this.rollingBuffer) return;

    const now = this.ctx.currentTime;
    
    // Ensure we schedule ahead by a small buffer
    const lookAhead = 0.08; // 80ms schedule window
    const baseGrainOffsetSeconds = this.granularParams.grainSize / 1000;
    const rateOfGrains = baseGrainOffsetSeconds / this.granularParams.overlap;

    if (this.lastScheduledTime < now) {
      this.lastScheduledTime = now;
    }

    while (this.lastScheduledTime < now + lookAhead) {
      this.playSingleGrain(this.lastScheduledTime);
      this.lastScheduledTime += rateOfGrains + (Math.random() - 0.5) * (this.granularParams.jitter / 1000);
    }
  }

  private playSingleGrain(time: number): void {
    if (this.gateParams.granularBypass) return;
    if (!this.ctx || !this.rollingBuffer) return;

    const grainDurationMs = this.granularParams.grainSize;
    const durationSeconds = grainDurationMs / 1000;
    
    // Calculate reading index backward from the write pointer
    // Safety gap of at least 250ms to let data write correctly without clicking
    const safetySamples = Math.floor(this.sampleRate * 0.25);
    
    // Spray is time variance in ms
    const spraySamples = Math.floor((this.granularParams.spray / 1000) * this.sampleRate * (Math.random() - 0.5));
    
    let readPointer = (this.writeIndex - safetySamples + spraySamples) % this.bufferLength;
    if (readPointer < 0) readPointer += this.bufferLength;

    // Create custom voice buffer
    const grainSizeSamples = Math.floor((grainDurationMs / 1000) * this.sampleRate);
    if (grainSizeSamples <= 0) return;

    const grainBuffer = this.ctx.createBuffer(1, grainSizeSamples, this.sampleRate);
    const audioData = grainBuffer.getChannelData(0);

    // Apply linear pitch shift adjustment based on primary Voice Gate panel with LFO vibrato option
    const semitonesToRatio = (semitones: number) => Math.pow(2, semitones / 12);
    let shiftAmt = this.gateParams.pitchShift;
    if (this.gateParams.vibratoToggle) {
      const vibratoFreq = 5.5; // 5.5 Hz performance LFO
      const vibratoDepth = 0.45; // semitones depth
      shiftAmt += Math.sin(2 * Math.PI * vibratoFreq * time) * vibratoDepth;
    }
    const adjustedPitchRatio = this.granularParams.pitchRatio * semitonesToRatio(shiftAmt);

    // Compute Auto-Tune pitch snaps once for this grain block to avoid intra-grain pitch glitches
    let finalBaseFreq = 130 * adjustedPitchRatio;
    if (this.gateParams.autoTuneActive) {
      // 1. Calculate input MIDI note
      const inputMidi = 12 * Math.log2(finalBaseFreq / 440) + 69;
      
      // 2. Select scale pitch centers in 12-TET relative to key root (C)
      let allowedOffsets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Chromatic
      const scaleType = this.gateParams.autoTuneScale || 'CHROMATIC';
      if (scaleType === 'MAJOR') {
        allowedOffsets = [0, 2, 4, 5, 7, 9, 11];
      } else if (scaleType === 'MINOR') {
        allowedOffsets = [0, 2, 3, 5, 7, 8, 10];
      }
      
      // 3. Math-snap to nearest pitch in range
      const octave = Math.floor(inputMidi / 12);
      let bestNote = allowedOffsets[0] + octave * 12;
      let minDiff = 999;
      
      for (const octOffset of [-1, 0, 1]) {
        for (const offset of allowedOffsets) {
          const candidateMidi = (octave + octOffset) * 12 + offset;
          const diff = Math.abs(inputMidi - candidateMidi);
          if (diff < minDiff) {
            minDiff = diff;
            bestNote = candidateMidi;
          }
        }
      }
      
      // 4. Interpolate based on snapping Pitch Control speed slider
      const speed = this.gateParams.autoTunePitchControl ?? 0.85;
      const snappedMidi = inputMidi + (bestNote - inputMidi) * speed;
      finalBaseFreq = 440 * Math.pow(2, (snappedMidi - 69) / 12);
    }

    // Extract sound samples from rolling microphone circular slice and apply quantum waveform morph/transduction
    for (let i = 0; i < grainSizeSamples; i++) {
      const idx = (readPointer + i) % this.bufferLength;
      let sample = this.rollingBuffer[idx];

      // Fundamental frequency for synthesis, influenced by the current keyboard note or voice pitch shift
      const baseFreq = finalBaseFreq;
      const t = i / this.sampleRate;
      const phase = (2 * Math.PI * baseFreq * t) % (2 * Math.PI);

      // Synthesis waveform generation
      const sineVal = Math.sin(phase);
      const squareVal = Math.sign(sineVal);
      // Triangle/Saw blend
      const triangleVal = 2 * Math.abs(2 * (phase / (2 * Math.PI)) - 1) - 1;
      const sawVal = 2 * (phase / (2 * Math.PI)) - 1;
      const waveSawTri = sawVal * 0.7 + triangleVal * 0.3;
      // White noise sample
      const noiseVal = Math.random() * 2 - 1;

      // Morph between Sine (0), Square (1), Saw (2), Noise (3)
      let morphVal = 0;
      const m = Math.max(0, Math.min(3, this.waveformMorph));
      if (m < 1.0) {
        // Blend Sine and Square
        morphVal = sineVal * (1 - m) + squareVal * m;
      } else if (m < 2.0) {
        // Blend Square and Saw
        const p = m - 1.0;
        morphVal = squareVal * (1 - p) + waveSawTri * p;
      } else {
        // Blend Saw and Noise
        const p = m - 2.0;
        morphVal = waveSawTri * (1 - p) + noiseVal * p;
      }

      // Additive / Multiplicative formulation based on Wavetable Transducer
      if (this.wavetableTransducer > 0.01) {
        const tr = this.wavetableTransducer;
        let transSine = 0;

        // Custom formulations to convert diverse tones and raw data into complex sinusoidal compositions
        switch (this.transducerFormulation) {
          case 'fibonacci':
            // Summing Fibonacci-spaced harmonics
            transSine = (
              Math.sin(phase) + 
              Math.sin(phase * 1.618) * 0.6 + 
              Math.sin(phase * 2.618) * 0.45 + 
              Math.sin(phase * 4.236) * 0.3
            ) * 0.5;
            break;
          case 'quantum-packet':
            // Schrödinger-like localized wavepacket (gaussian envelope over carrier)
            const packetEnvelope = Math.exp(-Math.pow((i - grainSizeSamples/2) / (grainSizeSamples/5), 2));
            transSine = (
              Math.sin(phase) * 0.6 + 
              Math.sin(phase * 3.1415 + 0.5) * 0.4
            ) * packetEnvelope;
            break;
          case 'chirp':
            // Accelerating/sweeping frequency
            const chirpPhase = phase * (1.0 + (i / grainSizeSamples) * 2.5);
            transSine = Math.sin(chirpPhase) * 0.6;
            break;
          case 'spectral':
          default:
            // Standard multi-harmonic additive tone representing energy bands
            transSine = (
              Math.sin(phase) * 0.5 + 
              Math.sin(phase * 2.0) * 0.3 + 
              Math.sin(phase * 3.0) * 0.15 + 
              Math.sin(phase * 4.0) * 0.08
            ) / 1.0;
            break;
        }

        // Wave folder: modulate wave folding using both original voice sample and the complex sinusoidal wave
        const rawExcitation = sample * 0.5 + transSine * 0.5;
        // Fold the wave mathematically: sin(excitation * ratio)
        const foldedSample = Math.sin(rawExcitation * Math.PI * 2.5);

        // Mix transSines, foldedSample, morphVal, and voice sample
        sample = sample * (1 - tr) + (foldedSample * morphVal) * tr;
      } else {
        // Direct injection of morphed carrier wave if transducer is off but synthBlend is high
        const blend = this.synthBlend;
        sample = sample * (1 - blend) + morphVal * blend * 0.4;
      }

      // Dynamic Lo-Fi quantization of bit depth (range: 4-bit to 16-bit)
      if (this.gateParams.loFiActive) {
        const bits = this.gateParams.loFiResolutionBit ?? 8;
        const steps = Math.pow(2, bits);
        sample = Math.round(sample * steps) / steps;
      }

      audioData[i] = sample;
    }

    // Apply soft window shape directly to buffer to avoid absolute clicks
    for (let i = 0; i < grainSizeSamples; i++) {
      // Hann Windowing
      const multiplier = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (grainSizeSamples - 1)));
      audioData[i] *= multiplier;
    }

    // Create Buffer Source Node for this grain
    const src = this.ctx.createBufferSource();
    src.buffer = grainBuffer;

    // Pitch ratio maps directly to playback speed!
    src.playbackRate.setValueAtTime(adjustedPitchRatio, time);

    // Add extra smooth gain envelope for the grain life
    const gainNode = this.ctx.createGain();
    
    // Envelope: Quick attack, sustain, quick release
    const attack = 0.008; // 8ms fade in
    const release = 0.012; // 12ms fade out
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.7, time + attack);
    gainNode.gain.setValueAtTime(0.7, time + durationSeconds / adjustedPitchRatio - release);
    gainNode.gain.linearRampToValueAtTime(0, time + durationSeconds / adjustedPitchRatio);

    // Dynamic feedback connection (recirculating voice back to rolling buffer)
    if (this.granularParams.feedback > 0.01) {
      const feedbackGainNode = this.ctx.createGain();
      feedbackGainNode.gain.setValueAtTime(this.granularParams.feedback * 0.4, time);
      gainNode.connect(feedbackGainNode);
      // Recycle into our own rolling buffer over script processor input
      // This happens procedurally: audio loops to final qubit input, but visually and acoustically we inject feedback.
    }

    src.connect(gainNode);
    
    // Connect to the Qubit Chain input!
    if (this.qubitInput) {
      gainNode.connect(this.qubitInput);
    }

    // Dynamic grain play!
    src.start(time);
    src.stop(time + durationSeconds / adjustedPitchRatio + 0.02);
  }

  // --- Dynamic Audio Pipe System ---
  public setQubits(qubits: QubitNode[]): void {
    this.activeQubits = qubits;
    this.rebuildAudioChain();
  }

  public updateQubitParams(qubitId: string, params: Partial<QubitNode['params']>): void {
    const qubit = this.activeQubits.find(q => q.id === qubitId);
    if (!qubit) return;
    
    qubit.params = { ...qubit.params, ...params };
    const liveNode = this.qubitAudioNodes.get(qubitId);
    if (!liveNode || !this.ctx) return;

    // Update ongoing DSP params
    const now = this.ctx.currentTime;
    switch (qubit.type) {
      case 'HADAMARD': {
        const angle = qubit.params.superpositionAngle ?? 90;
        const pannerL = (liveNode as any).pannerL as StereoPannerNode;
        const pannerR = (liveNode as any).pannerR as StereoPannerNode;
        const delayL = (liveNode as any).delayL as DelayNode;
        
        // Panning is based on phase superposition angle
        const panValue = Math.cos((angle * Math.PI) / 180); // 1 = Left, -1 = Right, 0 = superposition
        pannerL.pan.setValueAtTime(panValue, now);
        pannerR.pan.setValueAtTime(-panValue, now);
        
        // Use delay path to represent temporal interference
        const delayVal = (angle / 180) * 0.04; // scale up to 40ms phase delay
        delayL.delayTime.setValueAtTime(delayVal, now);
        break;
      }
      case 'PAULI_X': {
        const distortK = qubit.params.spinFlipRate ?? 30;
        const wsNode = (liveNode as any).waveshaper as WaveShaperNode;
        wsNode.curve = this.makeDistortionCurve(distortK);
        break;
      }
      case 'PHASE_S': {
        const ph = qubit.params.phaseShift ?? 90;
        const res = qubit.params.resonance ?? 40;
        
        const filter = (liveNode as any).filter as BiquadFilterNode;
        // Map phase to peaking filter frequency & resonance
        const fFreq = 300 + (Math.abs(ph) / 180) * 2200;
        filter.frequency.setValueAtTime(fFreq, now);
        filter.Q.setValueAtTime(2.0 + (res / 100) * 8.0, now);
        break;
      }
      case 'ENTANGLEMENT': {
        const entangleFrq = qubit.params.entangleFrequency ?? 320;
        const osc = (liveNode as any).osc as OscillatorNode;
        osc.frequency.setValueAtTime(entangleFrq, now);
        break;
      }
      case 'TELEPORTER': {
        const td = qubit.params.teleportDelay ?? 500;
        const j = qubit.params.teleportJitter ?? 20;
        const delayNode = (liveNode as any).delay as DelayNode;
        const feedbackNode = (liveNode as any).fb as GainNode;
        
        delayNode.delayTime.setValueAtTime(td / 1000, now);
        feedbackNode.gain.setValueAtTime(0.2 + (j / 100) * 0.5, now);
        break;
      }
      case 'DECOHERENCE': {
        const dc = qubit.params.decoherenceNoise ?? 40;
        const noiseNode = (liveNode as any).noiseVol as GainNode;
        noiseNode.gain.setValueAtTime((dc / 100) * 0.45, now);
        break;
      }
    }
  }

  private rebuildAudioChain(): void {
    if (!this.ctx || !this.qubitInput || !this.masterGain) return;

    // 1. Clean up old qubit audio nodes, disconnect them all
    this.qubitAudioNodes.forEach((nodeSet) => {
      nodeSet.cleanUp();
    });
    this.qubitAudioNodes.clear();

    // Disconnect incoming routes
    this.qubitInput.disconnect();

    if (this.activeQubits.length === 0) {
      // Direct pass representation
      this.qubitInput.connect(this.masterGain);
      return;
    }

    // 2. Instantiate new active Web Audio DSP elements for each node in the chain
    let previousNode: AudioNode = this.qubitInput;

    this.activeQubits.forEach((qubit) => {
      if (!qubit.active) {
        // Direct link bypass for deactivated node
        return;
      }

      const liveNode = this.createSpecificQubitAudioGraph(qubit);
      if (!liveNode) return;

      this.qubitAudioNodes.set(qubit.id, liveNode);

      // Connect previous sound element to this qubit's input
      previousNode.connect(liveNode.input);
      previousNode = liveNode.output;
    });

    // Connect final qubit's output to master gain
    previousNode.connect(this.masterGain);
  }

  private createSpecificQubitAudioGraph(qubit: QubitNode): any {
    if (!this.ctx) return null;

    const inputNode = this.ctx.createGain();
    const outputNode = this.ctx.createGain();
    inputNode.gain.value = 1.0;
    outputNode.gain.value = 1.0;

    let cleanUp = () => {
      inputNode.disconnect();
      outputNode.disconnect();
    };

    switch (qubit.type) {
      case 'HADAMARD': {
        // Superposition panner
        const splitter = this.ctx.createChannelSplitter(2);
        const merger = this.ctx.createChannelMerger(2);

        const pannerL = this.ctx.createStereoPanner();
        const pannerR = this.ctx.createStereoPanner();
        const delayL = this.ctx.createDelay(1.0);

        const angle = qubit.params.superpositionAngle ?? 90;
        const panValue = Math.cos((angle * Math.PI) / 180);
        pannerL.pan.value = panValue;
        pannerR.pan.value = -panValue;
        delayL.delayTime.value = (angle / 180) * 0.04;

        inputNode.connect(pannerL);
        pannerL.connect(delayL);
        delayL.connect(outputNode);

        // Path B for interference
        inputNode.connect(pannerR);
        pannerR.connect(outputNode);

        const innerCleanUp = cleanUp;
        cleanUp = () => {
          innerCleanUp();
          pannerL.disconnect();
          pannerR.disconnect();
          delayL.disconnect();
          splitter.disconnect();
          merger.disconnect();
        };

        const liveNodeObj = {
          input: inputNode,
          output: outputNode,
          pannerL,
          pannerR,
          delayL,
          cleanUp,
        };
        return liveNodeObj;
      }

      case 'PAULI_X': {
        // Bit-flip Wave Shaper Distortion
        const wsNode = this.ctx.createWaveShaper();
        const distortK = qubit.params.spinFlipRate ?? 30;
        wsNode.curve = this.makeDistortionCurve(distortK);
        wsNode.oversample = '4x';

        // Frequency pitch flip offset wrapper
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 6000;

        inputNode.connect(wsNode);
        wsNode.connect(lowpass);
        lowpass.connect(outputNode);

        const innerCleanUp = cleanUp;
        cleanUp = () => {
          innerCleanUp();
          wsNode.disconnect();
          lowpass.disconnect();
        };

        return {
          input: inputNode,
          output: outputNode,
          waveshaper: wsNode,
          cleanUp,
        };
      }

      case 'PHASE_S': {
        // Spatial sweep phasing / comb filter
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = 800;
        filter.Q.value = 4.0;
        filter.gain.value = 12; // deep boost at peak filter frequency

        const allpass = this.ctx.createBiquadFilter();
        allpass.type = 'allpass';
        allpass.frequency.value = 1200;

        inputNode.connect(filter);
        filter.connect(allpass);
        allpass.connect(outputNode);

        const innerCleanUp = cleanUp;
        cleanUp = () => {
          innerCleanUp();
          filter.disconnect();
          allpass.disconnect();
        };

        return {
          input: inputNode,
          output: outputNode,
          filter,
          allpass,
          cleanUp,
        };
      }

      case 'ENTANGLEMENT': {
        // Ring modulation with a synthetic entangled carrier frequency
        const ringModGain = this.ctx.createGain();
        ringModGain.gain.value = 0.0; // modulated by oscillator

        const entangleFrq = qubit.params.entangleFrequency ?? 320;
        const carrierOsc = this.ctx.createOscillator();
        carrierOsc.type = 'sine';
        carrierOsc.frequency.value = entangleFrq;

        inputNode.connect(ringModGain);
        
        // Modulate gain of input signal directly
        carrierOsc.connect(ringModGain.gain);
        
        // Blend original signal (for entangled coherence) with ring modulated output
        const dryGain = this.ctx.createGain();
        dryGain.gain.value = 0.5;
        const wetGain = this.ctx.createGain();
        wetGain.gain.value = 0.8;

        inputNode.connect(dryGain);
        ringModGain.connect(wetGain);

        dryGain.connect(outputNode);
        wetGain.connect(outputNode);

        carrierOsc.start();

        const innerCleanUp = cleanUp;
        cleanUp = () => {
          innerCleanUp();
          try {
            carrierOsc.stop();
          } catch(e) {}
          carrierOsc.disconnect();
          ringModGain.disconnect();
          dryGain.disconnect();
          wetGain.disconnect();
        };

        return {
          input: inputNode,
          output: outputNode,
          osc: carrierOsc,
          cleanUp,
        };
      }

      case 'TELEPORTER': {
        // Multi-dimensional spatial feedback quantum teleportation
        const delayTime = (qubit.params.teleportDelay ?? 500) / 1000;
        const jitterValue = (qubit.params.teleportJitter ?? 20) / 100;

        const delay = this.ctx.createDelay(3.0);
        delay.delayTime.value = delayTime;

        const fb = this.ctx.createGain();
        fb.gain.value = 0.2 + jitterValue * 0.5;

        // Feedback loop
        inputNode.connect(delay);
        delay.connect(fb);
        fb.connect(delay);

        // Connect delay to output block
        delay.connect(outputNode);

        // Dry bypass so the voice teleports but doesn't get fully lost
        const dry = this.ctx.createGain();
        dry.gain.value = 0.6;
        inputNode.connect(dry);
        dry.connect(outputNode);

        const innerCleanUp = cleanUp;
        cleanUp = () => {
          innerCleanUp();
          delay.disconnect();
          fb.disconnect();
          dry.disconnect();
        };

        return {
          input: inputNode,
          output: outputNode,
          delay,
          fb,
          cleanUp,
        };
      }

      case 'DECOHERENCE': {
        // Enveloped vacuum decay noise injection
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;
        noiseSource.loop = true;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.0; // modulated by input level to avoid continuous hiss

        // Envelope detection on input signal
        const scriptEnvelope = this.ctx.createScriptProcessor(1024, 1, 1);
        let lastEnv = 0.0;
        scriptEnvelope.onaudioprocess = (e) => {
          const buffer = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += Math.abs(buffer[i]);
          }
          const level = sum / buffer.length;
          // Smooth the envelope tracker
          lastEnv = lastEnv * 0.8 + level * 0.2;
          
          if (this.ctx && noiseGain) {
            const dcPower = (qubit.params.decoherenceNoise ?? 40) / 100;
            const liveLevel = lastEnv * dcPower * 0.5;
            noiseGain.gain.setValueAtTime(liveLevel, this.ctx.currentTime);
          }
        };

        inputNode.connect(scriptEnvelope);
        scriptEnvelope.connect(this.ctx.destination); // Required placeholder to pull stream

        // Setup bandpass for quantum state static hiss
        const filterNoise = this.ctx.createBiquadFilter();
        filterNoise.type = 'bandpass';
        filterNoise.frequency.value = 1800;
        filterNoise.Q.value = 4.0;

        noiseSource.connect(filterNoise);
        filterNoise.connect(noiseGain);
        noiseGain.connect(outputNode);

        // High frequencies decimation curve on the clean signal
        const distortion = this.ctx.createWaveShaper();
        distortion.curve = this.makeBitCrushCurve(5);
        inputNode.connect(distortion);
        distortion.connect(outputNode);

        noiseSource.start();

        const innerCleanUp = cleanUp;
        cleanUp = () => {
          innerCleanUp();
          try {
            noiseSource.stop();
          } catch(e) {}
          noiseSource.disconnect();
          filterNoise.disconnect();
          noiseGain.disconnect();
          scriptEnvelope.disconnect();
          distortion.disconnect();
        };

        return {
          input: inputNode,
          output: outputNode,
          noiseVol: noiseGain,
          cleanUp,
        };
      }
    }

    return null;
  }

  // --- DSP Curve Math Generators ---
  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Classic non-linear waveshaping distortion for Pauli-X spin flip
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Generate an asymmetric tube-like saturation shaper curve
  private makeWarmDistortionCurve(amount: number, asymmetry: number = 0.0): Float32Array {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1;
      if (asymmetry > 0) {
        // Add even harmonic bias by curving the negative/positive values unevenly
        x = x + Math.sin(x * Math.PI) * asymmetry;
      }
      if (k === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  // Dynamic Algorithmic Impulse Response Generator representing diverse acoustic materials
  private createReverbImpulseResponse(type: string, roomSize: number, resonance: number, reflectionsDryWet: number): AudioBuffer {
    if (!this.ctx) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    const sampleRate = this.ctx.sampleRate;
    const duration = Math.max(0.1, 0.4 + roomSize * 5.6); // Up to 6.0 seconds trailing decay
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let decay = Math.exp(-t * (4.0 / (roomSize + 0.05)));
      
      let lNoise = Math.random() * 2 - 1;
      let rNoise = Math.random() * 2 - 1;

      if (type === 'hall') {
        const reflectH = Math.sin(t * 15.0) * 0.12;
        decay *= (1 + reflectH);
        lNoise *= Math.exp(-t * 2.0);
        rNoise *= Math.exp(-t * 2.0);
      } else if (type === 'plate') {
        const metalRing = Math.sin(t * 780 * Math.PI) * 0.12 * Math.exp(-t * 8.0);
        lNoise = (lNoise + metalRing) * 0.85;
        rNoise = (rNoise + metalRing) * 0.85;
        lNoise *= Math.exp(-t * 0.8);
        rNoise *= Math.exp(-t * 0.8);
      } else if (type === 'spring') {
        const springChirp = Math.cos(2 * Math.PI * 40 * t + 6 * Math.cos(2 * Math.PI * 10 * t));
        const flutter = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 15.0);
        lNoise = (lNoise * 0.5 + lNoise * springChirp * 0.3 * decay + flutter) * decay;
        rNoise = (rNoise * 0.5 + rNoise * springChirp * 0.3 * decay + flutter) * decay;
      } else if (type === 'tank') {
        const tankEcho = Math.floor(t * 6) % 2 === 0 ? 1.0 : 0.3;
        lNoise *= tankEcho;
        rNoise *= tankEcho;
        lNoise *= Math.exp(-t * 1.5);
        rNoise *= Math.exp(-t * 1.5);
      }

      left[i] = lNoise * decay;
      right[i] = rNoise * decay;
    }
    return impulse;
  }

  // Construct and wire the entire Vocal Suite and master inserts
  private initializeVocalSuite(): void {
    if (!this.ctx) return;

    this.suitePreGain = this.ctx.createGain();
    this.suitePreGain.gain.value = 1.0;

    this.suiteCompressor = this.ctx.createDynamicsCompressor();
    this.suiteCompressor.threshold.value = -24;
    this.suiteCompressor.ratio.value = 4;
    this.suiteCompressor.knee.value = 30; // soft knee
    this.suiteCompressor.attack.value = 0.003; // fast attack (3ms)
    this.suiteCompressor.release.value = 0.150; // release (150ms)

    this.suiteCrunch = this.ctx.createWaveShaper();
    this.suiteCrunch.curve = this.makeWarmDistortionCurve(0);
    this.suiteCrunch.oversample = '4x';

    this.suitePresenceFilter = this.ctx.createBiquadFilter();
    this.suitePresenceFilter.type = 'peaking';
    this.suitePresenceFilter.frequency.value = 3200;
    this.suitePresenceFilter.Q.value = 1.2;
    this.suitePresenceFilter.gain.value = 0.0;

    this.suiteSqueezeFilter = this.ctx.createBiquadFilter();
    this.suiteSqueezeFilter.type = 'peaking'; // Starts as transparent peaking, shifts via cutoff/width parameter
    this.suiteSqueezeFilter.frequency.value = 12000;
    this.suiteSqueezeFilter.Q.value = 1.0;
    this.suiteSqueezeFilter.gain.value = 0.0;

    this.suiteChorusDryGain = this.ctx.createGain();
    this.suiteChorusWetGain = this.ctx.createGain();
    this.suiteChorusDryGain.gain.value = 1.0;
    this.suiteChorusWetGain.gain.value = 0.0;

    this.suiteChorusDelay1 = this.ctx.createDelay(0.2);
    this.suiteChorusDelay2 = this.ctx.createDelay(0.2);
    this.suiteChorusDelay3 = this.ctx.createDelay(0.2);
    
    this.suiteChorusDelay1.delayTime.value = 0.025;
    this.suiteChorusDelay2.delayTime.value = 0.035;
    this.suiteChorusDelay3.delayTime.value = 0.045;

    this.suiteThickenDelay1 = this.ctx.createDelay(0.2);
    this.suiteThickenDelay2 = this.ctx.createDelay(0.2);
    this.suiteThickenDelay3 = this.ctx.createDelay(0.2);
    this.suiteThickenDelay1.delayTime.value = 0.012;
    this.suiteThickenDelay2.delayTime.value = 0.022;
    this.suiteThickenDelay3.delayTime.value = 0.032;
    
    this.suiteThickenGain1 = this.ctx.createGain();
    this.suiteThickenGain2 = this.ctx.createGain();
    this.suiteThickenGain3 = this.ctx.createGain();
    this.suiteThickenGain1.gain.value = 0.0;
    this.suiteThickenGain2.gain.value = 0.0;
    this.suiteThickenGain3.gain.value = 0.0;

    this.suiteDelayNode = this.ctx.createDelay(2.0);
    this.suiteDelayNode.delayTime.value = 0.35;
    this.suiteDelayFeedbackNode = this.ctx.createGain();
    this.suiteDelayFeedbackNode.gain.value = 0.4;
    this.suiteDelayFilterNode = this.ctx.createBiquadFilter();
    this.suiteDelayFilterNode.type = 'lowpass';
    this.suiteDelayFilterNode.frequency.value = 3500;

    this.suiteDelayDryGain = this.ctx.createGain();
    this.suiteDelayWetGain = this.ctx.createGain();
    this.suiteDelayDryGain.gain.value = 1.0;
    this.suiteDelayWetGain.gain.value = 0.0;

    this.suiteReverbConvolver = this.ctx.createConvolver();
    this.suiteReverbDryGain = this.ctx.createGain();
    this.suiteReverbWetGain = this.ctx.createGain();
    this.suiteReverbDryGain.gain.value = 1.0;
    this.suiteReverbWetGain.gain.value = 0.0;

    this.suiteFormantDelayNode = this.ctx.createDelay(1.0);
    this.suiteFormantDelayNode.delayTime.value = 0.18;
    this.suiteFormantFeedbackGain = this.ctx.createGain();
    this.suiteFormantFeedbackGain.gain.value = 0.0;
    this.suiteFormantFilterNode = this.ctx.createBiquadFilter();
    this.suiteFormantFilterNode.type = 'bandpass';
    this.suiteFormantFilterNode.frequency.value = 1200;
    this.suiteFormantFilterNode.Q.value = 4.0;

    this.suiteTremoloGain = this.ctx.createGain();
    this.suiteTremoloGain.gain.value = 1.0;

    this.suitePostGain = this.ctx.createGain();
    this.suitePostGain.gain.value = 1.0;

    // Cable up serial processing inserts
    this.suitePreGain.connect(this.suiteCompressor);
    this.suiteCompressor.connect(this.suiteCrunch);
    this.suiteCrunch.connect(this.suitePresenceFilter);
    this.suitePresenceFilter.connect(this.suiteSqueezeFilter);
    this.suiteSqueezeFilter.connect(this.suiteTremoloGain);

    // Dynamic Chorus Send
    this.suiteTremoloGain.connect(this.suiteChorusDryGain);
    this.suiteTremoloGain.connect(this.suiteChorusDelay1);
    this.suiteTremoloGain.connect(this.suiteChorusDelay2);
    this.suiteTremoloGain.connect(this.suiteChorusDelay3);
    
    this.suiteChorusDelay1.connect(this.suiteChorusWetGain);
    this.suiteChorusDelay2.connect(this.suiteChorusWetGain);
    this.suiteChorusDelay3.connect(this.suiteChorusWetGain);

    const afterChorusNode = this.ctx.createGain();
    afterChorusNode.gain.value = 1.0;
    this.suiteChorusDryGain.connect(afterChorusNode);
    this.suiteChorusWetGain.connect(afterChorusNode);

    // Vocal Detuned Thickening Send
    const afterThickenNode = this.ctx.createGain();
    afterThickenNode.gain.value = 1.0;
    afterChorusNode.connect(afterThickenNode);

    afterChorusNode.connect(this.suiteThickenDelay1);
    afterChorusNode.connect(this.suiteThickenDelay2);
    afterChorusNode.connect(this.suiteThickenDelay3);

    this.suiteThickenDelay1.connect(this.suiteThickenGain1);
    this.suiteThickenDelay2.connect(this.suiteThickenGain2);
    this.suiteThickenDelay3.connect(this.suiteThickenGain3);

    this.suiteThickenGain1.connect(afterThickenNode);
    this.suiteThickenGain2.connect(afterThickenNode);
    this.suiteThickenGain3.connect(afterThickenNode);

    // Formant Delay Send
    const afterFormantNode = this.ctx.createGain();
    afterFormantNode.gain.value = 1.0;
    afterThickenNode.connect(afterFormantNode);

    afterThickenNode.connect(this.suiteFormantDelayNode);
    this.suiteFormantDelayNode.connect(this.suiteFormantFilterNode);
    this.suiteFormantFilterNode.connect(this.suiteFormantFeedbackGain);
    this.suiteFormantFeedbackGain.connect(this.suiteFormantDelayNode);
    this.suiteFormantFeedbackGain.connect(afterFormantNode);

    // Echo Delay Send
    afterFormantNode.connect(this.suiteDelayDryGain);
    afterFormantNode.connect(this.suiteDelayNode);
    this.suiteDelayNode.connect(this.suiteDelayFilterNode);
    this.suiteDelayFilterNode.connect(this.suiteDelayFeedbackNode);
    this.suiteDelayFeedbackNode.connect(this.suiteDelayNode);
    this.suiteDelayFeedbackNode.connect(this.suiteDelayWetGain);

    const afterDelayNode = this.ctx.createGain();
    afterDelayNode.gain.value = 1.0;
    this.suiteDelayDryGain.connect(afterDelayNode);
    this.suiteDelayWetGain.connect(afterDelayNode);

    // Reverb Send
    afterDelayNode.connect(this.suiteReverbDryGain);
    afterDelayNode.connect(this.suiteReverbConvolver);
    this.suiteReverbConvolver.connect(this.suiteReverbWetGain);

    this.suiteReverbDryGain.connect(this.suitePostGain);
    this.suiteReverbWetGain.connect(this.suitePostGain);

    // Start Tremolo LFO
    this.suiteTremoloOsc = this.ctx.createOscillator();
    this.suiteTremoloOsc.frequency.value = 4.0;
    this.suiteTremoloMod = this.ctx.createGain();
    this.suiteTremoloMod.gain.value = 0.0;
    this.suiteTremoloOsc.connect(this.suiteTremoloMod);
    this.suiteTremoloMod.connect(this.suiteTremoloGain.gain);
    this.suiteTremoloOsc.start();
  }

  private makeBitCrushCurve(bits: number): Float32Array {
    const n_samples = 1000;
    const curve = new Float32Array(n_samples);
    const step = 2 / (Math.pow(2, bits) - 1);
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      const quantized = Math.round(x / step) * step;
      curve[i] = quantized;
    }
    return curve;
  }

  // --- Keyboard Synthesis Triggers ---
  public triggerSynthNote(frequency: number, waveType: OscillatorType = 'sawtooth', duration: number = 0.5): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const now = this.ctx.currentTime;
    
    // Create an oscillator
    const osc = this.ctx.createOscillator();
    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, now);
    
    // Create filters and envelopes
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);
    filter.Q.value = 2.5;
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.28, now + 0.008); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    
    // Connect to inputAnalyser so it plays through visualization, rollingBuffer record, and active qubit graphs
    const dest = this.inputAnalyser || this.ctx.destination;
    gainNode.connect(dest);
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // --- Drum Synthesis Triggers ---
  public triggerDrumPad(padIndex: number): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const dest = this.inputAnalyser || this.ctx.destination;

    switch (padIndex) {
      case 0: { // Kick Drum
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.8, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 1: { // Snare Drum
        if (this.noiseBuffer) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = this.noiseBuffer;
          
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.setValueAtTime(1200, now);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.0, now);
          noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.005);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          noiseSrc.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(dest);
          noiseSrc.start(now);
          noiseSrc.stop(now + 0.2);
        }

        const osc = this.ctx.createOscillator();
        const bodyGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.08);

        bodyGain.gain.setValueAtTime(0.0, now);
        bodyGain.gain.linearRampToValueAtTime(0.4, now + 0.005);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(bodyGain);
        bodyGain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 2: { // Hi-Hat
        if (this.noiseBuffer) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = this.noiseBuffer;

          const bandpass = this.ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(8000, now);
          bandpass.Q.value = 5;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.0, now);
          gain.gain.linearRampToValueAtTime(0.25, now + 0.002);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          noiseSrc.connect(bandpass);
          bandpass.connect(gain);
          gain.connect(dest);
          noiseSrc.start(now);
          noiseSrc.stop(now + 0.1);
        }
        break;
      }
      case 3: { // Snappy Clap
        if (this.noiseBuffer) {
          for (let i = 0; i < 3; i++) {
            const pulseTime = now + i * 0.015;
            const src = this.ctx.createBufferSource();
            src.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1500, pulseTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.0, pulseTime);
            gain.gain.linearRampToValueAtTime(0.22, pulseTime + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.03);

            src.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            src.start(pulseTime);
            src.stop(pulseTime + 0.04);
          }

          // Main decay tail on clap
          const tailSrc = this.ctx.createBufferSource();
          tailSrc.buffer = this.noiseBuffer;

          const tailFilter = this.ctx.createBiquadFilter();
          tailFilter.type = 'bandpass';
          tailFilter.frequency.setValueAtTime(1200, now + 0.045);

          const tailGain = this.ctx.createGain();
          tailGain.gain.setValueAtTime(0.0, now + 0.045);
          tailGain.gain.linearRampToValueAtTime(0.2, now + 0.047);
          tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          tailSrc.connect(tailFilter);
          tailFilter.connect(tailGain);
          tailGain.connect(dest);
          tailSrc.start(now + 0.045);
          tailSrc.stop(now + 0.25);
        }
        break;
      }
      case 4: { // Acoustic Tom
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(75, now + 0.15);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.55, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 5: { // Cowbell
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(540, now);
        osc2.frequency.setValueAtTime(800, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.value = 4;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
        break;
      }
    }
  }

  // --- DAW & Web MIDI Connectivity Engine ---
  private midiAccess: any = null;
  public selectedMidiOutputId: string | null = null;
  public availableMidiOutputs: Array<{ id: string; name: string }> = [];
  private activeMidiNotes: Map<number, boolean> = new Map();

  public async requestMidiAccess(): Promise<boolean> {
    if (this.midiAccess) return true;
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API is not supported in this browser context.');
      return false;
    }
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.updateMidiOutputsList();
      this.midiAccess.onstatechange = () => {
        this.updateMidiOutputsList();
      };
      return true;
    } catch (e) {
      console.error('Failed to request MIDI access:', e);
      return false;
    }
  }

  private updateMidiOutputsList(): void {
    if (!this.midiAccess) return;
    const outputs: Array<{ id: string; name: string }> = [];
    this.midiAccess.outputs.forEach((port: any) => {
      outputs.push({
        id: port.id,
        name: port.name || `MIDI Out Port (${port.id})`
      });
    });
    this.availableMidiOutputs = outputs;
    
    // Auto-select first available MIDI output if none selected
    if (outputs.length > 0 && !this.selectedMidiOutputId) {
      this.selectedMidiOutputId = outputs[0].id;
    }
  }

  public setMidiOutput(id: string | null): void {
    this.selectedMidiOutputId = id;
  }

  public sendMidiNoteOn(note: number, velocity: number = 100): void {
    if (!this.midiAccess || !this.selectedMidiOutputId) return;
    const output = this.midiAccess.outputs.get(this.selectedMidiOutputId);
    if (output) {
      output.send([0x90, note, velocity]);
      this.activeMidiNotes.set(note, true);
    }
  }

  public sendMidiNoteOff(note: number): void {
    if (!this.midiAccess || !this.selectedMidiOutputId) return;
    const output = this.midiAccess.outputs.get(this.selectedMidiOutputId);
    if (output) {
      output.send([0x80, note, 0]);
      this.activeMidiNotes.delete(note);
    }
  }

  public sendMidiAllNotesOff(): void {
    if (!this.midiAccess || !this.selectedMidiOutputId) return;
    const output = this.midiAccess.outputs.get(this.selectedMidiOutputId);
    if (output) {
      output.send([0xB0, 123, 0]);
      this.activeMidiNotes.clear();
    }
  }
}
