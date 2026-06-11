/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Sliders, Trash2, Zap, HelpCircle } from 'lucide-react';
import { CymaticSnapshot } from '../types';
import { QuantumAudioEngine } from '../lib/audioEngine';

interface CymaticsPanelProps {
  engine: QuantumAudioEngine;
  onRecallSnapshot: (n: number, m: number, reactivity: number, colorScheme: string) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function CymaticsPanel({ engine, onRecallSnapshot }: CymaticsPanelProps) {
  // Config state
  const [n, setN] = useState<number>(6);
  const [m, setM] = useState<number>(4);
  const [reactivity, setReactivity] = useState<number>(40);
  const [colorScheme, setColorScheme] = useState<string>('cyan');
  const [snapshots, setSnapshots] = useState<CymaticSnapshot[]>(() => {
    const saved = localStorage.getItem('vgs_cymatic_snapshots');
    return saved ? JSON.parse(saved) : [
      {
        id: 'cy-factory-1',
        timestamp: new Date().toLocaleTimeString(),
        tag: 'SYM-0604',
        n: 6,
        m: 4,
        reactivity: 40,
        colorScheme: 'cyan'
      },
      {
        id: 'cy-factory-2',
        timestamp: new Date().toLocaleTimeString(),
        tag: 'SYM-0808',
        n: 8,
        m: 8,
        reactivity: 65,
        colorScheme: 'gold'
      }
    ];
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number | null>(null);

  // Sync snapshots to storage
  useEffect(() => {
    localStorage.setItem('vgs_cymatic_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  // Max particles based on design complexity
  const PARTICLE_COUNT = 1500;

  // Initialize Particles on mounting
  useEffect(() => {
    const freshParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      freshParticles.push({
        x: Math.random() * 200 - 100, // Normalized plate coordinate system [-100, 100]
        y: Math.random() * 200 - 100,
        vx: 0,
        vy: 0
      });
    }
    particlesRef.current = freshParticles;
  }, []);

  // Frame simulation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame = 0;

    const render = () => {
      localFrame++;
      const w = canvas.width;
      const h = canvas.height;
      const center = w / 2;
      const scale = (w * 0.9) / 200; // fit coordinate [-100, 100] inside canvas

      // Draw backdrop
      ctx.fillStyle = '#060a10';
      ctx.fillRect(0, 0, w, h);

      // Draw vibrating plate grid layout
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center, center, center * 0.9, 0, Math.PI * 2);
      ctx.stroke();

      // Nodal Grid line helper
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.beginPath();
      ctx.moveTo(center - 100 * scale, center);
      ctx.lineTo(center + 100 * scale, center);
      ctx.moveTo(center, center - 100 * scale);
      ctx.lineTo(center, center + 100 * scale);
      ctx.stroke();

      // Audio perturbation coefficient
      // Adds a chaotic mechanical vibration force to move sand away from anti-nodes to nodes
      let localEnergy = 0;
      if (engine && engine.outputAnalyser) {
        const bufferLength = engine.outputAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        engine.outputAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let k = 0; k < 64; k++) sum += dataArray[k] || 0;
        localEnergy = sum / 64;
      }

      const voiceVolFactor = localEnergy / 255;
      const physicalVibrationIntensity = 0.5 + (voiceVolFactor * (reactivity / 10));

      const piN = n * Math.PI;
      const piM = m * Math.PI;

      // Update particle physics simulating sand on a metal Chladni plate
      particlesRef.current.forEach((p) => {
        // Convert back to scale [-1, 1] for trig inputs
        const nx = p.x / 100;
        const ny = p.y / 100;

        // Chladni plate displacement amplitude equation
        // Z measures the distance to a nodal static line. 
        // Particles move away from regions of high displacement (anti-nodes) to zero displacement (nodes)
        const z = (Math.cos(n * piN * nx) * Math.cos(m * piM * ny)) - (Math.cos(m * piM * nx) * Math.cos(n * piM * ny));

        // Theoretical gradient calculation to find vector drift directions
        // dz/dx and dz/dy
        const d_dzdx = -n * piN * Math.sin(n * piN * nx) * Math.cos(m * piM * ny) + m * piM * Math.sin(m * piM * nx) * Math.cos(n * piM * ny);
        const d_dzdy = -m * piM * Math.cos(n * piN * nx) * Math.sin(m * piM * ny) + n * piM * Math.cos(m * piM * nx) * Math.sin(n * piM * ny);

        // Particle drifts toward node (Z -> 0) proportional to displacement gradient and physical vibration
        // Add random thermal/kinetic noise mapping directly to live audio spikes
        const kineticFriction = 0.88;
        const jitter = (Math.random() - 0.5) * (0.4 + voiceVolFactor * 3.5);

        // Drift force proportional to displacement amplitude and gradient direction
        p.vx = p.vx * kineticFriction - d_dzdx * z * 0.08 * physicalVibrationIntensity + jitter;
        p.vy = p.vy * kineticFriction - d_dzdy * z * 0.08 * physicalVibrationIntensity + jitter;

        p.x += p.vx;
        p.y += p.vy;

        // Boundary constraint mapping disk shape circular boundary
        const radiusSq = p.x * p.x + p.y * p.y;
        if (radiusSq > 95 * 95) {
          // Bounce or reset inside
          const angle = Math.atan2(p.y, p.x);
          p.x = Math.cos(angle) * (90 + Math.random() * 4);
          p.y = Math.sin(angle) * (90 + Math.random() * 4);
          p.vx = -p.vx * 0.4;
          p.vy = -p.vy * 0.4;
        }

        // Translate plate positions to canvas visual positions [0, w]
        const cx = center + p.x * scale;
        const cy = center + p.y * scale;

        // Dynamic colors based on spatial amplitude & selected visual coloring scheme
        let nodeFillColor = '#06b6d4';
        const absoluteZ = Math.abs(z);
        
        switch (colorScheme) {
          case 'pink': {
            const red = Math.min(255, 180 + absoluteZ * 75);
            nodeFillColor = `rgb(${red.toFixed(0)}, 55, 150)`;
            break;
          }
          case 'gold': {
            const green = Math.min(255, 140 + absoluteZ * 115);
            nodeFillColor = `rgb(245, ${green.toFixed(0)}, 30)`;
            break;
          }
          case 'rainbow': {
            const hue = (45 + Math.abs(p.x * p.y) * 0.12 + Math.floor(localFrame * 0.1)) % 360;
            nodeFillColor = `hsl(${hue}, 95%, 55%)`;
            break;
          }
          default: // cyan (default quantum)
            nodeFillColor = `rgb(6, ${(182 + absoluteZ * 73).toFixed(0)}, 212)`;
            break;
        }

        // Draw individual granules as small glowing micro circles
        ctx.fillStyle = nodeFillColor;
        ctx.beginPath();
        const pSize = 1.0 + (absoluteZ * 0.8) + (voiceVolFactor * 1.5);
        ctx.arc(cx, cy, pSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Overlay text stats
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '9px monospace';
      ctx.fillText(`SYM-CHLADNI REGIME: ${n}:${m}`, 15, h - 25);
      ctx.fillText(`ENTROPY COMPRESS: ${(purityRate(localEnergy) * 100).toFixed(0)}%`, 15, h - 14);

      animationIdRef.current = requestAnimationFrame(render);
    };

    // Calculate cluster purity metrics
    const purityRate = (egy: number) => {
      // simpler proxy: percentage of particles closer to nodes
      return Math.max(0.1, 0.92 - (egy / 450) - (reactivity / 400));
    };

    render();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [n, m, reactivity, colorScheme, engine]);

  // Capture current cymatic snapshot image and save
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgUrl = canvas.toDataURL('image/png');

    const freshSnapshot: CymaticSnapshot = {
      id: `cy-snap-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toLocaleTimeString(),
      tag: `CHL-${n}${m}-${Math.floor(1000 + Math.random() * 9000).toString().slice(-4)}`,
      n,
      m,
      reactivity,
      colorScheme,
      imgDataUrl: imgUrl
    };

    setSnapshots(prev => [freshSnapshot, ...prev]);
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  const handleSelectSnapshot = (snap: CymaticSnapshot) => {
    setN(snap.n);
    setM(snap.m);
    setReactivity(snap.reactivity);
    setColorScheme(snap.colorScheme);
    onRecallSnapshot(snap.n, snap.m, snap.reactivity, snap.colorScheme);
  };

  return (
    <div className="border border-gray-900 bg-[#090e16]/95 p-5 rounded-lg flex flex-col gap-4 shadow-sm text-left relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-cyan-600/30" />
      
      {/* Header and description */}
      <div className="flex items-center justify-between border-b border-gray-950 pb-2.5">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4.5 h-4.5 text-cyan-400" />
          <h2 className="text-xs font-mono tracking-wider font-bold text-gray-200">
            CHLADNI CYMATIC PLATE RESONANCE
          </h2>
        </div>
        <span className="text-[10px] font-mono text-gray-500">VOICE RESONATOR SHAPE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Dynamic plate visualizer canvas */}
        <div className="md:col-span-5 flex flex-col items-center justify-between bg-[#05080f] rounded border border-gray-950 p-4 shrink-0 relative">
          <div className="w-[180px] h-[180px] relative rounded overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="w-full h-full block"
            />
          </div>
          
          <button
            onClick={handleCaptureSnapshot}
            className="cursor-pointer font-mono text-[10px] w-full mt-3 py-1.5 bg-[#0e1726] hover:bg-[#15233a] text-cyan-400 font-bold rounded border border-cyan-500/10 hover:border-cyan-500/35 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>SAVE METRIC RESONANCE SNAP</span>
          </button>
        </div>

        {/* Real-time parameter controllers */}
        <div className="md:col-span-7 flex flex-col justify-between gap-3">
          
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-gray-300">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>INTERACTIVE MODAL FREQUENCIES (N:M)</span>
            </div>

            {/* Slider N Factor */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>Nodal X-Mult (N-value)</span>
                <span className="text-cyan-400">{n} waves</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="1"
                value={n}
                onChange={(e) => setN(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Slider M Factor */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>Nodal Y-Mult (M-value)</span>
                <span className="text-cyan-400">{m} waves</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="1"
                value={m}
                onChange={(e) => setM(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Interactive Reactivity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>Vocal Kinetic Reactivity</span>
                <span className="text-cyan-400">{reactivity}% scale</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={reactivity}
                onChange={(e) => setReactivity(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Color selector dropdown */}
            <div className="pt-1.5">
              <div className="flex justify-between items-center text-[11px] font-mono mb-1 text-gray-400">
                <span>Granular Color Dispersion Scheme</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {['cyan', 'pink', 'gold', 'rainbow'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setColorScheme(color)}
                    className={`cursor-pointer capitalize font-mono text-[9px] py-1 border rounded font-bold transition-all ${
                      colorScheme === color
                        ? 'border-cyan-400 bg-cyan-950/20 text-cyan-400 font-bold'
                        : 'border-gray-950 bg-gray-950 text-gray-500 hover:border-gray-800'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-gray-950/60 border border-gray-900/60 rounded text-[9px] leading-relaxed text-gray-500 font-mono">
            <span className="text-cyan-400 block font-semibold">ABOUT CHLADNI PLATES</span>
            Vibrational waves bounce off disk edges, forming interference nodes where plate displacement remains absolute zero. Sound pressure spikes automatically scatter sand particles into geometric standing rings.
          </div>

        </div>
      </div>

      {/* Snapshots Grid */}
      <div className="border-t border-gray-950 pt-3.5">
        <span className="text-[10px] font-mono text-gray-500 block mb-2 leading-none">
          RESONANT SNAPSHOT GRID (CLICK CARD TO LOAD SYMMETRIES IN STATE RECALL)
        </span>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {snapshots.length === 0 ? (
            <div className="py-2 text-[9px] font-mono text-gray-600 text-center w-full">
              No saved snapshots inside matrix memory. Snap plate patterns above to register.
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                onClick={() => handleSelectSnapshot(snap)}
                className="cursor-pointer min-w-[125px] max-w-[125px] p-2 bg-[#05090f] hover:bg-[#0b121e] border border-gray-900 hover:border-gray-800 rounded flex flex-col justify-between gap-1.5 transition-all text-left relative overflow-hidden"
              >
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-cyan-400 font-bold">{snap.tag}</span>
                  <button
                    onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                    className="text-gray-600 hover:text-red-400 p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
                {snap.imgDataUrl ? (
                  <div className="w-full h-[55px] bg-black border border-gray-950 rounded overflow-hidden shrink-0">
                    <img src={snap.imgDataUrl} alt="plate snap" className="w-full h-full object-cover scale-110 pointer-events-none" />
                  </div>
                ) : (
                  <div className="w-full h-[55px] bg-cyan-950/10 border border-cyan-900/10 rounded flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4.5 h-4.5 text-cyan-500/25 animate-pulse" />
                  </div>
                )}
                <div className="text-[8px] font-mono text-gray-400 leading-none space-y-0.5 border-t border-gray-900/60 pt-1">
                  <div className="flex justify-between">
                    <span>Nodal Regime:</span>
                    <span>{snap.n}:{snap.m}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vibration:</span>
                    <span>{snap.reactivity}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
