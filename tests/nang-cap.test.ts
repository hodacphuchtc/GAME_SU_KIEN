import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { coCot, nangCap, themCot } from "@/lib/db/nang-cap";

/**
 * Lớp NÂNG CẤP CẤU TRÚC. `luoc-do.ts` chỉ biết `CREATE TABLE IF NOT EXISTS`, nên
 * một cơ sở dữ liệu ĐÃ TỒN TẠI sẽ không bao giờ nhận được cột mới. Đây là chỗ vá.
 *
 * Luật của cả file: mọi thứ ở đây phải chạy được NHIỀU LẦN mà không đổi kết quả —
 * nó chạy mỗi lần khởi động máy chủ.
 */

let goc: string;
let duongDan: string;
let db: DatabaseSync;

/** Dựng một CSDL theo lược đồ CŨ — chưa có cột nào của v2. */
function dungCsdlCu(): DatabaseSync {
  const d = new DatabaseSync(duongDan);
  d.exec(`
    CREATE TABLE luot_choi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chuong_trinh_id INTEGER NOT NULL,
      nguoi_choi_id INTEGER,
      ngay TEXT NOT NULL,
      trung INTEGER NOT NULL DEFAULT 0
    );
  `);
  return d;
}

beforeEach(() => {
  goc = mkdtempSync(join(tmpdir(), "nang-cap-test-"));
  duongDan = join(goc, "thu.db");
  db = dungCsdlCu();
});

afterEach(() => {
  db.close();
  rmSync(goc, { recursive: true, force: true });
});

describe("coCot", () => {
  it("thấy cột đang có", () => {
    expect(coCot(db, "luot_choi", "ngay")).toBe(true);
  });

  it("không thấy cột chưa có", () => {
    expect(coCot(db, "luot_choi", "da_ghi_danh")).toBe(false);
  });

  it("bảng không tồn tại thì trả false, không ném", () => {
    expect(coCot(db, "bang_ma", "cot_ma")).toBe(false);
  });
});

describe("themCot", () => {
  it("thêm được cột mới", () => {
    themCot(db, "luot_choi", "da_ghi_danh", "integer not null default 0");
    expect(coCot(db, "luot_choi", "da_ghi_danh")).toBe(true);
  });

  it("🔴 gọi hai lần không ném lỗi (chạy mỗi lần khởi động)", () => {
    themCot(db, "luot_choi", "da_ghi_danh", "integer not null default 0");
    expect(() =>
      themCot(db, "luot_choi", "da_ghi_danh", "integer not null default 0"),
    ).not.toThrow();
  });

  it("không đụng dữ liệu đang có", () => {
    db.prepare("insert into luot_choi (chuong_trinh_id, ngay) values (?, ?)").run(1, "2026-09-01");
    themCot(db, "luot_choi", "da_ghi_danh", "integer not null default 0");
    const dong = db.prepare("select id, da_ghi_danh from luot_choi").all();
    expect(dong).toEqual([{ id: 1, da_ghi_danh: 0 }]);
  });
});

describe("nangCap", () => {
  it("thêm đủ cột thước đo ghi danh vào CSDL cũ", () => {
    nangCap(db);
    expect(coCot(db, "luot_choi", "da_ghi_danh")).toBe(true);
    expect(coCot(db, "luot_choi", "ghi_danh_luc")).toBe(true);
  });

  it("🔴 chạy hai lần cho ra kết quả y hệt, không ném", () => {
    nangCap(db);
    const truoc = db.prepare("pragma table_info(luot_choi)").all();
    expect(() => nangCap(db)).not.toThrow();
    expect(db.prepare("pragma table_info(luot_choi)").all()).toEqual(truoc);
  });

  it("giữ nguyên dòng dữ liệu cũ", () => {
    db.prepare("insert into luot_choi (chuong_trinh_id, nguoi_choi_id, ngay, trung) values (?,?,?,?)").run(
      1,
      9,
      "2026-08-30",
      1,
    );
    nangCap(db);
    const d = db.prepare("select chuong_trinh_id, nguoi_choi_id, ngay, trung from luot_choi").get();
    expect(d).toEqual({ chuong_trinh_id: 1, nguoi_choi_id: 9, ngay: "2026-08-30", trung: 1 });
  });
});
