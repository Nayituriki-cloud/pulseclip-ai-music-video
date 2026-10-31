import React, { useState } from 'react';
import {
  Wand2,
  Sliders,
  Camera,
  Type,
  User,
  Zap,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  VisualScene,
  VisualStylePreset,
  ColorGradePreset,
  KineticLyric,
  PerformerMode,
} from '../types';
import { STYLE_PRESETS, COLOR_GRADES } from '../data/presets';

interface SceneInspectorProps {
  activeScene: VisualScene;
  onUpdateScene: (updated: Partial<VisualScene>) => void;
  selectedStyle: VisualStylePreset;
  onSelectStyle: (style: VisualStylePreset) => void;
  selectedColorGrade: ColorGradePreset;
  onSelectColorGrade: (cg: ColorGradePreset) => void;
  lyrics: KineticLyric[];
  showLyrics: boolean;
  setShowLyrics: (show: boolean) => void;
  onUpdateLyric: (id: string, text: string) => void;
  performerMode: PerformerMode;
  setPerformerMode: (pm: PerformerMode) => void;
  onUploadCustomAvatar: (file: File) => void;
  onRemixSceneAI: () => void;
  isRemixing: boolean;
  mood: string;
  setMood: (mood: string) => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  activeScene,
  onUpdateScene,
  selectedStyle,
  onSelectStyle,
  selectedColorGrade,
  onSelectColorGrade,
  lyrics,
  showLyrics,
  setShowLyrics,
  onUpdateLyric,
  performerMode,
  setPerformerMode,
  onUploadCustomAvatar,
  onRemixSceneAI,
  isRemixing,
  mood,
  setMood,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'camera' | 'lyrics' | 'performer'>('style');

  const moods = ['Aggressive', 'Emotional', 'Energetic', 'Chill', 'Epic'];
  const cameraEffects: Array<{ id: VisualScene['cameraEffect']; label: string }> = [
    { id: 'punch_zoom', label: 'Punch Zoom' },
    { id: 'orbit_slow', label: 'Orbit Rotation' },
    { id: 'whip_pan', label: 'Whip Pan' },
    { id: 'drone_glide', label: 'Drone Glide' },
    { id: 'bass_strobe', label: 'Bass Strobe' },
  ];

  const beatHits: Array<{ id: VisualScene['beatHitAction']; label: string }> = [
    { id: 'screen_flash', label: 'Screen Flash' },
    { id: 'chromatic_shake', label: 'Chromatic Shake' },
    { id: 'particle_burst', label: 'Particle Burst' },
    { id: 'glitch_warp', label: 'Glitch Warp' },
  ];

