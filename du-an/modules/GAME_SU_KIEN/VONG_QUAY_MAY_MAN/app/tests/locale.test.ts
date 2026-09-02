import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { T } from "@/config/locale";

/**
 * Test khói của V.0. Nó canh đúng một luật: MỌI chuỗi hiển thị nằm ở
 * `config/locale.ts`, và file đó không có khoá trùng.
 *
 * Vì sao đáng một test: TypeScript KHÔNG báo lỗi khi một object literal có hai
 * khoá trùng tên trong vài cấu hình — khoá sau lặng lẽ đè khoá trước, và chuỗi
 * biến mất khỏi giao diện mà không ai biết.
 */
describe("config/locale.ts", () => {
  const duongDan = fileURLToPath(new URL("../config/locale.ts", import.meta.url));
  const nguon = readFileSync(duongDan, "utf8");

  it("không có khoá trùng tên", () => {
    const khoa = [...nguon.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map(
      (m) => m[1],
    );
    const trung = khoa.filter((k, i) => khoa.indexOf(k) !== i);
    expect(trung).toEqual([]);
    expect(khoa.length).toBeGreaterThan(0);
  });

  it("không có chuỗi nào bỏ trống", () => {
    for (const [ten, gia] of Object.entries(T)) {
      if (typeof gia === "string") expect(gia.trim(), ten).not.toBe("");
    }
  });
});
