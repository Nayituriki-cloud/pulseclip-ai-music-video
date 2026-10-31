import { VisualScene, AspectRatio, ColorGradePreset, KineticLyric, PerformerMode } from '../types';
import { audioEngine } from './audioEngine';

// Pre-cached visual assets
export const PRELOADED_ASSETS = {
  cinematic_neon: '/src/assets/images/style_cinematic_neon_1793388343669.jpg',
  dark_moody: '/src/assets/images/style_dark_moody_1793388344834.jpg',
  anime_cyber: '/src/assets/images/style_anime_cyber_1793388344470.jpg',
  luxury_gold: '/src/assets/images/style_luxury_gold_1793388344968.jpg',
};

export class VideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; alpha: number; hue: number }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.initParticles();
    this.preloadImages();
  }

  private preloadImages() {
    Object.entries(PRELOADED_ASSETS).forEach(([key, url]) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(key, img);
      };
    });
  }

  public registerCustomImage(key: string, url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(key, img);
        resolve();
      };
      img.onerror = () => resolve();
    });
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        size: 1 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.002,
        speedY: -0.001 - Math.random() * 0.003,
        alpha: 0.2 + Math.random() * 0.6,
        hue: 180 + Math.random() * 60,
      });
    }
  }

  public renderFrame(options: {
    currentTime: number;
    duration: number;
    aspectRatio: AspectRatio;
    scenes: VisualScene[];
    strongMode: boolean;
    colorGrade: ColorGradePreset;
    lyrics: KineticLyric[];
    showLyrics: boolean;
    performerMode: PerformerMode;
    watermark: boolean;
    fallbackStyleKey: string;
    customAvatarImg?: HTMLImageElement | null;
  }) {
    const {
      currentTime,
      scenes,
      strongMode,
      colorGrade,
      lyrics,
      showLyrics,
      performerMode,
      watermark,
      fallbackStyleKey,
      customAvatarImg,
    } = options;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Audio energy metrics
    const energy = audioEngine.getEnergyLevels();
    const bass = energy.bass;
    const mid = energy.mid;
    const strongMultiplier = strongMode ? 1.7 : 1.0;

    // 1. Identify active scene
    const activeScene = scenes.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    ) || scenes[0];

    // Determine background asset
    const imageKey = activeScene?.imageKey || fallbackStyleKey || 'cinematic_neon';
    const bgImage = this.imageCache.get(imageKey) || this.imageCache.get('cinematic_neon');

    // Camera transform calculations
    const sceneElapsed = activeScene ? currentTime - activeScene.startTime : currentTime;
    const sceneDuration = activeScene ? activeScene.endTime - activeScene.startTime : 5;
    const sceneProgress = Math.min(1, Math.max(0, sceneElapsed / (sceneDuration || 1)));

    let scale = 1.05;
    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;

    // Camera move styles
    const cameraEffect = activeScene?.cameraEffect || 'punch_zoom';
    if (cameraEffect === 'punch_zoom') {
      const beatPop = (bass > 0.45 ? bass * 0.18 : 0) * strongMultiplier;
      scale = 1.04 + sceneProgress * 0.08 + beatPop;
    } else if (cameraEffect === 'orbit_slow') {
      rotation = (sceneProgress - 0.5) * 0.04 * (strongMode ? 2 : 1);
      scale = 1.1 + bass * 0.06;
    } else if (cameraEffect === 'whip_pan') {
      const whip = Math.sin(sceneProgress * Math.PI) * 40 * strongMultiplier;
      offsetX = whip;
      scale = 1.08 + bass * 0.08;
    } else if (cameraEffect === 'bass_strobe') {
      scale = 1.06 + Math.sin(currentTime * 12) * 0.04 * strongMultiplier;
    } else if (cameraEffect === 'drone_glide') {
      scale = 1.0 + sceneProgress * 0.15;
    }

    // Screen shake on heavy bass hit
    if (bass > 0.6) {
      const shakeMag = (bass - 0.6) * 16 * strongMultiplier;
      offsetX += (Math.random() - 0.5) * shakeMag;
      offsetY += (Math.random() - 0.5) * shakeMag;
    }

    // Clear background
    ctx.save();
    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Background image with transform
    ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      // Cover fit inside canvas
      const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;

      if (canvasRatio > imgRatio) {
        drawW = width;
        drawH = width / imgRatio;
      } else {
        drawH = height;
        drawW = height * imgRatio;
      }

      ctx.drawImage(bgImage, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      // Gradient fallback
      const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(-width / 2, -height / 2, width, height);
    }
    ctx.restore();

    // 3. Draw Beat-Reactive Overlays & Lighting
    // Dynamic Bass Vignette / Pulse
    const vignetteGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.2,
      width / 2,
      height / 2,
      height * 0.8
    );
    const vignetteDarkness = 0.5 + bass * 0.3 * strongMultiplier;
    vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(1, `rgba(0,0,0,${Math.min(0.9, vignetteDarkness)})`);
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);

    // Beat Hit Flash (Strobe)
    if (activeScene?.beatHitAction === 'screen_flash' && bass > 0.65) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.35, (bass - 0.65) * 0.9 * strongMultiplier)})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Chromatic glitch lines on high energy
    if (strongMode && (bass > 0.75 || Math.random() < 0.05)) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)'; // Cyan split
      ctx.fillRect(0, Math.random() * height, width, 4 + Math.random() * 8);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.12)'; // Magenta split
      ctx.fillRect(0, Math.random() * height, width, 4 + Math.random() * 8);
      ctx.restore();
    }

    // 4. Floating Ambient Particles & Cyber Rays
    this.drawParticles(ctx, width, height, bass, strongMultiplier);

    // 5. Performer Silhouette / Avatar Mode
    if (performerMode.id !== 'none') {
      this.drawPerformer(ctx, width, height, performerMode, bass, customAvatarImg);
    }

    // 6. Color Grading & Tone Shading
    this.applyColorGrading(ctx, width, height, colorGrade, strongMode);

    // 7. Kinetic Typography / Lyrics
    if (showLyrics) {
      const activeLyric = lyrics.find(
        (l) => currentTime >= l.startTime && currentTime <= l.endTime
      );
      if (activeLyric) {
        this.drawKineticLyric(ctx, width, height, activeLyric, currentTime, bass, strongMode);
      }
    }

    // 8. Watermark (if free plan / user opted in)
    if (watermark) {
      ctx.save();
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'right';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('PULSECLIP STUDIO', width - 24, height - 28);
      ctx.restore();
    }
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bass: number,
    strongMultiplier: number
  ) {
    ctx.save();
    this.particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY * (1 + bass * 3 * strongMultiplier);

      if (p.y < 0) p.y = 1;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;

      const px = p.x * width;
      const py = p.y * height;
      const pulseSize = p.size * (1 + bass * 1.5);

      ctx.beginPath();
      ctx.arc(px, py, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.alpha * (0.4 + bass * 0.6)})`;
      ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.8)`;
      ctx.shadowBlur = 8;
      ctx.fill();
    });
    ctx.restore();
  }

  private drawPerformer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    performerMode: PerformerMode,
    bass: number,
    customAvatarImg?: HTMLImageElement | null
  ) {
    ctx.save();
    const centerX = width / 2;
    const bottomY = height;
    const avatarScale = 1.0 + bass * 0.05;

    if (customAvatarImg && customAvatarImg.complete) {
      // Custom uploaded avatar in circular beat-reactive neon halo
      const avatarSize = Math.min(width, height) * 0.28 * avatarScale;
      const avatarY = height * 0.42;

      ctx.save();
      // Outer beat ring
      ctx.beginPath();
      ctx.arc(centerX, avatarY, avatarSize / 2 + 6 + bass * 12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + bass * 0.6})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Clip image to circle
      ctx.beginPath();
      ctx.arc(centerX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        customAvatarImg,
        centerX - avatarSize / 2,
        avatarY - avatarSize / 2,
        avatarSize,
        avatarSize
      );
      ctx.restore();
    } else if (performerMode.id === 'silhouette') {
      // Dramatic artist silhouette at bottom
      ctx.save();
      ctx.fillStyle = 'rgba(8, 10, 16, 0.95)';
      ctx.shadowColor = `rgba(6, 182, 212, ${0.3 + bass * 0.5})`;
      ctx.shadowBlur = 24;

      ctx.beginPath();
      // Head
      const headRadius = width * 0.07 * avatarScale;
      const headY = bottomY - height * 0.35;
      ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
      // Torso & Shoulders
      ctx.moveTo(centerX - headRadius * 2.8, bottomY);
      ctx.lineTo(centerX - headRadius * 1.6, headY + headRadius * 1.2);
      ctx.lineTo(centerX + headRadius * 1.6, headY + headRadius * 1.2);
      ctx.lineTo(centerX + headRadius * 2.8, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (performerMode.id === 'cyber_dj' || performerMode.id === 'neon_hologram') {
      // Holographic wireframe rings
      ctx.save();
      ctx.translate(centerX, height * 0.5);
      ctx.rotate(bass * 0.2);
      ctx.strokeStyle = performerMode.id === 'cyber_dj' ? 'rgba(236, 72, 153, 0.6)' : 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;

      for (let r = 40; r <= 140; r += 35) {
        ctx.beginPath();
        ctx.arc(0, 0, r + bass * 25, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private applyColorGrading(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colorGrade: ColorGradePreset,
    strongMode: boolean
  ) {
    if (colorGrade.tintColor && colorGrade.tintColor !== 'transparent') {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = colorGrade.tintColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // High contrast overlay for Strong Mode
    if (strongMode) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  private drawKineticLyric(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lyric: KineticLyric,
    currentTime: number,
    bass: number,
    strongMode: boolean
  ) {
    ctx.save();
    const progress = (currentTime - lyric.startTime) / (lyric.endTime - lyric.startTime);
    const centerX = width / 2;
    const posY = height * 0.75;

    // Responsive typography sizing
    const baseFontSize = Math.max(22, Math.min(width * 0.055, 48));
    let fontScale = 1.0;

    if (lyric.style === 'punch') {
      // Pop in and subtle scale on bass
      fontScale = progress < 0.2 ? 0.7 + (progress / 0.2) * 0.35 : 1.0 + bass * 0.12;
    } else if (lyric.style === 'neon') {
      fontScale = 1.0 + Math.sin(progress * Math.PI) * 0.08;
    } else if (lyric.style === 'glitch') {
      fontScale = 1.0;
    }

    const fontSize = baseFontSize * fontScale * (strongMode ? 1.08 : 1.0);
    ctx.font = `800 ${Math.round(fontSize)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text Glow
    ctx.shadowColor = lyric.style === 'neon' ? 'rgba(6, 182, 212, 0.9)' : 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = lyric.style === 'neon' ? 24 : 10;

    // Background scrim for maximum legibility
    const textMetrics = ctx.measureText(lyric.text);
    const boxWidth = textMetrics.width + 48;
    const boxHeight = fontSize * 1.5;

    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 12, 0.55)';
    ctx.fillRect(centerX - boxWidth / 2, posY - boxHeight / 2, boxWidth, boxHeight);
    ctx.restore();

    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lyric.text, centerX, posY);

    // Neon accent outline
    if (lyric.style === 'neon') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#22d3ee';
      ctx.strokeText(lyric.text, centerX, posY);
    }
    ctx.restore();
  }

  // Export video recording pipeline
  public recordClip(options: {
    duration: number;
    fps: number;
    onProgress: (percent: number) => void;
    renderFrameFn: (time: number) => void;
  }): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const stream = this.canvas.captureStream(options.fps || 60);

        // Attach Web Audio destination stream if available
        const audioDestination = audioEngine.getStreamDestination();
        if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
          audioDestination.stream.getAudioTracks().forEach((track) => {
            stream.addTrack(track);
          });
        }

        // Select supported mimeType
        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
          resolve(finalBlob);
        };

        recorder.onerror = (err) => {
          reject(err);
        };

        // Start playback and recording
        audioEngine.seek(0);
        audioEngine.play();
        recorder.start();

        const startTime = Date.now();
        const totalDurationMs = options.duration * 1000;

        const recordLoop = () => {
          const elapsedMs = Date.now() - startTime;
          const currentTime = elapsedMs / 1000;
          const percent = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
          options.onProgress(percent);

          options.renderFrameFn(currentTime);

          if (elapsedMs < totalDurationMs) {
            requestAnimationFrame(recordLoop);
          } else {
            recorder.stop();
            audioEngine.pause();
          }
        };

        requestAnimationFrame(recordLoop);
      } catch (err) {
        reject(err);
      }
    });
  }
}
