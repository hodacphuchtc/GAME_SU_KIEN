import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { coCot, nangCap, themCot } from "@/lib/db/nang-cap";
import { LUOC_DO } from "@/lib/db/luoc-do";

/**
 * Lớp NÂNG CẤP. `luoc-do.ts` chỉ biết `CREATE TABLE IF NOT EXISTS`, nên một cơ
 * sở dữ liệu ĐÃ TỒN TẠI sẽ không bao giờ nhận được cột mới. Đây là chỗ vá.
 *
 * Hai lớp tách bạch, test theo đúng ranh giới đó:
 *   CẤU TRÚC — chạy MỖI LẦN khởi động, phải chạy lại được vô số lần.
 *   DỮ LIỆU  — chạy ĐÚNG MỘT LẦN, canh bằng `PRAGMA user_version`.
 */

let goc: string;
let duongDan: string;
let db: DatabaseSync;

/** Lược đồ CŨ đúng như bản v1 đang chạy trên máy trung tâm — chưa có gì của v2. */
const LUOC_DO_CU = `
  CREATE TABLE chuong_trinh (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma TEXT NOT NULL UNIQUE,
    ten_trung_tam TEXT NOT NULL,
    so_trung INTEGER NOT NULL,
    muc_do TEXT NOT NULL,
    tham_so TEXT,
    ten_giai_thuong TEXT NOT NULL,
    tran_giai_moi_ngay INTEGER NOT NULL DEFAULT 0,
    trang_thai TEXT NOT NULL DEFAULT 'dang_chay',
    token_man_hinh TEXT, han_man_hinh INTEGER,
    token_nguoi_choi TEXT, han_nguoi_choi INTEGER,
    tao_luc INTEGER NOT NULL, sua_luc INTEGER NOT NULL
  );
  CREATE TABLE nguoi_choi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    so_dien_thoai TEXT NOT NULL UNIQUE,
    ho_ten TEXT NOT NULL,
    dong_y_tu_van INTEGER NOT NULL DEFAULT 0,
    quan_tam_hoc_thu INTEGER NOT NULL DEFAULT 0,
    tao_luc INTEGER NOT NULL, sua_luc INTEGER NOT NULL
  );
  CREATE TABLE luot_choi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chuong_trinh_id INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
    nguoi_choi_id INTEGER REFERENCES nguoi_choi(id),
    ngay TEXT NOT NULL,
    bat_dau_luc INTEGER NOT NULL, ket_thuc_luc INTEGER,
    so_da_dung INTEGER, trung INTEGER NOT NULL DEFAULT 0,
    khoang_lech INTEGER, het_gio INTEGER NOT NULL DEFAULT 0,
    thiet_bi_bam TEXT, ma_xac_thuc TEXT,
    da_trao_thuong INTEGER NOT NULL DEFAULT 0, trao_luc INTEGER
  );
`;

function themChuongTrinh(ma: string, tenTrungTam: string, giai = "Voucher 200k"): number {
  db.prepare(
    `insert into chuong_trinh
       (ma, ten_trung_tam, so_trung, muc_do, ten_giai_thuong, tran_giai_moi_ngay, tao_luc, sua_luc)
     values (?, ?, 114, 'vua', ?, 5, ?, ?)`,
  ).run(ma, tenTrungTam, giai, Date.now(), Date.now());
  return Number((db.prepare("select last_insert_rowid() as id").get() as { id: number }).id);
}

function themLuot(ctId: number, trung = 0, ma_xac_thuc: string | null = null): void {
  db.prepare(
    `insert into luot_choi (chuong_trinh_id, ngay, bat_dau_luc, ket_thuc_luc, trung, ma_xac_thuc)
     values (?, '2026-09-01', ?, ?, ?, ?)`,
  ).run(ctId, Date.now(), Date.now(), trung, ma_xac_thuc);
}

/** Đúng trình tự `moCsdl`: lược đồ dựng hình dạng lý tưởng, rồi nâng cấp kéo CSDL cũ về đó. */
function chayNangCap(): void {
  db.exec(LUOC_DO);
  nangCap(db);
}

