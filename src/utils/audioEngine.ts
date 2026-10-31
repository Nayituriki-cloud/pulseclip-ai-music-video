/**
 * PulseClip High-Performance Web Audio Engine
 * Handles audio playback, real-time frequency analysis, procedural beat synthesis,
 * beat peak detection, and MediaStream capture for video export.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private gainNode: GainNode | null = null;
  
  // Custom audio playback
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isCustomPlaying = false;
  
  // Procedural synthesizer state
  private isSynthPlaying = false;
  private synthIntervalId: number | null = null;
  private currentStep = 0;
  private synthBpm = 128;
  private synthTheme: 'synthwave' | 'phonk' | 'melodic' | 'festival' | 'drift' = 'synthwave';
  
  // Playback tracking
  private startTime = 0;
  private pauseOffset = 0;
  private isPlaying = false;
  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private animFrameId: number | null = null;

  constructor() {
    // Lazy initialized on first user gesture
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.9;

      // Stream destination for video export recording
      this.destinationNode = this.ctx.createMediaStreamDestination();

      // Connect master gain to speaker output and recording stream
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.analyser.connect(this.destinationNode);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getStreamDestination(): MediaStreamAudioDestinationNode | null {
    this.init();
    return this.destinationNode;
  }

  public getAudioContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getEnergyLevels(): { bass: number; mid: number; high: number; overall: number } {
    const data = this.getFrequencyData();
    if (data.length === 0) return { bass: 0, mid: 0, high: 0, overall: 0 };

    let bassSum = 0;
    const bassBins = Math.min(10, data.length);
    for (let i = 0; i < bassBins; i++) bassSum += data[i];

    let midSum = 0;
    const midEnd = Math.min(45, data.length);
    for (let i = bassBins; i < midEnd; i++) midSum += data[i];

    let highSum = 0;
    const highEnd = Math.min(100, data.length);
    for (let i = midEnd; i < highEnd; i++) highSum += data[i];

    const bass = bassSum / (bassBins * 255);
    const mid = midSum / ((midEnd - bassBins) * 255);
    const high = highSum / ((highEnd - midEnd) * 255);
    const overall = (bass * 0.5 + mid * 0.3 + high * 0.2);

    return { bass, mid, high, overall };
  }

  public async loadAudioFile(file: File): Promise<{ buffer: AudioBuffer; detectedBpm: number; duration: number }> {
    this.init();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
    this.audioBuffer = audioBuffer;

    // Detect BPM via peak energy distribution
    const detectedBpm = this.estimateBpm(audioBuffer);
    return {
      buffer: audioBuffer,
      detectedBpm,
      duration: audioBuffer.duration,
    };
  }

  private estimateBpm(buffer: AudioBuffer): number {
    try {
      const channelData = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;
      // sample 10 seconds in the middle of track
      const startSample = Math.floor(sampleRate * Math.min(10, buffer.duration * 0.2));
      const endSample = Math.min(channelData.length, startSample + sampleRate * 12);
      
      const peaks: number[] = [];
      const threshold = 0.5;
      for (let i = startSample; i < endSample; i += 200) {
        if (Math.abs(channelData[i]) > threshold) {
          peaks.push(i);
        }
      }
      
      // Default fallback if too short or irregular
      if (peaks.length < 5) return 128;
      
      const intervals: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        const interval = (peaks[i] - peaks[i - 1]) / sampleRate;
        if (interval > 0.3 && interval < 0.8) {
          intervals.push(interval);
        }
      }
      
      if (intervals.length === 0) return 128;
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      let calculatedBpm = Math.round(60 / avgInterval);
      while (calculatedBpm < 90) calculatedBpm *= 2;
      while (calculatedBpm > 180) calculatedBpm /= 2;
      return calculatedBpm || 128;
    } catch {
      return 128;
    }
  }

  public setSynthTheme(theme: 'synthwave' | 'phonk' | 'melodic' | 'festival' | 'drift', bpm: number = 128) {
    this.synthTheme = theme;
    this.synthBpm = bpm;
  }

  public play(theme?: 'synthwave' | 'phonk' | 'melodic' | 'festival' | 'drift', bpm?: number) {
    this.init();
    if (this.isPlaying) return;

    if (theme) this.synthTheme = theme;
    if (bpm) this.synthBpm = bpm;

    this.isPlaying = true;
    this.startTime = this.ctx!.currentTime - this.pauseOffset;

    if (this.audioBuffer) {
      this.playCustomBuffer();
    } else {
      this.startProceduralSynth();
    }

    this.startProgressTracker();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.pauseOffset = this.getCurrentTime();

    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.synthIntervalId) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public stop() {
    this.pause();
    this.pauseOffset = 0;
    this.currentStep = 0;
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.pauseOffset = Math.max(0, seconds);
    if (wasPlaying) {
      this.play();
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseOffset;
    if (!this.ctx) return 0;
    return Math.max(0, this.ctx.currentTime - this.startTime);
  }

  public setTimeUpdateListener(callback: (time: number) => void) {
    this.onTimeUpdateCallback = callback;
  }

  private startProgressTracker() {
    const track = () => {
      if (!this.isPlaying) return;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.getCurrentTime());
      }
      this.animFrameId = requestAnimationFrame(track);
    };
    this.animFrameId = requestAnimationFrame(track);
  }

  private playCustomBuffer() {
    if (!this.ctx || !this.audioBuffer || !this.gainNode) return;
    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.start(0, this.pauseOffset % this.audioBuffer.duration);
  }

  // Procedural synthesizer: generates rhythmic, layered beats (kick, snare, hi-hats, sub-bass, lead chords)
  private startProceduralSynth() {
    if (!this.ctx || !this.gainNode) return;
    const stepDurationMs = (60 / this.synthBpm) / 4 * 1000; // 16th note steps

    this.synthIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.gainNode) return;
      const step = this.currentStep % 16;
      const now = this.ctx.currentTime;

      // Kick drum on beats 0, 4, 8, 12 (or syncopated in trap/phonk)
      const isKick = this.synthTheme === 'phonk'
        ? (step === 0 || step === 3 || step === 8 || step === 11 || step === 14)
        : (step === 0 || step === 4 || step === 8 || step === 12);

      if (isKick) {
        this.triggerKick(now);
      }

      // Snare / Clap on beats 4 & 12 (or 8 in half-time trap)
      const isSnare = (this.synthTheme === 'phonk' || this.synthTheme === 'drift')
        ? (step === 8)
        : (step === 4 || step === 12);

      if (isSnare) {
        this.triggerSnare(now);
      }

      // Hi-Hats on every even step or roll
      const isHat = step % 2 === 0 || (this.synthTheme === 'phonk' && (step === 6 || step === 14));
      if (isHat) {
        this.triggerHiHat(now, step % 4 === 2 ? 0.35 : 0.2);
      }

      // Bass notes & Melodic chords
      if (step === 0 || step === 4 || step === 8 || step === 12) {
        this.triggerBass(now, step);
      }

      if (step === 0 || step === 6 || step === 10) {
        this.triggerSynthChord(now, step);
      }

      this.currentStep++;
    }, stepDurationMs);
  }

  private triggerKick(time: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = this.synthTheme === 'phonk' || this.synthTheme === 'drift' ? 140 : 160;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.gainNode) return;
    // White noise buffer
    const bufferSize = this.ctx.sampleRate * 0.18;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.2);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.1);
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private triggerHiHat(time: number, volume: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  private triggerBass(time: number, step: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = this.synthTheme === 'phonk' ? 'sawtooth' : 'triangle';
    
    // Scale notes: F minor pentatonic or C minor
    const notes = [43.65, 48.99, 51.91, 58.27]; // F1, G1, Ab1, Bb1
    const note = notes[(step / 4) % notes.length];

    osc.frequency.setValueAtTime(note, time);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.28);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private triggerSynthChord(time: number, step: number) {
    if (!this.ctx || !this.gainNode) return;
    const frequencies = this.synthTheme === 'synthwave'
      ? [220, 261.63, 329.63] // A minor
      : [174.61, 220, 261.63]; // F major

    frequencies.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.gainNode!);

      osc.start(time);
      osc.stop(time + 0.45);
    });
  }
}

export const audioEngine = new AudioEngine();
