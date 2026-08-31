import { describe, expect, it } from "vitest";

import {
  DEFAULT_CENTER_NAME,
  DEFAULT_DIFFICULTY,
  DEFAULT_PRIZE_NAME,
  DEFAULT_TARGET,
  DIFFICULTIES,
  LIMITS,
} from "@/config/game";
import {
  buildPlayUrl,
  clampSettings,
  parseGameConfig,
} from "@/lib/cau-hinh-url";

describe("đọc cấu hình từ URL", () => {
  it("URL trống thì rơi về mặc định an toàn", () => {
    const config = parseGameConfig("");
    expect(config.target).toBe(DEFAULT_TARGET);
    expect(config.difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(config.centerName).toBe(DEFAULT_CENTER_NAME);
    expect(config.prizeName).toBe(DEFAULT_PRIZE_NAME);
    expect(config.settings).toEqual(DIFFICULTIES[DEFAULT_DIFFICULTY].settings);
  });

  it("đọc đúng số cài có số 0 ở đầu và mức khó", () => {
    const config = parseGameConfig("so=0211&muc=kho&tt=Trung%20t%C3%A2m%20ABC&qua=Voucher");
    expect(config.target).toBe(211);
    expect(config.difficulty).toBe("kho");
    expect(config.centerName).toBe("Trung tâm ABC");
    expect(config.prizeName).toBe("Voucher");
  });

  it("giá trị rác không làm vỡ ván chơi", () => {
    expect(parseGameConfig("so=abc").target).toBe(DEFAULT_TARGET);
    expect(parseGameConfig("so=-5").target).toBe(9995);
    expect(parseGameConfig("so=12345").target).toBe(2345);
    expect(parseGameConfig("muc=khong-co-that").difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(parseGameConfig("tt=%20%20").centerName).toBe(DEFAULT_CENTER_NAME);
  });

  it("có tham số tuỳ chỉnh thì tự hiểu là mức Tuỳ chỉnh", () => {
    const config = parseGameConfig("vmax=333");
    expect(config.difficulty).toBe("custom");
    expect(config.settings.maxSpeed).toBe(333);
  });
});

describe("ép tham số về khoảng hợp lệ", () => {
  it("tốc độ xuất phát không được vượt tốc độ đỉnh", () => {
    const settings = clampSettings({
      startSpeed: 900,
      maxSpeed: 100,
      rampSeconds: 6,
      lockSeconds: 6,
      roundLimitSeconds: 30,
      countdownSeconds: 3,
    });
    expect(settings.startSpeed).toBeLessThanOrEqual(settings.maxSpeed);
  });

  it("khoá nút không được dài hơn cả lượt chơi, nếu không nút chẳng mở lần nào", () => {
    const settings = clampSettings({
      startSpeed: 250,
      maxSpeed: 800,
      rampSeconds: 6,
      lockSeconds: 25,
      roundLimitSeconds: 10,
      countdownSeconds: 3,
    });
    expect(settings.lockSeconds).toBeLessThanOrEqual(settings.roundLimitSeconds);
  });

  it("số quá lố bị kéo về biên", () => {
    const settings = clampSettings({
      startSpeed: -50,
      maxSpeed: 999999,
      rampSeconds: 500,
      lockSeconds: -3,
      roundLimitSeconds: 99999,
      countdownSeconds: 99,
    });
    expect(settings.maxSpeed).toBe(LIMITS.speed.max);
    expect(settings.startSpeed).toBe(LIMITS.speed.min);
    expect(settings.rampSeconds).toBe(LIMITS.rampSeconds.max);
    expect(settings.lockSeconds).toBe(LIMITS.lockSeconds.min);
    expect(settings.roundLimitSeconds).toBe(LIMITS.roundLimitSeconds.max);
    expect(settings.countdownSeconds).toBe(LIMITS.countdownSeconds.max);
  });
});

describe("đường dẫn in ra mã QR", () => {
  it("dựng rồi đọc lại phải ra đúng cấu hình ban đầu", () => {
    const original = {
      target: 7042,
      difficulty: "custom" as const,
      settings: clampSettings({
        startSpeed: 120,
        maxSpeed: 640,
        rampSeconds: 4,
        lockSeconds: 4,
        roundLimitSeconds: 25,
        countdownSeconds: 2,
      }),
      centerName: "Trung tâm Hoa Mai",
      prizeName: "Balo",
    };
    const url = buildPlayUrl("https://vi-du.vn/", original);
    const query = url.slice(url.indexOf("?") + 1);
    expect(parseGameConfig(query)).toEqual(original);
    expect(url.startsWith("https://vi-du.vn/?")).toBe(true);
  });

  it("mức có sẵn thì URL gọn, không nhét tham số thừa cho mã QR đỡ rối", () => {
    const url = buildPlayUrl("https://vi-du.vn", {
      target: 211,
      difficulty: "vua",
      settings: DIFFICULTIES.vua.settings,
      centerName: DEFAULT_CENTER_NAME,
      prizeName: DEFAULT_PRIZE_NAME,
    });
    expect(url).toBe("https://vi-du.vn/?so=0211&muc=vua");
  });
});
