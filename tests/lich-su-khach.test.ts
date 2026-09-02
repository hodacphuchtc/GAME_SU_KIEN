import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { taoCoSo } from "@/lib/co-so/kho";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { chay, layMot } from "@/lib/db/truy-van";
import { sinhLead } from "@/lib/lead/kho";
import { hoSoKhach, lichSuChoiCuaKhach, soThayDoi } from "@/lib/lead/lich-su-khach";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * HỒ SƠ MỘT KHÁCH XUYÊN BA GAME.
 *
 * 🔴 Ba game ghi vào HAI bảng khác nhau (`van_choi` cho Trúng Số + Chọn Số,
 * `luot_quay` cho Vòng Quay). Câu hỏi "khách này đã chơi những game nào" KHÔNG
 * trả lời được từ `khach_tiem_nang.chuong_trinh_id_dau` — cột đó chỉ ghi game
 * ĐẦU TIÊN và không bao giờ cập nhật.
 */

let don: () => void;
let cs1: number;
let cs2: number;

const TOAN_HE_THONG = phamViCua({ id: 1, vaiTro: "quan_tri", coSoId: null });

beforeEach(() => {
  don = dungCsdlTam();
  cs1 = taoCoSo({ ten: "Cơ sở 1" }).id;
  cs2 = taoCoSo({ ten: "Cơ sở 2" }).id;
});
afterEach(() => don());

function ct(coSoId: number, troChoi: "trung_so" | "chon_so" | "vong_quay", ten: string) {
  return taoChuongTrinh({
    tenTrungTam: "Cơ sở thử",
    coSoId,
    soTrung: 7,
    mucDo: "vua",
    tenGiaiThuong: ten,
    tranGiaiMoiNgay: 0,
    troChoi,
  });
}

function ghiVan(chuongTrinhId: number, nguoiChoiId: number, coSoId: number, trung: number) {
  const luc = Date.now();
  chay(
    `insert into van_choi (chuong_trinh_id, nguoi_choi_id, co_so_id, ngay, so_lan_cho_phep,
       so_lan_da_dung, trung, ma_xac_thuc, bat_dau_luc, ket_thuc_luc, tao_luc, sua_luc)
     values (?, ?, ?, '2026-09-02', 1, 1, ?, 'K7M2', ?, ?, ?, ?)`,
    chuongTrinhId, nguoiChoiId, coSoId, trung, luc, luc, luc, luc,
  );
}

function ghiQuay(chuongTrinhId: number, nguoiChoiId: number, oTen: string) {
  chay(
    `insert into luot_quay (chuong_trinh_id, nguoi_choi_id, ngay, hat_giong, goc_dung,
       phien_ban_o, o_ten, ma_xac_thuc, bat_dau_luc)
     values (?, ?, '2026-09-02', 'hg', 12.5, 1, ?, 'AB12', ?)`,
    chuongTrinhId, nguoiChoiId, oTen, Date.now() + 1000,
  );
}

describe("gộp lịch sử ba game", () => {
  it("🔴 một khách chơi CẢ BA game hiện đủ ba dòng", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs1, nc.id, null);
    ghiVan(ct(cs1, "trung_so", "Đợt Trúng Số").id, nc.id, cs1, 1);
    ghiVan(ct(cs1, "chon_so", "Đợt Chọn Số").id, nc.id, cs1, 0);
    ghiQuay(ct(cs1, "vong_quay", "Đợt Vòng Quay").id, nc.id, "Balo");

    const ds = lichSuChoiCuaKhach(nc.id, TOAN_HE_THONG);
    expect(ds).toHaveLength(3);
    expect(new Set(ds.map((d) => d.troChoi))).toEqual(
      new Set(["trung_so", "chon_so", "vong_quay"]),
    );
  });

  it("mới nhất trước", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs1, nc.id, null);
    ghiVan(ct(cs1, "trung_so", "A").id, nc.id, cs1, 1);
    ghiQuay(ct(cs1, "vong_quay", "B").id, nc.id, "Balo");
    const ds = lichSuChoiCuaKhach(nc.id, TOAN_HE_THONG);
    expect(ds[0].troChoi).toBe("vong_quay");
  });

  it("ván KHÔNG trúng thì phần quà rỗng; vòng quay luôn có quà", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs1, nc.id, null);
    ghiVan(ct(cs1, "trung_so", "Balo STEM").id, nc.id, cs1, 0);
    ghiQuay(ct(cs1, "vong_quay", "Đợt VQ").id, nc.id, "Bút chì");
    const ds = lichSuChoiCuaKhach(nc.id, TOAN_HE_THONG);
    expect(ds.find((d) => d.troChoi === "trung_so")!.phanQua).toBeNull();
    expect(ds.find((d) => d.troChoi === "vong_quay")!.phanQua).toBe("Bút chì");
  });

  it("🔴 sale cơ sở A KHÔNG đọc được ván khách chơi ở cơ sở B", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs1, nc.id, null);
    sinhLead(cs2, nc.id, null);
    ghiVan(ct(cs1, "trung_so", "Ở cơ sở 1").id, nc.id, cs1, 1);
    ghiQuay(ct(cs2, "vong_quay", "Ở cơ sở 2").id, nc.id, "Balo");

    const saleCs1 = phamViCua({ id: 2, vaiTro: "sale", coSoId: cs1 });
    const ds = lichSuChoiCuaKhach(nc.id, saleCs1);
    expect(ds).toHaveLength(1);
    expect(ds[0].tenDot).toBe("Ở cơ sở 1");
  });
});

describe("hồ sơ khách + phân quyền", () => {
  it("🔴 sale cơ sở KHÁC không mở được hồ sơ", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs1, nc.id, null);
    expect(hoSoKhach(nc.id, TOAN_HE_THONG)?.hoTen).toBe("Nguyễn Thị Hoa");
    expect(hoSoKhach(nc.id, phamViCua({ id: 2, vaiTro: "sale", coSoId: cs2 }))).toBeNull();
  });

  it("khách chưa có lead nào thì không có hồ sơ để mở", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    expect(hoSoKhach(nc.id, TOAN_HE_THONG)).toBeNull();
  });

  it("hồ sơ giữ nguyên cờ đồng ý tư vấn", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs1, nc.id, null);
    expect(hoSoKhach(nc.id, TOAN_HE_THONG)!.dongYTuVan).toBe(true);
  });
});

describe("sổ thay đổi hiện trên hồ sơ", () => {
  it("đổi tên hai lần thì sổ có hai dòng, mới nhất TRƯỚC", () => {
    nhanDien("Hoa", "0912345678", true);
    nhanDien("Thị Hoa", "0912345678", true);
    nhanDien("Nguyễn Thị Hoa", "0912345678", true);
    const id = layMot<{ id: number }>("select id from nguoi_choi")!.id;
    const ds = soThayDoi(id);
    expect(ds).toHaveLength(2);
    expect(ds[0].giaTriMoi).toBe("Nguyễn Thị Hoa");
    expect(ds[1].giaTriMoi).toBe("Thị Hoa");
  });
});
