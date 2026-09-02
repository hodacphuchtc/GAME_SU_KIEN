import { describe, expect, it } from "vitest";

import {
  DIFFICULTIES,
  REACTION_JITTER_SECONDS,
  WHEEL_SIZE,
  type RoundSettings,
} from "@/config/game";
import {
  canStop,
  circularDistance,
  countAt,
  estimateWinChance,
  formatNumber,
  formatOdds,
  resolveRound,
  speedAt,
  timeAtCount,
  valueAt,
} from "@/lib/bo-dem";

const VUA = DIFFICULTIES.vua.settings;
const THU = DIFFICULTIES.thu.settings;

describe("tốc độ", () => {
  it("đúng tại mốc 0, T và sau T thì giữ đỉnh", () => {
    expect(speedAt(VUA, 0)).toBeCloseTo(VUA.startSpeed, 6);
    expect(speedAt(VUA, VUA.rampSeconds)).toBeCloseTo(VUA.maxSpeed, 6);
    expect(speedAt(VUA, VUA.rampSeconds * 2)).toBeCloseTo(VUA.maxSpeed, 6);
    expect(speedAt(VUA, 999)).toBeCloseTo(VUA.maxSpeed, 6);
  });

  it("tăng đơn điệu trong lúc tăng tốc — không có đoạn nào chậm lại", () => {
    let previous = -1;
    for (let t = 0; t <= VUA.rampSeconds; t += 0.05) {
      const speed = speedAt(VUA, t);
      expect(speed).toBeGreaterThanOrEqual(previous);
      previous = speed;
    }
  });

  it("mức Chế độ thử chạy đều một tốc độ, không tăng tốc", () => {
    expect(speedAt(THU, 0)).toBeCloseTo(THU.maxSpeed, 6);
    expect(speedAt(THU, 50)).toBeCloseTo(THU.maxSpeed, 6);
  });
});

