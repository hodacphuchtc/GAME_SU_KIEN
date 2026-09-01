import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { datCoLuot, lichSu } from "@/lib/luot/kho-luot";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { xinCho } from "@/app/actions/choi";
import { doiTrangThai } from "@/lib/chuong-trinh/kho";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * Ba lỗi vá ở GĐ 8.2. Cả ba đều thuộc loại "chạy vẫn chạy, chỉ là sai" — không
 * có test canh thì chúng quay lại mà không ai biết.
 */

let don: () => void;
let ma: string;
let ctId: number;

function ghiLuot(nguoiChoiId: number | null, trung = false): number {
  const db = csdl();
  db.prepare(
    `insert into luot_choi
       (chuong_trinh_id, nguoi_choi_id, ngay, bat_dau_luc, ket_thuc_luc, trung, ma_xac_thuc)
     values (?, ?, '2026-09-01', ?, ?, ?, ?)`,
  ).run(ctId, nguoiChoiId, Date.now(), Date.now(), trung ? 1 : 0, trung ? "K7M2" : null);
  return Number(db.prepare("select last_insert_rowid() as id").get()!.id);
}

beforeEach(() => {
  don = dungCsdlTam();
  const ct = taoChuongTrinh({
    tenTrungTam: "Trung tâm thử",
    soTrung: 114,
    mucDo: "vua",
    tenGiaiThuong: "Balo STEM",
    tranGiaiMoiNgay: 0,
  });
  ma = ct.ma;
  ctId = ct.id;
});

afterEach(() => don());

describe("LỖI 1 — cờ đồng ý nhận tư vấn phải ra tới dòng lịch sử", () => {
  it("🔴 người tích ô đồng ý thì dòng lịch sử mang cờ đó", () => {
    const kq = nhanDien("Nguyễn Văn A", "0912345678", true);
    ghiLuot(kq.nguoiChoi!.id);
    expect(lichSu(ctId)[0].dongYTuVan).toBe(true);
  });

  it("người KHÔNG tích thì cờ là false — căn cứ gọi điện phải phân biệt được", () => {
    const kq = nhanDien("Trần Thị B", "0912345679", false);
    ghiLuot(kq.nguoiChoi!.id);
    expect(lichSu(ctId)[0].dongYTuVan).toBe(false);
  });

  it("lượt ẩn danh thì cờ là false, không ném", () => {
    ghiLuot(null);
    expect(lichSu(ctId)[0].dongYTuVan).toBe(false);
  });
});

describe("LỖI 2 — cờ đã trao quà (cột chết từ v1)", () => {
  it("🔴 bật được — trước GĐ 8.2 không nơi nào ghi vào cột này", () => {
    const luot = ghiLuot(null, true);
    expect(datCoLuot(luot, "trao-thuong", true)).toBe(true);
    expect(lichSu(ctId)[0].daTraoThuong).toBe(true);
  });

  it("bật rồi tắt lại được", () => {
    const luot = ghiLuot(null, true);
    datCoLuot(luot, "trao-thuong", true);
    datCoLuot(luot, "trao-thuong", false);
    expect(lichSu(ctId)[0].daTraoThuong).toBe(false);
  });

  it("bật hai lần không dời mốc thời gian", () => {
    const luot = ghiLuot(null, true);
    datCoLuot(luot, "trao-thuong", true);
    const truoc = csdl().prepare("select trao_luc from luot_choi where id = ?").get(luot);
    datCoLuot(luot, "trao-thuong", true);
    expect(csdl().prepare("select trao_luc from luot_choi where id = ?").get(luot)).toEqual(truoc);
  });

  it("hai cờ độc lập nhau — tích trao quà không đụng ghi danh", () => {
    const luot = ghiLuot(null, true);
    datCoLuot(luot, "trao-thuong", true);
    expect(lichSu(ctId)[0].daGhiDanh).toBe(false);
    datCoLuot(luot, "ghi-danh", true);
    expect(lichSu(ctId)[0].daTraoThuong).toBe(true);
  });
});

describe("LỖI 3 — xinCho phải nói ĐÚNG lý do bị chặn", () => {
  it("🔴 chương trình đã tắt → lyDo 'da-ket-thuc'", async () => {
    doiTrangThai(ma, "ket_thuc");
    const kq = await xinCho(ma, "nguoi_choi", "token-a");
    expect(kq.duoc).toBe(false);
    expect(kq.lyDo).toBe("da-ket-thuc");
  });

  it("🔴 ghế đang có người → lyDo 'dang-ban'", async () => {
    expect((await xinCho(ma, "nguoi_choi", "token-a")).duoc).toBe(true);
    const kq = await xinCho(ma, "nguoi_choi", "token-b");
    expect(kq.duoc).toBe(false);
    expect(kq.lyDo).toBe("dang-ban");
  });

  it("hai ca này TRƯỚC ĐÂY không phân biệt được — nay phải khác nhau", async () => {
    const ban = await xinCho(ma, "nguoi_choi", "token-a");
    expect(ban.duoc).toBe(true);
    const dangBan = await xinCho(ma, "nguoi_choi", "token-b");
    doiTrangThai(ma, "ket_thuc");
    const daTat = await xinCho(ma, "nguoi_choi", "token-c");
    expect(dangBan.lyDo).not.toBe(daTat.lyDo);
  });

  it("xin được chỗ thì không có lyDo", async () => {
    const kq = await xinCho(ma, "nguoi_choi", "token-a");
    expect(kq.duoc).toBe(true);
    expect(kq.lyDo).toBeUndefined();
  });
});
