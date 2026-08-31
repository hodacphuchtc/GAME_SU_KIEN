import { describe, expect, it } from "vitest";

import { tinhLech, type MauDo } from "@/lib/dong-bo/dong-ho";

describe("canh đồng hồ", () => {
  it("máy khách chạy sau máy chủ 5 giây thì lệch ra đúng +5000", () => {
    // Máy chủ nhanh hơn 5 giây; mỗi lượt đi–về mất 100ms.
    const cacMau: MauDo[] = [0, 1, 2].map((i) => ({
      gui: 1000 + i * 500,
      nhan: 1100 + i * 500,
      gioMayChu: 1050 + i * 500 + 5000,
    }));
    const kq = tinhLech(cacMau);
    expect(kq.lech).toBe(5000);
    expect(kq.rtt).toBe(100);
  });

  it("lấy TRUNG VỊ chứ không lấy trung bình — một lượt lệch không kéo cả kết quả", () => {
    const cacMau: MauDo[] = [
      { gui: 0, nhan: 100, gioMayChu: 1050 },
      { gui: 0, nhan: 100, gioMayChu: 1050 },
      { gui: 0, nhan: 100, gioMayChu: 9999 },
    ];
    expect(tinhLech(cacMau).lech).toBe(1000);
  });

  it("bỏ lượt đo có rtt bất thường — mạng 4G vấp là chuyện thường", () => {
    const cacMau: MauDo[] = [
      { gui: 0, nhan: 100, gioMayChu: 1050 }, // rtt 100, lệch 1000
      { gui: 0, nhan: 110, gioMayChu: 1055 }, // rtt 110, lệch 1000
      { gui: 0, nhan: 2000, gioMayChu: 3000 }, // rtt 2000 — vấp mạng, phải loại
    ];
    const kq = tinhLech(cacMau);
    expect(kq.soMauDung).toBe(2);
    expect(kq.lech).toBe(1000);
  });

  it("mọi lượt đều vấp thì vẫn phải trả ra con số, không được ném lỗi", () => {
    const kq = tinhLech([{ gui: 0, nhan: 3000, gioMayChu: 1500 }]);
    expect(kq.soMauDung).toBe(1);
    expect(Number.isFinite(kq.lech)).toBe(true);
  });

  it("không đo được lượt nào thì coi như không lệch", () => {
    expect(tinhLech([])).toEqual({ lech: 0, rtt: 0, soMauDung: 0 });
  });
});