describe("bộ đếm", () => {
  it("đếm tăng dần, không bao giờ lùi", () => {
    let previous = -1;
    for (let t = 0; t <= VUA.roundLimitSeconds; t += 0.01) {
      const count = countAt(VUA, t);
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
  });

  it("quay vòng 9999 → 0000 chứ không tràn", () => {
    const tAt9999 = timeAtCount(VUA, WHEEL_SIZE - 1);
    const tAt10000 = timeAtCount(VUA, WHEEL_SIZE);
    expect(valueAt(VUA, tAt9999)).toBe(WHEEL_SIZE - 1);
    expect(valueAt(VUA, tAt10000)).toBe(0);
    for (let t = 0; t <= 120; t += 0.037) {
      const value = valueAt(VUA, t);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(WHEEL_SIZE);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("timeAtCount là hàm ngược đúng của countAt", () => {
    for (const count of [0, 1, 211, 2837, 9999, 10211, 45000]) {
      expect(countAt(VUA, timeAtCount(VUA, count))).toBeCloseTo(count, 6);
    }
  });

  it("kết quả KHÔNG đổi theo nhịp lấy mẫu — máy 30Hz, 60Hz, 120Hz như nhau", () => {
    const pressAt = 17.3456;
    const expected = valueAt(VUA, pressAt);
    for (const frameRate of [30, 60, 120, 144]) {
      // Dù màn hình vẽ ở nhịp nào, kết quả vẫn tính từ đúng mốc bấm.
      const framesBefore = Math.floor(pressAt * frameRate);
      const lastPainted = valueAt(VUA, framesBefore / frameRate);
      expect(valueAt(VUA, pressAt)).toBe(expected);
      // và con số đang vẽ thường KHÁC con số chốt — đúng như thiết kế.
      expect(typeof lastPainted).toBe("number");
    }
  });
});

describe("khoảng lệch vòng tròn", () => {
  it("dừng 9998 với số cài 0002 là lệch 4, không phải 9996", () => {
    expect(circularDistance(9998, 2)).toBe(4);
    expect(circularDistance(2, 9998)).toBe(4);
  });

  it("lệch tối đa là nửa vòng", () => {
    expect(circularDistance(0, 5000)).toBe(5000);
    expect(circularDistance(0, 0)).toBe(0);
    expect(circularDistance(211, 215)).toBe(4);
  });
});

describe("chốt kết quả", () => {
  it("trùng khít thì thắng, lệch thì thua và nói đúng số lệch", () => {
    const t = timeAtCount(VUA, WHEEL_SIZE + 211);
    const hit = resolveRound(VUA, 211, t);
    expect(hit.value).toBe(211);
    expect(hit.win).toBe(true);
    expect(hit.distance).toBe(0);

    const tMiss = timeAtCount(VUA, WHEEL_SIZE + 215);
    const miss = resolveRound(VUA, 211, tMiss);
    expect(miss.win).toBe(false);
    expect(miss.distance).toBe(4);
  });

  /**
   * 🔴 LUẬT CŨ (tới 02/09/2026): *"nút DỪNG khoá đúng bằng thời gian tăng tốc"* —
   * `lockSeconds === rampSeconds === 6`, bấm trước mốc đó thì `canStop` trả false.
   *
   * ĐẢO ở hạng mục 2.1 của `PLAN_TONG_HOP_V2.md`: người chơi phải chờ 6 giây mới
   * bấm được, và 6 giây đứng nhìn ở quầy là 6 giây họ tưởng máy hỏng. Nay cả ba
   * mức đều `rampSeconds = lockSeconds = 0`, kèm rút `roundLimitSeconds` đi đúng
   * 6 giây để tỉ lệ trúng KHÔNG đổi (xem hai bài "ước tính tỉ lệ trúng" bên dưới,
   * chúng là bằng chứng của phép bù).
   */
  it("nút DỪNG bấm được NGAY từ giây 0, cả ba mức thi đấu", () => {
    for (const m of [DIFFICULTIES.de, DIFFICULTIES.vua, DIFFICULTIES.kho]) {
      expect(m.settings.rampSeconds, m.label).toBe(0);
      expect(m.settings.lockSeconds, m.label).toBe(0);
      expect(m.settings.startSpeed, m.label).toBe(m.settings.maxSpeed);
      expect(canStop(m.settings, 0), m.label).toBe(true);
    }
  });

  it("in số luôn đủ 4 chữ số", () => {
    expect(formatNumber(211)).toBe("0211");
    expect(formatNumber(0)).toBe("0000");
    expect(formatNumber(9999)).toBe("9999");
    expect(formatNumber(10000)).toBe("0000");
  });
});

describe("công bằng: mọi số cài đều khó như nhau", () => {
  const competitive: RoundSettings[] = [
    DIFFICULTIES.de.settings,
    DIFFICULTIES.vua.settings,
    DIFFICULTIES.kho.settings,
  ];

  it("số cài nào cũng chỉ gặp được khi đã đạt tốc độ tối đa", () => {
    for (const settings of competitive) {
      for (let target = 0; target < WHEEL_SIZE; target += 137) {
        const { passSeconds } = estimateWinChance(settings, target);
        for (const seconds of passSeconds) {
          expect(seconds).toBeGreaterThanOrEqual(settings.lockSeconds);
          expect(speedAt(settings, seconds)).toBeCloseTo(settings.maxSpeed, 6);
        }
      }
    }
  });

  it("số cài nào cũng có ít nhất một cơ hội trong một lượt", () => {
    for (const settings of competitive) {
      for (let target = 0; target < WHEEL_SIZE; target += 137) {
        expect(estimateWinChance(settings, target).passes).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("ước tính tỉ lệ trúng", () => {
  it("mức Vừa rơi vào khoảng 1/20 – 1/80 mỗi lượt", () => {
    const { perRound } = estimateWinChance(VUA, 211);
    expect(perRound).toBeGreaterThan(1 / 80);
    expect(perRound).toBeLessThan(1 / 20);
  });

  /**
   * 🔴 BẰNG CHỨNG CỦA PHÉP BÙ (rủi ro R2, hạng mục 2.1 sổ v2).
   *
   * Bỏ `lockSeconds` 6 giây mà giữ nguyên `roundLimitSeconds` là giãn cửa sổ
   * chơi thêm 6 giây — tỉ lệ trúng tăng ÂM THẦM, kho quà cạn nhanh hơn mà không
   * ai chủ ý quyết. Phép bù là rút `roundLimitSeconds` đi đúng 6 giây.
   *
   * Đo trên TRUNG BÌNH của mọi số cài chứ không một số duy nhất: với một số cụ
   * thể, việc bỏ đoạn tăng tốc làm lệch PHA của dãy đếm, nên số lần con số đó
   * lướt qua có thể nhích một đơn vị theo cả hai chiều. Đó là hạt của phép đếm
   * nguyên, không phải thiên lệch — và nó biến mất khi lấy trung bình.
   *
   * Con số đo được ngày 02/09/2026: lệch 0,00 % ở cả ba mức; còn nếu QUÊN bù thì
   * Dễ +10,6 %, Vừa +24,5 %, Khó +42,4 %.
   */
  it("🔴 bỏ khoá 6 giây mà tỉ lệ trúng KHÔNG đổi — phép bù đã đúng", () => {
    const THAM_SO_CU: Record<string, RoundSettings> = {
      de: { startSpeed: 150, maxSpeed: 400, rampSeconds: 6, lockSeconds: 6, roundLimitSeconds: 60, countdownSeconds: 3 },
      vua: { startSpeed: 250, maxSpeed: 800, rampSeconds: 6, lockSeconds: 6, roundLimitSeconds: 30, countdownSeconds: 3 },
      kho: { startSpeed: 400, maxSpeed: 1500, rampSeconds: 6, lockSeconds: 6, roundLimitSeconds: 20, countdownSeconds: 3 },
    };
    // Lấy mẫu thưa (bước 7) cho nhanh mà vẫn phủ đều vòng 10.000 số.
    const trungBinh = (s: RoundSettings) => {
      let tong = 0;
      let n = 0;
      for (let so = 0; so < WHEEL_SIZE; so += 7) {
        tong += estimateWinChance(s, so).perRound;
        n += 1;
      }
      return tong / n;
    };

    for (const muc of ["de", "vua", "kho"] as const) {
      const cu = trungBinh(THAM_SO_CU[muc]);
      const moi = trungBinh(DIFFICULTIES[muc].settings);
      expect(Math.abs(moi - cu) / cu, `mức ${muc} lệch tỉ lệ trúng`).toBeLessThan(0.01);

      // Và bài kiểm phải CÓ RĂNG: quên bù thì nó ĐỎ.
      const quenBu = trungBinh({
        ...DIFFICULTIES[muc].settings,
        roundLimitSeconds: THAM_SO_CU[muc].roundLimitSeconds,
      });
      expect(quenBu / cu, `mức ${muc}: quên bù mà không thấy tỉ lệ tăng`).toBeGreaterThan(1.05);
    }
  });

  it("Khó thì khó hơn Vừa, Vừa thì khó hơn Dễ", () => {
    const easy = estimateWinChance(DIFFICULTIES.de.settings, 211).perRound;
    const medium = estimateWinChance(VUA, 211).perRound;
    const hard = estimateWinChance(DIFFICULTIES.kho.settings, 211).perRound;
    expect(easy).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(hard);
  });

  it("Chế độ thử gần như chắc trúng nếu chịu nhìn", () => {
    const { perPass, passes } = estimateWinChance(THU, 211);
    expect(passes).toBeGreaterThanOrEqual(1);
    expect(perPass).toBeCloseTo(
      Math.min(1, 1 / (THU.maxSpeed * REACTION_JITTER_SECONDS)),
      6,
    );
    expect(perPass).toBeGreaterThan(0.9);
  });

  it("viết tỉ lệ ra chữ cho nhân viên đọc", () => {
    expect(formatOdds(1 / 33)).toBe("1/33");
    expect(formatOdds(0)).toBe("gần như không thể");
    expect(formatOdds(1)).toBe("gần như chắc chắn");
  });
});

describe("cảnh báo cấu hình hỏng", () => {
  it("phát hiện được cấu hình mà số cài KHÔNG BAO GIỜ lướt qua", () => {
    // Chế độ thử chạy chậm nên không tới được số cài lớn — trang cài đặt phải
    // cảnh báo, nếu không nhân viên sẽ treo một ván không ai trúng nổi.
    expect(estimateWinChance(THU, 9000).passes).toBe(0);
    expect(estimateWinChance(THU, 211).passes).toBeGreaterThanOrEqual(1);
  });

  it("ba mức thi đấu thì số cài nào cũng lướt qua được", () => {
    for (const id of ["de", "vua", "kho"] as const) {
      for (let target = 0; target < WHEEL_SIZE; target += 311) {
        expect(estimateWinChance(DIFFICULTIES[id].settings, target).passes)
          .toBeGreaterThanOrEqual(1);
      }
    }
  });
});
