import React, { useState, useEffect, useRef } from 'react';
import { QuantumAudioEngine } from '../lib/audioEngine';
import { 
  Play, Pause, Square, Trash2, Download, Radio, 
  ListMusic, Edit2, Check, X, FileAudio, AlertCircle 
} from 'lucide-react';

interface RecordedSound {
  id: string;
  name: string;
  date: string;
  duration: number;
  url: string;
}

interface QuantumRecordingStudioProps {
  engine: QuantumAudioEngine;
  micState: 'idle' | 'recording' | 'simulated' | 'error';
}

export const QuantumRecordingStudio: React.FC<QuantumRecordingStudioProps> = ({
  engine,
  micState
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordedSounds, setRecordedSounds] = useState<RecordedSound[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  // Audio elements for on-page playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Load existing recordings from localStorage
    const saved = localStorage.getItem('quantum_recorded_sounds');
    if (saved) {
      try {
        setRecordedSounds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved recordings:", e);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Save changes to local storage helper
  const saveToLocalStorage = (list: RecordedSound[]) => {
    localStorage.setItem('quantum_recorded_sounds', JSON.stringify(list));
  };

  const handleStartRecording = () => {
    if (micState === 'idle' || micState === 'error') {
      alert("Please connect the Live Microphone or engage Simulation first to initiate audio signal flow!");
      return;
    }

    const success = engine.startRecording();
    if (success) {
      setIsRecording(true);
      setElapsedTime(0);
      
      timerRef.current = setInterval(() => {
        setElapsedTime(engine.getRecordingElapsedTime());
      }, 100);
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recordData = engine.stopRecording();
    setIsRecording(false);
    setElapsedTime(0);

    if (recordData) {
      const newSound: RecordedSound = {
        id: `sound-${Date.now()}`,
        name: `Quantum Soundscape #${recordedSounds.length + 1}`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        duration: recordData.duration,
        url: recordData.url
      };

      const updated = [newSound, ...recordedSounds];
      setRecordedSounds(updated);
      saveToLocalStorage(updated);
    }
  };

  const handleDeleteSound = (id: string, url: string) => {
    // Revoke Object URL to release memory lease
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}

    const updated = recordedSounds.filter(s => s.id !== id);
    setRecordedSounds(updated);
    saveToLocalStorage(updated);

    if (playbackId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaybackId(null);
    }
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveRename = (id: string) => {
    const updated = recordedSounds.map(s => {
      if (s.id === id) {
        return { ...s, name: editName.trim() || s.name };
      }
      return s;
    });
    setRecordedSounds(updated);
    saveToLocalStorage(updated);
    setEditingId(null);
  };

  const handlePlaybackToggle = (sound: RecordedSound) => {
    if (playbackId === sound.id) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaybackId(null);
    } else {
      // Play new
      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(sound.url);
      audioRef.current.play().then(() => {
        setPlaybackId(sound.id);
        
        audioRef.current!.onended = () => {
          setPlaybackId(null);
        };
      }).catch(e => {
        console.error("Audio playback error:", e);
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    const ms = Math.floor((secs % 1) * 10).toString();
    return `${m}:${s}.${ms}`;
  };

  return (
    <div id="quantum-recording-studio" className="border border-gray-900 bg-[#070b12]/90 p-5 rounded-lg flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* SHIMMER EFFECT FOR RECORDING ACCENT */}
      {isRecording && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse pointer-events-none" />
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-900 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-red-800'} pointer-events-none`} />
          <div>
            <h2 id="studio-title" className="text-white text-xs uppercase font-bold tracking-widest font-sans flex items-center gap-1.5 animate-pulse">
              <span>QUANTUM SOUNDSCAPE FIELD RECORDER</span>
              {isRecording && (
                <span className="text-[8.5px] bg-red-950/40 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono font-normal">
                  CAPTURING POST-QUBIT LINE
                </span>
              )}
            </h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Capture real-time frequency modulations and matrix projections as standard WAV artifacts</p>
          </div>
        </div>

        {/* RECORDER BUTTON AND COUNTER */}
        <div id="recorder-controls" className="flex items-center gap-3">
          {/* LCD COUNTER */}
          <div className={`font-mono text-xs px-3 py-1.5 rounded border ${isRecording ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-gray-950 border-gray-950 text-gray-400'} flex items-center gap-2`}>
            <span>TIME:</span>
            <span className="font-bold tracking-wider">{formatTime(elapsedTime)}</span>
          </div>

          {!isRecording ? (
            <button
              id="start-rec-btn"
              onClick={handleStartRecording}
              className={`cursor-pointer font-mono text-xs font-bold px-4 py-2 hover:bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:text-white transition-all flex items-center gap-2 ${
                (micState === 'idle' || micState === 'error') ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={(micState === 'idle' || micState === 'error') ? 'Engage live mic or simulation to record' : 'Start high-fidelity WAV recording'}
            >
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-0.5" />
              <span>REC SOUNDSCAPE</span>
            </button>
          ) : (
            <button
              id="stop-rec-btn"
              onClick={handleStopRecording}
              className="cursor-pointer font-mono text-xs font-bold px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-white text-white" />
              <span>STOP & COMPILE</span>
            </button>
          )}
        </div>
      </div>

      {/* RECORDED SOUNDSCALES FILE GRID / TABLE */}
      {recordedSounds.length === 0 ? (
        <div id="recorder-guidelines" className="bg-gray-950/50 p-6 rounded border border-gray-900 flex flex-col items-center justify-center text-center gap-2">
          <ListMusic className="w-8 h-8 text-zinc-700 pointer-events-none" />
          <span className="text-xs text-gray-400 font-mono font-medium uppercase tracking-wider">No soundscapes compiled yet</span>
          <p className="text-[10px] text-gray-500 font-mono max-w-sm mt-0.5">
            Turn on the microphone synthesizer stream, manipulate your qubits state, then hit <strong className="text-red-400/95 font-normal">REC SOUNDSCAPE</strong> to preserve your custom quantum dimensions!
          </p>
        </div>
      ) : (
        <div id="recorded-list" className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2 rounded bg-gray-950/20 overflow-x-hidden border border-gray-950/30 p-1">
          {recordedSounds.map((sound) => (
            <div 
              key={sound.id}
              className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 rounded border transition-all text-xs font-mono select-none ${
                playbackId === sound.id 
                  ? 'bg-cyan-950/10 border-cyan-500/20 text-cyan-400' 
                  : 'bg-[#0a0f18]/60 border-gray-900 text-zinc-300 hover:border-gray-800'
              }`}
            >
              {/* FILE ICON AND DETAIL COMPONENT */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileAudio className={`w-5 h-5 shrink-0 ${playbackId === sound.id ? 'text-cyan-400 animate-bounce' : 'text-zinc-600'}`} />
                <div className="min-w-0 flex-1 text-left">
                  {editingId === sound.id ? (
                    <div className="flex items-center gap-1.5 w-full max-w-xs sm:max-w-md">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-gray-950 border border-cyan-500/30 rounded px-2 py-0.5 text-xs text-white font-mono w-full focus:outline-none focus:border-cyan-400"
                        placeholder="Soundscape name..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(sound.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button 
                        onClick={() => saveRename(sound.id)}
                        className="p-1 hover:text-green-400 text-gray-500 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:text-red-400 text-gray-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-200 truncate pr-1">{sound.name}</span>
                      <button
                        onClick={() => startRename(sound.id, sound.name)}
                        className="opacity-0 group-hover:opacity-100 hover:text-white text-zinc-500 transition-opacity cursor-pointer inline-flex p-0.5"
                        style={{ opacity: 1 }}
                        title="Rename recording"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[9px] text-gray-500 mt-1">
                    <span>DURATION: <strong className="text-zinc-400 font-normal">{sound.duration.toFixed(1)}s</strong></span>
                    <span>•</span>
                    <span>COMPILED: <strong className="text-zinc-400 font-normal">{sound.date}</strong></span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON PACK */}
              <div id={`actions-${sound.id}`} className="flex items-center justify-end gap-2 shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-950">
                {/* PLAYBACK SWITCH */}
                <button
                  onClick={() => handlePlaybackToggle(sound)}
                  className={`cursor-pointer px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono border transition-all flex items-center gap-1.5 ${
                    playbackId === sound.id
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40 hover:bg-cyan-500/30 hover:text-white'
                      : 'bg-transparent text-gray-400 border-gray-900 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {playbackId === sound.id ? (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                {/* EXPORT DIRECT WAV */}
                <a
                  href={sound.url}
                  download={`${sound.name.replace(/\s+/g, "_")}.wav`}
                  className="cursor-pointer px-3 py-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-cyan-500/40 transition-all flex items-center gap-1.5"
                  title="Download standard 16-bit PCM WAV"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>WAV</span>
                </a>

                {/* DELETE TRASH */}
                <button
                  onClick={() => handleDeleteSound(sound.id, sound.url)}
                  className="cursor-pointer p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded border border-transparent hover:border-red-500/20 transition-all"
                  title="Remove recording"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER METRICS RACK MOUNT SCREWS */}
      <div className="flex items-center justify-between border-t border-gray-950 pt-2.5 text-[8.5px] font-mono text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full border border-zinc-700 pointer-events-none" />
          <span>UNIT SPEC: MOUNT_B2_SLOT_5</span>
        </span>
        <span className="uppercase text-red-500/80 font-bold flex items-center gap-1 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          <span>REAL-TIME DIRECT PCM LINE OUT</span>
        </span>
        <span className="flex items-center gap-1">
          <span>ALGO CODEC REF: FL_WAV</span>
          <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full border border-zinc-700 pointer-events-none" />
        </span>
      </div>
    </div>
  );
};
