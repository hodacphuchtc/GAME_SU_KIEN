import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { datGhiDanh, thongKeGhiDanh } from "@/lib/luot/kho-luot";
import { thangVietNam } from "@/lib/db/thoi-gian";
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

/** Tạo một người chơi và một lượt đã kết thúc trong ngày cho trước. */
function ghiLuot(nguoiChoiId: number | null, ngay: string): number {
  const db = csdl();
  db.prepare(
    `insert into luot_choi (chuong_trinh_id, nguoi_choi_id, ngay, bat_dau_luc, ket_thuc_luc, trung)
     values (?, ?, ?, ?, ?, 0)`,
  ).run(ctId, nguoiChoiId, ngay, Date.now(), Date.now());
  return Number(db.prepare("select last_insert_rowid() as id").get()!.id);
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
    ghiLuot(taoNguoiChoi("0900000001"), "2026-09-01");
    ghiLuot(taoNguoiChoi("0900000002"), "2026-09-15");
    expect(thongKeGhiDanh(thang)).toEqual({ soKhach: 2, soGhiDanh: 0 });
  });

  it("🔴 một khách chơi nhiều ngày vẫn tính LÀ MỘT", () => {
    const a = taoNguoiChoi("0900000001");
    ghiLuot(a, "2026-09-01");
    ghiLuot(a, "2026-09-02");
    ghiLuot(a, "2026-09-03");
    expect(thongKeGhiDanh(thang).soKhach).toBe(1);
  });

  it("🔴 lượt ẩn danh không tính vào mẫu số", () => {
    ghiLuot(null, "2026-09-01");
    ghiLuot(taoNguoiChoi("0900000001"), "2026-09-01");
    expect(thongKeGhiDanh(thang).soKhach).toBe(1);
  });

  it("không đếm lượt của tháng khác", () => {
    ghiLuot(taoNguoiChoi("0900000001"), "2026-08-31");
    expect(thongKeGhiDanh(thang).soKhach).toBe(0);
  });

  it("đếm được người đã ghi danh", () => {
    const a = taoNguoiChoi("0900000001");
    const luot = ghiLuot(a, "2026-09-01");
    ghiLuot(taoNguoiChoi("0900000002"), "2026-09-02");
    datGhiDanh(luot, true);
    expect(thongKeGhiDanh(thang)).toEqual({ soKhach: 2, soGhiDanh: 1 });
  });

  it("🔴 tích ghi danh hai LƯỢT của cùng một khách không cộng thành hai", () => {
    const a = taoNguoiChoi("0900000001");
    const l1 = ghiLuot(a, "2026-09-01");
    const l2 = ghiLuot(a, "2026-09-02");
    datGhiDanh(l1, true);
    datGhiDanh(l2, true);
    expect(thongKeGhiDanh(thang)).toEqual({ soKhach: 1, soGhiDanh: 1 });
  });
});

describe("datGhiDanh", () => {
  it("bật rồi tắt lại được", () => {
    const luot = ghiLuot(taoNguoiChoi("0900000001"), "2026-09-01");
    datGhiDanh(luot, true);
    expect(thongKeGhiDanh("2026-09").soGhiDanh).toBe(1);
    datGhiDanh(luot, false);
    expect(thongKeGhiDanh("2026-09").soGhiDanh).toBe(0);
  });

  it("bật hai lần liên tiếp không đổi gì thêm", () => {
    const luot = ghiLuot(taoNguoiChoi("0900000001"), "2026-09-01");
    datGhiDanh(luot, true);
    const truoc = csdl().prepare("select ghi_danh_luc from luot_choi where id = ?").get(luot);
    datGhiDanh(luot, true);
    expect(csdl().prepare("select ghi_danh_luc from luot_choi where id = ?").get(luot)).toEqual(
      truoc,
    );
  });

  it("lượt không tồn tại thì trả false, không ném", () => {
    expect(datGhiDanh(999999, true)).toBe(false);
  });
});
