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

describe("🔴 chưa đo xong độ lệch thì KHÔNG quy đổi mốc máy chủ", () => {
  /**
   * Đây là luật, không phải một dòng code: `doLechDongHo()` là bất đồng bộ, và
   * một tin quay tới TRƯỚC khi nó xong sẽ thấy `lech = 0`. Nếu coi số 0 đó là
   * một phép đo thật thì máy quầy lệch đồng hồ 30 giây với máy chủ sẽ làm vòng
   * đứng im nửa phút, hoặc nhảy thẳng tới đích. Cả hai màn (LCD và điện thoại)
   * đều phải giữ cờ "đã đo chưa" và lấy "bây giờ" làm gốc khi chưa đo.
   *
   * Bài kiểm dựng lại đúng phép tính hai component đang dùng.
   */
  function daTroi(daDo: boolean, lech: number, bayGio: number, batDauLuc: number): number {
    return daDo ? bayGio + lech - batDauLuc : 0;
  }

  it("chưa đo: daTroi = 0 dù đồng hồ hai máy lệch 30 giây", () => {
    expect(daTroi(false, 0, 1_000_000, 1_030_000)).toBe(0);
    expect(daTroi(false, 0, 1_000_000, 970_000)).toBe(0);
  });

  it("đã đo: daTroi phản ánh đúng phần ván đã chạy", () => {
    // Máy chủ chạy trước máy này 30 giây (lech = 30_000); ván mở lúc mốc máy chủ
    // 1_030_000, và bây giờ theo máy chủ là 1_032_000 ⇒ đã trôi 2 giây.
    expect(daTroi(true, 30_000, 1_002_000, 1_030_000)).toBe(2_000);
  });

  it("🔴 nếu TIN vào lech = 0 khi chưa đo thì sai bằng đúng độ lệch đồng hồ", () => {
    // Ca này chứng minh vì sao cờ `daDo` phải tồn tại: cùng dữ liệu, bỏ cờ đi
    // là ra −30 giây — vòng nhảy thẳng tới đích, người chơi không thấy gì cả.
    expect(daTroi(true, 0, 1_000_000, 1_030_000)).toBe(-30_000);
  });
});