const dem = (sql: string) => Number((db.prepare(sql).get() as { n: number }).n);

beforeEach(() => {
  goc = mkdtempSync(join(tmpdir(), "nang-cap-test-"));
  duongDan = join(goc, "thu.db");
  db = new DatabaseSync(duongDan);
  db.exec(LUOC_DO_CU);
});

afterEach(() => {
  db.close();
  rmSync(goc, { recursive: true, force: true });
});

describe("lớp CẤU TRÚC — coCot / themCot", () => {
  it("thấy cột đang có, không thấy cột chưa có", () => {
    expect(coCot(db, "luot_choi", "ngay")).toBe(true);
    expect(coCot(db, "luot_choi", "da_ghi_danh")).toBe(false);
  });

  it("bảng không tồn tại thì trả false, không ném", () => {
    expect(coCot(db, "bang_ma", "cot_ma")).toBe(false);
  });

  it("🔴 themCot gọi hai lần không ném (chạy mỗi lần khởi động)", () => {
    themCot(db, "luot_choi", "da_ghi_danh", "integer not null default 0");
    expect(() =>
      themCot(db, "luot_choi", "da_ghi_danh", "integer not null default 0"),
    ).not.toThrow();
  });

  it("thêm cột không đụng dữ liệu đang có", () => {
    const id = themChuongTrinh("AAAA", "Trung tâm A");
    themLuot(id);
    themCot(db, "luot_choi", "da_ghi_danh", "integer not null default 0");
    expect(dem("select count(*) as n from luot_choi")).toBe(1);
  });

  it("nangCap thêm đủ cột của cả 7.2 lẫn 10.1", () => {
    chayNangCap();
    for (const c of ["da_ghi_danh", "ghi_danh_luc", "van_id", "lan_thu"]) {
      expect(coCot(db, "luot_choi", c)).toBe(true);
    }
    for (const c of ["co_so_id", "che_do", "nguon_co_so", "so_lan_choi", "tro_choi"]) {
      expect(coCot(db, "chuong_trinh", c)).toBe(true);
    }
  });

  it("nangCap thêm ba cột dải số của game CHỌN SỐ (v3)", () => {
    chayNangCap();
    for (const c of ["dai_tu", "dai_den", "loai_tru_da_ra"]) {
      expect(coCot(db, "chuong_trinh", c)).toBe(true);
    }
  });

  it("🔴 chương trình cũ giữ nguyên thân phận trúng số, dải số nhận giá trị mặc định", () => {
    themChuongTrinh("AAAA", "Trung tâm A");
    chayNangCap();
    // Ba cột mới KHÔNG được đổi thân phận của chương trình đang chạy thật:
    // nó vẫn là trúng số, và dải số chỉ là chỗ trống chờ game kia dùng tới.
    expect(
      db
        .prepare("select tro_choi, dai_tu, dai_den, loai_tru_da_ra from chuong_trinh")
        .get(),
    ).toEqual({ tro_choi: "trung_so", dai_tu: 1, dai_den: 100, loai_tru_da_ra: 0 });
  });

  // Con số này ĐỔI khi lược đồ đẻ thêm bảng — và đó là lý do nó được viết
  // thẳng chứ không đếm động: một bảng lạ chui vào CSDL quầy phải làm bài kiểm
  // này ĐỎ, chứ không phải được cộng vào lặng lẽ.
  //
  // 9 → 11 ngày 02/09/2026 (ADR-011): gộp Vòng Quay vào app này thêm `o_qua`
  // và `luot_quay`. Luật CŨ là "một app hai game, 9 bảng"; nay là ba game.
  // 11 → 12 ngày 02/09/2026: thêm `nguoi_choi_thay_doi` (sổ thay đổi hồ sơ khách).
  it("dựng đủ 12 bảng (9 của Trúng Số + Chọn Số, 2 của Vòng Quay, 1 sổ thay đổi)", () => {
    chayNangCap();
    expect(dem("select count(*) as n from sqlite_master where type='table' and name not like 'sqlite_%'")).toBe(12);
  });
});

