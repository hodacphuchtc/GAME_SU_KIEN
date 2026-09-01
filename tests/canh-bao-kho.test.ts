import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NGUONG_CANH_BAO_KHO } from "@/config/to-chuc";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { layMot, layNhieu } from "@/lib/db/truy-van";
import { mucCanhBaoKho } from "@/lib/qua/canh-bao";
import type { LoaiQua } from "@/lib/qua/chon-qua";
import { canhBaoKho, ghiNhatKyNguongKho, themQua } from "@/lib/qua/kho-qua";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * BA KÊNH CẢNH BÁO KHO (GĐ 13.2 · Đ14).
 *
 * Cả ba kênh đọc từ ĐÚNG MỘT hàm thuần `mucCanhBaoKho`. Bài test canh chính hàm
 * đó, cộng với luật "nhật ký ghi một lần mỗi ngưỡng mỗi ngày" — thứ mà nếu sai
 * thì nhật ký thành rác chỉ trong một buổi chiều.
 */

function q(p: Partial<LoaiQua> & { id: number }): LoaiQua {
  return {
    ten: `Quà ${p.id}`,
    thuTu: p.id,
    soLuong: 100,
    tranMoiNgay: 0,
    daTrao: 0,
    daTraoHomNay: 0,
    ...p,
  };
}

describe("mucCanhBaoKho — hàm thuần", () => {
  it("ngưỡng vàng bật khi còn đúng 20%", () => {
    // 20 cái, ngưỡng 0,2 ⇒ vàng khi còn ≤ 4.
    const mocVang = 20 * NGUONG_CANH_BAO_KHO;
    expect(mucCanhBaoKho([q({ id: 1, soLuong: 20, daTrao: 20 - mocVang - 1 })]).muc).toBe("xanh");
    expect(mucCanhBaoKho([q({ id: 1, soLuong: 20, daTrao: 20 - mocVang })]).muc).toBe("vang");
  });

  it("dải vàng nói rõ còn mấy trên mấy, của loại nào", () => {
    const kq = mucCanhBaoKho([q({ id: 1, ten: "Balo STEM", soLuong: 20, daTrao: 18 })]);
    expect(kq.muc).toBe("vang");
    expect(kq.conLai).toBe(2);
    expect(kq.tong).toBe(20);
    expect(kq.loaiDangTrao?.ten).toBe("Balo STEM");
  });

  it("đỏ khi loại đang trao là loại đáy", () => {
    const kq = mucCanhBaoKho([
      q({ id: 1, thuTu: 0, soLuong: 2, daTrao: 2 }),
      q({ id: 2, thuTu: 1, ten: "Buổi học thử", soLuong: null }),
    ]);
    expect(kq.muc).toBe("do");
    expect(kq.loaiDangTrao?.ten).toBe("Buổi học thử");
  });

  it("đỏ khi kho cạn sạch — và phân biệt được với ca tụt đáy", () => {
    const kq = mucCanhBaoKho([q({ id: 1, soLuong: 2, daTrao: 2 })]);
    expect(kq.muc).toBe("do");
    // `loaiDangTrao === null` là dấu hiệu để dải nói "KHO ĐÃ CẠN" thay vì
    // "đang trao loại đáy" — hai chuyện khác hẳn nhau với người đọc.
    expect(kq.loaiDangTrao).toBeNull();
  });

  it("không ghi cảnh báo khi chưa khai kho — đó là trạng thái bình thường của v1", () => {
    expect(mucCanhBaoKho([]).muc).toBe("xanh");
  });

  it("kho còn nhiều thì xanh, không doạ người dùng vô cớ", () => {
    expect(mucCanhBaoKho([q({ id: 1, soLuong: 100, daTrao: 3 })]).muc).toBe("xanh");
  });

  /**
   * 🔴 VẾT SẸO 01/09 — lộ ra khi bấm thử trên trình duyệt, 215 test đều xanh.
   *
   * Ngưỡng thuần tỉ lệ chết lặng với kho nhỏ: 20% của 4 là 0,8, mà tồn thì luôn
   * là số nguyên ≥ 1, nên loại còn 1 cái nhảy thẳng từ xanh sang đỏ và cảnh báo
   * vàng chưa từng bật lần nào. Quản lý mất đúng cái khoảng thời gian mà dải
   * vàng sinh ra để cho họ.
   */
  it("🔴 kho NHỎ vẫn cảnh báo được: còn đúng 1 cái luôn là vàng", () => {
    for (const tong of [1, 2, 3, 4]) {
      expect(
        mucCanhBaoKho([q({ id: 1, soLuong: tong, daTrao: tong - 1 })]).muc,
        `kho ${tong} cái, còn 1`,
      ).toBe("vang");
    }
  });

  it("kho nhỏ còn NGUYÊN thì vẫn xanh — trừ khi tổng đúng bằng 1", () => {
    expect(mucCanhBaoKho([q({ id: 1, soLuong: 4, daTrao: 0 })]).muc).toBe("xanh");
    // Tổng bằng 1 thì "còn nguyên" cũng chính là "còn 1 cái cuối".
    expect(mucCanhBaoKho([q({ id: 1, soLuong: 1, daTrao: 0 })]).muc).toBe("vang");
  });
});

