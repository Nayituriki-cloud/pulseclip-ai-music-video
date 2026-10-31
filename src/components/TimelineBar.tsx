import React, { useRef } from 'react';
import { Sparkles, Zap, Scissors } from 'lucide-react';
import { VisualScene, SongSection } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface TimelineBarProps {
  duration: number;
  setDuration: (dur: number) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  scenes: VisualScene[];
  activeSceneIndex: number;
  setActiveSceneIndex: (idx: number) => void;
  sections?: SongSection[];
  onFindBestDrop: () => void;
  bpm: number;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  duration,
  setDuration,
  currentTime,
  setCurrentTime,
  scenes,
  activeSceneIndex,
  setActiveSceneIndex,
  onFindBestDrop,
  bpm,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    const seekTime = ratio * duration;
    audioEngine.seek(seekTime);
    setCurrentTime(seekTime);

    // Find clicked scene index
    const clickedIdx = scenes.findIndex(
      (s) => seekTime >= s.startTime && seekTime <= s.endTime
    );
    if (clickedIdx !== -1) {
      setActiveSceneIndex(clickedIdx);
    }
  };

  const progressPercent = Math.min(100, (currentTime / duration) * 100);

  // Generate simulated beat ticks across duration based on BPM
  const beatsCount = Math.floor((bpm / 60) * duration);
  const beatIntervalPercent = 100 / beatsCount;

  return (
    <div className="w-full bg-[#0a0d14] border border-slate-800/80 rounded-xl p-4 shadow-lg">
      {/* Top Header: Duration Picker & AI Drop Finder */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Clip Length:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            {[15, 30, 45, 60].map((dur) => (
              <button
                key={dur}
                onClick={() => {
                  setDuration(dur);
                  if (currentTime > dur) {
                    audioEngine.seek(0);
                    setCurrentTime(0);
                  }
                }}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  duration === dur
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        {/* AI Pick Strongest Drop */}
        <button
          onClick={onFindBestDrop}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 rounded-lg hover:bg-purple-500/25 transition-all whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Find Best Drop</span>
        </button>
      </div>

      {/* Interactive Timeline Container */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-20 w-full bg-[#06080d] rounded-lg border border-slate-800/90 overflow-hidden cursor-pointer select-none group"
      >
        {/* Waveform graphic visualization */}
        <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
          {Array.from({ length: 96 }).map((_, i) => {
            // Rhythmic amplitude simulation with drop boost in middle
            const normX = i / 96;
            const isDropRegion = normX >= 0.35 && normX <= 0.7;
            const baseAmp = Math.sin(i * 0.4) * 0.3 + 0.4;
            const amp = isDropRegion ? Math.min(0.95, baseAmp * 1.5) : baseAmp;
            const heightPercent = Math.max(15, Math.round(amp * 80));

            return (
              <div
                key={i}
                className={`w-[2px] rounded-full transition-all ${
                  isDropRegion ? 'bg-cyan-400' : 'bg-slate-500'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        {/* Beat tick marks */}
        <div className="absolute inset-x-0 bottom-0 h-2 flex pointer-events-none opacity-30">
          {Array.from({ length: Math.min(60, beatsCount) }).map((_, i) => (
            <div
              key={i}
              className="w-[1px] h-full bg-slate-400"
              style={{ marginLeft: `${beatIntervalPercent}%` }}
            />
          ))}
        </div>

        {/* Scene regions */}
        <div className="absolute inset-0 flex pointer-events-none">
          {scenes.map((scene, idx) => {
            const leftPercent = (scene.startTime / duration) * 100;
            const widthPercent = ((scene.endTime - scene.startTime) / duration) * 100;
            const isSelected = activeSceneIndex === idx;

            return (
              <div
                key={scene.id}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
                className={`absolute top-0 bottom-0 border-r border-slate-700/60 transition-colors flex flex-col justify-between p-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400/80 shadow-[inset_0_0_12px_rgba(34,211,238,0.2)]'
                    : 'hover:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold truncate ${
                      isSelected ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    0{idx + 1}. {scene.title}
                  </span>
                  {scene.bassIntensity >= 8 && (
                    <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                  <Scissors className="w-2 h-2" />
                  <span>{scene.startTime}s - {scene.endTime}s</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Playhead Scrubber */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] pointer-events-none z-10 transition-all duration-75"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-cyan-400 rounded-full shadow-md transform rotate-45 border-2 border-slate-950" />
        </div>
      </div>

      {/* Bottom Scene quick selector */}
      <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-medium text-slate-500 uppercase shrink-0">Scenes:</span>
        {scenes.map((scene, idx) => (
          <button
            key={scene.id}
            onClick={() => {
              setActiveSceneIndex(idx);
              audioEngine.seek(scene.startTime);
              setCurrentTime(scene.startTime);
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all whitespace-nowrap shrink-0 border ${
              activeSceneIndex === idx
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Scene 0{idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