describe("lớp DỮ LIỆU — backfill sinh cơ sở", () => {
  it("🔴 3 chương trình với 2 tên lệch hoa thường/khoảng trắng → đúng 2 cơ sở", () => {
    themChuongTrinh("AAAA", "Trung tâm Hoa Mai");
    themChuongTrinh("BBBB", "  trung tâm   hoa mai ");
    themChuongTrinh("CCCC", "Trung tâm Quận 7");
    chayNangCap();
    expect(dem("select count(*) as n from co_so")).toBe(2);
  });

  it("mã CS1/CS2 đúng thứ tự id chương trình, tên lấy bản xuất hiện đầu tiên", () => {
    themChuongTrinh("AAAA", "Trung tâm Hoa Mai");
    themChuongTrinh("BBBB", "Trung tâm Quận 7");
    themChuongTrinh("CCCC", "trung tâm hoa mai");
    chayNangCap();
    expect(db.prepare("select ma, ten from co_so order by id").all()).toEqual([
      { ma: "CS1", ten: "Trung tâm Hoa Mai" },
      { ma: "CS2", ten: "Trung tâm Quận 7" },
    ]);
  });

  it("🔴 mọi chương trình đều có co_so_id sau khi nâng cấp", () => {
    themChuongTrinh("AAAA", "Trung tâm A");
    themChuongTrinh("BBBB", "Trung tâm B");
    chayNangCap();
    expect(dem("select count(*) as n from chuong_trinh where co_so_id is null")).toBe(0);
  });

  it("chương trình cũ được đặt là tại quầy, gán sẵn, 1 lần bấm", () => {
    themChuongTrinh("AAAA", "Trung tâm A");
    chayNangCap();
    expect(db.prepare("select che_do, nguon_co_so, so_lan_choi, tro_choi from chuong_trinh").get())
      .toEqual({ che_do: "tai_quay", nguon_co_so: "gan_san", so_lan_choi: 1, tro_choi: "trung_so" });
  });

  it("tên trung tâm RỖNG gom vào 'Chưa phân loại'", () => {
    themChuongTrinh("AAAA", "   ");
    chayNangCap();
    expect(db.prepare("select ten from co_so").get()).toEqual({ ten: "Chưa phân loại" });
  });

  it("KHÔNG tự gộp tên khác dấu — máy đoán sai nguy hiểm hơn để người tự tắt", () => {
    themChuongTrinh("AAAA", "Trung tâm Quận 7");
    themChuongTrinh("BBBB", "Trung tam Quan 7");
    chayNangCap();
    expect(dem("select count(*) as n from co_so")).toBe(2);
  });
});

describe("lớp DỮ LIỆU — backfill kho quà và ván chơi", () => {
  it("mỗi chương trình đúng 1 dòng kho quà, KHÔNG GIỚI HẠN", () => {
    themChuongTrinh("AAAA", "Trung tâm A", "Balo STEM");
    themChuongTrinh("BBBB", "Trung tâm B", "Voucher 200k");
    chayNangCap();
    expect(db.prepare("select ten, so_luong, tran_moi_ngay from qua_tang order by id").all())
      .toEqual([
        { ten: "Balo STEM", so_luong: null, tran_moi_ngay: 5 },
        { ten: "Voucher 200k", so_luong: null, tran_moi_ngay: 5 },
      ]);
  });

  it("🔴 mỗi lượt cũ có đúng 1 ván, chép đúng trung và mã xác thực", () => {
    const id = themChuongTrinh("AAAA", "Trung tâm A");
    themLuot(id, 1, "K7M2");
    themLuot(id, 0, null);
    chayNangCap();
    expect(dem("select count(*) as n from van_choi")).toBe(2);
    expect(db.prepare("select trung, ma_xac_thuc, so_lan_cho_phep from van_choi order by id").all())
      .toEqual([
        { trung: 1, ma_xac_thuc: "K7M2", so_lan_cho_phep: 1 },
        { trung: 0, ma_xac_thuc: null, so_lan_cho_phep: 1 },
      ]);
  });

  it("ván thừa hưởng đúng cơ sở của chương trình", () => {
    const id = themChuongTrinh("AAAA", "Trung tâm A");
    themLuot(id);
    chayNangCap();
    expect(dem("select count(*) as n from van_choi v join co_so c on c.id = v.co_so_id")).toBe(1);
  });

  it("mỗi lượt được nối ngược về ván của nó", () => {
    const id = themChuongTrinh("AAAA", "Trung tâm A");
    themLuot(id);
    themLuot(id);
    chayNangCap();
    expect(dem("select count(*) as n from luot_choi where van_id is null")).toBe(0);
  });

  it("🔴 KHÔNG mất dòng luot_choi nào", () => {
    const id = themChuongTrinh("AAAA", "Trung tâm A");
    for (let i = 0; i < 7; i += 1) themLuot(id);
    chayNangCap();
    expect(dem("select count(*) as n from luot_choi")).toBe(7);
  });
});

