import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { doiTenTep } from "@/lib/db/doi-ten-tep";

/**
 * Đổi tên tệp CSDL khi module đổi tên DEM_SO → GAME_SU_KIEN.
 *
 * 🔴 Ca đắt nhất của cả bộ: SQLite ở chế độ WAL có BA tệp (.db, .db-wal,
 * .db-shm). Trên máy thật, .db là 40 KB còn .db-wal là 399 KB. Đổi tên mỗi tệp
 * .db là mất gần hết dữ liệu mới — mà app vẫn chạy, vẫn mở được, chỉ là trống.
 */

let goc: string;
let cu: string;
let moi: string;

/** Dựng CSDL có dữ liệu và CỐ Ý để WAL chưa checkpoint. */
function dungCoWal(): DatabaseSync {
  const db = new DatabaseSync(cu);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS chuong_trinh (id INTEGER PRIMARY KEY, ten TEXT NOT NULL);
  `);
  db.prepare("insert into chuong_trinh (ten) values (?)").run("Nguyễn Văn A");
  return db;
}

function doc(duongDan: string): string[] {
  const db = new DatabaseSync(duongDan);
  const ten = (db.prepare("select ten from chuong_trinh order by id").all() as { ten: string }[]).map(
    (d) => d.ten,
  );
  db.close();
  return ten;
}

beforeEach(() => {
  goc = mkdtempSync(join(tmpdir(), "doi-ten-test-"));
  cu = join(goc, "dem-so.db");
  moi = join(goc, "game-su-kien.db");
});

afterEach(() => rmSync(goc, { recursive: true, force: true }));

describe("doiTenTep", () => {
  it("🔴 không BỎ LẠI tệp phụ nào ở đường dẫn cũ", () => {
    // Đây mới là hỏng thật sự: một tệp -wal nằm lại chỗ cũ nghĩa là dữ liệu
    // trong nó không bao giờ đi theo sang tên mới.
    const db = dungCoWal();
    expect(existsSync(cu + "-wal")).toBe(true);
    db.close();

    doiTenTep(cu, moi);

    for (const hau of ["", "-wal", "-shm"]) {
      expect(existsSync(cu + hau)).toBe(false);
    }
    expect(existsSync(moi)).toBe(true);
  });

  it("tệp phụ còn sót lại thì được mang theo, không bỏ lại", () => {
    // Máy tắt đột ngột có thể để lại -wal/-shm mồ côi. Bước sao lưu đã chạy rồi
    // (bản .truoc-doi-ten có sẵn) nên hàm đi thẳng tới khâu đổi tên.
    dungCoWal().close();
    writeFileSync(cu + ".truoc-doi-ten", "");
    writeFileSync(cu + "-wal", "");
    writeFileSync(cu + "-shm", "");

    doiTenTep(cu, moi);

    for (const hau of ["", "-wal", "-shm"]) {
      expect(existsSync(cu + hau)).toBe(false);
      expect(existsSync(moi + hau)).toBe(true);
    }
  });

  it("🔴 KHÔNG mất dòng nào đang nằm trong WAL chưa checkpoint", () => {
    const db = dungCoWal();
    db.prepare("insert into chuong_trinh (ten) values (?)").run("Trần Thị B");
    db.close(); // đóng để đổi tên được, nhưng cả 3 tệp vẫn phải đi cùng nhau

    doiTenTep(cu, moi);

    expect(doc(moi)).toEqual(["Nguyễn Văn A", "Trần Thị B"]);
  });

  it("để lại bản sao lưu trước khi đụng vào tệp", () => {
    dungCoWal().close();
    doiTenTep(cu, moi);
    expect(existsSync(cu + ".truoc-doi-ten")).toBe(true);
    expect(doc(cu + ".truoc-doi-ten")).toEqual(["Nguyễn Văn A"]);
  });

  it("tệp MỚI đã tồn tại thì không làm gì (đã đổi ở lần chạy trước)", () => {
    dungCoWal().close();
    const dbMoi = new DatabaseSync(moi);
    dbMoi.exec("CREATE TABLE chuong_trinh (id INTEGER PRIMARY KEY, ten TEXT NOT NULL)");
    dbMoi.prepare("insert into chuong_trinh (ten) values (?)").run("Đang dùng");
    dbMoi.close();

    doiTenTep(cu, moi);

    expect(doc(moi)).toEqual(["Đang dùng"]); // không bị tệp cũ đè lên
    expect(existsSync(cu)).toBe(true); // tệp cũ để nguyên cho người xem lại
  });

  it("tệp CŨ không tồn tại thì không làm gì, không ném (máy mới)", () => {
    expect(() => doiTenTep(cu, moi)).not.toThrow();
    expect(existsSync(moi)).toBe(false);
  });

  it("chạy hai lần liên tiếp không ném và không đổi gì thêm", () => {
    dungCoWal().close();
    doiTenTep(cu, moi);
    const truoc = doc(moi);
    expect(() => doiTenTep(cu, moi)).not.toThrow();
    expect(doc(moi)).toEqual(truoc);
  });

  it("đường dẫn :memory: thì bỏ qua hoàn toàn", () => {
    expect(() => doiTenTep(":memory:", ":memory:")).not.toThrow();
  });
});

describe("🔴 từ chối nguồn KHÔNG phải cơ sở dữ liệu thật", () => {
  // Bài học 01/09/2026: một tệp rỗng trùng tên bị đổi tên đè vào đúng chỗ CSDL
  // thật. App vẫn chạy, chỉ là trắng trơn — không một dòng báo lỗi.
  it("tệp nguồn RỖNG 0 byte thì không đụng vào gì", () => {
    writeFileSync(cu, "");
    doiTenTep(cu, moi);
    expect(existsSync(moi)).toBe(false);
    expect(existsSync(cu)).toBe(true);
  });

  it("tệp nguồn là rác, không phải SQLite → không đụng", () => {
    writeFileSync(cu, "đây không phải cơ sở dữ liệu");
    doiTenTep(cu, moi);
    expect(existsSync(moi)).toBe(false);
  });

  it("là SQLite nhưng KHÔNG có bảng của mình → không đụng", () => {
    const la = new DatabaseSync(cu);
    la.exec("CREATE TABLE cua_ai_do (id INTEGER PRIMARY KEY)");
    la.close();
    doiTenTep(cu, moi);
    expect(existsSync(moi)).toBe(false);
  });

  it("có bảng chuong_trinh thì đổi tên bình thường", () => {
    const that = new DatabaseSync(cu);
    that.exec("CREATE TABLE chuong_trinh (id INTEGER PRIMARY KEY, ma TEXT NOT NULL)");
    that.prepare("insert into chuong_trinh (ma) values (?)").run("L7WH");
    that.close();

    doiTenTep(cu, moi);

    expect(existsSync(moi)).toBe(true);
    const db = new DatabaseSync(moi);
    expect(db.prepare("select ma from chuong_trinh").get()).toEqual({ ma: "L7WH" });
    db.close();
  });
});
