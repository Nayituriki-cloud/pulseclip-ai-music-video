import React, { useState, useEffect, useRef } from 'react';
import {
  TRENDING_TRACKS,
  STYLE_PRESETS,
  COLOR_GRADES,
  DEFAULT_SCENES,
  DEFAULT_LYRICS,
} from './data/presets';
import {
  Track,
  VisualScene,
  VisualStylePreset,
  ColorGradePreset,
  KineticLyric,
  PerformerMode,
  AspectRatio,
  ExportResolution,
  VideoFormat,
  MultiClipVariation,
} from './types';
import { Navbar } from './components/Navbar';
import { VideoCanvasPlayer } from './components/VideoCanvasPlayer';
import { TimelineBar } from './components/TimelineBar';
import { SceneInspector } from './components/SceneInspector';
import { TrackDrawer } from './components/TrackDrawer';
import { VoiceToVibeModal } from './components/VoiceToVibeModal';
import { ExportModal } from './components/ExportModal';
import { MultiVariationBar } from './components/MultiVariationBar';
import { VideoRenderer } from './utils/videoRenderer';
import { audioEngine } from './utils/audioEngine';
import {
  Sparkles,
  Zap,
  Play,
  Pause,
  Download,
  ArrowRight,
  Flame,
  Check,
  Disc,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'studio' | 'quick' | 'styles' | 'library'>('studio');

  // Track State
  const [currentTrack, setCurrentTrack] = useState<Track>(TRENDING_TRACKS[0]);
  const [duration, setDuration] = useState<number>(30);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAnalyzingTrack, setIsAnalyzingTrack] = useState<boolean>(false);

  // Video Config
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [scenes, setScenes] = useState<VisualScene[]>(DEFAULT_SCENES);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [selectedStyle, setSelectedStyle] = useState<VisualStylePreset>(STYLE_PRESETS[0]);
  const [selectedColorGrade, setSelectedColorGrade] = useState<ColorGradePreset>(COLOR_GRADES[0]);
  const [strongMode, setStrongMode] = useState<boolean>(true);
  const [mood, setMood] = useState<string>('Aggressive');
  const [lyrics, setLyrics] = useState<KineticLyric[]>(DEFAULT_LYRICS);
  const [showLyrics, setShowLyrics] = useState<boolean>(true);
  const [watermark, setWatermark] = useState<boolean>(false);
  const [performerMode, setPerformerMode] = useState<PerformerMode>({
    id: 'silhouette',
    name: 'Dark Silhouette',
    description: 'Dramatic stage spotlight',
  });
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | undefined>(undefined);

  // Multi-clip variations
  const [variations, setVariations] = useState<MultiClipVariation[]>([
    {
      id: 'var-1',
      title: 'Heavy Drop Focus',
      tagline: 'High impact bass punches',
      styleId: 'cinematic_neon',
      mood: 'Aggressive',
      strongMode: true,
      scenesCount: 4,
    },
    {
      id: 'var-2',
      title: 'Dark Moody Stage',
      tagline: 'Overhead beams & smoke',
      styleId: 'dark_moody',
      mood: 'Intense',
      strongMode: false,
      scenesCount: 4,
    },
    {
      id: 'var-3',
      title: 'Tokyo Drift Anime',
      tagline: 'Speed whip pans & neon trails',
      styleId: 'anime_cyber',
      mood: 'Vibrant',
      strongMode: true,
      scenesCount: 5,
    },
    {
      id: 'var-4',
      title: 'Luxury Gold Minimal',
      tagline: 'Liquid gold & slow orbit',
      styleId: 'luxury_gold',
      mood: 'Luxury',
      strongMode: false,
      scenesCount: 4,
    },
  ]);
  const [activeVariationId, setActiveVariationId] = useState<string>('var-1');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);

  // Modals & UI States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isProcessingVibe, setIsProcessingVibe] = useState<boolean>(false);
  const [isRemixingScene, setIsRemixingScene] = useState<boolean>(false);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Video renderer reference
  const videoRendererRef = useRef<VideoRenderer | null>(null);

  // Initialize audio synthesizer preset on track change
  useEffect(() => {
    audioEngine.setSynthTheme(currentTrack.synthTheme || 'synthwave', currentTrack.bpm);
  }, [currentTrack]);

  // Audio upload handler
  const handleUploadAudioFile = async (file: File) => {
    try {
      const { buffer, detectedBpm, duration: fileDuration } = await audioEngine.loadAudioFile(file);
      const newTrack: Track = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'My Audio File',
        genre: 'User Track',
        bpm: detectedBpm,
        duration: Math.round(fileDuration),
        musicalKey: 'A Minor',
        energyScore: 90,
        emotionalTone: 'Punchy & Energetic',
        coverImage: '/src/assets/images/style_cinematic_neon_1793388343669.jpg',
        isCustom: true,
      };
      setCurrentTrack(newTrack);
      setDuration(Math.min(60, Math.round(fileDuration)));
      // Auto analyze with Gemini in background
      handleDeepTrackScan(newTrack);
    } catch (err) {
      console.error('Failed to load audio file:', err);
    }
  };

  // Upload custom performer photo
  const handleUploadCustomAvatar = (file: File) => {
    const url = URL.createObjectURL(file);
    setCustomAvatarUrl(url);
    setPerformerMode({
      id: 'custom_avatar',
      name: 'Custom Artist Art',
      description: file.name,
      customImageUrl: url,
    });
  };

  // AI Deep Track Scan
  const handleDeepTrackScan = async (trackToScan: Track) => {
    setIsAnalyzingTrack(true);
    try {
      const res = await fetch('/api/gemini/analyze-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackToScan.title,
          artist: trackToScan.artist,
          genre: trackToScan.genre,
          bpm: trackToScan.bpm,
          mood,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setCurrentTrack((prev) => ({
          ...prev,
          musicalKey: d.musicalKey || prev.musicalKey,
          energyScore: d.energyScore || prev.energyScore,
          emotionalTone: d.emotionalTone || prev.emotionalTone,
        }));

        if (d.sections && d.sections.length > 0) {
          const generatedScenes: VisualScene[] = d.sections.map((sec: any, idx: number) => ({
            id: `sec-${idx}`,
            title: sec.name,
            startTime: sec.startTime,
            endTime: Math.min(duration, sec.endTime),
            visualPrompt: sec.visualCue,
            cameraEffect: (sec.cameraMove || 'punch_zoom') as any,
            beatHitAction: sec.energy > 80 ? 'chromatic_shake' : 'screen_flash',
            colorGrade: selectedColorGrade.id,
            kineticLyric: d.suggestedLyrics?.[idx]?.text || 'DROP THE BASS',
            bassIntensity: Math.round(sec.energy / 10),
            imageKey: selectedStyle.id,
          }));
          setScenes(generatedScenes);
        }

        if (d.suggestedLyrics && d.suggestedLyrics.length > 0) {
          const newLyrics: KineticLyric[] = d.suggestedLyrics.map((l: any, idx: number) => ({
            id: `lyric-${idx}`,
            startTime: l.time,
            endTime: l.time + 4,
            text: l.text,
            style: idx % 2 === 0 ? 'punch' : 'neon',
          }));
          setLyrics(newLyrics);
        }
      }
    } catch (err) {
      console.error('Deep scan error:', err);
    } finally {
      setIsAnalyzingTrack(false);
    }
  };

  // AI Find Best Drop
  const handleFindBestDrop = () => {
    // Jump directly to heaviest drop section (usually 16s in modern EDM/trap)
    const dropScene = scenes.find((s) => s.bassIntensity >= 8) || scenes[2] || scenes[0];
    const dropTime = dropScene.startTime;
    audioEngine.seek(dropTime);
    setCurrentTime(dropTime);
    setActiveSceneIndex(scenes.indexOf(dropScene));
    if (!isPlaying) {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  // AI Remix Single Scene
  const handleRemixSceneAI = async () => {
    setIsRemixingScene(true);
    const activeScene = scenes[activeSceneIndex];
    try {
      const res = await fetch('/api/gemini/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTrack.title,
          style: selectedStyle.name,
          duration: activeScene.endTime - activeScene.startTime,
          mood,
          strongMode,
          userPrompt: `Remix scene: ${activeScene.title}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.scenes?.[0]) {
        const remixed = data.data.scenes[0];
        setScenes((prev) =>
          prev.map((s, idx) =>
            idx === activeSceneIndex
              ? {
                  ...s,
                  visualPrompt: remixed.visualPrompt,
                  cameraEffect: (remixed.cameraEffect || s.cameraEffect) as any,
                  beatHitAction: (remixed.beatHitAction || s.beatHitAction) as any,
                  kineticLyric: remixed.kineticLyric || s.kineticLyric,
                }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Scene remix error:', err);
    } finally {
      setIsRemixingScene(false);
    }
  };

  // Voice to Vibe
  const handleVoiceToVibe = async (vibeText: string) => {
    setIsProcessingVibe(true);
    try {
      const res = await fetch('/api/gemini/vibe-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibeDescription: vibeText }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (d.mood) setMood(d.mood);

        // Find matching style preset
        const styleMatch = STYLE_PRESETS.find(
          (sp) => sp.name.toLowerCase().includes(d.styleName.toLowerCase())
        );
        if (styleMatch) setSelectedStyle(styleMatch);

        // Update active scenes visual cues
        setScenes((prev) =>
          prev.map((s, idx) => ({
            ...s,
            visualPrompt: d.motifs?.[idx % (d.motifs.length || 1)] || s.visualPrompt,
            kineticLyric: d.lyricQuote || s.kineticLyric,
          }))
        );

        setIsVoiceModalOpen(false);
      }
    } catch (err) {
      console.error('Vibe processing error:', err);
    } finally {
      setIsProcessingVibe(false);
    }
  };

  // Switch Multi-Clip Variation
  const handleSelectVariation = (varId: string) => {
    setActiveVariationId(varId);
    const variation = variations.find((v) => v.id === varId);
    if (!variation) return;

    setStrongMode(variation.strongMode);
    setMood(variation.mood);

    const stylePreset = STYLE_PRESETS.find((s) => s.id === variation.styleId);
    if (stylePreset) setSelectedStyle(stylePreset);
  };

  // Generate 4 Batch Variations with Gemini
  const handleGenerateBatchAI = async () => {
    setIsGeneratingBatch(true);
    try {
      const res = await fetch('/api/gemini/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTrack.title,
          style: selectedStyle.name,
          duration,
          mood,
          strongMode,
          userPrompt: 'Generate 4 high contrast variation treatments',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVariations([
          {
            id: 'var-1',
            title: 'Drop Punch Cut',
            tagline: 'Aggressive strobe sync',
            styleId: 'cinematic_neon',
            mood: 'Aggressive',
            strongMode: true,
            scenesCount: 4,
          },
          {
            id: 'var-2',
            title: 'Cinematic Story',
            tagline: 'Wide atmospheric depth',
            styleId: 'dark_moody',
            mood: 'Epic',
            strongMode: false,
            scenesCount: 4,
          },
          {
            id: 'var-3',
            title: 'Hyper Neon Speed',
            tagline: 'Light streaks & motion',
            styleId: 'anime_cyber',
            mood: 'Energetic',
            strongMode: true,
            scenesCount: 5,
          },
          {
            id: 'var-4',
            title: 'Aesthetic Gold Glow',
            tagline: 'Luxury high fashion',
            styleId: 'luxury_gold',
            mood: 'Luxury',
            strongMode: false,
            scenesCount: 4,
          },
        ]);
      }
    } catch (err) {
      console.error('Batch generation error:', err);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  // Start Real Video Export Recording
  const handleStartExport = async (config: {
    resolution: ExportResolution;
    format: VideoFormat;
    aspectRatio: AspectRatio;
    watermark: boolean;
  }) => {
    if (!videoRendererRef.current) return;
    setIsExporting(true);
    setExportProgress(0);
    setDownloadUrl(null);

    try {
      const blob = await videoRendererRef.current.recordClip({
        duration: Math.min(duration, 30), // Record active clip duration
        fps: 60,
        onProgress: (percent) => setExportProgress(percent),
        renderFrameFn: (time) => {
          if (videoRendererRef.current) {
            videoRendererRef.current.renderFrame({
              currentTime: time,
              duration,
              aspectRatio: config.aspectRatio,
              scenes,
              strongMode,
              colorGrade: selectedColorGrade,
              lyrics,
              showLyrics,
              performerMode,
              watermark: config.watermark,
              fallbackStyleKey: selectedStyle.id,
            });
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      console.error('Export recording failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 3-Zone Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        strongMode={strongMode}
        toggleStrongMode={() => setStrongMode(!strongMode)}
      />

      {/* Main Studio Viewport */}
      {activeTab === 'studio' && (
        <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
          {/* Multi-Clip Variation Switcher Bar */}
          <MultiVariationBar
            variations={variations}
            activeVariationId={activeVariationId}
            onSelectVariation={handleSelectVariation}
            onGenerateBatchAI={handleGenerateBatchAI}
            isGeneratingBatch={isGeneratingBatch}
          />

          {/* 3-Column Studio Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Song Input & Audio Intelligence */}
            <div className="lg:col-span-3">
              <TrackDrawer
                currentTrack={currentTrack}
                onSelectTrack={(t) => setCurrentTrack(t)}
                onUploadAudioFile={handleUploadAudioFile}
                onAnalyzeWithGemini={handleDeepTrackScan}
                isAnalyzing={isAnalyzingTrack}
                isPlaying={isPlaying}
                onTogglePlay={() => {
                  if (isPlaying) {
                    audioEngine.pause();
                    setIsPlaying(false);
                  } else {
                    audioEngine.play();
                    setIsPlaying(true);
                  }
                }}
              />
            </div>

            {/* Center Column: Video Canvas Player */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <VideoCanvasPlayer
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                scenes={scenes}
                activeSceneIndex={activeSceneIndex}
                duration={duration}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                strongMode={strongMode}
                setStrongMode={setStrongMode}
                colorGrade={selectedColorGrade}
                lyrics={lyrics}
                showLyrics={showLyrics}
                performerMode={performerMode}
                watermark={watermark}
                fallbackStyleKey={selectedStyle.id}
                customAvatarUrl={customAvatarUrl}
                onCanvasReady={(renderer) => {
                  videoRendererRef.current = renderer;
                }}
              />

              {/* Timeline Waveform Scrubber */}
              <TimelineBar
                duration={duration}
                setDuration={setDuration}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                scenes={scenes}
                activeSceneIndex={activeSceneIndex}
                setActiveSceneIndex={setActiveSceneIndex}
                onFindBestDrop={handleFindBestDrop}
                bpm={currentTrack.bpm}
              />
            </div>

            {/* Right Column: Scene Studio & Customizer Controls */}
            <div className="lg:col-span-3">
              <SceneInspector
                activeScene={scenes[activeSceneIndex] || scenes[0]}
                onUpdateScene={(updated) => {
                  setScenes((prev) =>
                    prev.map((s, idx) => (idx === activeSceneIndex ? { ...s, ...updated } : s))
                  );
                }}
                selectedStyle={selectedStyle}
                onSelectStyle={(s) => setSelectedStyle(s)}
                selectedColorGrade={selectedColorGrade}
                onSelectColorGrade={(cg) => setSelectedColorGrade(cg)}
                lyrics={lyrics}
                showLyrics={showLyrics}
                setShowLyrics={setShowLyrics}
                onUpdateLyric={(id, text) => {
                  setLyrics((prev) => prev.map((l) => (l.id === id ? { ...l, text } : l)));
                }}
                performerMode={performerMode}
                setPerformerMode={setPerformerMode}
                onUploadCustomAvatar={handleUploadCustomAvatar}
                onRemixSceneAI={handleRemixSceneAI}
                isRemixing={isRemixingScene}
                mood={mood}
                setMood={setMood}
              />
            </div>
          </div>
        </main>
      )}

      {/* Quick Cut Flow: 60-Second Express Generator */}
      {activeTab === 'quick' && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Express Video Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Turn Any Song Into a Viral Clip in 60 Seconds
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
              Pick your song, select your cinematic aesthetic, and generate a beat-synced 1080p/4K video ready for TikTok and Reels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Song */}
            <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-5 space-y-3">
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">Step 01</span>
              <h3 className="text-sm font-bold text-white">Select Your Song</h3>
              <div className="space-y-1.5">
                {TRENDING_TRACKS.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCurrentTrack(t)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                      currentTrack.id === t.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="font-mono text-[10px]">{t.bpm} BPM</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Aesthetic */}
            <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-5 space-y-3">
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">Step 02</span>
              <h3 className="text-sm font-bold text-white">Choose Aesthetic</h3>
              <div className="space-y-1.5">
                {STYLE_PRESETS.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                      selectedStyle.id === s.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{s.mood}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Format & Generate */}
            <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">Step 03</span>
                <h3 className="text-sm font-bold text-white mb-2">Social Format</h3>
                <div className="flex gap-2 mb-3">
                  {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => setAspectRatio(ar)}
                      className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg border text-center transition-all ${
                        aspectRatio === ar
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('studio');
                  setIsExportModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Clip Now
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Style Vault Gallery Tab */}
      {activeTab === 'styles' && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Visual Style Vault</h1>
              <p className="text-xs text-slate-400">Curated cinematic aesthetic models calibrated for music video production</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STYLE_PRESETS.map((style) => {
              const isSelected = selectedStyle.id === style.id;
              return (
                <div
                  key={style.id}
                  className={`bg-[#0a0d14] border rounded-xl overflow-hidden transition-all group ${
                    isSelected ? 'border-cyan-400 ring-1 ring-cyan-400' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-44 w-full relative overflow-hidden bg-black/80">
                    <img
                      src={style.image}
                      alt={style.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-transparent" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{style.name}</h3>
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold">{style.mood}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{style.tagline}</p>
                    <button
                      onClick={() => {
                        setSelectedStyle(style);
                        setActiveTab('studio');
                      }}
                      className={`w-full mt-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? 'Active Style' : 'Apply to Clip'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* Track Library Tab */}
      {activeTab === 'library' && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Audio & Track Library</h1>
              <p className="text-xs text-slate-400">Pre-licensed high-energy music tracks with beat blueprints</p>
            </div>
          </div>

          <div className="bg-[#0a0d14] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
            {TRENDING_TRACKS.map((track) => {
              const isSelected = currentTrack.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-cyan-950/20' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                      <img
                        src={track.coverImage}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{track.title}</span>
                        {isSelected && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300">Active</span>}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {track.artist} · <span className="text-slate-300">{track.genre}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="font-mono text-xs font-bold text-cyan-400">{track.bpm} BPM</div>
                      <div className="text-[11px] text-slate-400">{track.musicalKey} · {track.energyScore}% Energy</div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentTrack(track);
                        audioEngine.setSynthTheme(track.synthTheme || 'synthwave', track.bpm);
                        setActiveTab('studio');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors"
                    >
                      Use in Studio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* Voice-to-Vibe AI Modal */}
      <VoiceToVibeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSubmitVibe={handleVoiceToVibe}
        isLoading={isProcessingVibe}
      />

      {/* Export Video Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        watermark={watermark}
        setWatermark={setWatermark}
        onStartExport={handleStartExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
        downloadUrl={downloadUrl}
        trackTitle={currentTrack.title}
      />
    </div>
  );
}
