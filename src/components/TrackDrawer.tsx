import React, { useState } from 'react';
import {
  Upload,
  Link2,
  Music,
  Play,
  Pause,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles,
  Disc,
} from 'lucide-react';
import { Track } from '../types';
import { TRENDING_TRACKS } from '../data/presets';
import { audioEngine } from '../utils/audioEngine';

interface TrackDrawerProps {
  currentTrack: Track;
  onSelectTrack: (track: Track) => void;
  onUploadAudioFile: (file: File) => void;
  onAnalyzeWithGemini: (track: Track) => void;
  isAnalyzing: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const TrackDrawer: React.FC<TrackDrawerProps> = ({
  currentTrack,
  onSelectTrack,
  onUploadAudioFile,
  onAnalyzeWithGemini,
  isAnalyzing,
  isPlaying,
  onTogglePlay,
}) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isUrlImporting, setIsUrlImporting] = useState(false);

  const handleSimulateUrlImport = () => {
    if (!streamUrl.trim()) return;
    setIsUrlImporting(true);

    setTimeout(() => {
      // Create imported track simulation
      const urlLower = streamUrl.toLowerCase();
      let detectedTitle = 'Streamed Song';
      let genre = 'Electronic Trap';
      if (urlLower.includes('spotify')) detectedTitle = 'Spotify Stream Hit';
      else if (urlLower.includes('youtube')) detectedTitle = 'YouTube Viral Cut';
      else if (urlLower.includes('soundcloud')) detectedTitle = 'SoundCloud Bass Exclusive';

      const newTrack: Track = {
        id: `stream-${Date.now()}`,
        title: detectedTitle,
        artist: 'Featured Artist',
        genre,
        bpm: 135,
        duration: 60,
        musicalKey: 'G Minor',
        energyScore: 92,
        emotionalTone: 'Aggressive & Hypnotic',
        coverImage: '/src/assets/images/style_dark_moody_1793388344834.jpg',
        synthTheme: 'phonk',
      };

      onSelectTrack(newTrack);
      setIsUrlImporting(false);
      setStreamUrl('');
    }, 1200);
  };

  return (
    <div className="w-full bg-[#0a0d14] border border-slate-800/80 rounded-xl p-4 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Audio & Song Input</h3>
        </div>
        <button
          onClick={() => onAnalyzeWithGemini(currentTrack)}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'AI Analyzing...' : 'Deep AI Scan'}</span>
        </button>
      </div>

      {/* Upload Local Audio File Dropzone */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-cyan-400/80 rounded-xl p-4 cursor-pointer transition-all bg-slate-950/40 group">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Upload className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
          Upload Any Song File (MP3, WAV, M4A)
        </span>
        <span className="text-[11px] text-slate-400 mt-0.5">
          Auto-detects BPM, key, musical energy, and drops
        </span>
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadAudioFile(file);
          }}
        />
      </label>

      {/* Paste Stream Link (Spotify, YouTube, SoundCloud) */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Paste Song URL (Spotify, YouTube, SoundCloud):</span>
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://open.spotify.com/track/... or YouTube link"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleSimulateUrlImport}
            disabled={isUrlImporting || !streamUrl.trim()}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 border border-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {isUrlImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>

      {/* Built-in Trending Royalty-Free Library */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Trending Built-In Tracks:</span>
          <span className="text-[10px] text-slate-500 font-mono">5 Royalty-Free</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {TRENDING_TRACKS.map((track) => {
            const isSelected = currentTrack.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => {
                  onSelectTrack(track);
                  audioEngine.setSynthTheme(track.synthTheme || 'synthwave', track.bpm);
                }}
                className={`p-2 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded overflow-hidden bg-slate-950 shrink-0 relative">
                    <img
                      src={track.coverImage}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>{track.title}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {track.artist} · <span className="font-mono text-cyan-300">{track.bpm} BPM</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">{track.musicalKey}</span>
                    <span className="text-[9px] text-purple-400 block font-semibold">{track.energyScore}% Energy</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Song Intelligence Breakdown Card */}
      <div className="p-3 bg-gradient-to-br from-slate-900 to-[#0e1320] border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="truncate">{currentTrack.title}</span>
          </div>
          <span className="font-mono text-cyan-400 font-bold">{currentTrack.bpm} BPM</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Musical Key</span>
            <span className="text-xs font-mono font-bold text-slate-200">{currentTrack.musicalKey}</span>
          </div>
          <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Energy Level</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{currentTrack.energyScore}%</span>
          </div>
          <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Vibe</span>
            <span className="text-xs font-mono font-bold text-purple-300 truncate">{currentTrack.emotionalTone.split('&')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
