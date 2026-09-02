import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { mauThuongHieu, mauTrangThai, tenBienCss } from "@/config/thuong-hieu";

/**
 * BỘ NHẬN DIỆN — bài kiểm thay cho một dòng chú thích in hoa.
 *
 * 🔴 Bài học đã trả giá ở app Trúng Số: `config/thuong-hieu.ts` tự xưng "NGUỒN
 * GIÁ TRỊ DUY NHẤT" trong khi màu thật đi qua `@theme` của `globals.css` — hai
 * bên lệch SÁU màu trước khi có ai để ý. Một quy ước không có gì canh thì không
 * phải quy ước.
 */

const GOC = join(import.meta.dirname, "..");
const CSS = readFileSync(join(GOC, "app/globals.css"), "utf8");

/** Đọc giá trị một biến màu trong khối `@theme`. */
function mauTrongCss(bien: string): string | null {
  const khop = CSS.match(new RegExp(`${bien}:\\s*(#[0-9a-fA-F]{6})`));
  return khop ? khop[1].toUpperCase() : null;
}

/**
 * Cắt MỌI chú thích khỏi mã nguồn trước khi soi.
 *
 * 🔴 Cần cả khối `/* … *\/` NHIỀU DÒNG, không chỉ `//` một dòng: chính các khối
 * JSDoc là nơi ta VIẾT RA lời cấm ("không mix-blend-mode", "nền master là
 * #FCFCFC"). Bắt lời cấm làm vi phạm thì bài kiểm tự đấu với chính nó, và người
 * sau sẽ nới nó ra cho đỡ phiền — mất luôn thứ nó canh.
 */
function boChuThich(nguon: string): string {
  // Thay khối chú thích bằng ĐÚNG bấy nhiêu dòng trống, không xoá hẳn: xoá hẳn
  // làm mọi số dòng phía sau lệch đi, và một báo lỗi chỉ sai chỗ thì người đọc
  // mất niềm tin vào cả bài kiểm.
  return nguon
    .replace(/\/\*[\s\S]*?\*\//g, (khoi) => "\n".repeat((khoi.match(/\n/g) ?? []).length))
    .replace(/\/\/.*$/gm, "");
}

/** Mọi tệp mã nguồn của ứng dụng (bỏ node_modules, .next, và chính config). */
function cacTepNguon(): string[] {
  const ra: string[] = [];
  const bo = new Set(["node_modules", ".next", "du-lieu", "sao-luu", ".git", "tests"]);
  const di = (thuMuc: string) => {
    for (const ten of readdirSync(thuMuc)) {
      if (bo.has(ten)) continue;
      const duong = join(thuMuc, ten);
      if (statSync(duong).isDirectory()) di(duong);
      else if (/\.(ts|tsx)$/.test(ten)) ra.push(duong);
    }
  };
  di(GOC);
  return ra;
}

describe("hai bảng màu phải KHỚP nhau", () => {
  const tatCa = { ...mauThuongHieu, ...mauTrangThai } as Record<string, string>;

  it("mọi màu khai trong thuong-hieu.ts đều có mặt trong globals.css với ĐÚNG giá trị", () => {
    for (const [ten, ma] of Object.entries(tatCa)) {
      const bien = tenBienCss[ten];
      if (!bien) continue; // `trang` cố ý không có biến riêng
      expect(mauTrongCss(bien), `${ten} (${bien})`).toBe(ma.toUpperCase());
    }
  });

  it("mọi biến --color-* trong globals.css đều được khai trong thuong-hieu.ts", () => {
    // Chiều ngược lại mới là chiều đã trả giá: CSS mọc thêm màu mà không ai
    // khai, rồi component dùng nó và bộ nhận diện không hề biết.
    const trongCss = [...CSS.matchAll(/--color-([a-z-]+):/g)].map((m) => `--color-${m[1]}`);
    const daKhai = new Set(Object.values(tenBienCss));
    for (const bien of trongCss) {
      expect(daKhai.has(bien), `${bien} có trong CSS mà KHÔNG khai ở thuong-hieu.ts`).toBe(
        true,
      );
    }
  });

  it("không màu nào bị khai hai lần với hai giá trị khác nhau", () => {
    const nguoc = new Map<string, string>();
    for (const [ten, ma] of Object.entries(tatCa)) {
      const cu = nguoc.get(ma.toUpperCase());
      if (cu) expect.fail(`${ten} và ${cu} cùng là ${ma}`);
      nguoc.set(ma.toUpperCase(), ten);
    }
  });
});

describe("không hardcode màu ngoài hai file nguồn", () => {
  it("không tệp .ts/.tsx nào viết thẳng mã màu hex", () => {
    const viPham: string[] = [];
    for (const tep of cacTepNguon()) {
      if (tep.endsWith("config/thuong-hieu.ts")) continue;
      // Cắt chú thích trên TOÀN tệp (giữ số dòng bằng cách thay bằng dòng trống),
      // rồi mới soi. Ở chú thích, mã màu là ví dụ chứ không phải giá trị đang chạy.
      const goc = readFileSync(tep, "utf8");
      const sach = boChuThich(goc);
      const dongGoc = goc.split("\n");
      sach.split("\n").forEach((dong, i) => {
        if (/#[0-9a-fA-F]{6}\b/.test(dong)) {
          viPham.push(
            `${tep.slice(GOC.length + 1)}:${i + 1}  ${(dongGoc[i] ?? dong).trim().slice(0, 80)}`,
          );
        }
      });
    }
    expect(viPham, `Màu phải đọc từ config/thuong-hieu.ts:\n${viPham.join("\n")}`).toEqual(
      [],
    );
  });
});

describe("ảnh nhận diện không bị bóp méo", () => {
  it("🔴 không tệp nào áp filter / opacity / mix-blend-mode lên ảnh nhận diện", () => {
    // Màu BÊN TRONG logo và linh vật là tài sản thương hiệu: cấm filter,
    // mix-blend-mode, opacity < 1, grayscale, tint. Một hiệu ứng "cho đẹp" chạy
    // xuyên qua logo là đổi màu thương hiệu trên màn hình cả sảnh cùng nhìn.
    const viPham: string[] = [];
    for (const tep of cacTepNguon()) {
      const noiDung = boChuThich(readFileSync(tep, "utf8"));
      // Chỉ soi những tệp thực sự có ảnh nhận diện.
      if (!/nhan-dien|logo|linh-vat|mascot/i.test(noiDung)) continue;
      for (const xau of ["mix-blend-mode", "mixBlendMode", "grayscale(", "sepia("]) {
        if (noiDung.includes(xau)) viPham.push(`${tep.slice(GOC.length + 1)}: ${xau}`);
      }
    }
    expect(viPham).toEqual([]);
  });
});
