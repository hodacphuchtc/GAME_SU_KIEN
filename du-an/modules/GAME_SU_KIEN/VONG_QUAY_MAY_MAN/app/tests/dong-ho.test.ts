import { describe, expect, it } from "vitest";

import { tinhLech, type MauDo } from "@/lib/dong-bo/dong-ho";

/**
 * Đo độ lệch đồng hồ giữa màn LCD và điện thoại.
 *
 * Không canh được thì hai vòng quay chạy lệch nhịp thấy rõ — và cả sảnh nhìn
 * thấy điều đó cùng lúc.
 */
describe("tính lệch đồng hồ (Cristian)", () => {
  it("không có mẫu nào thì trả 0, không ném", () => {
    expect(tinhLech([])).toEqual({ lech: 0, rtt: 0, soMauDung: 0 });
  });

  it("máy chủ nhanh hơn 5 giây, mạng mất 100ms → lệch ≈ +5000", () => {
    // Gửi lúc 1000, nhận lúc 1100 (rtt = 100). Máy chủ trả 6050, tức là lúc
    // nhận nó đang ở 6050 + 50 = 6100, trong khi máy khách ở 1100 ⇒ lệch 5000.
    const mau: MauDo[] = [
      { gui: 1000, nhan: 1100, gioMayChu: 6050 },
      { gui: 2000, nhan: 2100, gioMayChu: 7050 },
      { gui: 3000, nhan: 3100, gioMayChu: 8050 },
    ];
    const kq = tinhLech(mau);
    expect(kq.lech).toBe(5000);
    expect(kq.rtt).toBe(100);
    expect(kq.soMauDung).toBe(3);
  });

  it("hai đồng hồ trùng nhau thì lệch ≈ 0", () => {
    const mau: MauDo[] = [
      { gui: 1000, nhan: 1040, gioMayChu: 1020 },
      { gui: 2000, nhan: 2040, gioMayChu: 2020 },
    ];
    expect(tinhLech(mau).lech).toBe(0);
  });

  it("🔴 BỎ lượt đo vấp mạng — một lượt chậm bất thường không được kéo lệch cả phép đo", () => {
    const mau: MauDo[] = [
      { gui: 1000, nhan: 1100, gioMayChu: 6050 }, // rtt 100, lệch 5000
      { gui: 2000, nhan: 2100, gioMayChu: 7050 }, // rtt 100, lệch 5000
      // Lượt vấp: rtt 3000ms. Nếu tính cả nó thì lệch bị kéo lệch hẳn.
      { gui: 3000, nhan: 6000, gioMayChu: 9000 },
    ];
    const kq = tinhLech(mau);
    expect(kq.soMauDung).toBe(2);
    expect(kq.lech).toBe(5000);
  });

  it("MỌI lượt đều chậm thì vẫn dùng, không trả rỗng", () => {
    // Thà một con số kém chính xác còn hơn không canh gì cả.
    const mau: MauDo[] = [
      { gui: 0, nhan: 3000, gioMayChu: 1500 },
      { gui: 0, nhan: 5000, gioMayChu: 2500 },
    ];
    expect(tinhLech(mau).soMauDung).toBeGreaterThan(0);
  });

  it("dùng TRUNG VỊ chứ không phải trung bình", () => {
    // Trung bình bị một giá trị lạc kéo đi; trung vị thì không.
    const mau: MauDo[] = [
      { gui: 0, nhan: 100, gioMayChu: 1050 },
      { gui: 0, nhan: 100, gioMayChu: 1050 },
      { gui: 0, nhan: 100, gioMayChu: 9999 },
    ];
    expect(tinhLech(mau).lech).toBe(1000);
  });
});
