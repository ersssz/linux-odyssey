class SoundManager {
  private enabled = true;
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('linux-odyssey-sound') !== 'off';
    }
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('linux-odyssey-sound', enabled ? 'on' : 'off');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  playSuccess() {
    this.playTone(523.25, 0.1, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 100); // E5
  }

  playClick() {
    this.playTone(440, 0.05, 'sine');
  }

  playError() {
    this.playTone(196, 0.15, 'sawtooth'); // G3
  }

  playLevelUp() {
    this.playTone(392, 0.1, 'sine'); // G4
    setTimeout(() => this.playTone(523.25, 0.1, 'sine'), 100); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 200); // E5
    setTimeout(() => this.playTone(783.99, 0.3, 'sine'), 300); // G5
  }

  playUnlock() {
    this.playTone(523.25, 0.1, 'sine');
    setTimeout(() => this.playTone(698.46, 0.15, 'sine'), 100); // F5
    setTimeout(() => this.playTone(880, 0.2, 'sine'), 200); // A5
  }
}

export const soundManager = new SoundManager();
