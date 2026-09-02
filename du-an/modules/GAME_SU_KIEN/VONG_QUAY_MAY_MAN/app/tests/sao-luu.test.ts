import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  saoLuu,
  taoBanSaoLuu,
  tenBanSaoLuu,
  xoayVong,
} from "@/scripts/sao-luu.mjs";

/**
 * SAO LƯU LÀ LƯỚI AN TOÀN DUY NHẤT của dữ liệu khách hàng — `du-lieu/` nằm
 * trong `.gitignore` nên không có bản nào trong git.
 *
 * Bài kiểm này canh ba thứ, mỗi thứ ứng với một cách mất dữ liệu đã có thật:
 *   1. Bản sao MỞ ĐƯỢC và ĐẾM ĐỦ DÒNG (không phải một tệp rỗng trông như thật);
 *   2. bắt được cả dữ liệu còn nằm trong `-wal` khi app đang chạy;
 *   3. xoay vòng giữ đúng 14 bản, và KHÔNG đụng tệp lạ trong thư mục.
 */

/** Một CSDL nhỏ có thật trên đĩa, chạy WAL đúng như bản chạy thật. */
function dungCsdl(duongDan: string, soDong: number, dongMo = false): DatabaseSync | null {
  const db = new DatabaseSync(duongDan);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("CREATE TABLE IF NOT EXISTS luot_quay (id INTEGER PRIMARY KEY, ten TEXT)");
  const them = db.prepare("INSERT INTO luot_quay (ten) VALUES (?)");
  for (let i = 0; i < soDong; i++) them.run(`Nguyễn Thị Hoa ${i}`);
  if (dongMo) return db;
  db.close();
  return null;
}

function demDong(duongDan: string): number {
  const db = new DatabaseSync(duongDan, { readOnly: true });
  try {
    return (db.prepare("SELECT COUNT(*) AS n FROM luot_quay").get() as { n: number }).n;
  } finally {
    db.close();
  }
}

