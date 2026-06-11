/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  Layers, 
  Power, 
  Play, 
  Square, 
  Activity, 
  Sliders, 
  Zap, 
  ChevronsRight,
  Info,
  AlertTriangle,
  RotateCcw,
  Save,
  ZapOff,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QubitNode, QubitType, GranularParams, VoiceGateParams, QuantumPreset } from './types';
import { QuantumAudioEngine } from './lib/audioEngine';
import ScientificHud from './components/ScientificHud';
import CymaticsPanel from './components/CymaticsPanel';
import PresetManager from './components/PresetManager';
import AetherKeyboardDuo from './components/AetherKeyboardDuo';
import { AetherVocalFXSuite } from './components/AetherVocalFXSuite';
import { QuantumRecordingStudio } from './components/QuantumRecordingStudio';


export default function App() {
  const [engine] = useState(() => new QuantumAudioEngine());
  
  // Audio state
  const [micState, setMicState] = useState<'idle' | 'recording' | 'error' | 'simulated'>('idle');
  const [micErrorMessage, setMicErrorMessage] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [flowLocked, setFlowLocked] = useState<boolean>(false);
  
  const flowLockedRef = useRef(flowLocked);
  useEffect(() => {
    flowLockedRef.current = flowLocked;
  }, [flowLocked]);
  
  // Live computed voice amplitude for physics updates
  const [currentEnergy, setCurrentEnergy] = useState<number>(0);

  // Live noise gate metering states
  const [liveInputDb, setLiveInputDb] = useState<number>(-100);
  const [liveGateReduction, setLiveGateReduction] = useState<number>(0);
  const [liveGateState, setLiveGateState] = useState<'OPEN' | 'CLOSED' | 'ATTACK' | 'RELEASE' | 'HOLD'>('CLOSED');

  const handleLoadPreset = (preset: QuantumPreset) => {
    if (flowLocked) {
      alert("System configuration and parameters are currently locked under Quantum Flow Lock. Please disengage the padlock to load presets.");
      return;
    }
    setActivePresetId(preset.id);
    // Update core voice & synth parameters
    setQubits(preset.qubits);
    setGranularParams(preset.granularParams);
    setVoiceParams(preset.voiceParams);

    // Focus on the first qubit in the new chain
    if (preset.qubits.length > 0) {
      setSelectedQubitId(preset.qubits[0].id);
    }

    // Configure live engine registers instantly
    engine.setQubits(preset.qubits);
    engine.setGranularParams(preset.granularParams);
    engine.setVoiceGateParams(preset.voiceParams);
    preset.qubits.forEach((q) => {
      engine.updateQubitParams(q.id, q.params);
    });
  };

  const handleQuickSavePreset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickPresetName.trim()) return;

    const freshPreset: QuantumPreset = {
      id: `p-custom-${Date.now()}`,
      name: quickPresetName.trim(),
      description: 'Saved custom state configuration from live Qubit Pipeline.',
      category: quickPresetCategory,
      qubits: JSON.parse(JSON.stringify(qubits)),
      granularParams: { ...granularParams },
      voiceParams: { ...voiceParams },
      waveformMorph: engine ? engine.waveformMorph : undefined,
      wavetableTransducer: engine ? engine.wavetableTransducer : undefined,
      transducerFormulation: engine ? engine.transducerFormulation : undefined,
      synthBlend: engine ? engine.synthBlend : undefined
    };

    const updated = [...userPresets, freshPreset];
    setUserPresets(updated);
    localStorage.setItem('vgs_user_presets', JSON.stringify(updated));
    setActivePresetId(freshPreset.id);
    setQuickPresetName('');
    setIsSavingPreset(false);
  };

  const handleRecallCymaticSnapshot = (n: number, m: number, reactivity: number, colorScheme: string) => {
    // Recalled cymatics patterns successfully inside dashboard
  };
  
  // Synth/Voice params
  const [granularParams, rawSetGranularParams] = useState<GranularParams>({
    grainSize: 180,
    overlap: 3,
    pitchRatio: 1.0,
    jitter: 15,
    spray: 25,
    feedback: 0.1,
  });
  const setGranularParams = (val: React.SetStateAction<GranularParams>) => {
    if (flowLockedRef.current) return;
    rawSetGranularParams(val);
  };

  const [voiceParams, rawSetVoiceParams] = useState<VoiceGateParams>({
    threshold: -45,
    gain: 1.0,
    pitchShift: 0,
    attack: 5,
    release: 150,
    hold: 100,
    attenuation: -80,
    hysteresis: 4,
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
  });
  const setVoiceParams = (val: React.SetStateAction<VoiceGateParams>) => {
    if (flowLockedRef.current) return;
    rawSetVoiceParams(val);
  };

  // Qubit list state
  const [qubits, rawSetQubits] = useState<QubitNode[]>([
    {
      id: 'q-hadamard-1',
      type: 'HADAMARD',
      name: 'Superposition (H)',
      symbol: 'H',
      description: 'Creates a 50/50 stereo superposition with temporal phase interference.',
      active: true,
      color: '#06b6d4', // cyan-500
      params: { superpositionAngle: 90 }
    },
    {
      id: 'q-entangle-1',
      type: 'ENTANGLEMENT',
      name: 'Coherent Entanglement (Ψ)',
      symbol: 'Ψ',
      description: 'Entangles voice with synthetic acoustic carriers, generating ring modulations.',
      active: true,
      color: '#8b5cf6', // violet-500
      params: { entangleFrequency: 320 }
    },
    {
      id: 'q-teleport-1',
      type: 'TELEPORTER',
      name: 'Quantum Teleporter (T)',
      symbol: 'T',
      description: 'Instantly translates audio waves over variable echo loops.',
      active: true,
      color: '#ec4899', // pink-500
      params: { teleportDelay: 480, teleportJitter: 35 }
    }
  ]);
  const setQubits = (val: React.SetStateAction<QubitNode[]>) => {
    if (flowLockedRef.current) return;
    rawSetQubits(val);
  };

  const [selectedQubitId, setSelectedQubitId] = useState<string>('q-hadamard-1');

  // Synchronized user presets list
  const [userPresets, setUserPresets] = useState<QuantumPreset[]>(() => {
    const saved = localStorage.getItem('vgs_user_presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [activePresetId, setActivePresetId] = useState<string>('f-aether-whispers');

  // Track pre-bypass active state mappings for global non-destructive toggling
  const [preBypassActiveStates, setPreBypassActiveStates] = useState<Record<string, boolean> | null>(null);

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [quickPresetName, setQuickPresetName] = useState('');
  const [quickPresetCategory, setQuickPresetCategory] = useState('Atmospheric');

  // Interactive visualizer canvas references
  const inputWaveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputWaveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitalStageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation Frame tracker
  const animationFrameId = useRef<number | null>(null);

  // Synchronize initial & updated params directly to the audio engine
  useEffect(() => {
    engine.setGranularParams(granularParams);
  }, [granularParams, engine]);

  useEffect(() => {
    engine.setVoiceGateParams(voiceParams);
  }, [voiceParams, engine]);

  useEffect(() => {
    engine.setMasterVolume(isMuted ? 0 : volume);
  }, [volume, isMuted, engine]);

  useEffect(() => {
    engine.setQubits(qubits);
  }, [qubits, engine]);

  // Launch and capture high performance visualization curves at 60fps
  useEffect(() => {
    let frameCount = 0;
    const drawFreqWaveforms = () => {
      // 1. Pre-Qubit Raw Grain Visualizer
      if (engine.inputAnalyser && inputWaveCanvasRef.current) {
        const canvas = inputWaveCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          
          // Audio analyzer query
          const bufferLength = engine.inputAnalyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          engine.inputAnalyser.getByteTimeDomainData(dataArray);

          ctx.fillStyle = 'rgba(13, 20, 31, 0.3)'; // semi transparent black-blue
          ctx.fillRect(0, 0, width, height);

          // Grid lines for scifi laboratory telemetry look
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
          ctx.lineWidth = 1;
          for (let i = 0; i < width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
          }
          for (let j = 0; j < height; j += 20) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(width, j);
            ctx.stroke();
          }

          // Compute raw wave path
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#06b6d4'; // Cyan glowing stroke
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#06b6d4';
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // scale around 1.0
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      }

      // 2. Post-Qubit Quantum Output State Spectrogram / Holograph
      if (engine.outputAnalyser && outputWaveCanvasRef.current) {
        const canvas = outputWaveCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          
          const bufferLength = engine.outputAnalyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          engine.outputAnalyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = 'rgba(13, 20, 31, 0.3)';
          ctx.fillRect(0, 0, width, height);

          // Grid lines style
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.1)';
          ctx.lineWidth = 1;
          for (let i = 0; i < width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
          }
          for (let j = 0; j < height; j += 20) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(width, j);
            ctx.stroke();
          }

          // Draw frequency bars or glow hills
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#ec4899'; // Pink glow
          
          const barWidth = (width / bufferLength) * 1.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * height * 0.95;

            // Compute dynamic color representing quantum energy shift
            const red = Math.min(255, 120 + barHeight * 1.5);
            const green = Math.max(10, 40 - barHeight * 0.2);
            const blue = Math.min(255, 180 + barHeight * 0.5);

            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

            x += barWidth;
          }
          ctx.shadowBlur = 0; // reset
        }
      }

      // 3. Central Quantum Particle Teleportation Matrix Canvas animation
      if (orbitalStageCanvasRef.current) {
        const canvas = orbitalStageCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Clear backdrop with slight trail smear for speed effect
          ctx.fillStyle = 'rgba(9, 13, 22, 0.15)';
          ctx.fillRect(0, 0, width, height);

          // Read real-time frequency info to affect particles
          let currentEnergy = 0;
          if (engine.outputAnalyser) {
            const bufferLength = engine.outputAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            engine.outputAnalyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let k = 0; k < 64; k++) sum += dataArray[k] || 0;
            currentEnergy = sum / 64;
          }

          // Update parent state at a throttled rate for formula HUD reactivity
          frameCount++;
          if (frameCount % 6 === 0) {
            setCurrentEnergy(currentEnergy);
            setLiveInputDb(engine.liveInputDb);
            setLiveGateReduction(engine.liveGateReduction);
            setLiveGateState(engine.gateState);
          }

          // Render simulated Qubits as glowing ring nodes of the matrix
          const activeQubitList = qubits.filter(q => q.active);
          const numActive = activeQubitList.length;

          if (numActive > 0) {
            // Draw continuous dynamic current laser beams connecting active quantum states
            ctx.beginPath();
            ctx.lineWidth = 1 + (currentEnergy / 80);
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
            ctx.shadowColor = '#8b5cf6';

            for (let qIdx = 0; qIdx <= numActive; qIdx++) {
              const xPos = 40 + (width - 80) * (qIdx / numActive);
              const yPos = height / 2 + Math.sin(Date.now() / 300 + qIdx) * 15;
              if (qIdx === 0) {
                ctx.moveTo(xPos, yPos);
              } else {
                ctx.lineTo(xPos, yPos);
              }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw floating soundwave particles traversing and warping as they teleport
            const particleCount = 12;
            for (let pIdx = 0; pIdx < particleCount; pIdx++) {
              // Custom path based on timeline & current quantum effects
              const t = ((Date.now() + pIdx * 1200) % 6000) / 6000; // normalized time 0..1
              const currentX = 40 + (width - 80) * t;

              // Which qubit is the particle currently "inside"?
              const qubitSegmentIndex = Math.floor(t * numActive);
              const activeQubit = activeQubitList[qubitSegmentIndex] || activeQubitList[numActive - 1];

              let currentY = height / 2 + Math.sin(Date.now() / 150 + pIdx) * (10 + currentEnergy * 0.15);
              let size = 2 + (currentEnergy / 60);
              let color = '#06b6d4'; // default cyan

              // Apply visual representation matching that specific qubit effect
              if (activeQubit) {
                color = activeQubit.color;
                switch (activeQubit.type) {
                  case 'HADAMARD':
                    // Oscillating / spinning visual
                    currentY += Math.sin(Date.now() / 50 + pIdx) * 20;
                    break;
                  case 'PAULI_X':
                    // Polar spike distortion
                    if (Math.random() > 0.8) currentY += (Math.random() - 0.5) * 45;
                    size *= 1.8;
                    break;
                  case 'PHASE_S':
                    // Elegant micro ripples
                    currentY += Math.cos(Date.now() / 80 + pIdx * 5) * 8;
                    break;
                  case 'ENTANGLEMENT':
                    // Pairs of entangled orbiting particles
                    ctx.beginPath();
                    ctx.arc(currentX, currentY - 14, size / 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#8b5cf6';
                    ctx.fill();
                    ctx.arc(currentX, currentY + 14, size / 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                  case 'TELEPORTER':
                    // Teleport fade blink
                    if (Math.sin(Date.now() / 60 + pIdx) > 0.4) {
                      ctx.beginPath();
                      ctx.arc(currentX, currentY, size * 2.2, 0, Math.PI * 2);
                      ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
                      ctx.stroke();
                    }
                    break;
                  case 'DECOHERENCE':
                    // Decaying sparks
                    currentY += (Math.random() - 0.5) * 12;
                    size *= 0.7;
                    break;
                }
              }

              ctx.beginPath();
              ctx.arc(currentX, currentY, size, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.shadowBlur = 8;
              ctx.shadowColor = color;
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }

          // Draw vertical boundaries
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(35, 0); ctx.lineTo(35, height);
          ctx.moveTo(width - 35, 0); ctx.lineTo(width - 35, height);
          ctx.stroke();
        }
      }

      // Loop frame recursively
      animationFrameId.current = requestAnimationFrame(drawFreqWaveforms);
    };

    drawFreqWaveforms();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [qubits, engine]);

  // Clean engine stream on unmount
  useEffect(() => {
    return () => {
      engine.stopMic();
    };
  }, [engine]);


  // Play/Stop Audio Capture toggle
  const handleMicToggle = async () => {
    if (micState === 'recording' || micState === 'simulated') {
      engine.stopMic();
      setMicState('idle');
      setMicErrorMessage('');
    } else {
      setMicState('recording');
      try {
        if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone media devices are blocked or unsupported in this secure iframe preview context. (Highly common due to browser security policies).');
        }
        const ok = await engine.startMic();
        if (!ok) {
          throw new Error('Microphone access was denied or the hardware device is currently unavailable.');
        }
        setMicErrorMessage('');
      } catch (err: any) {
        setMicState('error');
        setMicErrorMessage(err?.message || 'Permission denied or microphone unavailable.');
        
        // Auto-activate simulated state after a 3-second delay so that sound and telemetry function instantly!
        setTimeout(async () => {
          await handleEngageSimulation();
        }, 3000);
      }
    }
  };

  const handleEngageSimulation = async () => {
    setMicState('simulated');
    setMicErrorMessage('');
    const ok = await engine.startSimulation();
    if (!ok) {
      setMicState('error');
      setMicErrorMessage('Error configuring synthetic voice generators.');
    }
  };

  // Add Qubit options
  const handleAddQubit = (type: QubitType) => {
    if (flowLocked) return;
    let freshNode: QubitNode;
    const cleanId = `q-${type.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    switch (type) {
      case 'HADAMARD':
        freshNode = {
          id: cleanId,
          type: 'HADAMARD',
          name: 'Superposition (H)',
          symbol: 'H',
          description: 'Splits voice into out-of-phase left and right spatial energy fields.',
          active: true,
          color: '#06b6d4',
          params: { superpositionAngle: 90 }
        };
        break;
      case 'PAULI_X':
        freshNode = {
          id: cleanId,
          type: 'PAULI_X',
          name: 'Pauli-X Flip (X)',
          symbol: 'X',
          description: 'Flips high/low frequency wave spin. Adds digital quantization saturation.',
          active: true,
          color: '#f59e0b', // amber-500
          params: { spinFlipRate: 40 }
        };
        break;
      case 'PHASE_S':
        freshNode = {
          id: cleanId,
          type: 'PHASE_S',
          name: 'Phase Sweep (S)',
          symbol: 'S',
          description: 'Sweeps phase angle of audio streams over interactive peaking comb filters.',
          active: true,
          color: '#10b981', // emerald-500
          params: { phaseShift: 90, resonance: 45 }
        };
        break;
      case 'ENTANGLEMENT':
        freshNode = {
          id: cleanId,
          type: 'ENTANGLEMENT',
          name: 'Aether Entanglement (Ψ)',
          symbol: 'Ψ',
          description: 'Pairs internal voice with a locked ring modulator carrier signal.',
          active: true,
          color: '#8b5cf6',
          params: { entangleFrequency: 240 }
        };
        break;
      case 'TELEPORTER':
        freshNode = {
          id: cleanId,
          type: 'TELEPORTER',
          name: 'Delay Teleporter (T)',
          symbol: 'T',
          description: 'Instantly teleports vocal vibrations into a space echo delay stream.',
          active: true,
          color: '#ec4899',
          params: { teleportDelay: 400, teleportJitter: 25 }
        };
        break;
      case 'DECOHERENCE':
        freshNode = {
          id: cleanId,
          type: 'DECOHERENCE',
          name: 'Decoherence Chaos (D)',
          symbol: 'D',
          description: 'Simulates decoherence noise. Interjects vacuum crackle keyed to speech peaks.',
          active: true,
          color: '#ef4444', // red-500
          params: { decoherenceNoise: 30 }
        };
        break;
    }

    setQubits(prev => {
      const next = [...prev, freshNode];
      return next;
    });
    setSelectedQubitId(cleanId);
  };

  const handleDeleteQubit = (id: string) => {
    if (flowLocked) return;
    // Prevent empty list for engine stability, or let it happen cleanly
    setQubits(prev => {
      const filtered = prev.filter(q => q.id !== id);
      if (filtered.length > 0 && selectedQubitId === id) {
        setSelectedQubitId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleResetCircuit = () => {
    if (flowLocked) return;
    setQubits([]);
    setSelectedQubitId('');
    setPreBypassActiveStates(null);
  };

  const isChainFullyBypassed = qubits.length > 0 && qubits.every(q => !q.active);

  const handleBypassAllToggle = () => {
    if (flowLocked) return;
    if (qubits.length === 0) return;

    if (!isChainFullyBypassed) {
      // Non-destructively capture the state of qubits before turning them all off
      const activeMap: Record<string, boolean> = {};
      qubits.forEach(q => {
        activeMap[q.id] = q.active;
      });
      setPreBypassActiveStates(activeMap);
      setQubits(prev => prev.map(q => ({ ...q, active: false })));
    } else {
      // Restore the prior configuration
      if (preBypassActiveStates && Object.keys(preBypassActiveStates).length > 0) {
        setQubits(prev => prev.map(q => ({
          ...q,
          active: preBypassActiveStates[q.id] !== undefined ? preBypassActiveStates[q.id] : true
        })));
      } else {
        // Fallback or override: activate all qubits
        setQubits(prev => prev.map(q => ({ ...q, active: true })));
      }
      setPreBypassActiveStates(null);
    }
  };

  const handleToggleActiveQubit = (id: string) => {
    if (flowLocked) return;
    setQubits(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, active: !q.active };
      }
      return q;
    }));
  };

  const handleMoveLeftQubit = (index: number) => {
    if (flowLocked) return;
    if (index === 0) return;
    setQubits(prev => {
      const next = [...prev];
      const target = next[index];
      next[index] = next[index - 1];
      next[index - 1] = target;
      return next;
    });
  };

  const handleMoveRightQubit = (index: number) => {
    if (flowLocked) return;
    if (index === qubits.length - 1) return;
    setQubits(prev => {
      const next = [...prev];
      const target = next[index];
      next[index] = next[index + 1];
      next[index + 1] = target;
      return next;
    });
  };

  const handleUpdateQubitParam = (qubitId: string, paramName: string, val: number) => {
    if (flowLocked) return;
    setQubits(prev => prev.map(q => {
      if (q.id === qubitId) {
        const updatedParams = { ...q.params, [paramName]: val };
        // Instantly notify the live audio engine of param slide!
        engine.updateQubitParams(qubitId, updatedParams);
        return { ...q, params: updatedParams };
      }
      return q;
    }));
  };

  const activeSelectedQubit = qubits.find(q => q.id === selectedQubitId);

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Dynamic Telemetry Matrix Grid Background Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,24,42,0.6)_0%,rgba(7,11,19,1)_95%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.03)_2px,transparent_2px),linear-gradient(90deg,rgba(18,24,38,0.03)_2px,transparent_2px)] bg-[size:24px_24px] pointer-events-none z-0" />

      {/* --- TELEMETRY LABORATORY HEADER BAR --- */}
      <header className="relative z-10 border-b border-gray-900 bg-[#090e18]/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-gradient-to-br from-cyan-900/30 to-violet-900/30 rounded border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Cpu className="w-6 h-6 text-cyan-400" />
            {micState === 'recording' && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-500 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/20 tracking-wider">
                VGS-919 MATRIX
              </span>
              <span className="text-xs font-mono text-violet-400">ACOUSTIC PORT</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Vox Grain Synth <span className="text-cyan-400 font-extralight text-sm">Aether Signal Control</span>
            </h1>
          </div>
        </div>

        {/* Live System Signal lock metrics */}
        <div className="hidden md:flex items-center gap-6 font-mono text-[10px] text-gray-400 border-l border-gray-800 pl-6">
          <div>
            <span className="block text-gray-600">INPUT SIGNAL</span>
            <span className={(micState === 'recording' || micState === 'simulated') ? "text-cyan-400 font-bold" : "text-gray-500"}>
              {micState === 'recording' ? '● LOCKED (MAPPED)' : micState === 'simulated' ? '● SIM ENGINE ACTIVE' : '○ VACANT'}
            </span>
          </div>
          <div>
            <span className="block text-gray-600">GRAIN STREAM</span>
            <span>{granularParams.overlap * 12} GRAINS/SEC</span>
          </div>
          <div>
            <span className="block text-gray-600">CIRCUIT MATRIX</span>
            <span className="text-violet-400 font-bold">
              {qubits.filter(q => q.active).length} COHERENT QUBITS
            </span>
          </div>
        </div>

        {/* Main Microphone Enabler & Connection Switch */}
        <div className="flex items-center gap-3">
          {micState === 'idle' && (
            <button
              onClick={handleEngageSimulation}
              className="cursor-pointer font-mono text-xs font-bold px-3.5 py-2.5 bg-[#0e1624] border border-cyan-900/30 text-cyan-400 rounded hover:border-cyan-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>ENGAGE SIMULATION</span>
            </button>
          )}

          <button
            onClick={handleMicToggle}
            id="mic-connect-btn"
            className={`cursor-pointer font-mono text-xs font-bold px-4 py-2.5 rounded border flex items-center gap-2.5 transition-all duration-300 shadow-sm ${
              (micState === 'recording' || micState === 'simulated')
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400/50 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-100 hover:text-white'
            }`}
          >
            {micState === 'recording' ? (
              <>
                <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>DISENGAGE RECEIVER</span>
              </>
            ) : micState === 'simulated' ? (
              <>
                <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>STOP SIMULATION</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-gray-400" />
                <span>CONNECT LIVE MIC</span>
              </>
            )}
          </button>
        </div>
      </header>

      {micState === 'error' && (
        <div className="bg-red-950/25 border border-red-900/45 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left relative z-20 mx-5 mt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-xs">
              <AlertTriangle className="w-4.5 h-4.5" />
              <span>SOUND DETECTOR FAULT: {micErrorMessage ? micErrorMessage.toUpperCase() : 'PERMISSION DENIED OR UNAVAILABLE'}</span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono leading-relaxed max-w-4xl">
              {micErrorMessage || 'Browser constraints or system security settings blocked live audio capture (common in iframe previews).'}{' '}
              <span className="text-cyan-400 font-bold animate-pulse">Automatically establishing Quantum Simulation Carrier so the synth and visualizations boot immediately!</span>
            </p>
          </div>
          <button
            onClick={handleEngageSimulation}
            className="shrink-0 cursor-pointer font-mono text-xs font-bold py-2 px-4 bg-cyan-950/40 border border-cyan-800/40 hover:border-cyan-500 text-cyan-400 hover:text-white rounded flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>ENGAGE SIMULATION MODE</span>
          </button>
        </div>
      )}

      {/* --- CORE WORKING DECK: TWO SIDED BENCH --- */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-y-auto max-h-[calc(100vh-80px)]">
        
        {/* === LEFT BENCH: GRANULAR CORE SYSTEM PANEL === */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           {/* Signal Guard & Input Gate Section */}
          <div className="border border-gray-900 bg-[#090e16]/95 p-5 rounded-lg flex flex-col gap-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#06b6d4]" />
            
            {/* Header with state badges and bypass */}
            <div className="flex items-center justify-between border-b border-gray-900 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono tracking-wider font-bold text-gray-200">QUANTUM NOISE GATE</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* State Badge */}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase border border-opacity-40 animate-pulse ${
                  liveGateState === 'OPEN' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' :
                  liveGateState === 'CLOSED' ? 'bg-zinc-950/60 border-zinc-700 text-zinc-500' :
                  liveGateState === 'ATTACK' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-400' :
                  liveGateState === 'RELEASE' ? 'bg-purple-950/60 border-purple-500 text-purple-400' :
                  'bg-amber-950/60 border-amber-500 text-amber-400' // HOLD state
                }`}>
                  {liveGateState}
                </span>

                {/* Bypass Toggle */}
                <button
                  onClick={() => setVoiceParams(prev => ({ ...prev, bypass: !prev.bypass }))}
                  className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition-all border ${
                    voiceParams.bypass
                      ? 'border-red-900 text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/35'
                      : 'border-cyan-900 text-cyan-400 hover:text-cyan-300 bg-cyan-950/20 hover:bg-cyan-950/35'
                  }`}
                  title="Force bypass the hysteretic gate entirely"
                >
                  {voiceParams.bypass ? 'GATE: BYPASS' : 'GATE: ACTIVE'}
                </button>
              </div>
            </div>

            {/* Live Interactive Telemetry Meters */}
            <div className="space-y-3 bg-black/45 p-3 rounded-md border border-gray-900/60">
              {/* Peak dB Meter with Threshold Marker */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-gray-400">INPUT ENERGY REGISTER</span>
                  <span className={`font-bold ${liveInputDb > (voiceParams.threshold ?? -45) ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {liveInputDb ? `${liveInputDb.toFixed(1)} dB` : '-75 dB'}
                  </span>
                </div>
                <div className="relative w-full h-2.5 bg-gray-950 rounded-sm overflow-hidden border border-gray-900">
                  {/* Threshold Marker Pin */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" 
                    style={{ left: `${Math.max(0, Math.min(100, (((voiceParams.threshold ?? -45) + 75) / 75) * 100))}%` }}
                    title={`Threshold: ${voiceParams.threshold ?? -45} dB`}
                  />
                  {/* Slew bar representation of live input */}
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-950 via-cyan-600 to-emerald-400 transition-all duration-75" 
                    style={{ width: `${Math.max(0, Math.min(100, ((liveInputDb + 75) / 75) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Gain Reduction Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-gray-400">GATE REDUCTION / MUZZLE</span>
                  <span className="text-red-400">
                    {liveGateReduction ? `${liveGateReduction.toFixed(1)} dB` : '0.0 dB'}
                  </span>
                </div>
                <div className="relative w-full h-1.5 bg-gray-950 rounded-sm overflow-hidden border border-gray-900">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-amber-500 self-end transition-all duration-75 ml-auto" 
                    style={{ width: `${Math.max(0, Math.min(100, ((-liveGateReduction) / (-(voiceParams.attenuation ?? -80))) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Symmetrical Controls Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {/* Column 1: Gain & Gate thresholds */}
              <div className="space-y-3">
                {/* MIC GAIN */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">MIC AMP GAIN</span>
                    <span className="text-cyan-400">{(voiceParams.gain * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.05"
                    value={voiceParams.gain}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, gain: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* THRESHOLD */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">THRESHOLD</span>
                    <span className="text-cyan-400">{voiceParams.threshold} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-75"
                    max="-15"
                    step="1"
                    value={voiceParams.threshold}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* HYSTERESIS */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">HYSTERESIS</span>
                    <span className="text-cyan-400">{(voiceParams.hysteresis ?? 4)} dB</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={voiceParams.hysteresis ?? 4}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, hysteresis: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* Column 2: Attack, Hold, Release timings */}
              <div className="space-y-3 border-l border-gray-900/60 pl-3">
                {/* ATTACK */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">ATTACK TIME</span>
                    <span className="text-[#06b6d4]">{(voiceParams.attack ?? 5)} ms</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={voiceParams.attack ?? 5}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, attack: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* HOLD */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">HOLD GATE</span>
                    <span className="text-[#06b6d4]">{(voiceParams.hold ?? 100)} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="5"
                    value={voiceParams.hold ?? 100}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, hold: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* RELEASE */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">RELEASE TIME</span>
                    <span className="text-[#06b6d4]">{(voiceParams.release ?? 150)} ms</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={voiceParams.release ?? 150}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, release: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Attenuation Bleed & Pitch transposition */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-900/60 pt-3 text-xs font-mono">
              {/* FLOOR ATTENUATION */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400 opacity-90">GATE BLEED FLOOR</span>
                  <span className="text-cyan-400">{(voiceParams.attenuation ?? -80)} dB</span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="-12"
                  step="2"
                  value={voiceParams.attenuation ?? -80}
                  onChange={(e) => setVoiceParams(prev => ({ ...prev, attenuation: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* PITCH OFFSET */}
              <div className="space-y-1 text-xs pl-3 border-l border-gray-900/60">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">TRANSPOSE</span>
                  <span className="text-cyan-400">
                    {voiceParams.pitchShift > 0 ? `+${voiceParams.pitchShift}` : voiceParams.pitchShift} ST ({(voiceParams.pitchShift / 12).toFixed(1)} Oct)
                  </span>
                </div>
                <input
                  type="range"
                  min="-144"
                  max="144"
                  step="1"
                  value={voiceParams.pitchShift}
                  onChange={(e) => setVoiceParams(prev => ({ ...prev, pitchShift: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* PERFORMANCE TOGGLES & RESONANT FILTER (Q) SECTION */}
            <div className="border-t border-gray-900/60 pt-3.5 space-y-3 font-mono">
              <div className="text-[10px] text-cyan-500 font-bold tracking-wider uppercase flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> 
                PERFORMANCE ENGINE CONTROLLERS & RESONANT COHERENCE FILTER
              </div>

              {/* Toggles bar */}
              <div className="grid grid-cols-3 gap-2 text-[9px]">
                {/* Granular core active toggle */}
                <button
                  type="button"
                  onClick={() => setVoiceParams(prev => ({ ...prev, granularBypass: !prev.granularBypass }))}
                  className={`cursor-pointer px-2 py-1.5 rounded border text-left flex flex-col gap-0.5 justify-center transition-all ${
                    !voiceParams.granularBypass
                      ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10'
                      : 'border-zinc-800 text-zinc-500 bg-transparent'
                  }`}
                  title="Toggle Granular engine. Bypassing routes live voice directly into Qubits."
                >
                  <span className="font-bold leading-none">GRANULAR SYNTH</span>
                  <span className="text-[7.5px] opacity-75">{!voiceParams.granularBypass ? "ACTIVE WORKER CELL" : "BYPASS (DIRECT)"}</span>
                </button>

                {/* Keyboard pitch shift tracking toggle */}
                <button
                  type="button"
                  onClick={() => setVoiceParams(prev => ({ ...prev, pitchTrackByKeyboard: !prev.pitchTrackByKeyboard }))}
                  className={`cursor-pointer px-2 py-1.5 rounded border text-left flex flex-col gap-0.5 justify-center transition-all ${
                    voiceParams.pitchTrackByKeyboard
                      ? 'border-purple-500/30 text-purple-400 bg-purple-950/10'
                      : 'border-zinc-800 text-zinc-500 bg-transparent'
                  }`}
                  title="Check this to play piano notes and automatically shift voice pitch transposition to that interval!"
                >
                  <span className="font-bold leading-none">KEYBOARD TRACK</span>
                  <span className="text-[7.5px] opacity-75">{voiceParams.pitchTrackByKeyboard ? "ACTIVE CARRIER [C4]" : "STATIC DIAL OFF"}</span>
                </button>

                {/* Vibrato/modulation performance toggle */}
                <button
                  type="button"
                  onClick={() => setVoiceParams(prev => ({ ...prev, vibratoToggle: !prev.vibratoToggle }))}
                  className={`cursor-pointer px-2 py-1.5 rounded border text-left flex flex-col gap-0.5 justify-center transition-all ${
                    voiceParams.vibratoToggle
                      ? 'border-pink-500/30 text-pink-400 bg-pink-950/10 animate-pulse'
                      : 'border-zinc-800 text-zinc-500 bg-transparent'
                  }`}
                  title="Introduce a rich 5.5 Hz vibrato pitch modulation to granular slices"
                >
                  <span className="font-bold leading-none">LFO VIBRATO</span>
                  <span className="text-[7.5px] opacity-75">{voiceParams.vibratoToggle ? "5.5Hz OSC ACTIVE" : "MODULATION OFF"}</span>
                </button>
              </div>

              {/* Sweeping Filter controls (Frequency and Q factor!) */}
              <div className="grid grid-cols-2 gap-4 bg-gray-950/50 p-2.5 rounded border border-gray-900/60 text-xs">
                {/* RESONANCE FREQUENCY */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400 text-[9px]">COHERENCE FREQUENCY</span>
                    <span className="text-cyan-400 font-bold">{(voiceParams.filterFreq ?? 8000)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="12000"
                    step="50"
                    value={voiceParams.filterFreq ?? 8000}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, filterFreq: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* RESONANCE VALUE (Q) */}
                <div className="space-y-1 pl-3 border-l border-gray-900/60">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400 text-[9px]">COHERENCE FILTER Q factor</span>
                    <span className="text-purple-400 font-bold">{(voiceParams.filterQ ?? 1.0).toFixed(1)} Q</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="15.0"
                    step="0.1"
                    value={voiceParams.filterQ ?? 1.0}
                    onChange={(e) => setVoiceParams(prev => ({ ...prev, filterQ: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-purple-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Granular Synth Parameter Deck */}
          <div className="border border-gray-900 bg-[#090e16]/90 p-5 rounded-lg flex flex-col gap-4 shadow-sm relative overflow-hidden flex-1">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500/20" />
            <div className="flex items-center justify-between border-b border-gray-900 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono tracking-wider font-bold text-gray-200">VOX GRAIN MATRIX</h2>
              </div>
              <span className="text-[10px] font-mono text-[#06b6d4]">AETHER STREAM</span>
            </div>

            {/* Grain size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400 font-medium">GRAIN SPECTRAL SIZE</span>
                <span className="text-[#06b6d4]">{granularParams.grainSize} ms</span>
              </div>
              <input
                type="range"
                min="40"
                max="500"
                step="5"
                value={granularParams.grainSize}
                onChange={(e) => setGranularParams(prev => ({ ...prev, grainSize: parseInt(e.target.value) }))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-gray-500 leading-snug">
                Slicing duration of vocal snippets. Short grains create atomic textures; wider grains sustain syllables.
              </p>
            </div>

            {/* Overlap Factor */}
            <div className="space-y-1.5 pt-2 border-t border-gray-900/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">TEMPORAL OVERLAP Density</span>
                <span className="text-[#06b6d4]">{granularParams.overlap} COPIES</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={granularParams.overlap}
                onChange={(e) => setGranularParams(prev => ({ ...prev, overlap: parseInt(e.target.value) }))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-gray-500 leading-snug">
                Simultaneous layers reading overlapping slots dynamically. Higher translates to a thicker physical chorus.
              </p>
            </div>

            {/* Playback speed / fine-transposition */}
            <div className="space-y-1.5 pt-2 border-t border-gray-900/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">FINITE WAVE STRETCH</span>
                <span className="text-[#06b6d4]">{granularParams.pitchRatio.toFixed(2)}x Speed</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="3.0"
                step="0.05"
                value={granularParams.pitchRatio}
                onChange={(e) => setGranularParams(prev => ({ ...prev, pitchRatio: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-gray-500 leading-snug">
                Time stretch factor. Fast speeds sound high-pitched; slow speeds stretch vocal grains into sub-bass drones.
              </p>
            </div>

            {/* Time Jitter */}
            <div className="space-y-1.5 pt-2 border-t border-gray-900/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">QUANTUM WAVE JITTER</span>
                <span className="text-[#06b6d4]">{granularParams.jitter} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="65"
                step="1"
                value={granularParams.jitter}
                onChange={(e) => setGranularParams(prev => ({ ...prev, jitter: parseInt(e.target.value) }))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Spatial Spray */}
            <div className="space-y-1.5 pt-2 border-t border-gray-900/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">AETHER SPATIAL SPRAY</span>
                <span className="text-[#06b6d4]">{granularParams.spray} ms</span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                step="1"
                value={granularParams.spray}
                onChange={(e) => setGranularParams(prev => ({ ...prev, spray: parseInt(e.target.value) }))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-gray-500 leading-snug">
                Randomizes location sampling points backwards in time, introducing atmospheric smear.
              </p>
            </div>

            {/* Granular Feedback */}
            <div className="space-y-1.5 pt-2 border-t border-gray-900/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">MATRIX RECYCLING FEEDBACK</span>
                <span className="text-[#06b6d4]">{(granularParams.feedback * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.02"
                value={granularParams.feedback}
                onChange={(e) => setGranularParams(prev => ({ ...prev, feedback: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

          </div>
        </div>

        {/* === CENTER BENCH: THE QUBIT CHAIN AND INTERACTION MATRIX === */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <PresetManager 
            currentQubits={qubits}
            currentGranularParams={granularParams}
            currentVoiceParams={voiceParams}
            onLoadPreset={handleLoadPreset}
            engine={engine}
            userPresets={userPresets}
            setUserPresets={setUserPresets}
            activePresetId={activePresetId}
            setActivePresetId={setActivePresetId}
            flowLocked={flowLocked}
          />

          <AetherKeyboardDuo engine={engine} voiceParams={voiceParams} setVoiceParams={setVoiceParams} />

          <AetherVocalFXSuite voiceParams={voiceParams} setVoiceParams={setVoiceParams} />

          <QuantumRecordingStudio engine={engine} micState={micState} />
          
          {/* Main Visual Teleporter Particle Matrix Canvas */}
          <div className="border border-gray-900 bg-[#090e16]/80 p-5 rounded-lg flex flex-col gap-3 shadow-md relative overflow-hidden h-[240px]">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
                <h2 className="text-xs font-mono tracking-wider font-bold text-gray-200">
                  VOV GRAIN MATRIX TELEPORTATION FLUX
                </h2>
              </div>
              <div className="text-[9px] font-mono text-gray-500 flex items-center gap-1.5">
                <span>WAVE LOCK TELEMETRY MATRIX</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-ping" />
              </div>
            </div>

            <div className="flex-1 relative w-full rounded border border-gray-950 bg-[#060a10]">
              <canvas
                ref={orbitalStageCanvasRef}
                width={800}
                height={165}
                className="w-full h-full block"
              />
              {/* Graphic overlays overlay labels */}
              <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-500 bg-cyan-950/40 border border-cyan-500/10 px-1.5 py-0.5 rounded">
                MIC GRAIN SOURCE L [H]〉
              </div>
              <div className="absolute top-2 right-3 text-[10px] font-mono text-pink-500 bg-pink-950/40 border border-pink-500/10 px-1.5 py-0.5 rounded">
                TELEPORTATION STATE DELTA R 〉
              </div>
            </div>
          </div>

          {/* QUBIT CIRCUITS ASSEMBLY PANEL */}
          <div className="border border-gray-900 bg-[#090e16]/90 p-5 rounded-lg flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-violet-400" />
                <h2 className="text-xs font-mono tracking-wider font-bold text-gray-200">
                  QUANTUM QUBIT PIPELINE CIRCUIT
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-[10px] font-mono text-gray-500">
                  DRIVE CHAINS IN DYNAMIC SERIES ORDER
                </span>
                <button
                  id="quick-save-preset-btn"
                  onClick={() => setIsSavingPreset(true)}
                  className="cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all bg-cyan-950/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-white hover:border-cyan-500/50 flex items-center gap-1.5"
                  title="Save current circuit setup and values as a custom preset"
                >
                  <Save className="w-3 h-3" />
                  <span>SAVE PRESET</span>
                </button>
                <button
                  id="bypass-all-btn"
                  onClick={handleBypassAllToggle}
                  disabled={qubits.length === 0}
                  className={`cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all flex items-center gap-1.5 border leading-none ${
                    qubits.length === 0
                      ? 'bg-zinc-950/10 text-zinc-600 border-zinc-900/50 cursor-not-allowed'
                      : isChainFullyBypassed
                      ? 'bg-amber-950/40 text-amber-400 border-amber-500/50 hover:bg-amber-500/20 hover:text-white shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : 'bg-[#181125] text-violet-400 border-violet-500/35 hover:bg-violet-500/20 hover:text-white hover:border-violet-500/50'
                  }`}
                  title={
                    qubits.length === 0
                      ? "Add qubits to the pipeline before enabling bypass"
                      : isChainFullyBypassed
                      ? "Restore original active qubit nodes setup for A/B testing comparison"
                      : "Temporarily bypass all active qubit nodes in the signal path for A/B testing comparison"
                  }
                >
                  {isChainFullyBypassed ? <Zap className="w-3 h-3 text-amber-400 animate-pulse" /> : <ZapOff className="w-3 h-3" />}
                  <span>{isChainFullyBypassed ? 'REACTIVATE ALL' : 'BYPASS ALL'}</span>
                </button>
                <button
                  id="flow-lock-btn"
                  onClick={() => setFlowLocked(prev => !prev)}
                  className={`cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all flex items-center gap-1.5 border leading-none ${
                    flowLocked
                      ? 'bg-red-950/40 text-red-400 border-red-500/50 hover:bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : 'bg-[#181125] text-cyan-400 border-cyan-500/35 hover:bg-cyan-500/20 hover:text-white hover:border-cyan-500/50'
                  }`}
                  title={flowLocked ? "Disengage Quantum Flow Lock" : "Engage Quantum Flow Lock to freeze signal path configurations and parameters"}
                >
                  {flowLocked ? <Lock className="w-3 h-3 text-red-500" /> : <Unlock className="w-3 h-3" />}
                  <span>{flowLocked ? 'FLOW LOCKED' : 'LOCK FLOW'}</span>
                </button>
                <button
                  id="reset-circuit-btn"
                  onClick={handleResetCircuit}
                  className="cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all bg-red-950/20 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-white hover:border-red-500/50 flex items-center gap-1.5"
                  title="Clear all active nodes and reset the signal path"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET CIRCUIT</span>
                </button>
              </div>
            </div>

            {/* Custom animated quick preset save drawer */}
            <AnimatePresence>
              {isSavingPreset && (
                <motion.form 
                  onSubmit={handleQuickSavePreset}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#05080f] rounded border border-cyan-500/20 p-3.5 flex flex-col sm:flex-row items-end gap-3 text-xs overflow-hidden"
                >
                  <div className="flex-1 space-y-1 w-full">
                    <label className="block text-gray-400 font-mono text-[9px] uppercase">Custom Preset Name</label>
                    <input
                      type="text"
                      maxLength={25}
                      required
                      placeholder="Enter unique preset name..."
                      value={quickPresetName}
                      onChange={(e) => setQuickPresetName(e.target.value)}
                      className="w-full bg-[#0a0f18] text-white py-1 px-3 h-8 rounded border border-gray-900 font-mono text-[11px] focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>

                  <div className="space-y-1 w-full sm:w-44">
                    <label className="block text-gray-400 font-mono text-[9px] uppercase">Category Allocation</label>
                    <select
                      value={quickPresetCategory}
                      onChange={(e) => setQuickPresetCategory(e.target.value)}
                      className="w-full bg-[#0a0f18] text-[#06b6d4] h-8 px-2 rounded border border-gray-900 font-mono text-[11px] focus:outline-none focus:border-cyan-400/50 cursor-pointer"
                    >
                      <option value="Atmospheric">Atmospheric</option>
                      <option value="Glitch">Glitch</option>
                      <option value="Ambient">Ambient</option>
                      <option value="Experimental">Experimental</option>
                      <option value="Sub-Bass">Sub-Bass</option>
                      <option value="IDM">IDM</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => setIsSavingPreset(false)}
                      className="cursor-pointer font-mono text-[10px] px-3 py-1.5 h-8 rounded transition-all border border-gray-800 text-gray-400 hover:text-white"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer font-mono text-[10px] px-4 py-1.5 h-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-md animate-pulse"
                    >
                      <Save className="w-3.5 h-3.5 text-white animate-bounce" />
                      <span>WRITE PRESET</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Visual draggable / stackable circuit grid */}
            <div className="bg-[#05090f] p-4 rounded-lg border border-gray-950 flex flex-nowrap gap-4 items-center overflow-x-auto min-h-[140px] relative scrollbar-thin">
              
              {qubits.length === 0 && (
                <div className="w-full py-8 text-center text-xs font-mono text-gray-600 flex flex-col items-center gap-2">
                  <span>EMPTY CIRCUIT BLOCK</span>
                  <p className="max-w-xs text-[10px] leading-relaxed text-gray-700">
                    Add qubit modules from the factory matrix options below to begin routing acoustic signals.
                  </p>
                </div>
              )}

              <AnimatePresence>
                {qubits.map((qubit, index) => {
                  const isSelected = selectedQubitId === qubit.id;
                  return (
                    <motion.div
                      key={qubit.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="flex-shrink-0 flex items-center gap-4"
                    >
                      {/* Connection wires between qubits */}
                      {index > 0 && (
                        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 px-0.5 relative w-16 select-none">
                          {/* Energy Pipeline Connector */}
                          <div className="w-full h-4 relative flex items-center justify-center">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 64 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Background Tube Conduit */}
                              <line 
                                x1="0" 
                                y1="8" 
                                x2="64" 
                                y2="8" 
                                stroke="#0a0f18" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                              />
                              {/* Waveguide glowing energy ribbon */}
                              <line 
                                x1="0" 
                                y1="8" 
                                x2="64" 
                                y2="8" 
                                stroke={`url(#energyGradient-${index})`} 
                                strokeWidth={2 + (currentEnergy / 60)} 
                                strokeLinecap="round"
                                style={{
                                  opacity: 0.15 + (currentEnergy / 120),
                                  transition: 'stroke-width 0.1s ease-out, opacity 0.1s ease-out',
                                  filter: `drop-shadow(0 0 ${2 + (currentEnergy / 15)}px rgba(139, 92, 246, 0.8))`
                                }}
                              />
                              {/* Active Signal Core Line */}
                              <line 
                                x1="0" 
                                y1="8" 
                                x2="64" 
                                y2="8" 
                                stroke="#06b6d4" 
                                strokeWidth="1" 
                                strokeLinecap="round"
                                style={{
                                  opacity: 0.4 + (currentEnergy / 100),
                                }}
                              />
                              {/* Glowing laser bullet traversing */}
                              <circle cx="0" cy="8" r={1.5 + (currentEnergy / 80)} fill="#ffffff">
                                <animate 
                                  attributeName="cx" 
                                  from="0" 
                                  to="64" 
                                  dur={`${Math.max(0.3, 1.8 - (currentEnergy / 60))}s`} 
                                  repeatCount="indefinite" 
                                />
                                <animate 
                                  attributeName="opacity" 
                                  values="0.2;1.0;0.2" 
                                  dur={`${Math.max(0.3, 1.8 - (currentEnergy / 60))}s`} 
                                  repeatCount="indefinite" 
                                />
                              </circle>
                              
                              {/* Defining Gradient */}
                              <defs>
                                <linearGradient id={`energyGradient-${index}`} x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="50%" stopColor="#ec4899" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          
                          <div className="flex flex-col items-center gap-0.5">
                            <span 
                              className="text-[7.5px] font-mono tracking-widest uppercase transition-colors duration-200 font-bold"
                              style={{
                                color: currentEnergy > 5 ? '#22d3ee' : '#4b5563'
                              }}
                            >
                              {currentEnergy > 5 ? `${Math.min(99, Math.round(currentEnergy))}% FLOW` : 'COHERENT'}
                            </span>
                            <span className="text-[6.5px] font-mono text-zinc-700 uppercase">SPIN-BOND</span>
                          </div>
                        </div>
                      )}

                      <div
                        onClick={() => setSelectedQubitId(qubit.id)}
                        className={`cursor-pointer min-w-[145px] max-w-[145px] p-3 rounded-lg border flex flex-col justify-between transition-all duration-300 relative ${
                          isSelected 
                            ? 'border-gray-500 bg-[#0e1726]/90 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                            : 'border-gray-950 bg-[#070b13] hover:border-gray-800'
                        } ${!qubit.active && 'opacity-40'}`}
                      >
                        {/* Upper state symbol and type key */}
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-xs font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border"
                            style={{ 
                              color: qubit.color, 
                              borderColor: `${qubit.color}25`, 
                              backgroundColor: `${qubit.color}08` 
                            }}
                          >
                            |{qubit.symbol}〉
                          </span>
                          
                          {/* Active / bypass power node */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActiveQubit(qubit.id);
                            }}
                            className={`p-1 rounded text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                              qubit.active 
                                ? 'text-green-400 bg-green-950/30 hover:bg-green-950/60'
                                : 'text-gray-500 bg-gray-900 hover:bg-gray-800'
                            }`}
                          >
                            <Power className="w-2.5 h-2.5" />
                            <span>{qubit.active ? 'COHERENT' : 'BYPASS'}</span>
                          </button>
                        </div>

                        {/* Name and placement metadata */}
                        <div className="my-3 text-left">
                          <div className="text-white text-[11px] font-bold font-mono tracking-tight leading-tight truncate">
                            {qubit.name}
                          </div>
                          <span className="text-[9px] font-mono text-gray-500 block mt-0.5 truncate">
                            Type: {qubit.type}
                          </span>
                        </div>

                        {/* Order shifter & Action block */}
                        <div className="flex items-center justify-between border-t border-gray-900 pt-2 text-gray-500">
                          {/* Movement logic */}
                          <div className="flex items-center gap-1.5">
                            <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleMoveLeftQubit(index);
                               }}
                               disabled={index === 0}
                               className="p-1 hover:text-white disabled:pointer-events-none disabled:opacity-20 cursor-pointer"
                               title="Shift Leftwards in series"
                            >
                              <ArrowLeft className="w-3   h-3" />
                            </button>
                            <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleMoveRightQubit(index);
                               }}
                               disabled={index === qubits.length - 1}
                               className="p-1 hover:text-white disabled:pointer-events-none disabled:opacity-20 cursor-pointer"
                               title="Shift Rightwards in series"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQubit(qubit.id);
                            }}
                            className="p-1 hover:text-red-400 font-mono transition-colors cursor-pointer"
                            title="Decompile from chain"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Connection visual highlights on side borders */}
                        {qubit.active && (
                          <div 
                            className="absolute inset-y-0 left-0 w-[2px] rounded-l"
                            style={{ backgroundColor: qubit.color }}
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

            </div>

            {/* QUBIT MODULE FACTORY OPTIONS MENU */}
            <div className="border-t border-[#1e1b4b] pt-4 space-y-2 relative overflow-hidden">
              {flowLocked && (
                <div className="absolute inset-0 bg-[#070b13]/85 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center border border-dashed border-red-500/20 rounded-md p-2 font-mono text-center">
                  <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold tracking-wider">
                    <Lock className="w-3 h-3 text-red-500" /> FACTORY SPAWNER LOCKED
                  </span>
                </div>
              )}
              <span className="text-[10px] font-mono text-gray-500 block text-left">
                FACTORY SPAWNER: CHOOSE AN ELEMENTAL QUANTUM OPERATOR TO SLICE INTO YOUR SIGNAL CHAIN
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQubit('HADAMARD')}
                  className="cursor-pointer border border-[#06b6d4]/20 hover:border-[#06b6d4]/60 bg-[#06b6d4]/05 hover:bg-[#06b6d4]/10 text-cyan-400 font-mono text-[10px] px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-left"
                >
                  <Plus className="w-3 h-3" />
                  <span>HADAMARD |H〉</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQubit('PAULI_X')}
                  className="cursor-pointer border border-amber-500/20 hover:border-amber-500/60 bg-amber-500/05 hover:bg-amber-500/10 text-amber-400 font-mono text-[10px] px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-left"
                >
                  <Plus className="w-3 h-3" />
                  <span>PAULI-X |X〉</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQubit('PHASE_S')}
                  className="cursor-pointer border border-emerald-500/20 hover:border-emerald-500/60 bg-emerald-500/05 hover:bg-emerald-500/10 text-emerald-400 font-mono text-[10px] px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-left"
                >
                  <Plus className="w-3 h-3" />
                  <span>PHASE GATE |S〉</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQubit('ENTANGLEMENT')}
                  className="cursor-pointer border border-violet-500/20 hover:border-violet-500/60 bg-violet-500/05 hover:bg-violet-500/10 text-violet-400 font-mono text-[10px] px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-left"
                >
                  <Plus className="w-3 h-3" />
                  <span>ENTANGLE |Ψ〉</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQubit('TELEPORTER')}
                  className="cursor-pointer border border-pink-500/20 hover:border-pink-500/60 bg-pink-500/05 hover:bg-pink-500/10 text-pink-400 font-mono text-[10px] px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-left"
                >
                  <Plus className="w-3 h-3" />
                  <span>TELEPORTER |T〉</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQubit('DECOHERENCE')}
                  className="cursor-pointer border border-red-500/20 hover:border-red-500/60 bg-red-500/05 hover:bg-red-500/10 text-red-400 font-mono text-[10px] px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-left"
                >
                  <Plus className="w-3 h-3" />
                  <span>DECOHERENCE |D〉</span>
                </button>
              </div>
            </div>

          </div>

          {/* TWO MAIN LOWER BLOCKS - PARAMETERS VS spectrum DUAL ANALYSERS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* LEFT LOWER CORE: SPECIFIC DETAILS CONTROL DECK */}
            <div className="md:col-span-8 border border-gray-900 bg-[#090e16]/90 p-5 rounded-lg flex flex-col gap-4 shadow-sm relative overflow-hidden">
              {flowLocked && (
                <div className="absolute inset-0 bg-[#070b13]/85 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center border border-dashed border-red-500/20 rounded-lg p-4 font-mono text-center select-none">
                  <span className="flex items-center gap-1.5 text-red-500 text-xs font-bold tracking-wider animate-pulse">
                    <Lock className="w-3.5 h-3.5 text-red-500" /> CORE TUNING MATRICES COLD FREEZE
                  </span>
                  <p className="text-[9px] text-gray-500 uppercase mt-1 leading-normal max-w-sm">
                    Regulators and parameter values are frozen under Quantum Flow lock constraint. Release flow lock from the pipeline header to recalibrate.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-gray-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-mono tracking-wider font-bold text-gray-200">
                    QUBIT MATRICES REGULATORS
                  </h3>
                </div>
                {activeSelectedQubit && (
                  <span className="text-[10px] font-mono text-[#8b5cf6] font-bold">
                    ACTIVE ADJUSTMENT DECK
                  </span>
                )}
              </div>

              {activeSelectedQubit ? (
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                        <span style={{ color: activeSelectedQubit.color }}>
                          |{activeSelectedQubit.symbol}〉
                        </span>
                        <span>{activeSelectedQubit.name} CORE</span>
                      </h4>
                      <p className="text-[10px] mt-1 text-gray-400 leading-relaxed font-mono max-w-md">
                        {activeSelectedQubit.description}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-gray-600 bg-gray-950 px-2 py-0.5 border border-gray-900 rounded">
                      ID: {activeSelectedQubit.id}
                    </span>
                  </div>

                  {/* HADAMARD CONTROLS */}
                  {activeSelectedQubit.type === 'HADAMARD' && (
                    <div className="space-y-3 pt-2 border-t border-gray-950">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">SUPERPOSITION SPACE ANGLE</span>
                        <span className="text-cyan-400">
                          {activeSelectedQubit.params.superpositionAngle}° DEGREES
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="180"
                        step="1"
                        value={activeSelectedQubit.params.superpositionAngle ?? 90}
                        onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'superpositionAngle', parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                        <span>0° (LEFT ALIGN)</span>
                        <span>90° (50/50 SUPERPOSITION)</span>
                        <span>180° (RIGHT ALIGN)</span>
                      </div>
                    </div>
                  )}

                  {/* PAULI X CONTROLS */}
                  {activeSelectedQubit.type === 'PAULI_X' && (
                    <div className="space-y-3 pt-2 border-t border-gray-950">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">SPIN-FLIP DISTORTION FREQUENCY</span>
                        <span className="text-amber-400">
                          {activeSelectedQubit.params.spinFlipRate}% FORCE
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={activeSelectedQubit.params.spinFlipRate ?? 40}
                        onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'spinFlipRate', parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <p className="text-[10px] text-gray-500 font-mono">
                        Controls the depth of structural non-linear waveshaping. Higher speeds invert waves completely.
                      </p>
                    </div>
                  )}

                  {/* PHASE S CONTROLS */}
                  {activeSelectedQubit.type === 'PHASE_S' && (
                    <div className="space-y-4 pt-2 border-t border-gray-950">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-gray-400">PHASE ANGLE SHIFT</span>
                          <span className="text-emerald-400">
                            {activeSelectedQubit.params.phaseShift}° SHIFT
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="2"
                          value={activeSelectedQubit.params.phaseShift ?? 90}
                          onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'phaseShift', parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-gray-400">COMB FEEDBACK RESONANCE</span>
                          <span className="text-emerald-400">
                            {activeSelectedQubit.params.resonance}% RESONANCE
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          step="1"
                          value={activeSelectedQubit.params.resonance ?? 45}
                          onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'resonance', parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* ENTANGLEMENT CONTROLS */}
                  {activeSelectedQubit.type === 'ENTANGLEMENT' && (
                    <div className="space-y-3 pt-2 border-t border-gray-950">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">COHERENT CARRIER RATE</span>
                        <span className="text-violet-400">
                          {activeSelectedQubit.params.entangleFrequency} Hz (Acoustic Entanglement)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="900"
                        step="5"
                        value={activeSelectedQubit.params.entangleFrequency ?? 320}
                        onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'entangleFrequency', parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                      <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                        <span>20 Hz (SUB BASS GLIDE)</span>
                        <span>320 Hz (MID CHROMATIC)</span>
                        <span>900 Hz (HIGH SHIMMING)</span>
                      </div>
                    </div>
                  )}

                  {/* TELEPORTER CONTROLS */}
                  {activeSelectedQubit.type === 'TELEPORTER' && (
                    <div className="space-y-4 pt-2 border-t border-gray-950">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-gray-400">TELEPORT DELAY COEFF</span>
                          <span className="text-pink-400">
                            {activeSelectedQubit.params.teleportDelay} ms DISPERSION
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="1500"
                          step="10"
                          value={activeSelectedQubit.params.teleportDelay ?? 480}
                          onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'teleportDelay', parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-gray-400">TELEPORTATION SCATTER JITTER</span>
                          <span className="text-pink-400">
                            {activeSelectedQubit.params.teleportJitter}% COHERENCE SCATTER
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          step="1"
                          value={activeSelectedQubit.params.teleportJitter ?? 35}
                          onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'teleportJitter', parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* DECOHERENCE CONTROLS */}
                  {activeSelectedQubit.type === 'DECOHERENCE' && (
                    <div className="space-y-3 pt-2 border-t border-gray-950">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">VACUUM STATIC RATIO</span>
                        <span className="text-red-400">
                          {activeSelectedQubit.params.decoherenceNoise}% DECAY NOISE
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={activeSelectedQubit.params.decoherenceNoise ?? 30}
                        onChange={(e) => handleUpdateQubitParam(activeSelectedQubit.id, 'decoherenceNoise', parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                      <p className="text-[10px] text-gray-500 font-mono">
                        Mixes chaotic ambient heat signals to model decay. High noise rates destroy coherent vocals into retro radio bursts.
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center p-8 text-xs font-mono text-gray-600 bg-[#05090f] rounded-lg border border-gray-950">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    SELECT A QUBIT FROM THE PIPELINE ASSEMBLY TO VIEW AND REGULATE ACCURATE PARAMETERS
                  </span>
                </div>
              )}
            </div>

            {/* MASTER OUTPUT DIALS AND GRAPHICS */}
            <div className="md:col-span-4 border border-gray-900 bg-[#090e16]/90 p-5 rounded-lg flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-900 pb-2.5">
                  <h3 className="text-xs font-mono tracking-wider font-bold text-gray-200">
                    MASTER CORE
                  </h3>
                  <span className="text-[9px] font-mono text-cyan-400">FINAL GAIN</span>
                </div>

                {/* Level dial slider */}
                <div className="py-2 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span>OUTPUT ENERGY</span>
                      {isMuted && <span className="text-red-500 text-[9px] uppercase font-bold animate-pulse">[MUTED]</span>}
                    </span>
                    <span className={isMuted ? "text-red-400 line-through" : "text-emerald-400"}>
                      {isMuted ? "0%" : `${(volume * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      disabled={isMuted}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer transition-all ${
                        isMuted 
                          ? "bg-zinc-950 accent-zinc-700 cursor-not-allowed opacity-50" 
                          : "bg-gray-900 accent-emerald-400"
                      }`}
                    />
                    <button
                      id="master-mute-btn"
                      type="button"
                      title={isMuted ? "Unmute system core output" : "Mute system core output safely (without resetting)"}
                      onClick={() => setIsMuted(prev => !prev)}
                      className={`cursor-pointer p-1.5 rounded transition-all border flex items-center justify-center shrink-0 ${
                        isMuted 
                          ? "bg-red-950/40 border-red-500/50 text-red-400 hover:bg-red-500/25" 
                          : "bg-[#0c131f] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                      }`}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400 animate-pulse" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status information disclaimer */}
              <div className="p-3 bg-gray-950/60 rounded border border-gray-900/60 text-[9px] leading-relaxed text-gray-500 font-mono text-left space-y-1.5">
                <span className="text-cyan-400/90 font-bold block">★ QUANTUM ACOUSTIC NOTE</span>
                <span>
                  The Vox Grain System streams your microphone speech directly into local buffer registers. It plays grains, which traverse the custom qubits sequentially from left to right.
                </span>
              </div>
            </div>

          </div>

          {/* DUAL WAVER SPECTROGRAM MATRIX ANALYSERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input state analyser */}
            <div className="border border-gray-900 bg-[#090e16]/80 p-4 rounded-lg flex flex-col gap-2 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-gray-900 pb-1.5">
                <span className="text-[10px] font-mono text-cyan-500 tracking-wider font-bold">
                  ● SPEECH GRAINS INPUT MATRIX (PRE-QUBIT)
                </span>
                <span className="text-[9px] font-mono text-gray-600">TIME EXPANSION REGIONS</span>
              </div>
              <div className="h-[90px] rounded bg-[#060a0f] border border-gray-950 overflow-hidden">
                <canvas
                  ref={inputWaveCanvasRef}
                  width={380}
                  height={88}
                  className="w-full h-full block"
                />
              </div>
            </div>

            {/* Output state spectrum */}
            <div className="border border-gray-900 bg-[#090e16]/80 p-4 rounded-lg flex flex-col gap-2 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-gray-900 pb-1.5">
                <span className="text-[10px] font-mono text-pink-500 tracking-wider font-bold">
                  ▲ RESONANCE SPECTROGRAM (POST-QUBIT)
                </span>
                <span className="text-[9px] font-mono text-gray-600">FREQUENCY BIN ENVELOPES</span>
              </div>
              <div className="h-[90px] rounded bg-[#060a0f] border border-gray-950 overflow-hidden">
                <canvas
                  ref={outputWaveCanvasRef}
                  width={380}
                  height={88}
                  className="w-full h-full block"
                />
              </div>
            </div>

          </div>

          {/* CYMATICS RESONANCES AND COHERENT STATE HUD */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CymaticsPanel engine={engine} onRecallSnapshot={handleRecallCymaticSnapshot} />
            <ScientificHud qubits={qubits} granularParams={granularParams} currentEnergy={currentEnergy} engine={engine} />
          </div>

        </div>

      </main>

    </div>
  );
}
