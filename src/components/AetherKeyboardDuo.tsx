/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Orbit, Volume2, Sliders, Music, Eye, EyeOff, Sparkles } from 'lucide-react';
import { QuantumAudioEngine } from '../lib/audioEngine';
import { VoiceGateParams } from '../types';

interface AetherKeyboardDuoProps {
  engine: QuantumAudioEngine | null;
  voiceParams: VoiceGateParams;
  setVoiceParams: React.Dispatch<React.SetStateAction<VoiceGateParams>>;
}

// Frequencies for our 12 notes (C4 of middle octave) with MIDI mappings
interface PianoKey {
  note: string;
  freq: number;
  isBlack: boolean;
  qwertyChar: string;
  midiNote: number;
}

const PIANO_KEYS: PianoKey[] = [
  { note: 'C4', freq: 261.63, isBlack: false, qwertyChar: 'a', midiNote: 60 },
  { note: 'C#4', freq: 277.18, isBlack: true, qwertyChar: 'w', midiNote: 61 },
  { note: 'D4', freq: 293.66, isBlack: false, qwertyChar: 's', midiNote: 62 },
  { note: 'D#4', freq: 311.13, isBlack: true, qwertyChar: 'e', midiNote: 63 },
  { note: 'E4', freq: 329.63, isBlack: false, qwertyChar: 'd', midiNote: 64 },
  { note: 'F4', freq: 349.23, isBlack: false, qwertyChar: 'f', midiNote: 65 },
  { note: 'F#4', freq: 369.99, isBlack: true, qwertyChar: 't', midiNote: 66 },
  { note: 'G4', freq: 392.00, isBlack: false, qwertyChar: 'g', midiNote: 67 },
  { note: 'G#4', freq: 415.30, isBlack: true, qwertyChar: 'y', midiNote: 68 },
  { note: 'A4', freq: 440.00, isBlack: false, qwertyChar: 'h', midiNote: 69 },
  { note: 'A#4', freq: 466.16, isBlack: true, qwertyChar: 'u', midiNote: 70 },
  { note: 'B4', freq: 493.88, isBlack: false, qwertyChar: 'j', midiNote: 71 },
  { note: 'C5', freq: 523.25, isBlack: false, qwertyChar: 'k', midiNote: 72 },
  { note: 'C#5', freq: 554.37, isBlack: true, qwertyChar: 'o', midiNote: 73 },
  { note: 'D5', freq: 587.33, isBlack: false, qwertyChar: 'l', midiNote: 74 },
  { note: 'D#5', freq: 622.25, isBlack: true, qwertyChar: 'p', midiNote: 75 },
  { note: 'E5', freq: 659.25, isBlack: false, qwertyChar: ';', midiNote: 76 }
];

