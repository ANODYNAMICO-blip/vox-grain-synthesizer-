/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Download, Upload, Trash2, Cpu, Check, ChevronUp, ChevronDown, Hash, Cloud, Database, RefreshCw, FileSpreadsheet, CloudDownload, CloudUpload, UserCheck, AlertTriangle } from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/firebaseAuth';
import { 
  findPresetsSpreadsheet, 
  createPresetsSpreadsheet, 
  syncPresetsToSpreadsheet, 
  importPresetsFromSpreadsheet, 
  savePresetPackToDrive, 
  listPresetPacksInDrive, 
  loadPresetPackFromDrive 
} from '../lib/googleDriveSheets';
import { QuantumPreset, QubitNode, GranularParams, VoiceGateParams } from '../types';

interface PresetManagerProps {
  currentQubits: QubitNode[];
  currentGranularParams: GranularParams;
  currentVoiceParams: VoiceGateParams;
  onLoadPreset: (preset: QuantumPreset) => void;
  engine?: any;
  userPresets?: QuantumPreset[];
  setUserPresets?: React.Dispatch<React.SetStateAction<QuantumPreset[]>>;
  activePresetId?: string;
  setActivePresetId?: React.Dispatch<React.SetStateAction<string>>;
  flowLocked?: boolean;
}

// All categorries, with up to 32 music-centric, atmospheric, and stylistic choices
export const PRESET_CATEGORIES = [
  'Atmospheric', 'Glitch', 'Sub-Bass', 'Experimental',
  'Ambient', 'Synthwave', 'Techno', 'Lo-Fi',
  'Hip-Hop', 'House', 'Dubstep', 'Cinematic',
  'IDM', 'Industrial', 'Drone', 'Chiptune',
  'Psytrance', 'Post-Rock', 'Electro', 'Metal',
  'Shoegaze', 'Trance', 'Garage', 'Drum & Bass',
  'Vaporwave', 'Eurodance', 'Afrobeats', 'Trap',
  'Darkwave', 'Neo-Classical', 'Minimalist', 'Acid House'
];

