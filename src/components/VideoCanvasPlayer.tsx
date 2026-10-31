import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Flame,
  Volume2,
  Smartphone,
  Tv,
  Square,
} from 'lucide-react';
import { AspectRatio, VisualScene, ColorGradePreset, KineticLyric, PerformerMode } from '../types';
import { VideoRenderer } from '../utils/videoRenderer';
import { audioEngine } from '../utils/audioEngine';

interface VideoCanvasPlayerProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  scenes: VisualScene[];
  activeSceneIndex: number;
  duration: number;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  strongMode: boolean;
  setStrongMode: (val: boolean) => void;
  colorGrade: ColorGradePreset;
  lyrics: KineticLyric[];
  showLyrics: boolean;
  performerMode: PerformerMode;
  watermark: boolean;
  fallbackStyleKey: string;
  customAvatarUrl?: string;
  onCanvasReady?: (renderer: VideoRenderer) => void;
}

export const VideoCanvasPlayer: React.FC<VideoCanvasPlayerProps> = ({
  aspectRatio,
  setAspectRatio,
  scenes,
  activeSceneIndex,
  duration,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  strongMode,
  setStrongMode,
  colorGrade,
  lyrics,
  showLyrics,
  performerMode,
  watermark,
  fallbackStyleKey,
  customAvatarUrl,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<VideoRenderer | null>(null);
  const customAvatarImgRef = useRef<HTMLImageElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [eqLevels, setEqLevels] = useState({ bass: 0, mid: 0, high: 0 });

  // Load custom avatar if provided
  useEffect(() => {
    if (customAvatarUrl) {
      const img = new Image();
      img.src = customAvatarUrl;
      img.onload = () => {
        customAvatarImgRef.current = img;
      };
    } else {
      customAvatarImgRef.current = null;
    }
  }, [customAvatarUrl]);

  // Canvas dimension sizing based on Aspect Ratio
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 1080, height: 1920, displayClass: 'aspect-[9/16] max-h-[580px]' };
      case '1:1':
        return { width: 1080, height: 1080, displayClass: 'aspect-square max-h-[520px]' };
      case '16:9':
      default:
        return { width: 1920, height: 1080, displayClass: 'aspect-[16/9] max-h-[520px]' };
    }
  };

  const { width, height, displayClass } = getCanvasDimensions();

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    const renderer = new VideoRenderer(canvas);
    rendererRef.current = renderer;
    if (onCanvasReady) {
      onCanvasReady(renderer);
    }
  }, [aspectRatio, width, height]);

  // Main render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const time = audioEngine.getCurrentTime();
      setCurrentTime(time);

      if (time >= duration && isPlaying) {
        audioEngine.seek(0);
        setCurrentTime(0);
      }

      if (rendererRef.current && canvasRef.current) {
        rendererRef.current.renderFrame({
          currentTime: time,
          duration,
          aspectRatio,
          scenes,
          strongMode,
          colorGrade,
          lyrics,
          showLyrics,
          performerMode,
          watermark,
          fallbackStyleKey,
          customAvatarImg: customAvatarImgRef.current,
        });
      }

      // Read audio energy for live HUD meter
      const levels = audioEngine.getEnergyLevels();
      setEqLevels({
        bass: Math.round(levels.bass * 100),
        mid: Math.round(levels.mid * 100),
        high: Math.round(levels.high * 100),
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    duration,
    aspectRatio,
    scenes,
    strongMode,
    colorGrade,
    lyrics,
    showLyrics,
    performerMode,
    watermark,
    fallbackStyleKey,
    isPlaying,
    setCurrentTime,
  ]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    audioEngine.seek(0);
    setCurrentTime(0);
    if (!isPlaying) {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const activeScene = scenes[activeSceneIndex] || scenes[0];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center bg-[#07090e] border border-slate-800/80 rounded-xl p-4 shadow-2xl overflow-hidden"
    >
      {/* Top Controls: Aspect Ratio & Scene Tag */}
      <div className="w-full flex items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-800/60">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              aspectRatio === '9:16'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            9:16 <span className="text-[10px] text-slate-500">Reels</span>
          </button>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              aspectRatio === '16:9'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            16:9 <span className="text-[10px] text-slate-500">YouTube</span>
          </button>
          <button
            onClick={() => setAspectRatio('1:1')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              aspectRatio === '1:1'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            1:1 <span className="text-[10px] text-slate-500">Feed</span>
          </button>
        </div>

        {/* Live Scene Info */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-200 font-semibold">{activeScene?.title || 'Intro'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-cyan-400 uppercase text-[11px]">{activeScene?.cameraEffect?.replace('_', ' ') || 'ZOOM'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-slate-500">{activeScene?.beatHitAction?.replace('_', ' ')}</span>
        </div>

        {/* Strong Mode Quick Toggle */}
        <button
          onClick={() => setStrongMode(!strongMode)}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all whitespace-nowrap shrink-0 ${
            strongMode
              ? 'bg-rose-500/25 border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${strongMode ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          Strong Impact
        </button>
      </div>

      {/* Canvas Viewport Frame */}
      <div className="relative flex items-center justify-center w-full bg-black/90 rounded-lg overflow-hidden border border-slate-800/80 shadow-inner group">
        <canvas
          ref={canvasRef}
          className={`w-auto h-auto object-contain rounded transition-transform ${displayClass}`}
        />

        {/* Hover Overlay Play Button */}
        {!isPlaying && (
          <button
            onClick={handleTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-all cursor-pointer group-hover:opacity-100"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-400/90 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.6)] transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 ml-1 fill-current" />
            </div>
          </button>
        )}

        {/* Live Audio Beat HUD overlay (bottom left inside canvas) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-md border border-slate-700/50 text-[10px] text-slate-300 font-mono pointer-events-none">
          <Volume2 className="w-3 h-3 text-cyan-400" />
          <div className="flex items-center gap-1">
            <span>BASS</span>
            <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-75"
                style={{ width: `${Math.min(100, eqLevels.bass)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>MID</span>
            <div className="w-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 transition-all duration-75"
                style={{ width: `${Math.min(100, eqLevels.mid)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>HIGH</span>
            <div className="w-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 transition-all duration-75"
                style={{ width: `${Math.min(100, eqLevels.high)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="w-full flex items-center justify-between gap-4 mt-3 pt-2">
        {/* Play / Pause / Restart */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className="w-9 h-9 rounded-lg bg-cyan-400 text-slate-950 flex items-center justify-center hover:bg-cyan-300 transition-colors shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            )}
          </button>
          <button
            onClick={handleRestart}
            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            title="Restart clip"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timecode display */}
        <div className="font-mono text-sm tracking-wider text-slate-300 tabular-nums">
          <span className="text-white font-bold">{formatTime(currentTime)}</span>
          <span className="text-slate-500 mx-1.5">/</span>
          <span className="text-slate-400">{formatTime(duration)}</span>
        </div>

        {/* Fullscreen button */}
        <button
          onClick={handleToggleFullscreen}
          className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
