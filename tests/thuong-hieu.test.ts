import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { mauThuongHieu } from "@/config/thuong-hieu";

/**
 * Canh `config/thuong-hieu.ts` khớp với `@theme` trong `app/globals.css`.
 *
 * Vì sao cần: Tailwind cần giá trị tĩnh lúc dựng nên KHÔNG import được file TS
 * vào CSS — hai nơi phải chép tay cho nhau. Không có gì canh thì chúng lệch
 * trong im lặng, và đã lệch thật: sáu màu (`tim-nhat`, `luc`, `do`, ba màu LED)
 * sống trong CSS mà file "nguồn giá trị duy nhất" không hề biết.
 *
 * Test đọc CSS bằng `node:fs` chứ không import — Vitest không parse CSS, và đọc
 * thô cũng đúng hơn: nó soi đúng cái chuỗi mà trình duyệt sẽ nhận.
 */

const CSS = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

/** `timNhat` → `tim-nhat`, để so với tên biến CSS. */
function sangKebab(ten: string): string {
  return ten.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Mọi `--color-X: #hex` khai trong khối `@theme`. */
function mauTrongCss(): Map<string, string> {
  const khoiTheme = /@theme\s*\{([\s\S]*?)\n\}/.exec(CSS);
  if (!khoiTheme) throw new Error("Không tìm thấy khối @theme trong app/globals.css");

  const bang = new Map<string, string>();
  for (const [, ten, hex] of khoiTheme[1].matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    bang.set(ten, hex.toLowerCase());
  }
  return bang;
}

describe("bảng màu thương hiệu", () => {
  const css = mauTrongCss();
  const ts = new Map(
    Object.entries(mauThuongHieu).map(([ten, hex]) => [sangKebab(ten), hex.toLowerCase()]),
  );

  it("mọi màu trong config đều có mặt trong @theme của globals.css", () => {
    const thieu = [...ts.keys()].filter((ten) => !css.has(ten));
    expect(
      thieu,
      `Có trong config/thuong-hieu.ts mà thiếu trong globals.css: ${thieu.map((t) => `--color-${t}`).join(" · ")}`,
    ).toEqual([]);
  });

  it("mọi màu trong @theme đều được khai trong config — không có màu sống ngoài sổ", () => {
    const thua = [...css.keys()].filter((ten) => !ts.has(ten));
    expect(
      thua,
      `Có trong globals.css mà thiếu trong config/thuong-hieu.ts: ${thua.map((t) => `--color-${t}`).join(" · ")}`,
    ).toEqual([]);
  });

  it("hai bên cùng một giá trị hex cho từng màu", () => {
    const lech: string[] = [];
    for (const [ten, hexTs] of ts) {
      const hexCss = css.get(ten);
      if (hexCss && hexCss !== hexTs) lech.push(`${ten}: config ${hexTs} ≠ css ${hexCss}`);
    }
    expect(lech, `Màu lệch giá trị:\n  ${lech.join("\n  ")}`).toEqual([]);
  });

  it("khai đủ ba màu nền tảng của bộ nhận diện", () => {
    // Tím ROBO · cam SATA · trắng nền — đổi ba màu này là đổi thương hiệu,
    // nên chúng được ghim cứng chứ không chỉ so hai file với nhau.
    expect(mauThuongHieu.tim).toBe("#6B21A8");
    expect(mauThuongHieu.cam).toBe("#F97316");
    expect(mauThuongHieu.trang).toBe("#FFFFFF");
  });
});