// Factory standard configurations
const FACTORY_PRESETS: QuantumPreset[] = [
  {
    id: 'f-aether-whispers',
    name: 'Aether Whispers',
    description: 'Create misty, ghostly, delayed vocal projections with high vacuum static.',
    isFactory: true,
    category: 'Atmospheric',
    qubits: [
      {
        id: 'q-hadamard-aw',
        type: 'HADAMARD',
        name: 'Superposition (H)',
        symbol: 'H',
        description: 'Creates a 50/50 stereo superposition with temporal phase interference.',
        active: true,
        color: '#06b6d4',
        params: { superpositionAngle: 95 }
      },
      {
        id: 'q-teleport-aw',
        type: 'TELEPORTER',
        name: 'Delay Teleporter (T)',
        symbol: 'T',
        description: 'Instantly translates audio waves over variable echo loops.',
        active: true,
        color: '#ec4899',
        params: { teleportDelay: 600, teleportJitter: 45 }
      },
      {
        id: 'q-dec-aw',
        type: 'DECOHERENCE',
        name: 'Decoherence Chaos (D)',
        symbol: 'D',
        description: 'Simulates decoherence noise. Interjects vacuum crackle keyed to speech peaks.',
        active: true,
        color: '#ef4444',
        params: { decoherenceNoise: 35 }
      }
    ],
    granularParams: {
      grainSize: 220,
      overlap: 4,
      pitchRatio: 0.85,
      jitter: 30,
      spray: 40,
      feedback: 0.35
    },
    voiceParams: {
      threshold: -45,
      gain: 1.1,
      pitchShift: -2
    }
  },
  {
    id: 'f-hyper-entanglement',
    name: 'Hyper-Entanglement',
    description: 'Entangle voices with high frequency metallic synthetic carriers.',
    isFactory: true,
    category: 'Experimental',
    qubits: [
      {
        id: 'q-entangle-he',
        type: 'ENTANGLEMENT',
        name: 'Coherent Entanglement (Ψ)',
        symbol: 'Ψ',
        description: 'Entangles voice with synthetic acoustic carriers, generating ring modulations.',
        active: true,
        color: '#8b5cf6',
        params: { entangleFrequency: 440 }
      },
      {
        id: 'q-teleport-he',
        type: 'TELEPORTER',
        name: 'Delay Teleporter (T)',
        symbol: 'T',
        description: 'Instantly translates audio waves over variable echo loops.',
        active: true,
        color: '#ec4899',
        params: { teleportDelay: 220, teleportJitter: 15 }
      }
    ],
    granularParams: {
      grainSize: 100,
      overlap: 6,
      pitchRatio: 1.45,
      jitter: 10,
      spray: 15,
      feedback: 0.2
    },
    voiceParams: {
      threshold: -45,
      gain: 1.0,
      pitchShift: 1
    }
  },
  {
    id: 'f-pauli-burst',
    name: 'Pauli Noise Burst',
    description: 'A heavily bitcrushed, distorted, digital fuzz system flipping voice spin.',
    isFactory: true,
    category: 'Glitch',
    qubits: [
      {
        id: 'q-pauli-pb',
        type: 'PAULI_X',
        name: 'Pauli-X Flip (X)',
        symbol: 'X',
        description: 'Flips high/low frequency wave spin. Adds digital quantization saturation.',
        active: true,
        color: '#f59e0b',
        params: { spinFlipRate: 75 }
      },
      {
        id: 'q-dec-pb',
        type: 'DECOHERENCE',
        name: 'Decoherence Chaos (D)',
        symbol: 'D',
        description: 'Simulates decoherence noise.',
        active: true,
        color: '#ef4444',
        params: { decoherenceNoise: 60 }
      }
    ],
    granularParams: {
      grainSize: 140,
      overlap: 2,
      pitchRatio: 0.6,
      jitter: 45,
      spray: 30,
      feedback: 0.15
    },
    voiceParams: {
      threshold: -45,
      gain: 1.3,
      pitchShift: -6
    }
  },
  {
    id: 'f-prismatic-sweeper',
    name: 'Prismatic Sweeper',
    description: 'Resonant sweeping phase filters splitting physical stereo superposition states.',
    isFactory: true,
    category: 'Ambient',
    qubits: [
      {
        id: 'q-phase-ps',
        type: 'PHASE_S',
        name: 'Phase Sweep (S)',
        symbol: 'S',
        description: 'Sweeps phase angle of audio streams over interactive peaking comb filters.',
        active: true,
        color: '#10b981',
        params: { phaseShift: 110, resonance: 80 }
      },
      {
        id: 'q-hadamard-ps',
        type: 'HADAMARD',
        name: 'Superposition (H)',
        symbol: 'H',
        description: 'Splits voice into out-of-phase left and right spatial energy fields.',
        active: true,
        color: '#06b6d4',
        params: { superpositionAngle: 90 }
      }
    ],
    granularParams: {
      grainSize: 310,
      overlap: 5,
      pitchRatio: 1.0,
      jitter: 15,
      spray: 55,
      feedback: 0.45
    },
    voiceParams: {
      threshold: -45,
      gain: 0.95,
      pitchShift: 0
    }
  }
];

