import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import { mucCanhBaoKho } from "@/lib/o-qua/canh-bao";
import { coODay, danhSachO, phienBanO, suaO, themO, xoaO } from "@/lib/o-qua/kho";
import { chiaCung, conPhatDuoc, type OQua } from "@/lib/vong-quay/chia-o";
import { ngayVN } from "@/lib/thoi-gian";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

/** Dựng một chương trình trống, trả id. */
function taoChuongTrinh(ma = "VQ1"): number {
  const gio = Date.now();
  const kq = csdl()
    .prepare("INSERT INTO chuong_trinh (ma, ten_co_so, tao_luc, sua_luc) VALUES (?, ?, ?, ?)")
    .run(ma, "Cơ sở thử", gio, gio);
  return Number(kq.lastInsertRowid);
}

/** Ghi N lượt đã trao ô này, để `da_trao` đếm được. */
function ghiDaTrao(ctId: number, oId: number, soLan: number, ngay = ngayVN()): void {
  const gio = Date.now();
  const db = csdl();
  for (let i = 0; i < soLan; i++) {
    db.prepare(
      `INSERT INTO luot_quay (chuong_trinh_id, o_qua_id, ngay, hat_giong, goc_dung,
                              phien_ban_o, bat_dau_luc)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(ctId, oId, ngay, `hat-${oId}-${i}`, 12.5, 1, gio);
  }
}

function o(soLuong: number | null, daTrao = 0, tranMoiNgay = 0, daTraoHomNay = 0): OQua {
  return { id: 1, ten: "X", thuTu: 1, soLuong, daTrao, tranMoiNgay, daTraoHomNay, mau: "#000" };
}

describe("conPhatDuoc — trần theo ngày", () => {
  it("chặn khi đã chạm trần hôm nay, dù kho vẫn còn hàng", () => {
    expect(conPhatDuoc(o(100, 5, 5, 5))).toBe(false);
    expect(conPhatDuoc(o(100, 5, 5, 4))).toBe(true);
  });

  it("🔴 trần theo ngày KHÔNG áp cho ô đáy — nếu không vòng thành rỗng", () => {
    expect(conPhatDuoc(o(null, 9999, 1, 9999))).toBe(true);
  });

  it("trần 0 nghĩa là không giới hạn theo ngày", () => {
    expect(conPhatDuoc(o(100, 50, 0, 50))).toBe(true);
  });
});

describe("Kho ô quà", () => {
  let don: () => void;
  let ctId: number;
  beforeEach(() => {
    don = dungCsdlTam();
    ctId = taoChuongTrinh();
  });
  afterEach(() => don());

  it("đếm da_trao TỪ bảng lượt quay, không từ bộ đếm lưu sẵn", () => {
    const oId = themO(ctId, { ten: "Balo", thuTu: 1, soLuong: 10, mau: "#6B21A8" });
    ghiDaTrao(ctId, oId, 3);
    const ds = danhSachO(ctId);
    expect(ds[0].daTrao).toBe(3);
    expect(ds[0].daTraoHomNay).toBe(3);
  });

  it("da_trao_hom_nay chỉ đếm HÔM NAY, không đếm hôm qua", () => {
    const oId = themO(ctId, { ten: "Balo", thuTu: 1, soLuong: 10, mau: "#6B21A8" });
    ghiDaTrao(ctId, oId, 2);
    ghiDaTrao(ctId, oId, 5, "2020-01-01");
    const ds = danhSachO(ctId);
    expect(ds[0].daTrao).toBe(7);
    expect(ds[0].daTraoHomNay).toBe(2);
  });

  it("🔴 thêm · sửa · xoá ô đều TĂNG phiên bản", () => {
    expect(phienBanO(ctId)).toBe(1);
    const oId = themO(ctId, { ten: "Balo", thuTu: 1, soLuong: 10, mau: "#6B21A8" });
    const sauThem = phienBanO(ctId);
    expect(sauThem).toBeGreaterThan(1);

    suaO(ctId, oId, { ten: "Balo to", thuTu: 1, soLuong: 5, mau: "#6B21A8" });
    const sauSua = phienBanO(ctId);
    expect(sauSua).toBeGreaterThan(sauThem);

    expect(xoaO(ctId, oId)).toBe(true);
    expect(phienBanO(ctId)).toBeGreaterThan(sauSua);
  });

  it("🔴 KHÔNG xoá được ô đã trao — đó là chứng cứ đối soát", () => {
    const oId = themO(ctId, { ten: "Balo", thuTu: 1, soLuong: 10, mau: "#6B21A8" });
    ghiDaTrao(ctId, oId, 1);
    const truoc = phienBanO(ctId);
    expect(xoaO(ctId, oId)).toBe(false);
    expect(danhSachO(ctId)).toHaveLength(1);
    // Từ chối thì cũng KHÔNG được tăng phiên bản — mặt vòng có đổi đâu.
    expect(phienBanO(ctId)).toBe(truoc);
  });

  it("coODay nhận ra kho thiếu ô đáy", () => {
    themO(ctId, { ten: "Balo", thuTu: 1, soLuong: 10, mau: "#6B21A8" });
    expect(coODay(danhSachO(ctId))).toBe(false);
    themO(ctId, { ten: "Sticker", thuTu: 9, soLuong: null, mau: "#6B6880" });
    expect(coODay(danhSachO(ctId))).toBe(true);
  });

  it("🔴 ô hết hàng biến khỏi vòng, các ô còn lại chia lại đủ 360°", () => {
    const balo = themO(ctId, { ten: "Balo", thuTu: 1, soLuong: 2, mau: "#6B21A8" });
    themO(ctId, { ten: "Bút", thuTu: 2, soLuong: 20, mau: "#F97316" });
    themO(ctId, { ten: "Sticker", thuTu: 9, soLuong: null, mau: "#6B6880" });

    expect(chiaCung(danhSachO(ctId)).map((c) => c.ten)).toContain("Balo");
    ghiDaTrao(ctId, balo, 2);
    const cung = chiaCung(danhSachO(ctId));
    expect(cung.map((c) => c.ten)).not.toContain("Balo");
    expect(cung.reduce((s, c) => s + c.doRong, 0)).toBeCloseTo(360, 9);
  });
});

describe("Cảnh báo kho", () => {
  it("kho chưa khai gì là XANH, không phải báo động", () => {
    expect(mucCanhBaoKho([]).muc).toBe("xanh");
  });

  it("mọi ô thật còn nhiều ⇒ XANH", () => {
    const kho = [o(100, 0), { ...o(null), id: 2 }];
    expect(mucCanhBaoKho(kho).muc).toBe("xanh");
  });

  it("🔴 kho NHỎ vẫn bật dải VÀNG — ca mà ngưỡng thuần tỉ lệ chết lặng", () => {
    // 20% của 4 là 0,8 — nhỏ hơn 1, nên tỉ lệ trần trụi KHÔNG BAO GIỜ chạm tới.
    // Còn 1 trên 4 thì đúng là sắp hết.
    const kho = [o(4, 3), { ...o(null), id: 2 }];
    const kq = mucCanhBaoKho(kho);
    expect(kq.muc).toBe("vang");
    expect(kq.sapHet).toHaveLength(1);
  });

  it("hết sạch ô thật ⇒ ĐỎ, nhưng người chơi vẫn nhận được quà an ủi", () => {
    const kho = [o(4, 4), { ...o(null), id: 2 }];
    const kq = mucCanhBaoKho(kho);
    expect(kq.muc).toBe("do");
    expect(kq.soOThat).toBe(0);
    expect(chiaCung(kho)).toHaveLength(1);
  });

  it("ô thật bị trần ngày chặn cũng tính là hết trên vòng hôm nay", () => {
    const kho = [o(100, 5, 5, 5), { ...o(null), id: 2 }];
    expect(mucCanhBaoKho(kho).muc).toBe("do");
  });
});