const DRUM_PADS = [
  { name: 'KICK [1]', key: '1', index: 0, color: 'border-rose-500/30 text-rose-400 bg-rose-950/10', midiNote: 36 },
  { name: 'SNARE [2]', key: '2', index: 1, color: 'border-violet-500/30 text-violet-400 bg-violet-950/10', midiNote: 38 },
  { name: 'HI-HAT [3]', key: '3', index: 2, color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10', midiNote: 42 },
  { name: 'CLAP [4]', key: '4', index: 3, color: 'border-amber-500/30 text-amber-400 bg-amber-950/10', midiNote: 39 },
  { name: 'TOM [5]', key: '5', index: 4, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10', midiNote: 45 },
  { name: 'COWBELL [6]', key: '6', index: 5, color: 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-950/10', midiNote: 56 },
];

export default function AetherKeyboardDuo({ engine, voiceParams, setVoiceParams }: AetherKeyboardDuoProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [waveType, setWaveType] = useState<OscillatorType>('sawtooth');
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});
  const [activeDrums, setActiveDrums] = useState<Record<number, boolean>>({});
  const [musicalTypingActive, setMusicalTypingActive] = useState(true);

  // MIDI outputs state
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [midiOutputs, setMidiOutputs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedMidiId, setSelectedMidiId] = useState<string>('');
  const [showMidiHelp, setShowMidiHelp] = useState(false);

  // Sync MIDI outputs from engine
  useEffect(() => {
    if (!engine) return;
    const syncMidiPorts = async () => {
      const allowed = await engine.requestMidiAccess();
      if (allowed) {
        setMidiEnabled(true);
        setMidiOutputs(engine.availableMidiOutputs);
        setSelectedMidiId(engine.selectedMidiOutputId || '');
      }
    };
    syncMidiPorts();
    
    // Periodically update list if devices are plugged/unplugged
    const interval = setInterval(() => {
      if (engine.availableMidiOutputs.length !== midiOutputs.length) {
        setMidiOutputs(engine.availableMidiOutputs);
        if (!selectedMidiId && engine.selectedMidiOutputId) {
          setSelectedMidiId(engine.selectedMidiOutputId);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [engine, midiOutputs.length, selectedMidiId]);

  const handleMidiPortChange = (id: string) => {
    setSelectedMidiId(id);
    if (engine) {
      engine.setMidiOutput(id);
    }
  };

  // Trigger synth note with visual feedback
  const playNote = useCallback((freq: number, noteId: string, midiNote: number) => {
    if (!engine) return;
    
    // Play sound
    engine.triggerSynthNote(freq, waveType);

    // Send Real Web MIDI to DAW (Logic/GarageBand)
    if (midiEnabled) {
      engine.sendMidiNoteOn(midiNote, 100);
      setTimeout(() => {
        engine.sendMidiNoteOff(midiNote);
      }, 150);
    }

    // Active Keyboard Pitch Shift Tracking
    if (voiceParams.pitchTrackByKeyboard) {
      // Calculate octave offset relative to middle C (C4 = 60)
      const semitonesFromMiddleC = midiNote - 60;
      setVoiceParams(prev => ({
        ...prev,
        pitchShift: semitonesFromMiddleC
      }));
    }

    // Active status feedback
    setActiveNotes(prev => ({ ...prev, [noteId]: true }));
    setTimeout(() => {
      setActiveNotes(prev => ({ ...prev, [noteId]: false }));
    }, 150);
  }, [engine, waveType, midiEnabled, voiceParams.pitchTrackByKeyboard, setVoiceParams]);

  // Trigger drum sample with visual feedback
  const playDrum = useCallback((index: number, midiNote: number) => {
    if (!engine) return;
    
    engine.triggerDrumPad(index);

    // Send MIDI to DAW
    if (midiEnabled) {
      engine.sendMidiNoteOn(midiNote, 100);
      setTimeout(() => {
        engine.sendMidiNoteOff(midiNote);
      }, 150);
    }
    
    setActiveDrums(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setActiveDrums(prev => ({ ...prev, [index]: false }));
    }, 150);
  }, [engine, midiEnabled]);

  // Listening for physical keyboard keydown events (GarageBand style!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!musicalTypingActive) return;

      // Ignore keys if user is typing in forms/textareas
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const keyLower = e.key.toLowerCase();

      // Check piano keys
      const matchedPianoKey = PIANO_KEYS.find(k => k.qwertyChar === keyLower);
      if (matchedPianoKey) {
        e.preventDefault();
        playNote(matchedPianoKey.freq, matchedPianoKey.note, matchedPianoKey.midiNote);
        return;
      }

      // Check drum keys
      const matchedDrumPad = DRUM_PADS.find(d => d.key === keyLower);
      if (matchedDrumPad) {
        e.preventDefault();
        playDrum(matchedDrumPad.index, matchedDrumPad.midiNote);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [musicalTypingActive, playNote, playDrum]);

  return (
    <div id="aether-midi-duo-panel" className="relative group/panel border border-gray-900 bg-[#070b12]/95 rounded-lg overflow-hidden flex flex-col text-left transition-all duration-300">
      
      {/* Decorative Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-80" />

      {/* Control Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c121e]/90 border-b border-gray-950">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="flex flex-col">
            <h3 className="text-[11px] font-mono font-bold text-gray-200 tracking-wider">
              AETHER SIGNAL INJECTOR & DRUM MATRIX
            </h3>
            <span className="text-[8px] font-mono text-gray-500 leading-none">
              MUSICAL TYPING DUO • ROUTED TO CORE CYMATIC SYSTEM
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Wave selection */}
          {isOpen && (
            <div className="flex items-center gap-1.5 bg-[#05080f] border border-gray-900/80 px-2 py-1 rounded">
              <span className="text-[8px] font-mono text-gray-400">CARRIER:</span>
              <div className="flex gap-1">
                {(['sawtooth', 'square', 'sine', 'triangle'] as OscillatorType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setWaveType(t)}
                    className={`cursor-pointer px-1 py-0.5 rounded text-[8px] font-mono font-bold leading-none tracking-tight transition-all ${
                      waveType === t 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30' 
                        : 'bg-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {t.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Toggle Lock */}
          {isOpen && (
            <button
              onClick={() => setMusicalTypingActive(!musicalTypingActive)}
              className={`cursor-pointer px-2 py-1 rounded text-[8px] font-mono border flex items-center gap-1 transition-all ${
                musicalTypingActive
                  ? 'border-emerald-500/20 text-emerald-400 bg-emerald-950/15'
                  : 'border-yellow-500/20 text-yellow-500 bg-yellow-950/15'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${musicalTypingActive ? 'bg-emerald-400 animate-ping' : 'bg-yellow-500'}`} />
              <span>{musicalTypingActive ? 'TYPING ON' : 'TYPING OFF'}</span>
            </button>
          )}

          {/* Deploy Panel Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer flex items-center gap-1 bg-[#090f18] hover:bg-[#131d2e] border border-gray-900 text-gray-400 hover:text-white px-2 py-1 rounded transition-all text-[9px] font-mono"
          >
            {isOpen ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                <span>COLLAPSE DECK</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>DEPLOY DECK</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 flex flex-col gap-4 animate-fade-in">
          
          {/* Dual Interface Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            
            {/* 6-Pad Analog Drum Matrix */}
            <div className="xl:col-span-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 border-b border-gray-950 pb-1">
                <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-fuchsia-400" /> SYNTH HEAVY DRUM TRIPS</span>
                <span>PAD 1-6 KEYBOARD CAPABLE</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {DRUM_PADS.map((pad) => {
                  const isActive = activeDrums[pad.index];
                  return (
                    <button
                      key={pad.name}
                      onClick={() => playDrum(pad.index, pad.midiNote)}
                      className={`cursor-pointer h-14 rounded-lg border flex flex-col items-center justify-center p-2 text-center transition-all ${
                        isActive
                           ? 'bg-cyan-500/25 border-cyan-400 border shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-98'
                          : `${pad.color} border hover:border-cyan-500/40 hover:bg-[#0c1320]`
                      }`}
                    >
                      <span className="text-[9px] font-mono font-bold leading-none select-none tracking-wider">
                        {pad.name.split(' ')[0]}
                      </span>
                      <span className="text-[7px] font-mono text-gray-500 mt-1 select-none font-semibold">
                        QWERTY: {pad.key}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Virtual Musical Keyboard */}
            <div className="xl:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 border-b border-gray-950 pb-1">
                <span className="flex items-center gap-1"><Music className="w-2.5 h-2.5 text-cyan-400" /> RESOPHANT CHROMATE KEYBOARD</span>
                <span>{voiceParams.pitchTrackByKeyboard ? "TRACKING ACTIVE TO VOICE SHIFTER ✅" : "KEYS A - W - S - E - D - F - T - G - Y - H - U - J - K - O - L - P - ;"}</span>
              </div>

              {/* White and Black Keys container */}
              <div className="relative flex w-full bg-[#03060a] border border-gray-950 p-1.5 py-2.5 rounded-lg select-none min-h-[95px] overflow-hidden">
                <div className="relative flex w-full h-[76px] gap-[2px]">
                  
                  {/* White Keys */}
                  {PIANO_KEYS.map((key, idx) => {
                    if (key.isBlack) return null;
                    const isActive = activeNotes[key.note];
                    return (
                      <button
                        key={key.note}
                        onClick={() => playNote(key.freq, key.note, key.midiNote)}
                        className={`cursor-pointer flex-1 h-full rounded-b border relative z-10 flex flex-col justify-end pb-1 transition-all ${
                          isActive
                            ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-gray-100 hover:bg-white border-gray-300 text-gray-800'
                        }`}
                      >
                        <div className="w-full text-center flex flex-col leading-none">
                          <span className="text-[7px] font-mono uppercase font-black" style={{ fontSize: '7px' }}>
                            {key.qwertyChar}
                          </span>
                          <span className="text-[5px] text-gray-500 font-mono mt-0.5" style={{ fontSize: '5px' }}>
                            {key.note}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Absolute Position Black Keys */}
                  <div className="absolute inset-0 z-20 pointer-events-none flex">
                    <div className="relative w-full h-full">
                      {PIANO_KEYS.map((key, idx) => {
                        if (!key.isBlack) return null;
                        
                        let leftPercent = 0;
                        switch (key.note) {
                          case 'C#4': leftPercent = 6.8; break;
                          case 'D#4': leftPercent = 16.5; break;
                          case 'F#4': leftPercent = 36.5; break;
                          case 'G#4': leftPercent = 46.5; break;
                          case 'A#4': leftPercent = 56.5; break;
                          case 'C#5': leftPercent = 76.8; break;
                          case 'D#5': leftPercent = 86.5; break;
                        }

                        const isActive = activeNotes[key.note];

                        return (
                          <button
                            key={key.note}
                            onClick={() => playNote(key.freq, key.note, key.midiNote)}
                            className="absolute pointer-events-auto w-[6.5%] h-12 rounded-b bg-[#090f19] hover:bg-[#141e2e] border-x border-b border-gray-900 flex flex-col justify-end pb-1 text-center transition-all cursor-pointer shadow-md"
                            style={{ 
                              left: `${leftPercent}%`,
                              backgroundColor: isActive ? '#06b6d4' : '',
                              color: isActive ? '#000' : '#888'
                            }}
                          >
                            <span className="text-[6px] font-mono leading-none uppercase font-bold" style={{ fontSize: '6px' }}>
                              {key.qwertyChar}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* DAW & Web MIDI Interface Deck */}
          <div className="border border-cyan-950/20 bg-[#04080e]/90 p-3 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-left">
            <div className="flex flex-col gap-0.5 max-w-xl">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`w-1.5 h-1.5 rounded-full ${midiEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-[9px] font-mono font-bold text-gray-300 uppercase tracking-wide">
                  DAW CONNECTIVITY & WEB MIDI OUTPUT
                </span>
                {midiEnabled ? (
                  <span className="bg-cyan-500/10 text-cyan-400 text-[6.5px] font-bold px-1 py-0.2 rounded border border-cyan-500/20 font-mono">
                    ONLINE Link Enabled
                  </span>
                ) : (
                  <span className="bg-gray-800/20 text-gray-400 text-[6.5px] font-semibold px-1 py-0.2 rounded border border-gray-800/20 font-mono">
                    STANDBY
                  </span>
                )}
              </div>
              <p className="text-[9px] text-gray-400 leading-normal font-mono">
                Transmit typing keys &amp; pads as physical MIDI triggers to Apple Logic Pro, GarageBand, Ableton Live, FL Studio, etc. Supports macOS IAC buses &amp; loopMIDI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {midiEnabled ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono text-gray-400">MIDI OUT PORT:</span>
                  <select
                    value={selectedMidiId}
                    onChange={(e) => handleMidiPortChange(e.target.value)}
                    className="bg-gray-950 border border-gray-900 rounded text-[9px] font-mono px-2 py-1 text-cyan-300 outline-none cursor-pointer focus:border-cyan-500 max-w-[150px]"
                  >
                    {midiOutputs.length === 0 ? (
                      <option value="">No Ports Detected</option>
                    ) : (
                      midiOutputs.map(port => (
                        <option key={port.id} value={port.id}>{port.name}</option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (engine) {
                      const allowed = await engine.requestMidiAccess();
                      if (allowed) {
                        setMidiEnabled(true);
                      }
                    }
                  }}
                  className="cursor-pointer bg-cyan-600/15 hover:bg-cyan-600/35 border border-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded text-[9px] font-mono font-bold transition-all"
                >
                  START MIDI BRIDGE
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowMidiHelp(!showMidiHelp)}
                className="cursor-pointer bg-gray-950 hover:bg-[#0e1624] border border-gray-900 text-gray-400 hover:text-gray-200 px-2 py-1 rounded text-[8px] font-mono transition-all"
              >
                {showMidiHelp ? "CLOSE MANUAL" : "DAW CONNECTIVITY HANDBOOK"}
              </button>
            </div>
          </div>

          {showMidiHelp && (
            <div className="bg-[#05070d] border border-cyan-500/10 p-3 rounded-lg text-left text-[9px] font-mono leading-relaxed text-gray-400 animate-fade-in space-y-2">
              <div className="text-[10px] font-bold text-cyan-400 border-b border-cyan-500/10 pb-1">
                💻 DAW SYNCHRONIZATION BLUEPRINT
              </div>
              <div className="space-y-1">
                <strong className="text-gray-200 block text-[9.5px]"> macOS Linkage (GarageBand, Logic Pro, Ableton):</strong> 
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Launch <span className="text-cyan-300">Audio MIDI Setup</span> on your Mac (via Cmd + Space).</li>
                  <li>Click <span className="text-cyan-300">Window &gt; Show MIDI Studio</span>.</li>
                  <li>Double-click the <span className="text-cyan-300">IAC Driver</span> box, and tick <strong className="text-emerald-400">"Device is online"</strong>. Then hit Apply.</li>
                  <li>Select <span className="text-cyan-300">"IAC Driver Bus 1"</span> in our dropdown above.</li>
                  <li>Open <span className="text-cyan-300">GarageBand</span> / <span className="text-cyan-300">Logic Pro</span> on any software instrument Track. Play!</li>
                </ol>
              </div>
              <div className="space-y-1 pt-0.5">
                <strong className="text-gray-200 block text-[9.5px]">❖ Windows Linkage (FL Studio, Ableton, Studio One):</strong> 
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Download and install utility <span className="text-cyan-300">loopMIDI</span> (industry standard virtual channel).</li>
                  <li>Add a virtual cable port named <span className="text-cyan-300">"loopMIDI Port"</span>.</li>
                  <li>Choose <span className="text-cyan-300">"loopMIDI Port"</span> in our dropdown selector above.</li>
                  <li>In your DAW's MIDI Devices Preferences, set loopMIDI as active Input. Enjoy!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Quick Info Bar */}
          <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 bg-gray-950/40 border border-gray-950 p-2 rounded">
            <span>💻 COHERENT INTERFERENCE CARRIER: PRESS KEYS RAPIDLY IN LEGATO TO ACCUMULATE CYMATIC HARMONICS</span>
            <div className="flex items-center gap-1 text-cyan-400">
              <Volume2 className="w-2.5 h-2.5 shrink-0" />
              <span>SIGNAL INJECTED INTO PRE-QUBIT ENGINE</span>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}
