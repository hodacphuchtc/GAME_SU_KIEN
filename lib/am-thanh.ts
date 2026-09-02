/**
 * Âm thanh tự tổng hợp bằng Web Audio — KHÔNG file mp3.
 * Lý do: không phải tải thêm gì (mở là chạy dù mạng yếu), không vướng bản
 * quyền nhạc, và tiếng tick có thể lên cao dần đúng theo tốc độ đang chạy.
 *
 * Trình duyệt điện thoại chỉ cho phát tiếng sau khi người dùng chạm, nên
 * `ensureStarted()` phải được gọi ngay trong sự kiện bấm BẮT ĐẦU.
 */

const MIN_TICK_GAP_MS = 40; // tối đa 25 tiếng/giây — nhanh hơn nữa thì tai nghe thành tiếng rè

/**
 * Một tệp WAV hợp lệ, 44 byte, KHÔNG có khung âm thanh nào — nhúng thẳng, không
 * thêm tệp vào `public/` (luật tự chứa của ứng dụng).
 *
 * 🔴 Đây là chìa khoá của cả GĐ 22. Trên iPhone, Web Audio chạy trong phiên âm
 * thanh "ambient", mà phiên đó bị **công tắc gạt im lặng ở cạnh máy tắt sạch** —
 * im lặng hoàn toàn, không một dòng lỗi nào, y hệt cái bẫy `allowedDevOrigins`.
 * Phát một `HTMLAudioElement` trong đúng cú chạm của người dùng đẩy phiên sang
 * "playback", và từ đó Web Audio kêu cả khi máy đang gạt im.
 *
 * ⚠️ Nói thẳng: đây là hành vi Apple KHÔNG cam kết và đã đổi vài lần qua các bản
 * iOS. Bài kiểm thật là người cầm máy bấm ở cả hai nấc công tắc — xem
 * `TRUNG_SO/PLAN_TRUNG_SO_V2.md` mục 22.1 bước (b). Nếu bản iOS nào đó không ăn,
 * phương án còn lại là bỏ Web Audio và phát tệp âm thanh thật.
 *
 * Đừng tự sinh lại chuỗi này — một byte sai là tệp hỏng và iOS lặng lẽ bỏ qua.
 */
const WAV_IM_LANG =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";

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
  private daMoKhoa = false;

  /**
   * Đẩy phiên âm thanh của iOS sang "playback". Chỉ chạy MỘT lần: phát lại tệp
   * mồi ở mỗi cú chạm là thêm việc vô ích, và trên vài máy còn cắt ngang chính
   * tiếng đang phát.
   */
  private moKhoaIos(): void {
    if (this.daMoKhoa) return;
    this.daMoKhoa = true;
    try {
      if (typeof Audio === "undefined") return;
      const the = new Audio(WAV_IM_LANG);
      // Không có `playsinline` thì iOS có thể mở trình phát toàn màn hình đè lên
      // trò chơi — người chơi mất luôn nút DỪNG.
      the.setAttribute("playsinline", "");
      the.volume = 0.01;
      void the.play().catch(() => {
        // Trình duyệt từ chối tự phát là chuyện thường; Web Audio vẫn chạy ở
        // chế độ thường. Nuốt lỗi ở đây, đừng để nó giết cả cú bấm.
      });
    } catch {
      // Máy không cho tạo `Audio` (chế độ riêng tư, chính sách quyền) — bỏ qua.
    }
  }

  /** Gọi TRONG sự kiện chạm đầu tiên, nếu không trình duyệt sẽ chặn tiếng. */
  ensureStarted(): void {
    this.moKhoaIos();

    if (this.context) {
      if (this.context.state === "suspended") void this.context.resume();
      return;
    }
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    try {
      this.context = new Ctor();
      // 🔴 Context VỪA TẠO cũng có thể ở trạng thái `suspended` — bản trước chỉ
      // resume cho context đã có sẵn, nên đúng lần đầu tiên thì bỏ qua, và lần
      // đầu tiên chính là cú bấm BẮT ĐẦU của người chơi.
      if (this.context.state === "suspended") void this.context.resume();
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

  // 🔴 `countdown()` ĐÃ XOÁ ngày 02/09/2026. Nó chỉ được gọi từ nhánh xử lý tin
  // `dem-nguoc` — một tin khai trong `kenh.ts`, có nhánh xử lý ở LCD, mà KHÔNG
  // một nơi nào phát. Giữ lại một hàm phát tiếng cho một tin không tồn tại là
  // mời người sau tin rằng màn hình có đếm ngược.

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
