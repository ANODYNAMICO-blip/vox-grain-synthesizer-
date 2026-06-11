import React, { useState } from 'react';
import { VoiceGateParams } from '../types';
import { 
  Sparkles, Sliders, Waves, Activity, Radio, Volume2, 
  Flame, Disc, Zap, Music, Anchor, Layers, RefreshCw
} from 'lucide-react';

interface AetherVocalFXSuiteProps {
  voiceParams: VoiceGateParams;
  setVoiceParams: React.Dispatch<React.SetStateAction<VoiceGateParams>>;
}

export const AetherVocalFXSuite: React.FC<AetherVocalFXSuiteProps> = ({
  voiceParams,
  setVoiceParams,
}) => {
  const [activeRack, setActiveRack] = useState<'tune' | 'pre' | 'mod' | 'spatial'>('tune');

  const updateParam = (key: keyof VoiceGateParams, value: any) => {
    setVoiceParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div id="vocal-suite-rack" className="border border-gray-900 bg-[#070b12]/90 p-5 rounded-lg flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* GLOWING RACK BACKDROP */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-32 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* RACK TITLE HEADER & PORT DIRECT CLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-900 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping pointer-events-none" />
          <div>
            <h2 id="vocal-suite-title" className="text-white text-xs uppercase font-bold tracking-widest font-sans flex items-center gap-1.5">
              <span>VOCAL MATRIX AUTO-TUNE & SPACE MULTI-FX SUITE</span>
              <span className="text-[9px] text-cyan-400 font-normal px-1.5 py-0.5 rounded bg-cyan-950/20 border border-cyan-500/20">PRO MASTER CHAIN</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">High-definition Web Audio convolution models, Snapping pitch grids, and asymmetric tube saturation</p>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div id="vocal-suite-tabs" className="flex items-center gap-1 bg-gray-950 p-1 rounded border border-gray-900">
          <button
            id="tab-tune"
            onClick={() => setActiveRack('tune')}
            className={`cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all uppercase flex items-center gap-1 ${
              activeRack === 'tune' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Music className="w-3 h-3" />
            <span>Scale Snapper</span>
          </button>
          
          <button
            id="tab-pre"
            onClick={() => setActiveRack('pre')}
            className={`cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all uppercase flex items-center gap-1 ${
              activeRack === 'pre' 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Tube Sat & Dynamics</span>
          </button>

          <button
            id="tab-mod"
            onClick={() => setActiveRack('mod')}
            className={`cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all uppercase flex items-center gap-1 ${
              activeRack === 'mod' 
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Ensemble & Coherence</span>
          </button>

          <button
            id="tab-spatial"
            onClick={() => setActiveRack('spatial')}
            className={`cursor-pointer px-2.5 py-1 text-[10px] font-mono rounded font-medium transition-all uppercase flex items-center gap-1 ${
              activeRack === 'spatial' 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Waves className="w-3 h-3" />
            <span>Acoustic Space</span>
          </button>
        </div>
      </div>

      {/* RACK CONTENT BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* TAB 1: SCALE SNAPPER (AUTO-TUNE SUITE) */}
        {activeRack === 'tune' && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TUNER PANEL */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3 relative">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  ROBO-TUNE snapping engine
                </span>
                <button
                  id="toggle-autotune"
                  onClick={() => updateParam('autoTuneActive', !voiceParams.autoTuneActive)}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold transition-all ${
                    voiceParams.autoTuneActive 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                      : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                  }`}
                >
                  {voiceParams.autoTuneActive ? '● CORRECTION LINE ON' : '○ CORRECTION BYPASSED'}
                </button>
              </div>

              {/* CONTROLS */}
              <div className="space-y-4">
                {/* SCALE SELECT */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Snapping Target Musical Scale</span>
                  <div className="grid grid-cols-3 gap-1">
                    {['CHROMATIC', 'MAJOR', 'MINOR'].map((scale) => (
                      <button
                        key={scale}
                        onClick={() => updateParam('autoTuneScale', scale)}
                        disabled={!voiceParams.autoTuneActive}
                        className={`cursor-pointer px-1 py-1 px-1.5 rounded text-[9px] font-mono tracking-wider text-center border font-bold transition-all ${
                          !voiceParams.autoTuneActive 
                            ? 'opacity-30 cursor-not-allowed border-gray-900 bg-transparent text-zinc-600'
                            : voiceParams.autoTuneScale === scale
                              ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                              : 'bg-transparent text-gray-400 border-gray-900 hover:text-gray-200'
                        }`}
                      >
                        {scale}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CORRECTION SPEED CORRECTION RANGE */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">CORRECTION SPEED (PITCH CONTROL)</span>
                    <span className="text-cyan-400 font-bold">{((voiceParams.autoTunePitchControl ?? 0.85) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    disabled={!voiceParams.autoTuneActive}
                    value={voiceParams.autoTunePitchControl ?? 0.85}
                    onChange={(e) => updateParam('autoTunePitchControl', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400 disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                  <span className="text-[8px] text-gray-500 font-mono italic block">Higher speeds snap instantly (robotic), lower speeds slide smoothly (warm dynamic)</span>
                </div>

                {/* RESPONSE RATE (MS) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">PITCH CORRECTION WINDOW</span>
                    <span className="text-cyan-400 font-bold">{(voiceParams.autoTuneResolution ?? 25)} ms</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="2"
                    disabled={!voiceParams.autoTuneActive}
                    value={voiceParams.autoTuneResolution ?? 25}
                    onChange={(e) => updateParam('autoTuneResolution', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-cyan-400 disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* LO-FI DIGITAL BITCRUSHER CORE */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3 relative">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ec4899] font-bold flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-[#ec4899]" />
                  LO-FI Downsampler & Bitcrusher
                </span>
                <button
                  id="toggle-lofi"
                  onClick={() => updateParam('loFiActive', !voiceParams.loFiActive)}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold transition-all ${
                    voiceParams.loFiActive 
                      ? 'bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/30' 
                      : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                  }`}
                >
                  {voiceParams.loFiActive ? '● RESOLUTION CHOPPER' : '○ DIGITAL COAX BYPASSED'}
                </button>
              </div>

              {/* LO-FI CONTROLS */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">AMPLITUDE QUANTIZATION BITDEPTH</span>
                    <span className="text-[#ec4899] font-bold">{(voiceParams.loFiResolutionBit ?? 8)} BITS</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="1"
                    disabled={!voiceParams.loFiActive}
                    value={voiceParams.loFiResolutionBit ?? 8}
                    onChange={(e) => updateParam('loFiResolutionBit', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#ec4899] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                  <span className="text-[8px] text-gray-500 font-mono leading-relaxed block mt-1">
                    4-bit is highly noisy and industrial, 8-bit brings warm arcade texture, 12-bit represents classic hip-hop samplers (e.g., SP-1200 style).
                  </span>
                </div>

                <div className="bg-gray-950/60 p-2.5 rounded border border-gray-900 text-[9.5px] text-[#ec4899] font-mono leading-relaxed flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-[#ec4899] shrink-0 animate-pulse pointer-events-none" />
                  <span>Bitcrushing runs inside the live grain buffer loop for zero-latency rendering!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TUBE SATURATION & DYNAMICS */}
        {activeRack === 'pre' && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TUBE CRUNCH OVERDRIVE */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#a855f7] font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#a855f7] animate-pulse pointer-events-none" />
                  Tube Crunch & Analog Color
                </span>
                <button
                  id="toggle-crunch"
                  onClick={() => updateParam('crunchActive', !voiceParams.crunchActive)}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold transition-all ${
                    voiceParams.crunchActive 
                      ? 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30' 
                      : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                  }`}
                >
                  {voiceParams.crunchActive ? '● GRIT SOUND ACTIVE' : '○ BYPASSED'}
                </button>
              </div>

              <div className="space-y-4">
                {/* GRIT SLIDER */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">SATURATION DEPTH (GRIT)</span>
                    <span className="text-[#a855f7] font-bold">{((voiceParams.crunchGritSound ?? 0.25) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.05"
                    disabled={!voiceParams.crunchActive}
                    value={voiceParams.crunchGritSound ?? 0.25}
                    onChange={(e) => updateParam('crunchGritSound', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#a855f7] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>

                {/* TUBE COLOR WARM vs BRIGHT */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">TUBE HARMONIC COLOR TONE</span>
                    <span className="text-[#a855f7] font-bold">{(voiceParams.colorTone ?? 0.4) > 0.5 ? 'BRIGHT SHIELD' : 'WARM VALVE'} ({(voiceParams.colorTone ?? 0.4).toFixed(2)})</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    disabled={!voiceParams.crunchActive}
                    value={voiceParams.colorTone ?? 0.4}
                    onChange={(e) => updateParam('colorTone', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#a855f7] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>

                {/* PRESENCE PRESENCE DB BOOST */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">PRESENCE HIGH BOOSTER (3200Hz Shelf)</span>
                    <span className="text-[#a855f7] font-bold">{(voiceParams.presenceDb ?? 4.0)} dB</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={voiceParams.presenceDb ?? 4.0}
                    onChange={(e) => updateParam('presenceDb', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#a855f7]"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMICS COMPRESSOR */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#a855f7] font-bold flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-[#a855f7]" />
                  STUDIO DYNAMICS COMPRESSOR
                </span>
                <button
                  id="toggle-compressor"
                  onClick={() => updateParam('compressorActive', !voiceParams.compressorActive)}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold transition-all ${
                    voiceParams.compressorActive 
                      ? 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30' 
                      : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                  }`}
                >
                  {voiceParams.compressorActive ? '● AUTO LEVELING ACTIVE' : '○ COMPRESSOR BYPASS'}
                </button>
              </div>

              <div className="space-y-4">
                {/* COMPRESSOR LEVEL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">COMPRESSOR WARMTH & LEVEL RATIO</span>
                    <span className="text-[#a855f7] font-bold">{((voiceParams.compressorWarmth ?? 0.5) * 10).toFixed(1)} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    disabled={!voiceParams.compressorActive}
                    value={voiceParams.compressorWarmth ?? 0.5}
                    onChange={(e) => updateParam('compressorWarmth', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#a855f7] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                  <span className="text-[8px] text-gray-500 font-mono leading-normal block mt-1">
                    Adds professional thickness and levels peak signals; essential for rich, radio-ready podcasting or high performance audio.
                  </span>
                </div>

                <div className="bg-gray-950/60 p-2.5 rounded border border-gray-900 text-[9px] text-[#a855f7] font-mono flex flex-col gap-1">
                  <div className="flex justify-between font-bold">
                    <span>COMPRESSOR STATUS GATE:</span>
                    <span className="text-[#a855f7]">ONLINE</span>
                  </div>
                  <p className="text-gray-500 text-[8px] leading-relaxed">
                    Auto-gain architecture with soft knee (30dB width) and responsive fast transients (3ms attack, 150ms release).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENSEMBLE & COHERENCE */}
        {activeRack === 'mod' && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ENSEMBLE CHORUS & VOICE LAYERING */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ec4899] font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#ec4899]" />
                  STEREO CHORUS & DETUNING
                </span>
                <button
                  id="toggle-chorus"
                  onClick={() => updateParam('chorusActive', !voiceParams.chorusActive)}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold transition-all ${
                    voiceParams.chorusActive 
                      ? 'bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/30' 
                      : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                  }`}
                >
                  {voiceParams.chorusActive ? '● CHORUS ACTIVE' : '○ BYPASSED'}
                </button>
              </div>

              <div className="space-y-4">
                {/* CHORUS VOICES */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Ensemble Voices count</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        onClick={() => updateParam('chorusVoices', num)}
                        disabled={!voiceParams.chorusActive}
                        className={`cursor-pointer py-1 rounded text-[9px] font-mono tracking-wider text-center border font-bold transition-all ${
                          !voiceParams.chorusActive 
                            ? 'opacity-30 cursor-not-allowed border-gray-900 bg-transparent text-zinc-600'
                            : voiceParams.chorusVoices === num
                              ? 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/40'
                              : 'bg-transparent text-gray-400 border-gray-900 hover:text-gray-200'
                        }`}
                      >
                        VOICE {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CHORUS DRIVE */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">CHORUS MIX & DRIVE SATURATION</span>
                    <span className="text-[#ec4899] font-bold">{((voiceParams.chorusDrive ?? 0.3) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    disabled={!voiceParams.chorusActive}
                    value={voiceParams.chorusDrive ?? 0.3}
                    onChange={(e) => updateParam('chorusDrive', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#ec4899] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>

                {/* VOCAL THICKENER SECTION */}
                <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-300 font-mono font-bold uppercase tracking-wider">Unison Vocal Thickener</span>
                    <span className="text-[8px] text-gray-500 font-mono">Triggers parallel detuning voices 123</span>
                  </div>
                  <button
                    id="toggle-vocal-thickening"
                    onClick={() => updateParam('vocalThickeningActive', !voiceParams.vocalThickeningActive)}
                    className={`cursor-pointer px-2 py-1 rounded text-[9.5px] font-mono tracking-wider border font-bold transition-all ${
                      voiceParams.vocalThickeningActive 
                        ? 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/40' 
                        : 'bg-transparent text-zinc-600 border-gray-900 hover:text-gray-400'
                    }`}
                  >
                    {voiceParams.vocalThickeningActive ? '● UNISON LAYERED ON' : '○ THICKENING OFF'}
                  </button>
                </div>

                {/* THICKENING LAYERS */}
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateParam('vocalThickeningVoicesCount', num)}
                      disabled={!voiceParams.vocalThickeningActive}
                      className={`cursor-pointer py-1 rounded text-[9px] font-mono tracking-wider text-center border font-bold transition-all ${
                        !voiceParams.vocalThickeningActive 
                          ? 'opacity-30 cursor-not-allowed border-gray-900 bg-transparent text-zinc-600'
                          : voiceParams.vocalThickeningVoicesCount === num
                            ? 'bg-[#ec4899]/10 text-white border-[#ec4899]/35'
                            : 'bg-transparent text-gray-400 border-gray-900 hover:text-zinc-200'
                      }`}
                    >
                      {num === 1 ? '1 LAYER' : `${num} LAYERS`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MASTER COHERENCE SWEET FILTER SQUEEZE */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ec4899] font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#ec4899]" />
                  COHERENCE FILTER SQUEEZE
                </span>
                <span className="text-[7.5px] font-mono text-zinc-500 uppercase">Master sweep filter</span>
              </div>

              <div className="space-y-4">
                {/* SQUEEZE CUTOFF */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">FILTER SWEET CUTOFF FREQUENCY</span>
                    <span className="text-[#ec4899] font-bold">
                      {(voiceParams.filterSqueezeCutoff ?? 12000) >= 11500 
                        ? 'BYPASS (WIDE)' 
                        : `${(voiceParams.filterSqueezeCutoff ?? 12000)} Hz`
                      }
                    </span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="12000"
                    step="100"
                    value={voiceParams.filterSqueezeCutoff ?? 12000}
                    onChange={(e) => updateParam('filterSqueezeCutoff', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#ec4899]"
                  />
                </div>

                {/* SQUEEZE WIDTH */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">SQUEEZE RESONANCE (BANDWIDTH)</span>
                    <span className="text-[#ec4899] font-bold">{(voiceParams.filterSqueezeWidth ?? 1.0).toFixed(1)} Q</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="8.0"
                    step="0.1"
                    value={voiceParams.filterSqueezeWidth ?? 1.0}
                    onChange={(e) => updateParam('filterSqueezeWidth', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#ec4899]"
                  />
                  <span className="text-[8px] text-gray-400 font-mono block">Limits frequency bands to direct vocal centers, producing a highly concentrated sound squeeze.</span>
                </div>

                {/* FORMANT DELAY */}
                <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between text-[10px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#ec4899] font-mono font-bold uppercase">Formant filter Shift</span>
                    <span className="text-gray-500 text-[8px] font-mono">Adds phonetic vowel shifting delay feedback</span>
                  </div>
                  <button
                    id="toggle-formant-delay"
                    onClick={() => updateParam('formantDelayActive', !voiceParams.formantDelayActive)}
                    className={`cursor-pointer px-2 py-0.5 rounded text-[9.5px] font-mono border font-bold transition-all ${
                      voiceParams.formantDelayActive 
                        ? 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/40' 
                        : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-400'
                    }`}
                  >
                    {voiceParams.formantDelayActive ? '● VALVE SHIFT ON' : '○ SHIFT OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACOUSTIC SPACE (REVERBS, REFLECTIONS, DELAYS & LFO) */}
        {activeRack === 'spatial' && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CONVOLUTION REVERBS PANEL */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#f59e0b] font-bold flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-[#f59e0b]" />
                  HD CONVOLUTION SPACE REVERB
                </span>
                <button
                  id="toggle-reverb"
                  onClick={() => updateParam('reverbActive', !voiceParams.reverbActive)}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold transition-all ${
                    voiceParams.reverbActive 
                      ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' 
                      : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                  }`}
                >
                  {voiceParams.reverbActive ? '● SPACE ACTIVE' : '○ BYPASSED'}
                </button>
              </div>

              <div className="space-y-3.5">
                {/* REVERB TYPE SEL */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Space / Reverb algorithm</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['hall', 'plate', 'spring', 'tank'].map((type) => (
                      <button
                        key={type}
                        onClick={() => updateParam('reverbType', type)}
                        disabled={!voiceParams.reverbActive}
                        className={`cursor-pointer py-1 rounded text-[9px] font-mono tracking-wider text-center border font-bold transition-all uppercase ${
                          !voiceParams.reverbActive 
                            ? 'opacity-30 cursor-not-allowed border-gray-900 bg-transparent text-zinc-600'
                            : voiceParams.reverbType === type
                              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40'
                              : 'bg-transparent text-gray-400 border-gray-900 hover:text-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ROOM SIZE */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">ROOM SIZE & TAILING DECAY</span>
                    <span className="text-[#f59e0b] font-bold">{(voiceParams.reverbRoomSize ?? 0.6).toFixed(2)} SEC</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    disabled={!voiceParams.reverbActive}
                    value={voiceParams.reverbRoomSize ?? 0.6}
                    onChange={(e) => updateParam('reverbRoomSize', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#f59e0b] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>

                {/* REVERB DRY WET */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">SPACE WETNESS (DRY/WET MIX)</span>
                    <span className="text-[#f59e0b] font-bold">{((voiceParams.reverbReflectionsDryWet ?? 0.35) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    disabled={!voiceParams.reverbActive}
                    value={voiceParams.reverbReflectionsDryWet ?? 0.35}
                    onChange={(e) => updateParam('reverbReflectionsDryWet', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#f59e0b] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* ECHO & FEEDBACK DELAYS WITH TREMOLO LFO */}
            <div className="bg-gray-950/40 p-4 rounded border border-gray-900 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#f59e0b] font-bold flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-[#f59e0b]" />
                  STEREO FEEDBACK DELAYS
                </span>
                <button
                  id="toggle-delay"
                  onClick={() => updateParam('delayActive', !voiceParams.delayActive)}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold transition-all ${
                    voiceParams.delayActive 
                      ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' 
                      : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                  }`}
                >
                  {voiceParams.delayActive ? '● DELAYS DEPLOYED' : '○ BYPASSED'}
                </button>
              </div>

              <div className="space-y-3.5 pt-1">
                {/* DELAY TIME */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">DELAY TIME OFFSET (ECHO GAP)</span>
                    <span className="text-[#f59e0b] font-bold">{((voiceParams.delayTime ?? 0.35) * 1000).toFixed(0)} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.5"
                    step="0.05"
                    disabled={!voiceParams.delayActive}
                    value={voiceParams.delayTime ?? 0.35}
                    onChange={(e) => updateParam('delayTime', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#f59e0b] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>

                {/* DELAY FEEDBACK */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">DELAY FEEDBACK (ECHO DECAY)</span>
                    <span className="text-[#f59e0b] font-bold">{((voiceParams.delayFeedback ?? 0.4) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.9"
                    step="0.05"
                    disabled={!voiceParams.delayActive}
                    value={voiceParams.delayFeedback ?? 0.4}
                    onChange={(e) => updateParam('delayFeedback', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-900 rounded appearance-none cursor-pointer accent-[#f59e0b] disabled:opacity-20 disabled:cursor-not-allowed"
                  />
                </div>

                {/* TREMOLO / LFO BLOCK (INTEGRAL MODULATION) */}
                <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 text-[#f59e0b] ${voiceParams.tremoloActive ? 'animate-spin' : ''}`} />
                    <span className="text-[10px] text-gray-300 font-mono font-bold uppercase">Volume Tremolo (LFO)</span>
                  </div>
                  <button
                    id="toggle-tremolo"
                    onClick={() => updateParam('tremoloActive', !voiceParams.tremoloActive)}
                    className={`cursor-pointer px-2 py-0.5 rounded text-[9.5px] font-mono border font-bold transition-all ${
                      voiceParams.tremoloActive 
                        ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40' 
                        : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-400'
                    }`}
                  >
                    {voiceParams.tremoloActive ? '● LFO ACTIVE' : '○ LFO BYPASSED'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER METRICS RACK MOUNT SCREWS */}
      <div className="flex items-center justify-between border-t border-gray-950 pt-2.5 text-[8.5px] font-mono text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full border border-zinc-700 pointer-events-none" />
          <span>UNIT SPEC: MOUNT_B2_SLOT_4</span>
        </span>
        <span className="uppercase text-cyan-500/80">LATENCY INTEGRATION: interactive Sub-2ms Vector Core</span>
        <span className="flex items-center gap-1">
          <span>ALGO CODEC REF: 9C11D9</span>
          <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full border border-zinc-700 pointer-events-none" />
        </span>
      </div>
    </div>
  );
};
