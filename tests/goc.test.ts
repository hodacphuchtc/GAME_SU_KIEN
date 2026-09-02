import { describe, expect, it } from "vitest";

import { GIAY_QUAY, VONG_TOI_THIEU } from "@/config/vong-quay";
import { bocGoc, chuanHoaGoc, goc, tongGocQuay } from "@/lib/vong-quay/goc";

describe("goc() — hàm thuần của thời gian", () => {
  it("xuất phát ở 0 và dừng đúng tổng góc đã định", () => {
    expect(goc(0, 137, GIAY_QUAY)).toBe(0);
    expect(goc(GIAY_QUAY, 137, GIAY_QUAY)).toBeCloseTo(tongGocQuay(137), 9);
  });

  it("góc dừng cuối cùng khớp đúng góc đích khi quy về [0,360)", () => {
    for (const gocDich of [0, 1, 89.5, 180, 271.3, 359.999]) {
      const cuoi = goc(GIAY_QUAY, gocDich, GIAY_QUAY);
      expect(chuanHoaGoc(cuoi)).toBeCloseTo(gocDich, 9);
    }
  });

  it("quay trọn ít nhất số vòng tối thiểu — phải trông như cú quay thật", () => {
    // Góc đích 0 là ca khắc nghiệt nhất: không có phần dư nào để che.
    expect(goc(GIAY_QUAY, 0, GIAY_QUAY)).toBeCloseTo(VONG_TOI_THIEU * 360, 9);
  });

  it("đơn điệu tăng — vòng không bao giờ giật lùi", () => {
    let truoc = -1;
    for (let i = 0; i <= 2000; i++) {
      const hienTai = goc((i / 2000) * GIAY_QUAY, 211, GIAY_QUAY);
      expect(hienTai).toBeGreaterThanOrEqual(truoc);
      truoc = hienTai;
    }
  });

  it("CHẬM DẦN — vận tốc mỗi đoạn phải nhỏ hơn đoạn trước", () => {
    const buoc = GIAY_QUAY / 200;
    let vanTocTruoc = Infinity;
    for (let i = 0; i < 200; i++) {
      const t = i * buoc;
      const v = goc(t + buoc, 211, GIAY_QUAY) - goc(t, 211, GIAY_QUAY);
      expect(v).toBeLessThanOrEqual(vanTocTruoc + 1e-9);
      vanTocTruoc = v;
    }
  });

  it("kẹp hai đầu: t âm và t quá hạn không cho ra giá trị lạ", () => {
    expect(goc(-5, 90, GIAY_QUAY)).toBe(0);
    expect(goc(999, 90, GIAY_QUAY)).toBeCloseTo(tongGocQuay(90), 9);
    // Thời lượng 0 hoặc âm ⇒ coi như đã xong, không chia cho 0.
    expect(goc(1, 90, 0)).toBeCloseTo(tongGocQuay(90), 9);
  });
});

describe("chuanHoaGoc()", () => {
  it("đưa mọi góc về [0,360), kể cả số âm và mấy nghìn độ", () => {
    expect(chuanHoaGoc(0)).toBe(0);
    expect(chuanHoaGoc(360)).toBe(0);
    expect(chuanHoaGoc(-90)).toBe(270);
    expect(chuanHoaGoc(VONG_TOI_THIEU * 360 + 137)).toBeCloseTo(137, 9);
  });
});

describe("bocGoc() — dựng lại được", () => {
  it("cùng hạt giống luôn cho cùng một góc", () => {
    for (const hat of ["a", "hat-giong-bat-ky", "9f3c1e", ""]) {
      expect(bocGoc(hat)).toBe(bocGoc(hat));
    }
  });

  it("hạt khác nhau thì góc khác nhau (không đụng nhau trên 10.000 hạt)", () => {
    const thay = new Set<number>();
    for (let i = 0; i < 10_000; i++) thay.add(bocGoc(`hat-${i}`));
    // Cho phép vài va chạm băm; quá nhiều là hàm băm hỏng.
    expect(thay.size).toBeGreaterThan(9_990);
  });

  it("luôn nằm trong [0,360)", () => {
    for (let i = 0; i < 10_000; i++) {
      const g = bocGoc(`hat-${i}`);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThan(360);
    }
  });

  it("rải ĐỀU quanh vòng — 36 rổ, không rổ nào lệch quá 25%", () => {
    const ro = new Array(36).fill(0);
    const n = 36_000;
    for (let i = 0; i < n; i++) ro[Math.floor(bocGoc(`hat-${i}`) / 10)]++;
    const kyVong = n / 36;
    for (const [i, dem] of ro.entries()) {
      expect(Math.abs(dem - kyVong) / kyVong, `rổ ${i}`).toBeLessThan(0.25);
    }
  });
});
