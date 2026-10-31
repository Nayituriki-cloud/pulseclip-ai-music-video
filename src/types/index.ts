export type AspectRatio = '9:16' | '16:9' | '1:1';
export type ExportResolution = '1080p' | '2K' | '4K';
export type VideoFormat = 'mp4' | 'webm';

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  duration: number; // in seconds
  musicalKey: string;
  energyScore: number; // 0 - 100
  emotionalTone: string;
  coverImage: string;
  audioUrl?: string;
  isCustom?: boolean;
  synthTheme?: 'synthwave' | 'phonk' | 'melodic' | 'festival' | 'drift';
}

export interface SongSection {
  name: string;
  startTime: number;
  endTime: number;
  energy: number;
  visualCue: string;
  cameraMove?: string;
}

export interface VisualScene {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  visualPrompt: string;
  cameraEffect: 'punch_zoom' | 'orbit_slow' | 'whip_pan' | 'bass_strobe' | 'drone_glide';
  beatHitAction: 'screen_flash' | 'chromatic_shake' | 'particle_burst' | 'glitch_warp';
  colorGrade: string;
  kineticLyric?: string;
  bassIntensity: number; // 1-10
  imageKey?: string;
}

export interface VisualStylePreset {
  id: string;
  name: string;
  tagline: string;
  image: string;
  mood: string;
  colorHex: string;
  filterStyle: string;
  particleType: 'dust' | 'neon_grid' | 'sparks' | 'bokeh' | 'matrix';
}

export interface KineticLyric {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style: 'punch' | 'neon' | 'karaoke' | 'minimal' | 'glitch';
}

export interface ColorGradePreset {
  id: string;
  name: string;
  contrast: number; // 1.0 - 2.0
  saturation: number; // 0.0 - 2.0
  tintColor: string;
  filmGrain: number; // 0.0 - 1.0
  bloom: number; // 0.0 - 1.0
}

export interface PerformerMode {
  id: 'none' | 'silhouette' | 'cyber_dj' | 'neon_hologram' | 'custom_avatar';
  name: string;
  description: string;
  customImageUrl?: string;
}

export interface MultiClipVariation {
  id: string;
  title: string;
  tagline: string;
  styleId: string;
  mood: string;
  strongMode: boolean;
  scenesCount: number;
}