describe("nhật ký ngưỡng", () => {
  let don: () => void;
  let ctId: number;

  beforeEach(() => {
    don = dungCsdlTam();
    ctId = taoChuongTrinh({
      tenTrungTam: "Trung tâm thử",
      coSoId: coSoThu("Trung tâm thử"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Balo STEM",
      tranGiaiMoiNgay: 0,
    }).id;
  });
  afterEach(() => don());

  const demNhatKy = () =>
    layMot<{ so: number }>(
      "select count(*) as so from nhat_ky_truy_cap where hanh_dong = 'canh_bao_kho'",
    )!.so;

  it("không ghi nhật ký khi chưa chạm ngưỡng", () => {
    expect(ghiNhatKyNguongKho(ctId, "xanh")).toBe(false);
    expect(demNhatKy()).toBe(0);
  });

  it("nhật ký ghi một lần mỗi ngưỡng mỗi ngày", () => {
    expect(ghiNhatKyNguongKho(ctId, "vang", "2026-09-01")).toBe(true);
    expect(ghiNhatKyNguongKho(ctId, "vang", "2026-09-01")).toBe(false);
    expect(ghiNhatKyNguongKho(ctId, "vang", "2026-09-01")).toBe(false);
    expect(demNhatKy()).toBe(1);
  });

  it("hai ngưỡng khác nhau trong cùng ngày thì ghi hai dòng", () => {
    ghiNhatKyNguongKho(ctId, "vang", "2026-09-01");
    expect(ghiNhatKyNguongKho(ctId, "do", "2026-09-01")).toBe(true);
    expect(demNhatKy()).toBe(2);
  });

  it("sang ngày mới thì ghi lại — quản lý cần biết hôm nay cũng đang thiếu", () => {
    ghiNhatKyNguongKho(ctId, "vang", "2026-09-01");
    expect(ghiNhatKyNguongKho(ctId, "vang", "2026-09-02")).toBe(true);
    expect(demNhatKy()).toBe(2);
  });

  it("hai chương trình khác nhau đếm riêng", () => {
    const ct2 = taoChuongTrinh({
      tenTrungTam: "Trung tâm hai",
      coSoId: coSoThu("Trung tâm hai"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Balo STEM",
      tranGiaiMoiNgay: 0,
    }).id;
    ghiNhatKyNguongKho(ctId, "do", "2026-09-01");
    expect(ghiNhatKyNguongKho(ct2, "do", "2026-09-01")).toBe(true);
    expect(layNhieu("select id from nhat_ky_truy_cap")).toHaveLength(2);
  });
});

describe("canhBaoKho đọc từ kho thật", () => {
  let don: () => void;
  let ctId: number;

  beforeEach(() => {
    don = dungCsdlTam();
    ctId = taoChuongTrinh({
      tenTrungTam: "Trung tâm thử",
      coSoId: coSoThu("Trung tâm thử"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Balo STEM",
      tranGiaiMoiNgay: 0,
    }).id;
  });
  afterEach(() => don());

  it("khai kho đầy thì xanh, khai kho chỉ còn loại đáy thì đỏ", () => {
    themQua(ctId, { ten: "Balo STEM", thuTu: 0, soLuong: 50, tranMoiNgay: 0, giaTri: null });
    expect(canhBaoKho(ctId).muc).toBe("xanh");

    themQua(ctId, { ten: "Buổi học thử", thuTu: 1, soLuong: null, tranMoiNgay: 0, giaTri: null });
    expect(canhBaoKho(ctId).muc).toBe("xanh");
  });

  it("kho chỉ có mỗi loại đáy thì đỏ ngay từ đầu — tiền quà đang chảy đường rẻ nhất", () => {
    themQua(ctId, { ten: "Buổi học thử", thuTu: 0, soLuong: null, tranMoiNgay: 0, giaTri: null });
    expect(canhBaoKho(ctId).muc).toBe("do");
  });
});
