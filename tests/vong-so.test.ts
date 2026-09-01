import { describe, expect, it } from "vitest";

import { GIAY_MOI_VONG, TOC_DO_TOI_DA, TOC_DO_TOI_THIEU } from "@/config/chon-so";
import { WHEEL_SIZE } from "@/config/game";
import { coDai, nhipCua, soTaiGiay, vongChay } from "@/lib/chon-so/vong-so";

/**
 * LÕI CỦA GAME CHỌN SỐ — thuần, không DOM, không CSDL.
 *
 * 🔴 Vì sao lõi phải thuần: LCD và điện thoại mỗi máy tự chạy dãy số của mình,
 * chỉ MỐC BẮT ĐẦU đi qua mạng. Hai máy chỉ hiện cùng một con số khi cả hai tính
 * bằng đúng một hàm của thời gian. Đây là bài học đã trả giá ở `bo-dem.ts`.
 */

const DAI = { tu: 1, den: 100 };

describe("vòng chạy", () => {
  it("dải 1→100 có đúng 100 số, tăng dần, không trùng", () => {
    const v = vongChay(DAI, new Set());
    expect(v).toHaveLength(100);
    expect(v[0]).toBe(1);
    expect(v[99]).toBe(100);
    expect(new Set(v).size).toBe(100);
  });

  it("coDai đếm CẢ HAI đầu — 1→100 là 100 số, không phải 99", () => {
    expect(coDai(DAI)).toBe(100);
    expect(coDai({ tu: 7, den: 7 })).toBe(1);
    expect(coDai({ tu: 0, den: 9999 })).toBe(WHEEL_SIZE);
  });

  it("🔴 số đã ra BIẾN MẤT khỏi vòng, không bị thay thầm bằng số khác", () => {
    const v = vongChay(DAI, new Set([42]));
    expect(v).toHaveLength(99);
    expect(v).not.toContain(42);
    // Hai số kề vẫn còn nguyên: vòng ngắn đi một chỗ, không xô lệch chỗ khác.
    expect(v).toContain(41);
    expect(v).toContain(43);
  });

  it("số đã ra NGOÀI dải không ảnh hưởng — dải vừa bị thu hẹp", () => {
    expect(vongChay({ tu: 1, den: 50 }, new Set([77]))).toHaveLength(50);
  });

  it("dải chỉ còn một số thì luôn ra đúng số đó", () => {
    const daRa = new Set(Array.from({ length: 99 }, (_, i) => i + 1));
    const v = vongChay(DAI, daRa);
    expect(v).toEqual([100]);
    for (const t of [0, 1.3, 3.7, 19]) {
      expect(soTaiGiay(nhipCua(DAI), v, t)).toBe(100);
    }
  });

  it("vòng rỗng khi mọi số đã ra — nơi gọi phải tự canh", () => {
    const daRa = new Set(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(vongChay(DAI, daRa)).toEqual([]);
  });
});

describe("số tại giây thứ t", () => {
  const nhip = nhipCua(DAI);
  const v = vongChay(DAI, new Set());

  it("🔴 là HÀM THUẦN của thời gian — cùng t luôn cho cùng số", () => {
    // Đây là điều kiện để LCD và điện thoại khớp nhau: hai máy có nhịp vẽ khác
    // nhau (30/60/120 Hz), nhưng cùng tính từ cùng một mốc thì ra cùng kết quả.
    for (const t of [0, 0.5, 2, 2.5, 7.31, 19.999]) {
      const lan1 = soTaiGiay(nhip, v, t);
      const lan2 = soTaiGiay(nhip, v, t);
      expect(lan2).toBe(lan1);
    }
  });

  it("mọi số trả về đều nằm TRONG vòng, kể cả khi vòng đã khuyết", () => {
    const vKhuyet = vongChay(DAI, new Set([1, 2, 3, 50, 99, 100]));
    for (let t = 0; t < 20; t += 0.017) {
      expect(vKhuyet).toContain(soTaiGiay(nhipCua(DAI), vKhuyet, t));
    }
  });

  it("chạy hết một vòng rồi quay lại đầu dải", () => {
    // Sau đúng một vòng kể từ một mốc bất kỳ ở đoạn tốc độ phẳng, số phải lặp.
    const tGoc = 10;
    const motVongGiay = coDai(DAI) / nhip.maxSpeed;
    expect(soTaiGiay(nhip, v, tGoc + motVongGiay)).toBe(soTaiGiay(nhip, v, tGoc));
  });

  it("số chạy tiến chứ không đứng im — trong một vòng gặp đủ mặt các số", () => {
    const gap = new Set<number>();
    for (let t = 5; t < 5 + coDai(DAI) / nhip.maxSpeed; t += 0.002) {
      gap.add(soTaiGiay(nhip, v, t));
    }
    // Lấy mẫu dày hơn nhịp đổi số thì phải gặp gần như trọn dải.
    expect(gap.size).toBeGreaterThan(90);
  });
});

describe("nhịp quay theo độ dài dải", () => {
  it("một vòng mất chừng GIAY_MOI_VONG giây với dải trung bình", () => {
    const motVong = coDai(DAI) / nhipCua(DAI).maxSpeed;
    expect(motVong).toBeCloseTo(GIAY_MOI_VONG, 5);
  });

  it("🔴 dải rất lớn bị kẹp tốc độ, không thành một vệt mờ", () => {
    expect(nhipCua({ tu: 0, den: 9999 }).maxSpeed).toBeLessThanOrEqual(TOC_DO_TOI_DA);
  });

  it("dải rất nhỏ vẫn quay đủ nhanh để ra dáng trò chơi", () => {
    expect(nhipCua({ tu: 1, den: 3 }).maxSpeed).toBeGreaterThanOrEqual(TOC_DO_TOI_THIEU);
  });

  it("khoá nút DỪNG đúng bằng thời gian tăng tốc — bấm sớm nhất là lúc vừa hết ramp", () => {
    const n = nhipCua(DAI);
    expect(n.lockSeconds).toBe(n.rampSeconds);
    expect(n.lockSeconds).toBeGreaterThan(0);
  });

  it("tốc độ xuất phát thấp hơn tốc độ tối đa — có cảm giác tăng tốc", () => {
    const n = nhipCua(DAI);
    expect(n.startSpeed).toBeLessThan(n.maxSpeed);
    expect(n.startSpeed).toBeGreaterThan(0);
  });
});
