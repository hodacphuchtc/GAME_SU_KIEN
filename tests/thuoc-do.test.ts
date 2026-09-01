import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { datGhiDanh, thongKeGhiDanh } from "@/lib/luot/kho-luot";
import { thangVietNam } from "@/lib/db/thoi-gian";
import { coSoThu } from "./ho-tro/co-so-thu";
import { ghiVanDaChot } from "./ho-tro/van-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * THƯỚC ĐO DUY NHẤT đáng nhìn: bao nhiêu phụ huynh để lại số, bao nhiêu người
 * trong đó thành học viên. Không có con số này thì mọi số liệu khác chỉ là số
 * lượt chơi — mà lượt chơi thì không trả tiền cho ai.
 *
 * Đếm theo NGƯỜI, không theo lượt: một phụ huynh chơi 5 ngày vẫn là MỘT khách.
 */

let don: () => void;
let ctId: number;

/** Một VÁN đã chốt trong ngày cho trước. Thước đo đếm theo ván, không theo lượt. */
function ghiVan(nguoiChoiId: number | null, ngay: string): number {
  return ghiVanDaChot({ chuongTrinhId: ctId, nguoiChoiId, ngay });
}

function taoNguoiChoi(sdt: string): number {
  const db = csdl();
  db.prepare(
    "insert into nguoi_choi (so_dien_thoai, ho_ten, tao_luc, sua_luc) values (?, ?, ?, ?)",
  ).run(sdt, "Phụ huynh " + sdt, Date.now(), Date.now());
  return Number(db.prepare("select last_insert_rowid() as id").get()!.id);
}

beforeEach(() => {
  don = dungCsdlTam();
  ctId = taoChuongTrinh({
    tenTrungTam: "Trung tâm thử",
    coSoId: coSoThu("Trung tâm thử"),
    soTrung: 114,
    mucDo: "vua",
    tenGiaiThuong: "Balo STEM",
    tranGiaiMoiNgay: 0,
  }).id;
});

afterEach(() => don());

describe("thangVietNam", () => {
  it("cho ra YYYY-MM theo giờ Việt Nam", () => {
    expect(thangVietNam(new Date("2026-09-01T01:00:00Z"))).toBe("2026-09");
  });

  it("22h30 ngày cuối tháng theo giờ UTC vẫn là tháng sau ở Việt Nam", () => {
    // 2026-08-31T17:30:00Z = 00:30 ngày 01/09 giờ Việt Nam.
    expect(thangVietNam(new Date("2026-08-31T17:30:00Z"))).toBe("2026-09");
  });
});

describe("thongKeGhiDanh", () => {
  const thang = "2026-09";

  it("đếm đúng số khách để lại số trong tháng", () => {
    ghiVan(taoNguoiChoi("0900000001"), "2026-09-01");
    ghiVan(taoNguoiChoi("0900000002"), "2026-09-15");
    expect(thongKeGhiDanh(thang)).toEqual({ soKhach: 2, soGhiDanh: 0 });
  });

  it("🔴 một khách chơi nhiều ngày vẫn tính LÀ MỘT", () => {
    const a = taoNguoiChoi("0900000001");
    ghiVan(a, "2026-09-01");
    ghiVan(a, "2026-09-02");
    ghiVan(a, "2026-09-03");
    expect(thongKeGhiDanh(thang).soKhach).toBe(1);
  });

  it("🔴 ván ẩn danh không tính vào mẫu số", () => {
    ghiVan(null, "2026-09-01");
    ghiVan(taoNguoiChoi("0900000001"), "2026-09-01");
    expect(thongKeGhiDanh(thang).soKhach).toBe(1);
  });

  it("không đếm ván của tháng khác", () => {
    ghiVan(taoNguoiChoi("0900000001"), "2026-08-31");
    expect(thongKeGhiDanh(thang).soKhach).toBe(0);
  });

  it("đếm được người đã ghi danh", () => {
    const a = taoNguoiChoi("0900000001");
    const van = ghiVan(a, "2026-09-01");
    ghiVan(taoNguoiChoi("0900000002"), "2026-09-02");
    datGhiDanh(van, true);
    expect(thongKeGhiDanh(thang)).toEqual({ soKhach: 2, soGhiDanh: 1 });
  });

  it("🔴 tích ghi danh hai VÁN của cùng một khách không cộng thành hai", () => {
    const a = taoNguoiChoi("0900000001");
    const v1 = ghiVan(a, "2026-09-01");
    const v2 = ghiVan(a, "2026-09-02");
    datGhiDanh(v1, true);
    datGhiDanh(v2, true);
    expect(thongKeGhiDanh(thang)).toEqual({ soKhach: 1, soGhiDanh: 1 });
  });
});

describe("datGhiDanh", () => {
  it("bật rồi tắt lại được", () => {
    const van = ghiVan(taoNguoiChoi("0900000001"), "2026-09-01");
    datGhiDanh(van, true);
    expect(thongKeGhiDanh("2026-09").soGhiDanh).toBe(1);
    datGhiDanh(van, false);
    expect(thongKeGhiDanh("2026-09").soGhiDanh).toBe(0);
  });

  it("bật hai lần liên tiếp không đổi gì thêm", () => {
    const van = ghiVan(taoNguoiChoi("0900000001"), "2026-09-01");
    datGhiDanh(van, true);
    const truoc = csdl().prepare("select ghi_danh_luc from van_choi where id = ?").get(van);
    datGhiDanh(van, true);
    expect(csdl().prepare("select ghi_danh_luc from van_choi where id = ?").get(van)).toEqual(
      truoc,
    );
  });

  it("ván không tồn tại thì trả false, không ném", () => {
    expect(datGhiDanh(999999, true)).toBe(false);
  });
});