  return (
    <div className="w-full bg-[#0a0d14] border border-slate-800/80 rounded-xl p-4 shadow-lg flex flex-col h-full">
      {/* Top Header & AI Remix Button */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800/60 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Scene Studio <span className="text-xs font-mono text-cyan-400 font-normal">[{activeScene?.title}]</span>
          </h3>
        </div>

        <button
          onClick={onRemixSceneAI}
          disabled={isRemixing}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/40 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
        >
          <Wand2 className={`w-3.5 h-3.5 ${isRemixing ? 'animate-spin' : ''}`} />
          <span>{isRemixing ? 'Remixing...' : 'AI Remix Scene'}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800 mb-4">
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all text-center whitespace-nowrap shrink-0 ${
            activeTab === 'style' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Visual Style
        </button>
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all text-center whitespace-nowrap shrink-0 ${
            activeTab === 'camera' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Camera & FX
        </button>
        <button
          onClick={() => setActiveTab('lyrics')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all text-center whitespace-nowrap shrink-0 ${
            activeTab === 'lyrics' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Typography
        </button>
        <button
          onClick={() => setActiveTab('performer')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all text-center whitespace-nowrap shrink-0 ${
            activeTab === 'performer' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Performer
        </button>
      </div>

      {/* Tab 1: Visual Style & Color Grading & Mood */}
      {activeTab === 'style' && (
        <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
          {/* Mood Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Emotional Mood:</span>
              <span className="font-mono text-cyan-400 uppercase text-[11px]">{mood}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`py-1 text-[11px] font-medium rounded border transition-all text-center truncate ${
                    mood === m
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Style Cards */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">Visual Aesthetic Preset:</span>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_PRESETS.map((preset) => {
                const isSelected = selectedStyle.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectStyle(preset)}
                    className={`relative rounded-lg overflow-hidden border p-2 text-left transition-all group ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="h-16 w-full rounded overflow-hidden mb-1.5 relative bg-black/60">
                      <img
                        src={preset.image}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </div>
                    <div className="font-bold text-xs text-white truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{preset.mood}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Grade */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">Color Grading Preset:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {COLOR_GRADES.map((cg) => {
                const isSelected = selectedColorGrade.id === cg.id;
                return (
                  <button
                    key={cg.id}
                    onClick={() => onSelectColorGrade(cg)}
                    className={`px-2.5 py-1.5 text-xs rounded border text-left truncate transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cg.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Camera & FX */}
      {activeTab === 'camera' && (
        <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
          {/* Camera Motion */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera Movement:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cameraEffects.map((effect) => {
                const isSelected = activeScene.cameraEffect === effect.id;
                return (
                  <button
                    key={effect.id}
                    onClick={() => onUpdateScene({ cameraEffect: effect.id })}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {effect.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Beat Hit Impact FX */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Beat Drop Reaction:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {beatHits.map((hit) => {
                const isSelected = activeScene.beatHitAction === hit.id;
                return (
                  <button
                    key={hit.id}
                    onClick={() => onUpdateScene({ beatHitAction: hit.id })}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hit.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bass Intensity Multiplier */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Bass Response Intensity:</span>
              <span className="font-mono text-cyan-400 font-bold">{activeScene.bassIntensity || 8} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={activeScene.bassIntensity || 8}
              onChange={(e) => onUpdateScene({ bassIntensity: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Creative Scene Prompt */}
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono uppercase text-[10px] block mb-1">AI Visual Cue:</span>
            <p className="text-slate-200 leading-relaxed italic">{activeScene.visualPrompt}</p>
          </div>
        </div>
      )}

      {/* Tab 3: Typography & Kinetic Lyrics */}
      {activeTab === 'lyrics' && (
        <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
          <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white">Enable Kinetic Lyrics</span>
            </div>
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                showLyrics ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  showLyrics ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {showLyrics && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Active Timeline Captions:</span>
              {lyrics.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Hook 0{idx + 1}</span>
                    <span className="text-cyan-400">{item.startTime}s - {item.endTime}s</span>
                  </div>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => onUpdateLyric(item.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Performer & Avatar */}
      {activeTab === 'performer' && (
        <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
          <span className="text-xs font-semibold text-slate-300 block">Performer Overlay Style:</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'none', label: 'None (Full Visuals)', desc: 'Clean background scenery' },
              { id: 'silhouette', label: 'Dark Silhouette', desc: 'Dramatic stage spotlight' },
              { id: 'cyber_dj', label: 'Cyber Hologram', desc: 'Rotating neon rings' },
              { id: 'custom_avatar', label: 'Custom Face / Art', desc: 'Upload your own image' },
            ].map((mode) => {
              const isSelected = performerMode.id === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() =>
                    setPerformerMode({
                      id: mode.id as any,
                      name: mode.label,
                      description: mode.desc,
                      customImageUrl: performerMode.customImageUrl,
                    })
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{mode.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Upload Custom Performer Photo */}
          {performerMode.id === 'custom_avatar' && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-xs font-semibold text-slate-200 block mb-2">Upload Artist Face / Logo:</span>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-lg p-4 cursor-pointer transition-colors bg-slate-950/50">
                <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">Click to select photo (PNG, JPG)</span>
                <span className="text-[10px] text-slate-500">Will be beat-synced with neon halo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadCustomAvatar(file);
                  }}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
