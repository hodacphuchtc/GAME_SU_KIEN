import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { moCsdl } from "@/lib/db/ket-noi";
import { ngayVietNam } from "@/lib/db/thoi-gian";

const cacFileTam: string[] = [];

function csdlTam() {
  const duongDan = join(tmpdir(), `dem-so-test-${Math.random().toString(36).slice(2)}.db`);
  cacFileTam.push(duongDan);
  return { db: moCsdl(duongDan), duongDan };
}

afterEach(() => {
  while (cacFileTam.length) {
    const f = cacFileTam.pop()!;
    for (const hau of ["", "-wal", "-shm"]) rmSync(f + hau, { force: true });
  }
});

describe("cơ sở dữ liệu", () => {
  it("tạo đủ 3 bảng", () => {
    const { db } = csdlTam();
    const ten = (
      db
        .prepare("select name from sqlite_master where type = 'table' order by name")
        .all() as { name: string }[]
    ).map((r) => r.name);
    expect(ten).toContain("chuong_trinh");
    expect(ten).toContain("nguoi_choi");
    expect(ten).toContain("luot_choi");
    db.close();
  });

  it("có đủ chỉ mục cho màn lịch sử và cho việc đếm giới hạn theo ngày", () => {
    const { db } = csdlTam();
    const ten = (
      db.prepare("select name from sqlite_master where type = 'index'").all() as {
        name: string;
      }[]
    ).map((r) => r.name);
    expect(ten).toContain("luot_theo_chuong_trinh");
    expect(ten).toContain("luot_theo_nguoi_choi");
    expect(ten).toContain("luot_theo_ngay");
    db.close();
  });

  it("mở lại KHÔNG mất dữ liệu — tắt máy bật lại chương trình vẫn còn", () => {
    const { db, duongDan } = csdlTam();
    const luc = Date.now();
    db.prepare(
      `insert into chuong_trinh
        (ma, ten_trung_tam, so_trung, muc_do, ten_giai_thuong, tao_luc, sua_luc)
       values (?, ?, ?, ?, ?, ?, ?)`,
    ).run("AC37", "Trung tâm Hoa Mai", 211, "vua", "Voucher 200k", luc, luc);
    db.close();

    const lai = moCsdl(duongDan);
    const dong = lai.prepare("select * from chuong_trinh where ma = ?").get("AC37") as {
      so_trung: number;
      ten_trung_tam: string;
    };
    expect(dong.so_trung).toBe(211);
    expect(dong.ten_trung_tam).toBe("Trung tâm Hoa Mai");
    lai.close();
  });

  it("một mã chương trình chỉ tồn tại một lần", () => {
    const { db } = csdlTam();
    const luc = Date.now();
    const them = db.prepare(
      `insert into chuong_trinh
        (ma, ten_trung_tam, so_trung, muc_do, ten_giai_thuong, tao_luc, sua_luc)
       values (?, ?, ?, ?, ?, ?, ?)`,
    );
    them.run("AC37", "Cơ sở 1", 211, "vua", "Quà", luc, luc);
    expect(() => them.run("AC37", "Cơ sở 2", 999, "kho", "Quà", luc, luc)).toThrow();
    db.close();
  });

  it("một số điện thoại chỉ có một hồ sơ", () => {
    const { db } = csdlTam();
    const luc = Date.now();
    const them = db.prepare(
      "insert into nguoi_choi (so_dien_thoai, ho_ten, tao_luc, sua_luc) values (?, ?, ?, ?)",
    );
    them.run("0912345678", "Chị Hoa", luc, luc);
    expect(() => them.run("0912345678", "Chị Hoa 2", luc, luc)).toThrow();
    db.close();
  });
});

describe("ngày theo giờ Việt Nam", () => {
  it("đúng dạng YYYY-MM-DD", () => {
    expect(ngayVietNam(Date.UTC(2026, 7, 31, 5, 0, 0))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("lấy giờ Việt Nam chứ không phải giờ UTC — nếu không thì ngày mới nhảy sai buổi", () => {
    // 17:30 UTC ngày 30/08 = 00:30 ngày 31/08 giờ Việt Nam.
    expect(ngayVietNam(Date.UTC(2026, 7, 30, 17, 30, 0))).toBe("2026-08-31");
    // 16:30 UTC ngày 30/08 = 23:30 cùng ngày 30/08 giờ Việt Nam.
    expect(ngayVietNam(Date.UTC(2026, 7, 30, 16, 30, 0))).toBe("2026-08-30");
  });
});
