import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { csdl, dongCsdl, moCsdl, moDeDoc, duongDanCsdl } from "@/lib/db/ket-noi";
import { nangCap, PHIEN_BAN_DU_LIEU } from "@/lib/db/nang-cap";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

const BANG = ["chuong_trinh", "o_qua", "nguoi_choi", "luot_quay", "nhat_ky"];

describe("Lược đồ cơ sở dữ liệu", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("dựng đủ 5 bảng trên một cơ sở dữ liệu trắng", () => {
    const db = csdl();
    const ten = (
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
        name: string;
      }[]
    ).map((d) => d.name);
    for (const b of BANG) expect(ten, `thiếu bảng ${b}`).toContain(b);
  });

  it("bật khoá ngoại — xoá chương trình là cuốn theo ô quà và lượt quay", () => {
    const db = csdl();
    const gio = Date.now();
    db.prepare(
      "INSERT INTO chuong_trinh (ma, ten_co_so, tao_luc, sua_luc) VALUES (?, ?, ?, ?)",
    ).run("VQ1", "Cơ sở A", gio, gio);
    const ctId = db.prepare("SELECT id FROM chuong_trinh WHERE ma = ?").get("VQ1") as {
      id: number;
    };
    db.prepare(
      "INSERT INTO o_qua (chuong_trinh_id, ten, so_luong, tao_luc, sua_luc) VALUES (?, ?, ?, ?, ?)",
    ).run(ctId.id, "Balo", 10, gio, gio);

    db.prepare("DELETE FROM chuong_trinh WHERE id = ?").run(ctId.id);
    const conLai = db
      .prepare("SELECT COUNT(*) AS n FROM o_qua WHERE chuong_trinh_id = ?")
      .get(ctId.id) as { n: number };
    expect(conLai.n).toBe(0);
  });

  it("chạy nâng cấp HAI lần không hỏng gì", () => {
    const db = csdl();
    expect(() => {
      nangCap(db);
      nangCap(db);
    }).not.toThrow();
    const pb = db.prepare("PRAGMA user_version").get() as { user_version: number };
    expect(pb.user_version).toBe(PHIEN_BAN_DU_LIEU);
  });

  it("mở lại cơ sở dữ liệu cũ giữ nguyên dữ liệu", () => {
    const gio = Date.now();
    csdl()
      .prepare("INSERT INTO chuong_trinh (ma, ten_co_so, tao_luc, sua_luc) VALUES (?, ?, ?, ?)")
      .run("VQ2", "Cơ sở B", gio, gio);
    dongCsdl();
    const dem = csdl().prepare("SELECT COUNT(*) AS n FROM chuong_trinh").get() as {
      n: number;
    };
    expect(dem.n).toBe(1);
  });

  it("ô đáy khai được với so_luong NULL", () => {
    const db = csdl();
    const gio = Date.now();
    db.prepare(
      "INSERT INTO chuong_trinh (ma, ten_co_so, tao_luc, sua_luc) VALUES (?, ?, ?, ?)",
    ).run("VQ3", "Cơ sở C", gio, gio);
    const ct = db.prepare("SELECT id FROM chuong_trinh WHERE ma = ?").get("VQ3") as {
      id: number;
    };
    expect(() =>
      db
        .prepare(
          "INSERT INTO o_qua (chuong_trinh_id, ten, so_luong, tao_luc, sua_luc) VALUES (?, ?, NULL, ?, ?)",
        )
        .run(ct.id, "Sticker", gio, gio),
    ).not.toThrow();
    const o = db.prepare("SELECT so_luong FROM o_qua WHERE ten = ?").get("Sticker") as {
      so_luong: number | null;
    };
    expect(o.so_luong).toBeNull();
  });
});

describe("🔴 moDeDoc() — chốt chặn tệp rỗng", () => {
  const duongDanMa = join(tmpdir(), `vong-quay-khong-ton-tai-${Date.now()}.db`);
  afterEach(() => rmSync(duongDanMa, { force: true }));

  it("ném lỗi khi đường dẫn KHÔNG tồn tại, và KHÔNG tạo tệp rỗng", () => {
    expect(existsSync(duongDanMa)).toBe(false);
    expect(() => moDeDoc(duongDanMa)).toThrow(/Không có cơ sở dữ liệu/);
    // Đây là dòng quan trọng nhất của cả file: một lệnh chẩn đoán gõ nhầm
    // đường dẫn KHÔNG được phép để lại một tệp 0 byte trên đĩa.
    expect(existsSync(duongDanMa), "đã lỡ tạo tệp rỗng").toBe(false);
  });

  it("đọc được cơ sở dữ liệu có thật, nhưng KHÔNG ghi được vào đó", () => {
    const don = dungCsdlTam();
    try {
      csdl();
      dongCsdl();
      const db = moDeDoc(duongDanCsdl());
      expect(() => db.prepare("SELECT COUNT(*) AS n FROM chuong_trinh").get()).not.toThrow();
      expect(() =>
        db
          .prepare("INSERT INTO nhat_ky (hanh_dong, luc) VALUES (?, ?)")
          .run("thu", Date.now()),
      ).toThrow();
      db.close();
    } finally {
      don();
    }
  });

  it("moCsdl vẫn TẠO tệp mới — đó là việc của nó, khác hẳn moDeDoc", () => {
    const p = join(tmpdir(), `vong-quay-moi-${Date.now()}.db`);
    try {
      const db = moCsdl(p);
      expect(existsSync(p)).toBe(true);
      db.close();
    } finally {
      for (const hau of ["", "-wal", "-shm"]) rmSync(p + hau, { force: true });
    }
  });
});