describe("sao lưu cơ sở dữ liệu", () => {
  let thuMuc: string;
  let nguon: string;
  let dich: string;

  beforeEach(() => {
    thuMuc = mkdtempSync(join(tmpdir(), "vq-sao-luu-"));
    nguon = join(thuMuc, "vong-quay.db");
    dich = join(thuMuc, "sao-luu");
  });
  afterEach(() => rmSync(thuMuc, { recursive: true, force: true }));

  it("🔴 bản sao MỞ ĐƯỢC và đếm ĐỦ DÒNG như bản gốc", () => {
    dungCsdl(nguon, 37);

    const { duongDan, soByte } = taoBanSaoLuu({ nguon, dich });
    expect(existsSync(duongDan)).toBe(true);
    // Một tệp 0 byte cũng "tồn tại" — đó đúng là cách CSDL thật từng bị thay
    // bằng tệp rỗng mà app vẫn khởi động, trắng trơn, không một dòng lỗi.
    expect(soByte).toBeGreaterThan(0);
    expect(demDong(duongDan)).toBe(37);
    expect(demDong(nguon)).toBe(37);
  });

  it("🔴 bắt được cả dữ liệu ĐANG NẰM TRONG -wal khi app còn đang chạy", () => {
    const dangMo = dungCsdl(nguon, 12, true)!;
    try {
      // Chưa đóng kết nối ⇒ phần lớn dữ liệu còn ở `.db-wal`. Chép mỗi tệp `.db`
      // ở thời điểm này là cầm về một bản sao THIẾU mà trông y như bản đầy đủ.
      expect(existsSync(`${nguon}-wal`)).toBe(true);
      const { duongDan } = taoBanSaoLuu({ nguon, dich });
      expect(demDong(duongDan)).toBe(12);
    } finally {
      dangMo.close();
    }
  });

  it("🔴 chạy 20 lần thì CHỈ CÒN 14 bản, và giữ đúng 14 bản MỚI NHẤT", () => {
    dungCsdl(nguon, 3);

    const tenDaTao: string[] = [];
    for (let i = 0; i < 20; i++) {
      // Mỗi lượt lùi một phút: tên tệp có độ phân giải phút, chạy 20 lần trong
      // cùng một phút thật thì lượt thứ hai đã đâm vào cửa "đã tồn tại".
      const luc = new Date(Date.UTC(2026, 0, 1, 0, i));
      tenDaTao.push(tenBanSaoLuu(luc));
      saoLuu({ nguon, dich, luc });
    }

    const conLai = readdirSync(dich).sort();
    expect(conLai).toHaveLength(14);
    expect(conLai).toEqual(tenDaTao.slice(-14).sort());
    // Bản sao còn lại vẫn phải mở được, không phải chỉ còn cái tên.
    expect(demDong(join(dich, conLai[0]))).toBe(3);
  });

  it("giữ được số bản khác 14 khi truyền `giuLai`", () => {
    dungCsdl(nguon, 1);
    for (let i = 0; i < 5; i++) {
      saoLuu({ nguon, dich, giuLai: 2, luc: new Date(Date.UTC(2026, 0, 1, 0, i)) });
    }
    expect(readdirSync(dich).filter((t) => t.endsWith(".db"))).toHaveLength(2);
  });

  it("xoay vòng KHÔNG đụng tệp lạ trong thư mục sao lưu", () => {
    dungCsdl(nguon, 1);
    for (let i = 0; i < 3; i++) {
      saoLuu({ nguon, dich, giuLai: 1, luc: new Date(Date.UTC(2026, 0, 1, 0, i)) });
    }
    const ghiChu = join(dich, "doc-truoc-khi-phuc-hoi.txt");
    writeFileSync(ghiChu, "bản sao ngoài ổ cứng để ở tủ tài liệu");
    xoayVong({ dich, giuLai: 1 });

    // Xoá nhầm tệp ghi chú của người vận hành một lần là mất niềm tin vào cả cơ chế.
    expect(existsSync(ghiChu)).toBe(true);
    expect(readdirSync(dich).filter((t) => t.endsWith(".db"))).toHaveLength(1);
  });

  it("🔴 nguồn KHÔNG tồn tại thì NÉM lỗi, TUYỆT ĐỐI không đẻ ra tệp rỗng", () => {
    const khongCo = join(thuMuc, "khong-he-co.db");
    expect(() => taoBanSaoLuu({ nguon: khongCo, dich })).toThrow(/Không tìm thấy/);
    // `new DatabaseSync(<đường dẫn không tồn tại>)` là TẠO một tệp rỗng. Một
    // script sao lưu mà tự đẻ ra CSDL rỗng thì chính nó là thứ gây mất dữ liệu.
    expect(existsSync(khongCo)).toBe(false);
  });

  it("trùng tên (chạy hai lần trong cùng một phút) thì DỪNG, không ghi đè", () => {
    dungCsdl(nguon, 5);
    const luc = new Date(Date.UTC(2026, 0, 1, 8, 30));
    taoBanSaoLuu({ nguon, dich, luc });
    expect(() => taoBanSaoLuu({ nguon, dich, luc })).toThrow(/đã tồn tại/);
    expect(readdirSync(dich)).toHaveLength(1);
  });

  it("tên bản sao theo GIỜ VIỆT NAM, không theo giờ UTC", () => {
    // 01/01/2026 lúc 18:30 UTC = 02/01/2026 lúc 01:30 giờ Việt Nam. Lấy giờ máy
    // thì người đi tìm bản sao "hôm qua" sẽ tìm nhầm ngày.
    expect(tenBanSaoLuu(new Date("2026-01-01T18:30:00Z"))).toBe("2026-01-02-0130.db");
  });

  it("thư mục đích chưa có thì tự tạo", () => {
    dungCsdl(nguon, 2);
    const sau = join(thuMuc, "chua", "co", "thu-muc");
    expect(existsSync(sau)).toBe(false);
    const { duongDan } = taoBanSaoLuu({ nguon, dich: sau });
    expect(demDong(duongDan)).toBe(2);
  });

  it("xoay vòng trên thư mục chưa tồn tại: trả mảng rỗng, không ném", () => {
    expect(xoayVong({ dich: join(thuMuc, "khong-co-thu-muc-nay") })).toEqual([]);
  });
});
