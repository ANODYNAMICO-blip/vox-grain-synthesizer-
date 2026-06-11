/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QubitNode, GranularParams } from '../types';
import { Sparkles, HelpCircle, Zap, Sliders, Activity, Compass, Link2, Target } from 'lucide-react';
import { QuantumAudioEngine } from '../lib/audioEngine';

interface ScientificHudProps {
  qubits: QubitNode[];
  granularParams: GranularParams;
  currentEnergy: number; // passed down live amplitude for physics animations
  engine?: QuantumAudioEngine | null;
}

export default function ScientificHud({ qubits, granularParams, currentEnergy, engine }: ScientificHudProps) {
  // Extract active qubits
  const activeQubits = qubits.filter(q => q.active);

  // Compute live aether physical values
  const systemStateVector = activeQubits.length > 0 
    ? activeQubits.map(q => `|${q.symbol}〉`).join(' ⊗ ')
    : '|Bypass〉';

  // --- Real-time Synth HUD parameters mapped directly to AudioEngine ---
  const [waveformMorph, setWaveformMorph] = useState(engine ? engine.waveformMorph : 0.5);
  const [wavetableTransducer, setWavetableTransducer] = useState(engine ? engine.wavetableTransducer : 0.0);
  const [transducerFormulation, setTransducerFormulation] = useState(engine ? engine.transducerFormulation : 'spectral');
  const [synthBlend, setSynthBlend] = useState(engine ? engine.synthBlend : 0.3);

  // --- Auto LFO Modulator ---
  const [lfoActive, setLfoActive] = useState(false);
  const [lfoRate, setLfoRate] = useState(0.4); // Oscillate speed in Hz (0.1 to 3.0)

  // --- Modular Patch Socket Connections ---
  const [carrierPatched, setCarrierPatched] = useState(true);
  const [transducerPatched, setTransducerPatched] = useState(false);

  // --- Local slider drag states ---
  const [isDialDragging, setIsDialDragging] = useState(false);
  const dialRef = useRef<SVGSVGElement | null>(null);
  const oscCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cable animation offsets
  const [cableOffset, setCableOffset] = useState(0);

  // Pull settings periodically from engine to keep preset/snapshot loaded state synchronized
  useEffect(() => {
    if (!engine) return;
    const interval = setInterval(() => {
      if (!isDialDragging) {
        setWaveformMorph(engine.waveformMorph);
        setWavetableTransducer(engine.wavetableTransducer);
        setTransducerFormulation(engine.transducerFormulation);
        setSynthBlend(engine.synthBlend);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [engine, isDialDragging]);

  // Run Auto LFO Modulation Sweep
  useEffect(() => {
    if (!lfoActive) return;

    let animId: number;
    const startTime = Date.now();

    const sweep = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Cycle waveformMorph smoothly back and forth between 0.0 and 3.0
      const sineWave = Math.sin(2 * Math.PI * lfoRate * elapsed);
      const nextMorph = (sineWave + 1) * 1.5; // Maps [-1, 1] to [0, 3]

      setWaveformMorph(prev => {
        const approx = Math.round(nextMorph * 100) / 100;
        if (engine) engine.waveformMorph = approx;
        return approx;
      });

      animId = requestAnimationFrame(sweep);
    };

    animId = requestAnimationFrame(sweep);
    return () => cancelAnimationFrame(animId);
  }, [lfoActive, lfoRate, engine]);

  // Animate cables flow
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setCableOffset(prev => (prev - 1) % 40);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Dial drag calculations for continuous waveform morphing 0.0 to 3.0 (315 degrees sweep range)
  const handleDialMove = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;
    
    // Angle starting at bottom (-90 degrees is left, 180 is bottom-right)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Constrain angle to a 280 degree slider arc
    // Map angle cleanly to morph ranges [0.0, 3.0]
    let normalized = angle / 360; // 0 to 1
    let morphVal = normalized * 3.0;
    morphVal = Math.max(0.0, Math.min(3.0, morphVal));

    setWaveformMorph(Math.round(morphVal * 100) / 100);
    if (engine) {
      engine.waveformMorph = morphVal;
    }
  }, [engine]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDialDragging(true);
    handleDialMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDialDragging(true);
    if (e.touches && e.touches[0]) {
      handleDialMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDialDragging) handleDialMove(e.clientX, e.clientY);
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDialDragging && e.touches && e.touches[0]) {
        handleDialMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleGlobalUp = () => setIsDialDragging(false);

    if (isDialDragging) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      window.addEventListener('touchend', handleGlobalUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDialDragging, handleDialMove]);

  // Adjust parameters
  const updateTransducerValue = (val: number) => {
    setWavetableTransducer(val);
    if (engine) engine.wavetableTransducer = val;
  };

  const updateTransducerFormulation = (val: string) => {
    setTransducerFormulation(val);
    if (engine) engine.transducerFormulation = val;
  };

  const updateSynthBlend = (val: number) => {
    setSynthBlend(val);
    if (engine) engine.synthBlend = val;
  };

  // Draw simulated or real-time oscilloscope waves
  useEffect(() => {
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Read real-time microphone analyzer if engine is processing
      let audioBuffer: Uint8Array | null = null;
      if (engine && engine.ctx && (engine.inputAnalyser || engine.outputAnalyser)) {
        const analyser = engine.inputAnalyser || engine.outputAnalyser;
        if (analyser) {
          audioBuffer = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteTimeDomainData(audioBuffer);
        }
      }

      // Draw mathematical composite representing waveform morphing & transduction parameters
      ctx.beginPath();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';

      const length = canvas.width;
      for (let x = 0; x < length; x++) {
        const normalizedX = x / length;
        const currentFreqMultiplier = 2 * Math.PI * 4; // 4 full periods
        const currentPhase = normalizedX * currentFreqMultiplier + phase;

        // Base synthesis waveform generator shapes
        const sineVal = Math.sin(currentPhase);
        const squareVal = Math.sign(sineVal);
        const triangleVal = 2 * Math.abs(2 * ((currentPhase / (2 * Math.PI)) % 1) - 1) - 1;
        const sawVal = 2 * ((currentPhase / (2 * Math.PI)) % 1) - 1;
        const waveSawTri = sawVal * 0.7 + triangleVal * 0.3;
        const noiseVal = Math.sin(currentPhase * 5.3) * 0.3 + (Math.random() * 2 - 1) * 0.7;

        // Perform Morphing between Sine (0), Square (1), Saw (2), Noise (3)
        let mathSample = 0;
        const m = waveformMorph; // 0.0 to 3.0
        if (m < 1.0) {
          mathSample = sineVal * (1 - m) + squareVal * m;
        } else if (m < 2.0) {
          const p = m - 1.0;
          mathSample = squareVal * (1 - p) + waveSawTri * p;
        } else {
          const p = m - 2.0;
          mathSample = waveSawTri * (1 - p) + noiseVal * p;
        }

        // Apply Wavetable Transduction composite harmonics
        if (wavetableTransducer > 0.01) {
          const tr = wavetableTransducer;
          let transSine = 0;
          
          switch (transducerFormulation) {
            case 'fibonacci':
              transSine = (
                Math.sin(currentPhase) + 
                Math.sin(currentPhase * 1.618) * 0.5 + 
                Math.sin(currentPhase * 2.618) * 0.3
              ) * 0.6;
              break;
            case 'quantum-packet':
              const envelope = Math.exp(-Math.pow((normalizedX - 0.5) / 0.16, 2));
              transSine = Math.sin(currentPhase * 2.5) * envelope;
              break;
            case 'chirp':
              const sweepPhase = currentPhase * (0.6 + normalizedX * 2.4);
              transSine = Math.sin(sweepPhase) * 0.6;
              break;
            case 'spectral':
            default:
              transSine = (
                Math.sin(currentPhase) * 0.5 + 
                Math.sin(currentPhase * 2.0) * 0.3 + 
                Math.sin(currentPhase * 3.0) * 0.15
              );
              break;
          }

          // Fold simulation
          const folded = Math.sin((mathSample * 0.45 + transSine * 0.55) * Math.PI * 1.8);
          mathSample = mathSample * (1 - tr) + folded * tr;
        }

        // Mix real ambient microphones for kinetic visual interaction
        if (audioBuffer && audioBuffer.length > 0) {
          const audioIdx = Math.floor(normalizedX * (audioBuffer.length - 1));
          const audioVal = (audioBuffer[audioIdx] - 128) / 128;
          mathSample = mathSample * 0.72 + audioVal * 0.28;
        }

        const y = (canvas.height / 2) + (mathSample * (canvas.height * 0.36));
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw interactive activation terminals (glowing circle ports on canvas edges)
      ctx.fillStyle = carrierPatched ? '#06b6d4' : '#1e293b';
      ctx.beginPath(); ctx.arc(15, canvas.height / 2, 4.5, 0, 2*Math.PI); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = transducerPatched ? '#a78bfa' : '#1e293b';
      ctx.beginPath(); ctx.arc(canvas.width - 15, canvas.height / 2, 4.5, 0, 2*Math.PI); ctx.fill();
      ctx.stroke();

      phase -= 0.045;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [waveformMorph, wavetableTransducer, transducerFormulation, engine, carrierPatched, transducerPatched]);

  return (
    <div id="quantum-waveform-transducer-hud-panel" className="border border-gray-900 bg-[#090e16]/95 p-5 rounded-lg flex flex-col gap-4 shadow-sm text-left relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <span className="text-[70px] font-serif font-extrabold text-cyan-400">Ψ</span>
      </div>
      <div className="absolute top-0 left-0 w-2 h-full bg-violet-600/30" />
      
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-gray-950 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h2 className="text-xs font-mono tracking-wider font-bold text-gray-200 uppercase">
            QUANTUM WAVEFUNCTION COMPUTATION MATRIX
          </h2>
        </div>
        <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded">
          CO-HERENT SYNTH ACTIVATED
        </span>
      </div>

      {/* Main Physics State Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Quantum Tensor Product & Active Operators */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* State Vector HUD */}
            <div className="bg-[#05080f] p-3 rounded border border-gray-950/80 md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-mono text-gray-500 block leading-none">TENSOR ACU STATE</span>
                <div className="text-xs font-bold font-mono text-cyan-400 mt-1 whitespace-nowrap overflow-x-auto py-1 scrollbar-thin">
                  |Ψ_acu〉 = {systemStateVector}
                </div>
                <p className="text-[8px] text-gray-400 font-mono mt-1 leading-relaxed">
                  Grains act as wavepackets modulated by Hilbert operator matrices.
                </p>
              </div>
              <div className="mt-2 pt-1 border-t border-gray-900 flex justify-between items-center text-[8px] font-mono text-gray-500">
                <span>COHERENCE:</span>
                <span className="text-cyan-400 font-bold">
                  {((1 - (granularParams.jitter / 100)) * (granularParams.overlap / 8) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Live DSL Operator equations */}
            <div className="bg-[#05080f] p-3 rounded border border-gray-950/80 md:col-span-3 flex flex-col justify-between">
              <span className="text-[8px] font-mono text-gray-500 block leading-none mb-1">ACTIVE OPERATOR FORMULAE</span>
              <div className="space-y-1.5 max-h-[75px] overflow-y-auto scrollbar-thin pr-1">
                {activeQubits.length === 0 ? (
                  <div className="text-[8px] font-mono text-gray-600">
                    Ground state active. Connect qubit nodes in registry to compile math.
                  </div>
                ) : (
                  activeQubits.map((qubit) => {
                    let equationText = '';
                    switch (qubit.type) {
                      case 'HADAMARD':
                        equationText = `H(θ) = cos(θ/2)|L〉 + sin(θ/2)|R〉`; break;
                      case 'PAULI_X':
                        equationText = `f_dist = (3.5x) / (1 + 40|x|)`; break;
                      case 'PHASE_S':
                        equationText = `φ_sh = e^{i·${qubit.params.phaseShift ?? 90}°}`; break;
                      case 'ENTANGLEMENT':
                        equationText = `Sin(2π·f_E·t) ⊗ Voice(t)`; break;
                      case 'TELEPORTER':
                        equationText = `h(t) = Σ(α^m·δ(t - m·τ))`; break;
                      case 'DECOHERENCE':
                        equationText = `ρ(t) = e^{-Γ·t} · ρ(0)`; break;
                    }
                    return (
                      <div key={qubit.id} className="text-[9px] font-mono flex items-center justify-between border-b border-gray-900/45 pb-0.5" style={{ color: qubit.color }}>
                        <span>|{qubit.symbol}〉 {qubit.name.split(' ')[0]}</span>
                        <span className="text-[7px] text-gray-500">{equationText}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Core Morpher Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Interactive Radial Slider for Waveform Morphing */}
            <div className="bg-[#05080f] p-3.5 rounded border border-gray-950/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-gray-500">QUANTUM WAVE RADIAL MORPH</span>
                <span className="text-[8px] font-mono text-cyan-400 font-bold bg-cyan-950/30 border border-cyan-900/30 px-1 rounded">
                  DIAL
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* SVG Radial Slider Dial */}
                <div className="relative shrink-0 select-none">
                  <svg
                    ref={dialRef}
                    width="75"
                    height="75"
                    className="cursor-grab active:cursor-grabbing outline-none"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                  >
                    {/* Background track circle */}
                    <circle cx="37.5" cy="37.5" r="30" fill="none" stroke="#0e1724" strokeWidth="4.5" />
                    
                    {/* Colored active stroke arc */}
                    <circle
                      cx="37.5"
                      cy="37.5"
                      r="30"
                      fill="none"
                      stroke="url(#radialGradientCyan)"
                      strokeWidth="4.5"
                      strokeDasharray="188"
                      strokeDashoffset={188 - (188 * (waveformMorph / 3.0))}
                      transform="rotate(-90 37.5 37.5)"
                      strokeLinecap="round"
                    />

                    {/* Draggable pointer dot */}
                    {(() => {
                      const angleRad = (waveformMorph / 3.0) * 2 * Math.PI - Math.PI / 2;
                      const dotX = 37.5 + 30 * Math.cos(angleRad);
                      const dotY = 37.5 + 30 * Math.sin(angleRad);
                      return (
                        <circle cx={dotX} cy={dotY} r="4.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="2.5" />
                      );
                    })()}

                    {/* Gradient definers */}
                    <defs>
                      <linearGradient id="radialGradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Central Text status */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-mono font-black text-gray-200 mt-1">{(waveformMorph).toFixed(2)}</span>
                    <span className="text-[5px] font-mono text-gray-500 uppercase">INDEX</span>
                  </div>
                </div>

                {/* Info labels / segment anchors */}
                <div className="flex-1 space-y-1 text-left">
                  <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[8px] font-mono font-bold">
                    <span className={waveformMorph < 0.75 ? 'text-cyan-400' : 'text-gray-600'}>∿ SINE [0.0]</span>
                    <span className={waveformMorph >= 0.75 && waveformMorph < 1.75 ? 'text-violet-400' : 'text-gray-600'}>⊓ SQUARE [1.0]</span>
                    <span className={waveformMorph >= 1.75 && waveformMorph < 2.5 ? 'text-pink-400' : 'text-gray-600'}>◸ SAW [2.0]</span>
                    <span className={waveformMorph >= 2.5 ? 'text-amber-500 animate-pulse' : 'text-gray-600'}>☵ NOISE [3.0]</span>
                  </div>
                  <p className="text-[8px] text-gray-400 leading-normal font-mono pt-1">
                    Drag circular dial continuously to blend fundamental carrier forms dynamically inside grains.
                  </p>
                </div>
              </div>
            </div>

            {/* Modular LFO Sweep Controls */}
            <div className="bg-[#05080f] p-3.5 rounded border border-gray-950/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-pink-400" /> MODULAR LFO REGIME SWEEPER
                </span>
                <button
                  onClick={() => setLfoActive(!lfoActive)}
                  className={`cursor-pointer px-1.5 py-0.5 rounded text-[8px] font-mono border font-bold transition-all ${
                    lfoActive
                      ? 'border-pink-500/30 text-pink-400 bg-pink-950/20'
                      : 'border-gray-800 text-gray-500 bg-transparent'
                  }`}
                >
                  {lfoActive ? 'ACTIVE LFO' : 'STANDBY'}
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-mono text-gray-400">
                  <span>SWEEP RATE:</span>
                  <span className="text-pink-400 font-bold">{lfoRate.toFixed(2)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={lfoRate}
                  onChange={(e) => setLfoRate(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />

                <div className="flex justify-between items-center text-[8px] font-mono text-gray-400">
                  <span>ADDITIONAL SYNTH BLEND:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(synthBlend * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={synthBlend}
                  onChange={(e) => updateSynthBlend(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Quantum Wavetable Transducer & Oscilloscope Sockets */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Wavetable Transducer Module */}
          <div className="bg-[#05080f] p-3.5 rounded border border-gray-950/80 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" /> WAVETABLE TRANSDUCER CONVERTER
              </span>
              <span className="text-[7.5px] font-mono text-fuchsia-400 font-bold leading-none py-0.5 px-1 bg-fuchsia-950/30 border border-fuchsia-900/30 rounded">
                FORMULATOR
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Target coefficient slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-mono">
                  <span className="text-gray-400">TRANSDUCTION COEFFICIENT [WFT]:</span>
                  <span className="text-fuchsia-400 font-bold">{(wavetableTransducer * 100).toFixed(0)}% Depth</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="1.00"
                  step="0.02"
                  value={wavetableTransducer}
                  onChange={(e) => updateTransducerValue(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
              </div>

              {/* Formulation Mode Selector */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {[
                  { id: 'spectral', label: '🧬 SPECTRAL ENERGIES', desc: 'Harmonics sum of ground states' },
                  { id: 'fibonacci', label: '🐚 FIBONACCI GOLDEN', desc: 'Phi coefficient golden harmonics' },
                  { id: 'quantum-packet', label: '🔬 SCHRÖDINGER PKT', desc: 'Gaussian wave envelope folder' },
                  { id: 'chirp', label: '📡 CHIRP FREQ SWEEP', desc: 'Dynamic phase acceleration' }
                ].map(form => (
                  <button
                    key={form.id}
                    onClick={() => updateTransducerFormulation(form.id)}
                    className={`cursor-pointer text-left p-1.5 rounded border text-[8px] font-mono flex flex-col justify-between transition-all ${
                      transducerFormulation === form.id
                        ? 'border-fuchsia-500/50 bg-[#160a21]/50 text-fuchsia-300'
                        : 'border-gray-900/80 bg-gray-950 text-gray-500 hover:text-gray-300 hover:border-gray-800'
                    }`}
                  >
                    <span className="font-bold leading-none mb-0.5 pb-0.5 border-b border-gray-900/30 block w-full">{form.label}</span>
                    <span className="text-[6.5px] leading-tight text-gray-500 font-normal">{form.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Glowing Oscilloscope with Activation Socket Patch Ports */}
          <div className="bg-[#05080f] p-3.5 rounded border border-gray-950/80 flex flex-col gap-2 relative">
            <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 border-b border-gray-900/60 pb-1">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-cyan-400" /> LIVE ANALOG MORPHEOSCOPE OSCILLOSCOPE
              </span>
              <span>SYNCHRONIZED ACTIVE NODES</span>
            </div>

            <div className="relative h-[65px] rounded bg-[#03060a] border border-gray-950 overflow-hidden">
              <canvas
                ref={oscCanvasRef}
                width={300}
                height={63}
                className="w-full h-full block"
              />

              {/* Socket terminal label overlays */}
              <div className="absolute top-1 left-2 pointer-events-none text-[6.5px] font-mono text-cyan-400 bg-cyan-950/50 px-1 rounded">
                PORT [C_IN]
              </div>
              <div className="absolute top-1 right-2 pointer-events-none text-[6.5px] font-mono text-fuchsia-400 bg-fuchsia-950/50 px-1 rounded">
                PORT [WFT_OUT]
              </div>
            </div>

            {/* Modular Patch cord toggles */}
            <div className="flex items-center justify-between text-[8px] font-mono py-1 rounded bg-gray-950/30 px-1 border border-gray-950">
              <div className="flex items-center gap-2">
                <Link2 className="w-3 h-3 text-cyan-400" />
                <span className="text-gray-500 uppercase">Active Modular Patch cords:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCarrierPatched(!carrierPatched)}
                  className={`cursor-pointer px-1.5 py-0.5 rounded border text-[7.5px] font-bold font-mono transition-all ${
                    carrierPatched
                      ? 'border-cyan-500/20 text-cyan-400 bg-cyan-950/15'
                      : 'border-gray-800 text-gray-600 bg-transparent'
                  }`}
                >
                  [C_IN] → CYMATICS {carrierPatched ? '●' : '○'}
                </button>
                <button
                  onClick={() => setTransducerPatched(!transducerPatched)}
                  className={`cursor-pointer px-1.5 py-0.5 rounded border text-[7.5px] font-bold font-mono transition-all ${
                    transducerPatched
                      ? 'border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-950/15'
                      : 'border-gray-800 text-gray-600 bg-transparent'
                  }`}
                >
                  [WFT] → QUBITS {transducerPatched ? '●' : '○'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Render Animated SVG Patch Cables Overlays for Synthesis Aesthetics */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <svg className="w-full h-full">
          {/* Cable 1: Carrier Dial to Oscilloscope Port [C_IN] */}
          {carrierPatched && (
            <path
              d="M 120 220 Q 200 310 400 235"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeOpacity="0.45"
              strokeDasharray="5,7"
              strokeDashoffset={cableOffset}
            />
          )}

          {/* Cable 2: Transducer to HUD operators */}
          {transducerPatched && (
            <path
              d="M 500 250 Q 320 280 200 135"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              strokeDasharray="6,8"
              strokeDashoffset={-cableOffset}
            />
          )}
        </svg>
      </div>

      {/* Acoustic Wavepacket Physics Explanation Footer */}
      <div className="border-t border-gray-950 pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-gray-500 gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span>Acoustic resonance formulation: f_g(t) = HannWindow(t) · [Sine(ωt) ⨂ Transducer({transducerFormulation})] modulated by qubit tensor indices.</span>
        </div>
        <div className="text-gray-400">
          Energy density E = <span className="text-pink-400">{(currentEnergy * 1.5).toFixed(1)} meV</span>
        </div>
      </div>
    </div>
  );
}