export default function PresetManager({
  currentQubits,
  currentGranularParams,
  currentVoiceParams,
  onLoadPreset,
  engine,
  userPresets: propUserPresets,
  setUserPresets: propSetUserPresets,
  activePresetId: propActivePresetId,
  setActivePresetId: propSetActivePresetId,
  flowLocked,
}: PresetManagerProps) {
  // Saved user presets list
  const [localUserPresets, setLocalUserPresets] = useState<QuantumPreset[]>(() => {
    const saved = localStorage.getItem('vgs_user_presets');
    return saved ? JSON.parse(saved) : [];
  });

  const userPresets = propUserPresets !== undefined && propSetUserPresets !== undefined
    ? propUserPresets
    : localUserPresets;

  const setUserPresets = propUserPresets !== undefined && propSetUserPresets !== undefined
    ? propSetUserPresets
    : setLocalUserPresets;

  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('Atmospheric');
  const [selectedFormTags, setSelectedFormTags] = useState<string[]>(['Atmospheric']);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  const [localActivePresetId, setLocalActivePresetId] = useState<string>('f-aether-whispers');
  const activePresetId = propActivePresetId !== undefined && propSetActivePresetId !== undefined
    ? propActivePresetId
    : localActivePresetId;

  const setActivePresetId = propActivePresetId !== undefined && propSetActivePresetId !== undefined
    ? propSetActivePresetId
    : setLocalActivePresetId;

  // Google Workspace Flow Sync states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [spreadsheetStatus, setSpreadsheetStatus] = useState<string>('Unlinked');
  const [driveBackups, setDriveBackups] = useState<Array<{ id: string; name: string; createdTime: string }>>([]);
  const [backupName, setBackupName] = useState<string>('quantum_vocal_flow_pack.json');
  const [workspaceError, setWorkspaceError] = useState<string>('');

  // Initialize Google Workspace Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setWorkspaceError('');
        loadSpreadsheetDetails(token);
        loadDriveBackups(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken('');
        setSpreadsheetId('');
        setSpreadsheetStatus('Unlinked');
        setDriveBackups([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setWorkspaceError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        triggerSuccess(`Google Account Connected: ${result.user.email}`);
        await loadSpreadsheetDetails(result.accessToken);
        await loadDriveBackups(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setWorkspaceError(err.message || 'Authentication flow interrupted.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    setWorkspaceError('');
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken('');
      setSpreadsheetId('');
      setSpreadsheetStatus('Unlinked');
      setDriveBackups([]);
      triggerSuccess('Successfully signed out of Google Cloud.');
    } catch (err: any) {
      setWorkspaceError(err.message || 'Logout failed.');
    }
  };

  const loadSpreadsheetDetails = async (token: string) => {
    try {
      setSpreadsheetStatus('Locating...');
      const sheet = await findPresetsSpreadsheet(token);
      if (sheet) {
        setSpreadsheetId(sheet.id);
        setSpreadsheetStatus('Linked');
      } else {
        setSpreadsheetId('');
        setSpreadsheetStatus('Not Created');
      }
    } catch (err: any) {
      setSpreadsheetStatus('Error');
    }
  };

  const handleCreateSheet = async () => {
    if (!googleToken) return;
    setIsGoogleLoading(true);
    setWorkspaceError('');
    try {
      setSpreadsheetStatus('Creating...');
      const sheetId = await createPresetsSpreadsheet(googleToken);
      setSpreadsheetId(sheetId);
      setSpreadsheetStatus('Linked');
      triggerSuccess('Successfully created Quantum Vocal Synth Flow sheet!');
    } catch (err: any) {
      setWorkspaceError(`Failed to initialize Google Sheet: ${err.message}`);
      setSpreadsheetStatus('Not Created');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePushToSheet = async () => {
    if (!googleToken || !spreadsheetId) return;
    setIsGoogleLoading(true);
    setWorkspaceError('');
    try {
      await syncPresetsToSpreadsheet(googleToken, spreadsheetId, userPresets);
      triggerSuccess(`Successfully synchronized ${userPresets.length} presets to your Google Sheet!`);
    } catch (err: any) {
      setWorkspaceError(`Full sync write failed: ${err.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!googleToken || !spreadsheetId) return;
    
    const confirmRestore = window.confirm(
      "Are you sure you want to pull data from your Google Sheet? This will merge any presets in the sheet into your current list."
    );
    if (!confirmRestore) return;

    setIsGoogleLoading(true);
    setWorkspaceError('');
    try {
      const sheetPresets = await importPresetsFromSpreadsheet(googleToken, spreadsheetId);
      if (sheetPresets.length === 0) {
        triggerSuccess('No custom presets found in the Google Sheet. Sync is up to date.');
        return;
      }

      // Merge logically by matching IDs or Names
      setUserPresets(prev => {
        const merged = [...prev];
        sheetPresets.forEach(sp => {
          const existsIdx = merged.findIndex(p => p.id === sp.id || p.name.toLowerCase() === sp.name.toLowerCase());
          if (existsIdx !== -1) {
            merged[existsIdx] = sp;
          } else {
            merged.push(sp);
          }
        });
        return merged;
      });

      triggerSuccess(`Successfully imported ${sheetPresets.length} presets from your Google Sheet!`);
    } catch (err: any) {
      setWorkspaceError(`Import failed: ${err.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const loadDriveBackups = async (token: string) => {
    try {
      const files = await listPresetPacksInDrive(token);
      setDriveBackups(files);
    } catch (err) {
      console.warn('Could not read backups from Drive:', err);
    }
  };

  const handleBackupToDrive = async () => {
    if (!googleToken) return;
    if (!backupName.trim()) {
      setWorkspaceError('Please specify a valid backup filename!');
      return;
    }
    
    setIsGoogleLoading(true);
    setWorkspaceError('');
    try {
      await savePresetPackToDrive(googleToken, backupName.trim(), userPresets);
      triggerSuccess(`Created/Updated backup "${backupName}" in your Google Drive!`);
      await loadDriveBackups(googleToken);
    } catch (err: any) {
      setWorkspaceError(`Drive backup write failed: ${err.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string, filename: string) => {
    const confirmBackup = window.confirm(
      `Are you sure you want to restore user presets from the backup file "${filename}"? Any existing custom presets will be merged.`
    );
    if (!confirmBackup) return;

    setIsGoogleLoading(true);
    setWorkspaceError('');
    try {
      const drivePresets = await loadPresetPackFromDrive(googleToken, fileId);
      setUserPresets(prev => {
        const merged = [...prev];
        drivePresets.forEach(dp => {
          const existsIdx = merged.findIndex(p => p.id === dp.id || p.name.toLowerCase() === dp.name.toLowerCase());
          if (existsIdx !== -1) {
            merged[existsIdx] = dp;
          } else {
            merged.push(dp);
          }
        });
        return merged;
      });
      triggerSuccess(`Successfully restored ${drivePresets.length} presets from "${filename}"!`);
    } catch (err: any) {
      setWorkspaceError(`Failed to load backup: ${err.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('vgs_user_presets', JSON.stringify(userPresets));
  }, [userPresets]);

  // Combine lists
  const allPresets = [...FACTORY_PRESETS, ...userPresets];

  // Filter presets by active category selection or tags
  const filteredPresets = selectedCategoryFilter === 'All'
    ? allPresets
    : allPresets.filter(p => 
        (p.category || 'Atmospheric') === selectedCategoryFilter || 
        (p.tags && p.tags.includes(selectedCategoryFilter))
      );

  // Reorder custom presets
  const handleMovePresetUp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = userPresets.findIndex(p => p.id === id);
    if (idx <= 0) return;
    const updated = [...userPresets];
    const temp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = temp;
    setUserPresets(updated);
    triggerSuccess('Moved preset up in order.');
  };

  const handleMovePresetDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = userPresets.findIndex(p => p.id === id);
    if (idx === -1 || idx >= userPresets.length - 1) return;
    const updated = [...userPresets];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setUserPresets(updated);
    triggerSuccess('Moved preset down in order.');
  };

  // Toggles a tag in the save form list
  const handleToggleFormTag = (tag: string) => {
    setSelectedFormTags(prev => {
      if (prev.includes(tag)) {
        if (prev.length === 1) return prev; // Keep at least one tag
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Save current system state as preset with tags
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (flowLocked) {
      setWorkspaceError("Acoustic parameters and flows are locked. Secure state snapshot captures are disabled.");
      return;
    }
    if (!newPresetName.trim()) return;

    const primaryCategory = selectedFormTags[0] || 'Atmospheric';

    const freshPreset: QuantumPreset = {
      id: `p-custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'Custom acoustic node combination chain.',
      category: primaryCategory,
      tags: [...selectedFormTags],
      qubits: JSON.parse(JSON.stringify(currentQubits)),
      granularParams: { ...currentGranularParams },
      voiceParams: { ...currentVoiceParams },
      waveformMorph: engine ? engine.waveformMorph : undefined,
      wavetableTransducer: engine ? engine.wavetableTransducer : undefined,
      transducerFormulation: engine ? engine.transducerFormulation : undefined,
      synthBlend: engine ? engine.synthBlend : undefined
    };

    setUserPresets(prev => [...prev, freshPreset]);
    setActivePresetId(freshPreset.id);
    setNewPresetName('');
    setNewPresetDesc('');
    setSelectedFormTags(['Atmospheric']);
    triggerSuccess(`Saved custom preset "${freshPreset.name}" with categories/tags!`);
  };

  // Select/load preset
  const handleSelectPreset = (preset: QuantumPreset) => {
    if (flowLocked) {
      setWorkspaceError("Quantum flow configuration and parameters are locked. Disengage flow lock in the upper master deck to activate different presets.");
      return;
    }
    setActivePresetId(preset.id);
    onLoadPreset(preset);
    triggerSuccess(`Successfully loaded preset: ${preset.name}`);
  };

  // Delete custom preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (flowLocked) {
      setWorkspaceError("Modification restricted: preset deletion locked under Quantum Flow Lock.");
      return;
    }
    setUserPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) {
      if (FACTORY_PRESETS.length > 0) {
        setActivePresetId(FACTORY_PRESETS[0].id);
      } else {
        setActivePresetId('');
      }
    }
    triggerSuccess('Decompiled preset from memory.');
  };

  // Export current configuration to JSON file download
  const handleExportJSON = () => {
    const backupObj = {
      app: 'VoxGrainSynth',
      timestamp: new Date().toISOString(),
      formulaicMode: 'true',
      configuration: {
        qubits: currentQubits,
        granularParams: currentGranularParams,
        voiceParams: currentVoiceParams,
        waveformMorph: engine ? engine.waveformMorph : undefined,
        wavetableTransducer: engine ? engine.wavetableTransducer : undefined,
        transducerFormulation: engine ? engine.transducerFormulation : undefined,
        synthBlend: engine ? engine.synthBlend : undefined
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `quantum_preset_export_${Date.now().toString().slice(-4)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSuccess('Exported system configuration JSON!');
  };

  // Import JSON configuration
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.configuration) {
          const loadedPreset: QuantumPreset = {
            id: `p-import-${Date.now()}`,
            name: file.name.replace('.json', ''),
            description: `Imported matrix configuration file.`,
            qubits: parsed.configuration.qubits,
            granularParams: parsed.configuration.granularParams,
            voiceParams: parsed.configuration.voiceParams
          };
          
          setUserPresets(prev => [...prev, loadedPreset]);
          setActivePresetId(loadedPreset.id);
          onLoadPreset(loadedPreset);
          triggerSuccess('Imported system configuration successfully!');
        } else {
          alert('Invalid preset JSON layout. Could not locate .configuration field.');
        }
      } catch (err) {
        alert('Could not parsed JSON format. File might be corrupted.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="border border-gray-900 bg-[#090e16]/95 p-5 rounded-lg flex flex-col gap-4 shadow-sm text-left relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-cyan-600/30" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-950 pb-2.5">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4.5 h-4.5 text-cyan-400" />
          <h2 className="text-xs font-mono tracking-wider font-bold text-gray-200 flex items-center gap-1.5">
            <span>QUANTUM ACOUSTIC REGIMENT PRESETS</span>
            {flowLocked && (
              <span className="text-[8px] bg-red-950/60 border border-red-500/30 text-rose-400 px-1 py-0.5 rounded flex items-center gap-0.5 font-bold tracking-tight animate-pulse self-center">
                <Lock className="w-2.5 h-2.5" /> LOCKED
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* File input import */}
          <label className="cursor-pointer p-1 rounded bg-[#0e1726] hover:bg-[#15233a] border border-cyan-500/10 text-cyan-400 hover:text-white transition-colors" title="Import Preset File">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
          {/* Export buttons */}
          <button
            onClick={handleExportJSON}
            className="p-1 rounded bg-[#0e1726] hover:bg-[#15233a] border border-cyan-500/10 text-cyan-400 hover:text-white transition-colors cursor-pointer"
            title="Export Current Preset File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-2 py-1.5 bg-green-950/40 border border-green-800/30 text-green-400 rounded text-[10px] font-mono flex items-center gap-1.5 leading-none transition-all duration-300">
          <Check className="w-3 h-3 text-green-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1">
        
        {/* Preset Selector List with Filters */}
        <div className="md:col-span-7 flex flex-col gap-3">
          
          <div className="flex flex-col gap-2 bg-[#04080e] p-2.5 rounded border border-gray-950 shrink-0">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-gray-400 font-bold truncate">🧬 BROWSE BY CATEGORY / TAG:</span>
              <span className="text-[9px] font-mono text-gray-500 leading-none">
                {filteredPresets.length} loaded
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1">
              {['All', 'Atmospheric', 'Glitch', 'Ambient', 'Experimental', 'Sub-Bass', 'Lo-Fi'].map((cat) => {
                const isSelected = selectedCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2 py-1 rounded text-[9px] font-mono font-semibold transition-all shrink-0 cursor-pointer border ${
                      isSelected 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.15)] font-bold' 
                        : 'bg-[#090e16]/80 text-gray-400 border-gray-900/60 hover:text-white hover:border-gray-800'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                );
              })}
              
              <select
                value={['All', 'Atmospheric', 'Glitch', 'Ambient', 'Experimental', 'Sub-Bass', 'Lo-Fi'].includes(selectedCategoryFilter) ? selectedCategoryFilter : "Other"}
                onChange={(e) => {
                  if (e.target.value !== "Other") {
                    setSelectedCategoryFilter(e.target.value);
                  }
                }}
                className="bg-[#090e16] text-[#06b6d4] border border-cyan-900/40 rounded font-mono text-[9px] py-1 px-1.5 focus:outline-none focus:border-cyan-500/40 cursor-pointer ml-auto max-w-[100px]"
              >
                <option value="Other">MORE...</option>
                {PRESET_CATEGORIES.filter(cat => !['Atmospheric', 'Glitch', 'Sub-Bass', 'Experimental', 'Ambient', 'Lo-Fi'].includes(cat)).map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
            {filteredPresets.length === 0 ? (
              <div className="text-[10px] font-mono text-gray-600 text-center py-12 bg-gray-950/40 rounded border border-gray-950 animate-pulse">
                NO PRESETS LOCKED IN FILTER: "{selectedCategoryFilter.toUpperCase()}"
              </div>
            ) : (
              filteredPresets.map((preset) => {
                const isActive = preset.id === activePresetId;
                const presetTags = preset.tags && preset.tags.length > 0
                  ? preset.tags
                  : [preset.category || 'Atmospheric'];
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                      isActive
                        ? 'border-cyan-400/50 bg-[#0e1726]/80 text-white shadow-[0_0_12px_rgba(6,182,212,0.08)]'
                        : 'border-gray-950 bg-gray-950 hover:bg-[#0b111a] hover:border-gray-900 text-gray-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Cpu className={`w-3.5 h-3.5 shrink-0 ${preset.isFactory ? 'text-violet-400' : 'text-cyan-400'}`} />
                        <span className="text-xs font-mono font-bold leading-none truncate">{preset.name}</span>
                        {preset.isFactory && (
                          <span className="text-[7.5px] font-mono text-violet-400 bg-violet-950/40 border border-violet-900/30 px-1 rounded leading-none py-0.5 select-none shrink-0 font-bold uppercase">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      
                      {/* Active Tags list */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {presetTags.map((tag, idx) => (
                          <span 
                            key={`${preset.id}-tag-${idx}`} 
                            style={{ fontSize: '7.5px' }}
                            className="bg-[#0d1522] text-cyan-300 border border-cyan-950/40 rounded px-1.5 py-0.5 font-mono uppercase font-bold shrink-0 tracking-wider flex items-center gap-0.5 leading-none"
                          >
                            <Hash className="w-2 h-2 text-cyan-500" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>

                      <p className="text-[9px] font-mono text-gray-400 leading-normal max-w-sm">
                        {preset.description}
                      </p>
                    </div>
                    
                    {/* Reorder and Delete controls side bar */}
                    <div className="flex items-center gap-1 self-center shrink-0">
                      {!preset.isFactory ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleMovePresetUp(preset.id, e)}
                            className="p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all cursor-pointer"
                            title="Move Preset Up (Reorder)"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleMovePresetDown(preset.id, e)}
                            className="p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all cursor-pointer"
                            title="Move Preset Down (Reorder)"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                            title="Decompile Preset (Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="text-[8px] font-mono text-gray-600 px-1 py-0.5 border border-gray-900 rounded">LOCKED</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Save Current State Form */}
        <form onSubmit={handleSavePreset} className="md:col-span-5 bg-[#05080f] rounded border border-gray-950 p-3.5 flex flex-col justify-between gap-3 text-[11px]">
          
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-gray-500 block leading-none font-bold uppercase">
              💾 WRITE CIRCUIT MATRIX STATE
            </span>

            <div className="space-y-1">
              <label className="block text-gray-400 font-mono text-[9px] uppercase">Preset Title Name</label>
              <input
                type="text"
                maxLength={25}
                required
                placeholder="e.g. Spectral Phased Echoes"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="w-full bg-[#0a0f18] text-white py-1.5 px-2 rounded border border-gray-900 font-mono text-[10px] focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            {/* Categorous Multi-Tag Picker */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 font-mono text-[9px] uppercase">Assign Categorical Tags</label>
              <div className="flex flex-wrap gap-1 bg-[#03060b] p-2 rounded border border-gray-950 max-h-[75px] overflow-y-auto scrollbar-thin">
                {['Glitch', 'Ambient', 'Experimental', 'Atmospheric', 'Sub-Bass', 'Lo-Fi', 'Synthwave', 'Drone', 'Techno', 'Cinematic'].map(tag => {
                  const isSelected = selectedFormTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleFormTag(tag)}
                      className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono transition-all border shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400/35 font-bold'
                          : 'bg-transparent text-gray-500 border-gray-900 hover:text-gray-300'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{tag.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <p className="text-[8px] font-mono text-gray-600 leading-none">
                Select one or more categories tags to associate with this preset state.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-400 font-mono text-[9px] uppercase">Brief Description / Notes</label>
              <textarea
                maxLength={80}
                placeholder="Describe acoustic properties of system state..."
                value={newPresetDesc}
                onChange={(e) => setNewPresetDesc(e.target.value)}
                className="w-full bg-[#0a0f18] text-white py-1 px-2 rounded border border-gray-900 font-mono text-[9.5px] h-[45px] resize-none focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          <button
            type="submit"
            className="cursor-pointer font-mono text-[10px] py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-md w-full shrink-0"
          >
            <Save className="w-3.5 h-3.5 text-white" />
            <span>WRITE STATE TO MEMORY BANKS</span>
          </button>

        </form>

      </div>

      {/* === GOOGLE WORKSPACE CLOUD SYNC FLOW === */}
      <div className="border-t border-gray-900/60 my-4" />
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className={`w-4 h-4 text-cyan-400 ${isGoogleLoading ? 'animate-bounce' : 'animate-pulse'}`} />
            <h3 className="text-[10px] font-mono tracking-wider font-bold text-cyan-400">
              ⚡ QUANTUM CLOUD SYNC FLOW
            </h3>
          </div>
          {/* Connection Status Badge */}
          <div className="text-[9px] font-mono flex items-center gap-1.5 bg-[#03060b] px-2 py-0.5 rounded border border-gray-900/40 select-none">
            <span className={`w-1.5 h-1.5 rounded-full ${googleUser ? 'bg-green-500 animate-pulse' : 'bg-semibold bg-amber-500'}`} />
            <span className="text-gray-500">STATUS:</span>
            <span className={googleUser ? 'text-green-400 font-bold' : 'text-amber-500 font-semibold'}>
              {googleUser ? 'ACTIVE SYNC' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {workspaceError && (
          <div className="p-2 py-1.5 bg-red-950/40 border border-red-800/30 text-red-400 rounded text-[9px] font-mono flex items-start gap-1.5 leading-normal">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <span>{workspaceError}</span>
          </div>
        )}

        {!googleUser ? (
          /* Locked/Connect Screen */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#05080f] p-3.5 rounded border border-gray-950">
            <div className="md:col-span-8 text-left space-y-1">
              <h4 className="text-[10.5px] font-mono text-gray-300 font-bold uppercase tracking-wide">
                Link Google Sheets & Google Drive
              </h4>
              <p className="text-[9px] font-mono text-gray-500 leading-normal">
                Authorizing enables dynamic two-way synchronicities. Stream your custom acoustic node matrix combinations to a live, editable table in <strong>Google Sheets</strong>, and backup or load entire sound banks via <strong>Google Drive</strong> with permission on your account.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="gsi-material-button text-[10px] scale-95 transition-transform hover:scale-100 font-sans cursor-pointer focus:outline-none"
                style={{ width: 'auto' }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-semibold">Sign in with Google</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Connected Live Control Console */
          <div className="flex flex-col gap-3 bg-[#04070c] p-3 rounded border border-gray-950">
            {/* Account Details Row */}
            <div className="flex items-center justify-between border-b border-gray-950 pb-2 text-[10px]">
              <div className="flex items-center gap-1.5 font-mono text-gray-300">
                <UserCheck className="w-3.5 h-3.5 text-green-400" />
                <span>SIGNED IN AS:</span>
                <span className="text-cyan-400 font-bold">{googleUser.email}</span>
              </div>
              <button 
                type="button" 
                onClick={handleGoogleLogout}
                className="text-[8.5px] font-mono text-gray-500 hover:text-red-400 transition-colors bg-transparent border border-red-950/20 px-1.5 py-0.5 rounded cursor-pointer uppercase font-semibold"
              >
                Disconnect
              </button>
            </div>

            {/* Dual Grid Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Sheets Engine */}
              <div className="p-3 rounded bg-[#070c14] border border-gray-950/80 flex flex-col gap-2 justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      Google Sheets Integration
                    </span>
                    <span className={`text-[8px] font-mono px-1 rounded border leading-none py-0.5 font-bold uppercase ${
                      spreadsheetStatus === 'Linked' 
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' 
                        : 'bg-amber-950/20 text-amber-500 border-amber-900/30 font-semibold'
                    }`}>
                      {spreadsheetStatus}
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-gray-500 leading-normal">
                    Sync customized acoustic presets to rows in a Spreadsheet workbook named <em>Quantum Vocal Synth Flow Presets</em>.
                  </p>
                </div>

                {spreadsheetStatus === 'Not Created' ? (
                  <button
                    type="button"
                    disabled={isGoogleLoading}
                    onClick={handleCreateSheet}
                    className="w-full text-center py-1.5 rounded font-mono text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-sm mt-3"
                  >
                    INITIALIZE PRESETS SHEET
                  </button>
                ) : (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      disabled={isGoogleLoading || spreadsheetStatus !== 'Linked'}
                      onClick={handlePushToSheet}
                      title="Sync current user presets bank to Google Sheets"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded font-mono text-[9px] bg-[#0d2216] border border-emerald-500/20 text-emerald-400 font-bold transition-all hover:bg-emerald-950/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>PUSH ({userPresets.length})</span>
                    </button>
                    <button
                      type="button"
                      disabled={isGoogleLoading || spreadsheetStatus !== 'Linked'}
                      onClick={handlePullFromSheet}
                      title="Pull preset records from Google Sheets and merge logically."
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded font-mono text-[9px] bg-[#0c1a27] border border-[#06b6d4]/20 text-[#06b6d4] font-bold transition-all hover:bg-cyan-950/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <CloudDownload className="w-3.5 h-3.5" />
                      <span>PULL / MERGE</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Google Drive Backup */}
              <div className="p-3 rounded bg-[#070c14] border border-gray-950/80 flex flex-col gap-2 justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-sans text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    Google Drive Backups
                  </span>
                  <p className="text-[9px] font-mono text-gray-500 leading-normal">
                    Save complete static config dumps of memory sound banks safely inside cloud storage.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    value={backupName}
                    maxLength={35}
                    placeholder="backup_name.json"
                    onChange={(e) => setBackupName(e.target.value)}
                    className="flex-1 min-w-0 bg-[#0a0f18] text-[9.5px] text-white py-1 px-2 rounded border border-gray-900 focus:outline-none focus:border-cyan-500/40 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isGoogleLoading}
                    onClick={handleBackupToDrive}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded font-mono text-[9px] transition-all cursor-pointer whitespace-nowrap"
                  >
                    BACKUP Bank
                  </button>
                </div>

                {/* Backups file list */}
                <div className="space-y-1 mt-2.5 border-t border-gray-950 pt-2 text-[8.5px]">
                  <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 leading-none">
                    <span>REMOTE PRESETS BACKUPS:</span>
                    <span>{driveBackups.length} SAVED</span>
                  </div>
                  {driveBackups.length === 0 ? (
                    <div className="text-[8px] font-mono text-gray-600 italic text-center py-1 mt-0.5">
                      No JSON snapshots found in Google Drive files.
                    </div>
                  ) : (
                    <div className="max-h-[60px] overflow-y-auto scrollbar-thin space-y-1 pr-1 mt-1">
                      {driveBackups.map(file => (
                        <div key={file.id} className="flex items-center justify-between bg-[#03060b] px-1.5 py-1 rounded border border-gray-950 text-[8px] font-mono">
                          <span className="text-gray-400 truncate max-w-[130px] font-semibold" title={file.name}>{file.name}</span>
                          <button
                            type="button"
                            disabled={isGoogleLoading}
                            onClick={() => handleRestoreFromDrive(file.id, file.name)}
                            className="text-cyan-400 hover:text-cyan-200 transition-colors uppercase font-bold cursor-pointer font-mono mr-1"
                          >
                            RESTORE
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
