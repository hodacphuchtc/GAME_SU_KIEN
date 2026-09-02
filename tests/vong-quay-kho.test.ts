import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MAU_O_SAN } from "@/config/thuong-hieu";
import { phamViCua, type NguoiDung } from "@/lib/bao-ve/quyen";
import {
  danhSachChonSo,
  danhSachChuongTrinh,
  danhSachVongQuay,
  taoChuongTrinh,
  timTheoMa,
  timTheoMaChonSo,
  timTheoMaVongQuay,
} from "@/lib/chuong-trinh/kho";
import { coODay, danhSachO, phienBanO, suaO, themO, xoaO } from "@/lib/vong-quay/kho-o";
import { lichSuLuot } from "@/lib/vong-quay/kho-luot-quay";
import { chay } from "@/lib/db/truy-van";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * KHO DỮ LIỆU VÒNG QUAY — rủi ro **R2** của ADR-011.
 *
 * Ba game dùng chung bảng `chuong_trinh`. Một câu SQL quên `locTroChoi` thì màn
 * quản trị của game này hiện chương trình của game kia; quên `locPhamVi` thì
 * sale cơ sở này đọc được dữ liệu cơ sở khác. Cả hai hướng lệch đều KHÔNG sinh
 * ra một dòng lỗi nào — chỉ có bài kiểm này bắt được.
 */

let don: () => void;

const TOAN_HE_THONG: NguoiDung = { id: 1, vaiTro: "quan_tri", coSoId: null };

function taoBaGame(coSoId: number) {
  const ts = taoChuongTrinh({
    tenTrungTam: "Cơ sở thử",
    soTrung: 7,
    mucDo: "vua",
    tenGiaiThuong: "Quà A",
    tranGiaiMoiNgay: 0,
    coSoId,
    troChoi: "trung_so",
  });
  const cs = taoChuongTrinh({
    tenTrungTam: "Cơ sở thử",
    soTrung: 0,
    mucDo: "vua",
    tenGiaiThuong: "Quà B",
    tranGiaiMoiNgay: 0,
    coSoId,
    troChoi: "chon_so",
  });
  const vq = taoChuongTrinh({
    tenTrungTam: "Cơ sở thử",
    soTrung: 0,
    mucDo: "vua",
    tenGiaiThuong: "Quà C",
    tranGiaiMoiNgay: 0,
    coSoId,
    troChoi: "vong_quay",
  });
  return { ts, cs, vq };
}

beforeEach(() => {
  don = dungCsdlTam();
});

afterEach(() => {
  don();
});

describe("🔴 R2 — ba game KHÔNG nhìn thấy chương trình của nhau", () => {
  it("danhSachVongQuay chỉ trả chương trình vong_quay", () => {
    const { vq } = taoBaGame(coSoThu());
    const ds = danhSachVongQuay(phamViCua(TOAN_HE_THONG));
    expect(ds.map((c) => c.ma)).toEqual([vq.ma]);
    expect(ds[0].troChoi).toBe("vong_quay");
  });

  it("🔴 chương trình Vòng Quay KHÔNG lọt vào danh sách Trúng Số đang chạy thật ở quầy", () => {
    const { ts } = taoBaGame(coSoThu());
    expect(danhSachChuongTrinh(phamViCua(TOAN_HE_THONG)).map((c) => c.ma)).toEqual([ts.ma]);
  });

  it("chương trình Vòng Quay cũng không lọt vào danh sách Chọn Số", () => {
    const { cs } = taoBaGame(coSoThu());
    expect(danhSachChonSo(phamViCua(TOAN_HE_THONG)).map((c) => c.ma)).toEqual([cs.ma]);
  });

  it("timTheoMaVongQuay KHÔNG mở được mã của game khác, và ngược lại", () => {
    const { ts, cs, vq } = taoBaGame(coSoThu());
    const pv = phamViCua(TOAN_HE_THONG);
    expect(timTheoMaVongQuay(vq.ma, pv)?.ma).toBe(vq.ma);
    expect(timTheoMaVongQuay(ts.ma, pv)).toBeNull();
    expect(timTheoMaVongQuay(cs.ma, pv)).toBeNull();
    expect(timTheoMa(vq.ma, pv)).toBeNull();
    expect(timTheoMaChonSo(vq.ma, pv)).toBeNull();
  });

  it("🔴 sale của cơ sở KHÁC không đọc được chương trình Vòng Quay này", () => {
    const coSoA = coSoThu("Cơ sở A");
    const { vq } = taoBaGame(coSoA);
    const saleB: NguoiDung = { id: 2, vaiTro: "sale", coSoId: coSoThu("Cơ sở B") };
    expect(timTheoMaVongQuay(vq.ma, phamViCua(saleB))).toBeNull();
    expect(danhSachVongQuay(phamViCua(saleB))).toEqual([]);
  });

  it("mã chương trình Vòng Quay dài ĐÚNG 4 ký tự (R3 — app cũ dùng 5)", () => {
    const { vq } = taoBaGame(coSoThu());
    expect(vq.ma).toHaveLength(4);
  });

  // `ti_le_o_day` đã rời khỏi kiểu miền ngày 02/09/2026 (ADR-012) — cột còn nằm
  // trong CSDL nhưng không nơi nào đọc. Chỉ còn `phien_ban_o` đáng canh.
  it("chương trình mới nhận phien_ban_o = 1", () => {
    const { vq } = taoBaGame(coSoThu());
    expect(vq.phienBanO).toBe(1);
  });
});

