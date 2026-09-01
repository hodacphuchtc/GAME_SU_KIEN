import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SO_BAN_GIU_LAI,
  saoLuu,
  taoBanSaoLuu,
  tenBanSaoLuu,
  xoayVong,
} from "@/scripts/sao-luu.mjs";

/**
 * Sao lưu là lưới an toàn DUY NHẤT của dữ liệu khách hàng: `du-lieu/` bị
 * .gitignore nên không có bản nào trong git. Bộ test này canh đúng ba thứ dễ
 * hỏng nhất: bản sao có đọc được không, có nuốt mất phần đang nằm trong WAL
 * không, và thư mục có phình vô hạn không.
 */

let goc: string;
let nguon: string;
let dich: string;

/** Dựng một CSDL nhỏ có dữ liệu thật để đem đi sao lưu. */
function dungCsdlCoDuLieu(duongDan: string): DatabaseSync {
  const db = new DatabaseSync(duongDan);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS thu (id INTEGER PRIMARY KEY, ten TEXT NOT NULL);
  `);
  db.prepare("insert into thu (ten) values (?)").run("Nguyễn Văn A");
  return db;
}

beforeEach(() => {
  goc = mkdtempSync(join(tmpdir(), "sao-luu-test-"));
  nguon = join(goc, "game-su-kien.db");
  dich = join(goc, "kho-sao-luu");
});

afterEach(() => {
  rmSync(goc, { recursive: true, force: true });
});

describe("tên bản sao lưu", () => {
  it("theo giờ Việt Nam, dạng YYYY-MM-DD-HHmm", () => {
    // 2026-09-01T01:00:00Z = 08:00 giờ Việt Nam cùng ngày.
    expect(tenBanSaoLuu(new Date("2026-09-01T01:00:00Z"))).toBe("2026-09-01-0800.db");
  });

  it("qua nửa đêm giờ Việt Nam thì sang ngày mới, không dùng giờ máy chủ", () => {
    // 2026-08-31T17:30:00Z = 00:30 ngày 01/09 giờ Việt Nam.
    expect(tenBanSaoLuu(new Date("2026-08-31T17:30:00Z"))).toBe("2026-09-01-0030.db");
  });
});

describe("tạo bản sao lưu", () => {
  it("bản sao đọc được bằng DatabaseSync", () => {
    const db = dungCsdlCoDuLieu(nguon);
    db.close();

    const { duongDan } = taoBanSaoLuu({ nguon, dich, luc: new Date("2026-09-01T01:00:00Z") });

    expect(existsSync(duongDan)).toBe(true);
    const ban = new DatabaseSync(duongDan);
    const dong = ban.prepare("select ten from thu").all() as { ten: string }[];
    ban.close();
    expect(dong).toEqual([{ ten: "Nguyễn Văn A" }]);
  });

  it("🔴 chứa cả dòng vừa ghi khi WAL CHƯA checkpoint", () => {
    // Đây là ca đắt nhất: `cp` file .db sẽ bỏ sót đúng phần này. Giữ kết nối MỞ
    // để WAL còn nguyên, không cho SQLite gộp về .db.
    const db = dungCsdlCoDuLieu(nguon);
    db.prepare("insert into thu (ten) values (?)").run("Trần Thị B");
    expect(existsSync(nguon + "-wal")).toBe(true);

    const { duongDan } = taoBanSaoLuu({ nguon, dich, luc: new Date("2026-09-01T01:00:00Z") });
    db.close();

    const ban = new DatabaseSync(duongDan);
    const ten = (ban.prepare("select ten from thu order by id").all() as { ten: string }[]).map(
      (d) => d.ten,
    );
    ban.close();
    expect(ten).toEqual(["Nguyễn Văn A", "Trần Thị B"]);
  });

  it("tự tạo thư mục đích nếu chưa có", () => {
    dungCsdlCoDuLieu(nguon).close();
    expect(existsSync(dich)).toBe(false);
    taoBanSaoLuu({ nguon, dich, luc: new Date("2026-09-01T01:00:00Z") });
    expect(existsSync(dich)).toBe(true);
  });

  it("đích đã tồn tại thì BÁO LỖI, không ghi đè im lặng", () => {
    dungCsdlCoDuLieu(nguon).close();
    const luc = new Date("2026-09-01T01:00:00Z");
    taoBanSaoLuu({ nguon, dich, luc });
    expect(() => taoBanSaoLuu({ nguon, dich, luc })).toThrow(/đã tồn tại/i);
  });

  it("nguồn không tồn tại thì báo lỗi rõ ràng bằng tiếng Việt", () => {
    expect(() => taoBanSaoLuu({ nguon: join(goc, "khong-co.db"), dich })).toThrow(
      /không tìm thấy/i,
    );
  });
});

describe("xoay vòng", () => {
  /** Đẻ n file .db giả, đặt tên tăng dần để thứ tự xoá đoán được. */
  function deFileGia(n: number): string[] {
    const ten: string[] = [];
    for (let i = 1; i <= n; i += 1) {
      const t = `2026-09-${String(i).padStart(2, "0")}-0800.db`;
      writeFileSync(join(dich, t), "x");
      ten.push(t);
    }
    return ten;
  }

  beforeEach(() => {
    rmSync(dich, { recursive: true, force: true });
    dungCsdlCoDuLieu(nguon).close();
    taoBanSaoLuu({ nguon, dich, luc: new Date("2026-01-01T01:00:00Z") });
    rmSync(join(dich, "2026-01-01-0800.db"), { force: true });
  });

  it("dưới ngưỡng thì không xoá gì", () => {
    deFileGia(SO_BAN_GIU_LAI - 1);
    expect(xoayVong({ dich, giuLai: SO_BAN_GIU_LAI })).toEqual([]);
    expect(readdirSync(dich)).toHaveLength(SO_BAN_GIU_LAI - 1);
  });

  it("đúng ngưỡng thì vẫn không xoá gì", () => {
    deFileGia(SO_BAN_GIU_LAI);
    expect(xoayVong({ dich, giuLai: SO_BAN_GIU_LAI })).toEqual([]);
    expect(readdirSync(dich)).toHaveLength(SO_BAN_GIU_LAI);
  });

  it("bản thứ 15 đẩy bản CŨ NHẤT ra, giữ đúng 14", () => {
    const ten = deFileGia(SO_BAN_GIU_LAI + 1);
    const daXoa = xoayVong({ dich, giuLai: SO_BAN_GIU_LAI });
    expect(daXoa).toEqual([ten[0]]);
    const conLai = readdirSync(dich).sort();
    expect(conLai).toHaveLength(SO_BAN_GIU_LAI);
    expect(conLai).not.toContain(ten[0]);
    expect(conLai).toContain(ten[ten.length - 1]);
  });

  it("bỏ qua file không phải .db, không xoá nhầm", () => {
    deFileGia(SO_BAN_GIU_LAI + 2);
    writeFileSync(join(dich, "GHI-CHU.txt"), "đừng xoá tôi");
    xoayVong({ dich, giuLai: SO_BAN_GIU_LAI });
    expect(existsSync(join(dich, "GHI-CHU.txt"))).toBe(true);
  });

  it("thư mục chưa tồn tại thì trả mảng rỗng, không ném", () => {
    expect(xoayVong({ dich: join(goc, "chua-co"), giuLai: SO_BAN_GIU_LAI })).toEqual([]);
  });
});

describe("saoLuu — chạy trọn một lượt", () => {
  it("tạo bản mới rồi xoay vòng trong một lần gọi", () => {
    dungCsdlCoDuLieu(nguon).close();
    for (let i = 1; i <= SO_BAN_GIU_LAI + 1; i += 1) {
      // Mỗi lượt cách nhau một phút để tên file không đụng nhau.
      const luc = new Date(Date.UTC(2026, 8, 1, 1, i, 0));
      const kq = saoLuu({ nguon, dich, giuLai: SO_BAN_GIU_LAI, luc });
      expect(existsSync(kq.duongDan)).toBe(true);
    }
    expect(readdirSync(dich).filter((t) => t.endsWith(".db"))).toHaveLength(SO_BAN_GIU_LAI);
  });
});
