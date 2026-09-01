import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { datCoVan, lichSu } from "@/lib/luot/kho-luot";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { xinCho } from "@/app/actions/choi";
import { doiTrangThai } from "@/lib/chuong-trinh/kho";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * Ba lỗi vá ở GĐ 8.2. Cả ba đều thuộc loại "chạy vẫn chạy, chỉ là sai" — không
 * có test canh thì chúng quay lại mà không ai biết.
 */

let don: () => void;
let ma: string;
let ctId: number;

/**
 * Dựng MỘT VÁN đã chốt kèm một lần bấm — từ GĐ 12.1 lịch sử đọc từ `van_choi`,
 * nên chỉ ghi mỗi `luot_choi` thì bảng lịch sử rỗng và bài test canh nhầm chỗ.
 * Trả về id của VÁN, vì mọi cờ tích đều nhắm vào ván.
 */
function ghiVan(nguoiChoiId: number | null, trung = false): number {
  const db = csdl();
  const luc = Date.now();
  db.prepare(
    `insert into luot_choi
       (chuong_trinh_id, nguoi_choi_id, ngay, bat_dau_luc, ket_thuc_luc, trung, khoang_lech)
     values (?, ?, '2026-09-01', ?, ?, ?, 0)`,
  ).run(ctId, nguoiChoiId, luc, luc, trung ? 1 : 0);
  const luotId = Number(db.prepare("select last_insert_rowid() as id").get()!.id);

  db.prepare(
    `insert into van_choi
       (chuong_trinh_id, nguoi_choi_id, ngay, so_lan_cho_phep, so_lan_da_dung,
        luot_tot_nhat_id, trung, ma_xac_thuc, bat_dau_luc, ket_thuc_luc, tao_luc, sua_luc)
     values (?, ?, '2026-09-01', 1, 1, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(ctId, nguoiChoiId, luotId, trung ? 1 : 0, trung ? "K7M2" : null, luc, luc, luc, luc);
  const vanId = Number(db.prepare("select last_insert_rowid() as id").get()!.id);
  db.prepare("update luot_choi set van_id = ? where id = ?").run(vanId, luotId);
  return vanId;
}

beforeEach(() => {
  don = dungCsdlTam();
  const ct = taoChuongTrinh({
    tenTrungTam: "Trung tâm thử",
    coSoId: coSoThu("Trung tâm thử"),
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
    ghiVan(kq.nguoiChoi!.id);
    expect(lichSu(ctId)[0].dongYTuVan).toBe(true);
  });

  it("người KHÔNG tích thì cờ là false — căn cứ gọi điện phải phân biệt được", () => {
    const kq = nhanDien("Trần Thị B", "0912345679", false);
    ghiVan(kq.nguoiChoi!.id);
    expect(lichSu(ctId)[0].dongYTuVan).toBe(false);
  });

  it("ván ẩn danh thì cờ là false, không ném", () => {
    ghiVan(null);
    expect(lichSu(ctId)[0].dongYTuVan).toBe(false);
  });
});

describe("LỖI 2 — cờ đã trao quà (cột chết từ v1)", () => {
  it("🔴 bật được — trước GĐ 8.2 không nơi nào ghi vào cột này", () => {
    const van = ghiVan(null, true);
    expect(datCoVan(van, "trao-thuong", true)).toBe(true);
    expect(lichSu(ctId)[0].daTraoThuong).toBe(true);
  });

  it("bật rồi tắt lại được", () => {
    const van = ghiVan(null, true);
    datCoVan(van, "trao-thuong", true);
    datCoVan(van, "trao-thuong", false);
    expect(lichSu(ctId)[0].daTraoThuong).toBe(false);
  });

  it("bật hai lần không dời mốc thời gian", () => {
    const van = ghiVan(null, true);
    datCoVan(van, "trao-thuong", true);
    const truoc = csdl().prepare("select trao_luc from van_choi where id = ?").get(van);
    datCoVan(van, "trao-thuong", true);
    expect(csdl().prepare("select trao_luc from van_choi where id = ?").get(van)).toEqual(truoc);
  });

  it("hai cờ độc lập nhau — tích trao quà không đụng ghi danh", () => {
    const van = ghiVan(null, true);
    datCoVan(van, "trao-thuong", true);
    expect(lichSu(ctId)[0].daGhiDanh).toBe(false);
    datCoVan(van, "ghi-danh", true);
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