describe("kho ô quà", () => {
  function chuongTrinhVongQuay() {
    return taoChuongTrinh({
      tenTrungTam: "Cơ sở thử",
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
      coSoId: coSoThu(),
      troChoi: "vong_quay",
    });
  }

  it("thêm ô rồi đọc lại đúng thứ tự, ô đáy nhận soLuong = null", () => {
    const ct = chuongTrinhVongQuay();
    themO(ct.id, { ten: "Balo", thuTu: 1, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
    themO(ct.id, { ten: "Sticker", thuTu: 0, soLuong: null, tiLeTrung: 0.5, mau: MAU_O_SAN[1] });
    const ds = danhSachO(ct.id);
    expect(ds.map((o) => o.ten)).toEqual(["Sticker", "Balo"]);
    expect(ds[0].soLuong).toBeNull();
    expect(coODay(ds)).toBe(true);
  });

  it("🔴 MỌI thay đổi danh sách ô đều tăng phiên bản — không tăng thì dựng lại ván ra vòng chưa từng tồn tại", () => {
    const ct = chuongTrinhVongQuay();
    expect(phienBanO(ct.id)).toBe(1);
    const oId = themO(ct.id, { ten: "Balo", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
    const sauThem = phienBanO(ct.id);
    expect(sauThem).toBeGreaterThan(1);
    suaO(ct.id, oId, { ten: "Balo mini", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
    const sauSua = phienBanO(ct.id);
    expect(sauSua).toBeGreaterThan(sauThem);
    xoaO(ct.id, oId);
    expect(phienBanO(ct.id)).toBeGreaterThan(sauSua);
  });

  it("🔴 KHÔNG xoá được ô đã trao — đó là chứng cứ đối soát khi phụ huynh khiếu nại", () => {
    const ct = chuongTrinhVongQuay();
    const oId = themO(ct.id, { ten: "Balo", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
    chay(
      `insert into luot_quay (chuong_trinh_id, o_qua_id, ngay, hat_giong, goc_dung,
                              phien_ban_o, bat_dau_luc)
       values (?, ?, '2026-09-02', 'hg', 12.5, 1, ?)`,
      ct.id,
      oId,
      Date.now(),
    );
    expect(xoaO(ct.id, oId)).toBe(false);
    expect(danhSachO(ct.id)).toHaveLength(1);
  });

  it("ô của chương trình khác không lẫn sang", () => {
    const a = chuongTrinhVongQuay();
    const b = chuongTrinhVongQuay();
    themO(a.id, { ten: "Của A", thuTu: 0, soLuong: 1, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
    expect(danhSachO(b.id)).toEqual([]);
  });

  it("phienBanO NÉM khi chương trình không tồn tại (layMot trả undefined, không phải null)", () => {
    expect(() => phienBanO(999_999)).toThrow();
  });
});

describe("🔴 R6 — sổ lịch sử đọc ẢNH CHỤP tên ô, không join sang danh mục hiện tại", () => {
  it("đổi tên ô KHÔNG làm đổi tên trong lịch sử đã ghi", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở thử",
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
      coSoId: coSoThu(),
      troChoi: "vong_quay",
    });
    const oId = themO(ct.id, { ten: "Balo", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });

    // Lượt được ghi KÈM ảnh chụp tên ô tại thời điểm đó.
    chay(
      `insert into luot_quay (chuong_trinh_id, o_qua_id, ngay, hat_giong, goc_dung,
                              phien_ban_o, o_ten, o_mau, bat_dau_luc)
       values (?, ?, '2026-09-02', 'hg', 12.5, 1, 'Balo', ?, ?)`,
      ct.id,
      oId,
      MAU_O_SAN[0],
      Date.now(),
    );

    suaO(ct.id, oId, { ten: "Balo mini", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });

    // Danh mục đã đổi…
    expect(danhSachO(ct.id)[0].ten).toBe("Balo mini");
    // …nhưng sổ đối soát vẫn nói đúng thứ đã trao hôm đó.
    expect(lichSuLuot(ct.id)[0].oTen).toBe("Balo");
  });

  it("dòng CŨ chưa có ảnh chụp thì lùi về tên hiện tại, không để trống", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở thử",
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
      coSoId: coSoThu(),
      troChoi: "vong_quay",
    });
    const oId = themO(ct.id, { ten: "Balo", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
    chay(
      `insert into luot_quay (chuong_trinh_id, o_qua_id, ngay, hat_giong, goc_dung,
                              phien_ban_o, bat_dau_luc)
       values (?, ?, '2026-09-02', 'hg', 12.5, 1, ?)`,
      ct.id,
      oId,
      Date.now(),
    );
    expect(lichSuLuot(ct.id)[0].oTen).toBe("Balo");
  });
});

describe("🔴 R6 — bản xuất Excel cũng phải đọc ẢNH CHỤP", () => {
  it("đổi tên ô KHÔNG làm đổi tên trong file đối soát", async () => {
    const { toanBoLichSuQuay } = await import("@/lib/vong-quay/kho-luot-quay");
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở thử",
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
      coSoId: coSoThu(),
      troChoi: "vong_quay",
    });
    const oId = themO(ct.id, { ten: "Balo", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
    chay(
      `insert into luot_quay (chuong_trinh_id, o_qua_id, ngay, hat_giong, goc_dung,
                              phien_ban_o, o_ten, o_mau, bat_dau_luc)
       values (?, ?, '2026-09-02', 'hg', 12.5, 1, 'Balo', ?, ?)`,
      ct.id,
      oId,
      MAU_O_SAN[0],
      Date.now(),
    );

    suaO(ct.id, oId, { ten: "Balo mini", thuTu: 0, soLuong: 5, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });

    // Đây chính là file đội sale mang đi đối soát với phụ huynh — nó phải nói
    // đúng thứ đã trao hôm đó, không phải tên trong danh mục hôm nay.
    expect(toanBoLichSuQuay(ct.id)[0].oTen).toBe("Balo");
  });
});