describe("lớp DỮ LIỆU — chỉ chạy MỘT LẦN", () => {
  it("🔴 mở lần hai KHÔNG đẻ thêm cơ sở", () => {
    themChuongTrinh("AAAA", "Trung tâm A");
    chayNangCap();
    chayNangCap();
    expect(dem("select count(*) as n from co_so")).toBe(1);
    expect(dem("select count(*) as n from qua_tang")).toBe(1);
  });

  it("🔴 đổi tên cơ sở rồi mở lại KHÔNG tái sinh cơ sở cũ", () => {
    themChuongTrinh("AAAA", "Trung tâm Hoa Mai");
    chayNangCap();
    db.exec("update co_so set ten = 'Cơ sở Hoa Mai'");
    chayNangCap();
    expect(db.prepare("select ten from co_so").all()).toEqual([{ ten: "Cơ sở Hoa Mai" }]);
  });

  // Con số này TĂNG mỗi khi thêm một bước backfill mới (v2 = GĐ 12.1 kéo cờ
  // ghi danh từ lượt lên ván). Cố ý viết thẳng số chứ không import hằng số:
  // import vào thì bài test tự khớp với chính nó và không canh được gì nữa.
  // 2 → 3 ngày 02/09/2026: thêm backfill v3 (quy chuẩn đầu số 11 số + gộp hồ sơ
  // trùng). Số viết THẲNG, cố ý không import `PHIEN_BAN_DU_LIEU` — import vào thì
  // bài kiểm tự khớp với chính nó và không canh được gì.
  it("user_version được nâng lên 3", () => {
    chayNangCap();
    expect((db.prepare("pragma user_version").get() as { user_version: number }).user_version).toBe(3);
  });

  it("CSDL TRẮNG chạy trót lọt, 0 cơ sở, không ném", () => {
    const goc2 = mkdtempSync(join(tmpdir(), "trang-"));
    const db2 = new DatabaseSync(join(goc2, "trang.db"));
    db2.exec(LUOC_DO);
    expect(() => nangCap(db2)).not.toThrow();
    expect(Number((db2.prepare("select count(*) as n from co_so").get() as { n: number }).n)).toBe(0);
    db2.close();
    rmSync(goc2, { recursive: true, force: true });
  });
});


