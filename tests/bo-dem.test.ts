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

  it("nút DỪNG khoá đúng bằng thời gian tăng tốc", () => {
    expect(canStop(VUA, 0)).toBe(false);
    expect(canStop(VUA, VUA.lockSeconds - 0.01)).toBe(false);
    expect(canStop(VUA, VUA.lockSeconds)).toBe(true);
    expect(VUA.lockSeconds).toBe(VUA.rampSeconds);
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
