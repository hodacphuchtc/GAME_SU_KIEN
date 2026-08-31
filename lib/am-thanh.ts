/**
 * Âm thanh tự tổng hợp bằng Web Audio — KHÔNG file mp3.
 * Lý do: không phải tải thêm gì (mở là chạy dù mạng yếu), không vướng bản
 * quyền nhạc, và tiếng tick có thể lên cao dần đúng theo tốc độ đang chạy.
 *
 * Trình duyệt điện thoại chỉ cho phát tiếng sau khi người dùng chạm, nên
 * `ensureStarted()` phải được gọi ngay trong sự kiện bấm BẮT ĐẦU.
 */

const MIN_TICK_GAP_MS = 40; // tối đa 25 tiếng/giây — nhanh hơn nữa thì tai nghe thành tiếng rè

type Ctor = typeof AudioContext;

function getAudioContextCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: Ctor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export class SoundEngine {
  private context: AudioContext | null = null;
  private lastTickAt = 0;
  private muted = false;

  /** Gọi TRONG sự kiện chạm đầu tiên, nếu không trình duyệt sẽ chặn tiếng. */
  ensureStarted(): void {
    if (this.context) {
      if (this.context.state === "suspended") void this.context.resume();
      return;
    }
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    try {
      this.context = new Ctor();
    } catch {
      this.context = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private beep(
    frequency: number,
    durationMs: number,
    peak = 0.14,
    type: OscillatorType = "square",
    delayMs = 0,
  ): void {
    const ctx = this.context;
    if (!ctx || this.muted) return;
    const startAt = ctx.currentTime + delayMs / 1000;
    const endAt = startAt + durationMs / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(endAt + 0.02);
  }

  /**
   * Tiếng tick của bảng số. `intensity` 0..1 theo tốc độ hiện tại — càng nhanh
   * tiếng càng cao và càng gấp, đúng cảm giác đang tăng tốc.
   */
  tick(intensity: number): void {
    const ctx = this.context;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime * 1000;
    const level = Math.min(1, Math.max(0, intensity));
    const gap = MIN_TICK_GAP_MS + (1 - level) * 70;
    if (now - this.lastTickAt < gap) return;
    this.lastTickAt = now;
    this.beep(320 + level * 720, 22, 0.07);
  }

  /** Tiếng đếm ngược 3 – 2 – 1 rồi tiếng "chạy". */
  countdown(isFinal: boolean): void {
    if (isFinal) this.beep(880, 200, 0.16, "triangle");
    else this.beep(440, 110, 0.12, "triangle");
  }

  /** Tiếng báo nút DỪNG vừa mở khoá. */
  unlocked(): void {
    this.beep(660, 70, 0.12, "triangle");
    this.beep(990, 90, 0.12, "triangle", 80);
  }

  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((frequency, i) => {
      this.beep(frequency, 260, 0.18, "triangle", i * 110);
    });
  }

  lose(): void {
    this.beep(330, 160, 0.13, "sawtooth");
    this.beep(220, 260, 0.11, "sawtooth", 150);
  }

  dispose(): void {
    void this.context?.close();
    this.context = null;
  }
}

export function createSoundEngine(): SoundEngine {
  return new SoundEngine();
}