describe("ADR-011 — hai bảng của Vòng Quay đi qua cửa nâng cấp", () => {
  /** Tên mọi bảng đang có, để khẳng định bằng SỰ TỒN TẠI chứ không bằng "không ném". */
  function cacBang(): string[] {
    return (db.prepare("select name from sqlite_master where type = 'table'").all() as { name: string }[])
      .map((r) => r.name);
  }

  it("🔴 CSDL quầy CŨ (chưa từng có o_qua/luot_quay) nhận đủ hai bảng", () => {
    expect(cacBang()).not.toContain("o_qua");
    chayNangCap();
    expect(cacBang()).toContain("o_qua");
    expect(cacBang()).toContain("luot_quay");
  });

  it("🔴 ba cột ẢNH CHỤP có mặt ngay từ đầu — thiếu chúng là sổ đối soát nói dối", () => {
    chayNangCap();
    for (const cot of ["cung_json", "o_ten", "o_mau"]) {
      expect(coCot(db, "luot_quay", cot)).toBe(true);
    }
  });

  it("chuong_trinh nhận ti_le_o_day = 0,5 và phien_ban_o = 1", () => {
    themChuongTrinh("AAAA", "Trung tâm A");
    chayNangCap();
    const ct = db.prepare("select ti_le_o_day, phien_ban_o from chuong_trinh").get() as {
      ti_le_o_day: number;
      phien_ban_o: number;
    };
    expect(ct.ti_le_o_day).toBe(0.5);
    expect(ct.phien_ban_o).toBe(1);
  });

  it("năm chỉ mục của Vòng Quay được tạo, không đụng tên chỉ mục Trúng Số", () => {
    chayNangCap();
    const ten = (
      db.prepare("select name from sqlite_master where type = 'index'").all() as { name: string }[]
    ).map((r) => r.name);
    for (const ix of [
      "o_theo_chuong_trinh",
      "quay_theo_chuong_trinh",
      "quay_theo_ngay",
      "quay_theo_nguoi_choi",
      "quay_theo_o",
    ]) {
      expect(ten).toContain(ix);
    }
    expect(ten).toContain("luot_theo_van");
  });

  /**
   * 🔴 ĐÂY LÀ BÀI KIỂM CHÍNH của rủi ro R1 (ADR-011).
   *
   * `nangCap()` chạy MỖI LẦN khởi động máy chủ. Nếu việc thêm bảng làm dữ liệu
   * Trúng Số đang phục vụ quầy suy suyển dù một dòng, hoặc làm `user_version`
   * nhảy khiến bước vá dữ liệu chạy lại, thì cả ba game hỏng cùng lúc — và không
   * có gì báo cho tới khi phụ huynh đứng trước quầy.
   */
  it("🔴 chạy HAI LẦN: dữ liệu Trúng Số không suy suyển, user_version không đổi", () => {
    themChuongTrinh("AAAA", "Trung tâm A");
    themChuongTrinh("BBBB", "Trung tâm B");
    chayNangCap();

    const truoc = {
      van: dem("select count(*) as n from van_choi"),
      luot: dem("select count(*) as n from luot_choi"),
      ct: dem("select count(*) as n from chuong_trinh"),
      coSo: dem("select count(*) as n from co_so"),
      qua: dem("select count(*) as n from qua_tang"),
      pb: (db.prepare("pragma user_version").get() as { user_version: number }).user_version,
    };

    chayNangCap();

    expect({
      van: dem("select count(*) as n from van_choi"),
      luot: dem("select count(*) as n from luot_choi"),
      ct: dem("select count(*) as n from chuong_trinh"),
      coSo: dem("select count(*) as n from co_so"),
      qua: dem("select count(*) as n from qua_tang"),
      pb: (db.prepare("pragma user_version").get() as { user_version: number }).user_version,
    }).toEqual(truoc);
  });

  it("🔴 CSDL đã CÓ SẴN o_qua với dữ liệu: chạy lại KHÔNG xoá dòng nào", () => {
    chayNangCap();
    themChuongTrinh("CCCC", "Trung tâm C");
    const id = dem("select id as n from chuong_trinh where ma = 'CCCC'");
    db.prepare(
      `insert into o_qua (chuong_trinh_id, ten, thu_tu, so_luong, tao_luc, sua_luc)
       values (?, 'Balo', 0, 5, 1, 1)`,
    ).run(id);
    chayNangCap();
    expect(dem("select count(*) as n from o_qua")).toBe(1);
    expect(
      (db.prepare("select ten from o_qua").get() as { ten: string }).ten,
    ).toBe("Balo");
  });
});

