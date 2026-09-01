import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { T } from "@/config/locale";

/**
 * Canh `config/locale.ts` không tích rác.
 *
 * Vì sao cần: xoá một trang thì component biến mất, nhưng chuỗi tiếng Việt của
 * nó vẫn nằm lại trong từ điển và **không có gì báo**. Trang `/cai-dat` bị xoá
 * đã để lại 46 khoá mồ côi sống sót qua 360 test và cả build — chỉ đếm tay mới
 * lòi ra. Test này biến việc đếm tay đó thành một cổng tự động.
 */

const GOC = fileURLToPath(new URL("..", import.meta.url));
const BO_QUA = new Set(["node_modules", ".next", "out", ".git", "du-lieu", "anh-chup"]);
const DUOI = new Set([".ts", ".tsx", ".mjs", ".js"]);

/** Mọi file mã của ứng dụng, trừ chính từ điển. */
function fileMaNguon(thuMuc: string, gom: string[] = []): string[] {
  for (const ten of readdirSync(thuMuc)) {
    if (BO_QUA.has(ten)) continue;
    const duongDan = join(thuMuc, ten);
    if (statSync(duongDan).isDirectory()) fileMaNguon(duongDan, gom);
    else if (DUOI.has(extname(duongDan)) && !duongDan.endsWith("config/locale.ts")) {
      gom.push(duongDan);
    }
  }
  return gom;
}

describe("từ điển tiếng Việt", () => {
  it("không còn khoá mồ côi — mọi khoá đều có ít nhất một chỗ dùng", () => {
    const maNguon = fileMaNguon(GOC)
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");

    const moCoi = Object.keys(T).filter(
      (khoa) => !new RegExp(`T\\.${khoa}\\b`).test(maNguon),
    );

    expect(
      moCoi,
      `Khoá không nơi nào dùng — xoá khỏi config/locale.ts:\n  ${moCoi.join(" · ")}`,
    ).toEqual([]);
  });

  it("mọi chuỗi hiển thị đều có nội dung, không có ô rỗng bỏ quên", () => {
    const rong = Object.entries(T)
      .filter(([, giaTri]) => typeof giaTri === "string" && giaTri.trim() === "")
      .map(([khoa]) => khoa);

    expect(rong, `Khoá rỗng: ${rong.join(" · ")}`).toEqual([]);
  });
});
