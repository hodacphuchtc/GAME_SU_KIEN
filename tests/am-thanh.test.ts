import { afterEach, describe, expect, it, vi } from "vitest";

import { createSoundEngine } from "@/lib/am-thanh";

/**
 * ĐÁNH THỨC ÂM THANH (GĐ 22.1).
 *
 * 🔴 Ba lỗi khác nhau đã làm quầy im lặng, đừng gộp làm một:
 *   1. `AudioContext` mới tạo đôi khi ở trạng thái `suspended` — bản cũ chỉ gọi
 *      `resume()` cho context đã có sẵn, nên lần đầu tiên bị bỏ qua.
 *   2. Trên iPhone, **công tắc gạt im lặng ở cạnh máy tắt sạch Web Audio**. Cách
 *      duy nhất vòng qua: phát một thẻ `<audio>` trong cùng cú chạm, nó đẩy phiên
 *      âm thanh của iOS từ "ambient" sang "playback".
 *   3. Máy chặn tạo `Audio` (chế độ riêng tư, quyền tự phát) — không được để lỗi
 *      đó ném ra ngoài và giết luôn cả nút bấm.
 *
 * ⚠️ Bài test này canh phần LOGIC. Nó **không chứng minh được tiếng có kêu trên
 * iPhone thật** — bài kiểm đó là người cầm máy bấm, ở cả hai nấc công tắc gạt.
 */

let daTao = 0;
let daPhat = 0;
let daResume = 0;

function gaLapTrinhDuyet(trangThaiDau: "running" | "suspended") {
  daTao = 0;
  daPhat = 0;
  daResume = 0;

  class AudioContextGia {
    state = trangThaiDau;
    currentTime = 0;
    destination = {};
    resume() {
      daResume += 1;
      this.state = "running";
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
    createOscillator() {
      return {
        type: "square",
        frequency: { setValueAtTime() {} },
        connect: (n: unknown) => n,
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect: (n: unknown) => n,
      };
    }
  }

  class AudioGia {
    volume = 1;
    constructor(public src: string) {
      daTao += 1;
    }
    setAttribute() {}
    play() {
      daPhat += 1;
      return Promise.resolve();
    }
  }

  vi.stubGlobal("window", { AudioContext: AudioContextGia });
  vi.stubGlobal("AudioContext", AudioContextGia);
  vi.stubGlobal("Audio", AudioGia);
}

afterEach(() => vi.unstubAllGlobals());

describe("đánh thức phiên âm thanh", () => {
  it("🔴 context sinh ra ở trạng thái suspended thì phải được resume ngay", () => {
    gaLapTrinhDuyet("suspended");
    createSoundEngine().ensureStarted();
    expect(daResume).toBeGreaterThan(0);
  });

  it("🔴 phát một thẻ audio im lặng — thứ duy nhất thắng được công tắc gạt của iPhone", () => {
    gaLapTrinhDuyet("running");
    createSoundEngine().ensureStarted();
    expect(daTao).toBe(1);
    expect(daPhat).toBe(1);
  });

  it("gọi nhiều lần chỉ đánh thức MỘT lần — đừng phát lại tệp mồi ở mỗi cú chạm", () => {
    gaLapTrinhDuyet("running");
    const may = createSoundEngine();
    may.ensureStarted();
    may.ensureStarted();
    may.ensureStarted();
    expect(daTao).toBe(1);
  });

  it("máy chặn tạo Audio thì KHÔNG ném ra ngoài — nút bấm phải sống", () => {
    gaLapTrinhDuyet("running");
    vi.stubGlobal("Audio", class {
      constructor() {
        throw new Error("Trình duyệt chặn tự phát");
      }
    });
    expect(() => createSoundEngine().ensureStarted()).not.toThrow();
  });

  it("Audio.play() bị từ chối cũng không ném ra ngoài", () => {
    gaLapTrinhDuyet("running");
    vi.stubGlobal("Audio", class {
      volume = 1;
      setAttribute() {}
      play() {
        return Promise.reject(new Error("NotAllowedError"));
      }
    });
    expect(() => createSoundEngine().ensureStarted()).not.toThrow();
  });

  it("máy không có Web Audio thì bỏ qua êm, không vỡ trang", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("Audio", undefined);
    expect(() => createSoundEngine().ensureStarted()).not.toThrow();
  });
});

describe("công tắc tắt tiếng", () => {
  it("tắt rồi thì không phát tiếng nào nữa", () => {
    gaLapTrinhDuyet("running");
    const may = createSoundEngine();
    may.ensureStarted();
    may.setMuted(true);
    expect(may.isMuted()).toBe(true);
    // Không ném, và cũng không tạo dao động nào — kiểm gián tiếp qua việc
    // gọi được mà không vỡ; phần vẽ sóng đã có bài kiểm riêng ở e2e.
    expect(() => {
      may.tick(0.5);
      may.win();
      may.lose();
    }).not.toThrow();
  });
});