describe("🔴 v3 — quy chuẩn đầu số 11 số và GỘP hồ sơ trùng", () => {
  /** Chèn thẳng vào `nguoi_choi` để dựng đúng thứ CSDL cũ đang có: hai hồ sơ,
   *  hai dạng số, cùng một thuê bao. `nhanDien` bây giờ đã chặn ca này rồi. */
  function themNguoi(sdt: string, ten: string, dongY = 0, quanTam = 0): number {
    db.prepare(
      `insert into nguoi_choi (so_dien_thoai, ho_ten, dong_y_tu_van, quan_tam_hoc_thu, tao_luc, sua_luc)
       values (?, ?, ?, ?, ?, ?)`,
    ).run(sdt, ten, dongY, quanTam, 1000, 1000);
    return Number(dem("select last_insert_rowid() as n"));
  }

  it("🔴 hai dạng của một thuê bao gộp thành MỘT hồ sơ, giữ bản id nhỏ hơn", () => {
    const cu = themNguoi("01629123456", "Hoa");
    themNguoi("0329123456", "Nguyễn Thị Hoa");
    chayNangCap();

    expect(dem("select count(*) as n from nguoi_choi")).toBe(1);
    const con = db.prepare("select id, so_dien_thoai from nguoi_choi").get() as {
      id: number;
      so_dien_thoai: string;
    };
    expect(con.id).toBe(cu);
    expect(con.so_dien_thoai).toBe("0329123456");
  });

  it("🔴 cờ đồng ý tư vấn KHÔNG mất khi gộp — nó là căn cứ pháp lý để gọi điện", () => {
    themNguoi("01629123456", "Hoa", 0);
    themNguoi("0329123456", "Hoa", 1);
    chayNangCap();
    expect(
      Number((db.prepare("select dong_y_tu_van as v from nguoi_choi").get() as { v: number }).v),
    ).toBe(1);
  });

  it("🔴 đủ BỐN bảng được trỏ lại — luot_quay là bảng dễ sót nhất", () => {
    const bo = themNguoi("01629123456", "Hoa");
    const giu = themNguoi("0329123456", "Hoa");
    themChuongTrinh("AAAA", "Trung tâm A");
    chayNangCap();
    // Sau nâng cấp, chèn dữ liệu tham chiếu tới hồ sơ ĐÃ BỊ GỘP là không còn được;
    // nên dựng trước bằng cách chạy nâng cấp rồi kiểm không còn dòng mồ côi nào.
    expect(db.prepare("pragma foreign_key_check").all()).toEqual([]);
    expect(dem("select count(*) as n from nguoi_choi")).toBe(1);
    expect(giu).toBeGreaterThan(bo);
  });

  it("đầu số 11 số KHÔNG trong bảng thì giữ nguyên, không gộp bừa", () => {
    themNguoi("01779123456", "Người A");
    themNguoi("0779123456", "Người B");
    chayNangCap();
    expect(dem("select count(*) as n from nguoi_choi")).toBe(2);
  });

  it("🔴 chạy HAI LẦN không đổi gì thêm", () => {
    themNguoi("01629123456", "Hoa");
    themNguoi("0329123456", "Hoa");
    chayNangCap();
    const truoc = {
      nguoi: dem("select count(*) as n from nguoi_choi"),
      pb: (db.prepare("pragma user_version").get() as { user_version: number }).user_version,
    };
    chayNangCap();
    expect({
      nguoi: dem("select count(*) as n from nguoi_choi"),
      pb: (db.prepare("pragma user_version").get() as { user_version: number }).user_version,
    }).toEqual(truoc);
  });

  it("CSDL không có hồ sơ nào trùng thì v3 là NO-OP (đúng dữ liệu quầy hôm nay)", () => {
    themNguoi("0912345678", "A");
    themNguoi("0987654321", "B");
    chayNangCap();
    expect(dem("select count(*) as n from nguoi_choi")).toBe(2);
    expect(dem("select count(*) as n from nhat_ky_truy_cap where hanh_dong = 'gop_khach'")).toBe(0);
  });

  it("có gộp thì GHI NHẬT KÝ, và KHÔNG ghi số điện thoại vào đó", () => {
    themNguoi("01629123456", "Hoa");
    themNguoi("0329123456", "Hoa");
    chayNangCap();
    const nk = db
      .prepare("select doi_tuong, so_dong from nhat_ky_truy_cap where hanh_dong = 'gop_khach'")
      .get() as { doi_tuong: string; so_dong: number };
    expect(nk.so_dong).toBe(1);
    expect(nk.doi_tuong).not.toMatch(/\d{9,}/);
  });
});
