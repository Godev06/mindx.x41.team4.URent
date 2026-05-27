export type ChimeStyle = "crystal" | "electronic" | "arpeggio" | "minimal";

class AudioChimeService {
  private audioCtx: AudioContext | null = null;
  private volume: number = 0.8;
  private style: ChimeStyle = "crystal";

  constructor() {
    if (typeof window !== "undefined") {
      // Load stored preferences
      const storedVolume = localStorage.getItem("settings.chimeVolume");
      if (storedVolume !== null) {
        const parsed = parseFloat(storedVolume);
        if (!isNaN(parsed)) {
          this.volume = parsed;
        }
      }

      const storedStyle = localStorage.getItem("settings.chimeStyle") as ChimeStyle;
      if (storedStyle && ["crystal", "electronic", "arpeggio", "minimal"].includes(storedStyle)) {
        this.style = storedStyle;
      }

      // Auto-unlock AudioContext on first user interaction to comply with modern browser autoplay policies
      const unlockEvents = ["click", "touchstart", "keydown", "mousedown"];
      const unlock = () => {
        this.initAudio();
        unlockEvents.forEach((e) => window.removeEventListener(e, unlock));
      };
      unlockEvents.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
    }
  }

  private initAudio() {
    if (typeof window === "undefined") return;
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (typeof window !== "undefined") {
      localStorage.setItem("settings.chimeVolume", String(clamped));
    }
  }

  public getStyle(): ChimeStyle {
    return this.style;
  }

  public setStyle(style: ChimeStyle) {
    this.style = style;
    if (typeof window !== "undefined") {
      localStorage.setItem("settings.chimeStyle", style);
    }
  }

  // Synthesizers
  private synthCrystal(ctx: AudioContext, destination: AudioNode, startTime: number) {
    // Oscillator 1: High tone bell resonance (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, startTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, startTime + 0.15); // A5 sweep
    gain1.gain.setValueAtTime(0.08, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(destination);
    osc1.start(startTime);
    osc1.stop(startTime + 0.6);

    // Oscillator 2: High bright sparkling harmony (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, startTime); // A5
    osc2.frequency.setValueAtTime(1174.66, startTime + 0.12); // D6
    gain2.gain.setValueAtTime(0.04, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(destination);
    osc2.start(startTime);
    osc2.stop(startTime + 0.5);
  }

  private synthElectronic(ctx: AudioContext, destination: AudioNode, startTime: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    // Quick tech sweep
    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.15);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, startTime);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.25);
  }

  private synthArpeggio(ctx: AudioContext, destination: AudioNode, startTime: number) {
    // Quick ascending major arpeggio: D5 (587.33), F#5 (739.99), A5 (880.00), D6 (1174.66)
    const notes = [587.33, 739.99, 880.00, 1174.66];
    const noteDuration = 0.07;

    notes.forEach((freq, index) => {
      const noteTime = startTime + index * noteDuration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.06, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  private synthMinimal(ctx: AudioContext, destination: AudioNode, startTime: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, startTime); // A5

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.12);
  }

  public playChime(overrideStyle?: ChimeStyle, overrideVolume?: number) {
    try {
      this.initAudio();
      const ctx = this.audioCtx;
      if (!ctx) return;

      const style = overrideStyle ?? this.style;
      const volume = overrideVolume ?? this.volume;

      // Master gain for user-adjusted volume control
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const startTime = ctx.currentTime;

      switch (style) {
        case "electronic":
          this.synthElectronic(ctx, masterGain, startTime);
          break;
        case "arpeggio":
          this.synthArpeggio(ctx, masterGain, startTime);
          break;
        case "minimal":
          this.synthMinimal(ctx, masterGain, startTime);
          break;
        case "crystal":
        default:
          this.synthCrystal(ctx, masterGain, startTime);
          break;
      }
    } catch (err) {
      console.warn("[AudioChimeService] Play failed:", err);
    }
  }
}

export const audioChimeService = new AudioChimeService();
