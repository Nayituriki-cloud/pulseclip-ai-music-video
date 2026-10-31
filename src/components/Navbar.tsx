import React from 'react';
import { Download, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'quick' | 'styles' | 'library';
  setActiveTab: (tab: 'studio' | 'quick' | 'styles' | 'library') => void;
  onOpenExport: () => void;
  onOpenVoiceModal: () => void;
  strongMode: boolean;
  toggleStrongMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  onOpenVoiceModal,
  strongMode,
  toggleStrongMode,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-[#0a0c12]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-lg font-black tracking-wider text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></span>
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            PULSECLIP
          </span>
        </a>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('studio')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'studio' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Studio Editor
        </button>
        <button
          onClick={() => setActiveTab('quick')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'quick' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Quick Cut
        </button>
        <button
          onClick={() => setActiveTab('styles')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'styles' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Style Vault
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'library' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Track Library
        </button>
        <button
          onClick={onOpenVoiceModal}
          className="text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Voice-to-Vibe
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleStrongMode}
          title="Strong Mode: Boosts visual impact, bass flash, and camera speed"
          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            strongMode
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${strongMode ? 'bg-rose-400' : 'bg-slate-500'}`}></span>
          STRONG MODE
        </button>

        <button
          onClick={onOpenExport}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 rounded-md hover:from-cyan-300 hover:to-teal-200 transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Export Video
        </button>
      </div>
    </header>
  );
};
