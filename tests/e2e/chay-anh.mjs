/**
 * Bộ chạy riêng cho việc CHỤP ẢNH nghiệm thu (GĐ 20.1).
 *
 * Tách khỏi `chay.mjs` vì đây không phải bài test đạt/hỏng — nó dựng ra bộ ảnh
 * để người nhìn bằng mắt, và cần một cơ sở dữ liệu có đủ mọi cảnh trong CÙNG
 * một lượt chạy.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const CONG = Number(process.env.E2E_CONG ?? 3112);
const GOC = `http://localhost:${CONG}`;
const KHOA = randomBytes(32).toString("hex");
const thuMuc = mkdtempSync(join(tmpdir(), "gsk-anh-"));
const tep = join(thuMuc, "anh.db");
let mayChu = null;

function chay(lenh, tham, moiTruong = {}, vaoStdin) {
  return new Promise((xong, hong) => {
    const con = spawn(lenh, tham, {
      stdio: [vaoStdin ? "pipe" : "ignore", "inherit", "inherit"],
      env: { ...process.env, ...moiTruong },
    });
    if (vaoStdin) con.stdin.end(vaoStdin);
    con.on("exit", (ma) => (ma === 0 ? xong() : hong(new Error(`${lenh} thoát mã ${ma}`))));
  });
}

function dong() {
  if (mayChu && !mayChu.killed) mayChu.kill("SIGTERM");
  mayChu = null;
}
process.on("exit", dong);

try {
  const tra = await fetch(`${GOC}/api/gio`);
  if (tra.ok) {
    console.error(`✖ Cổng ${CONG} đang có máy chủ khác trả lời. Tắt nó rồi chạy lại.`);
    process.exit(1);
  }
} catch {
  // trống, đúng như mong đợi
}

console.log("› Dựng bản build…");
await chay("npm", ["run", "build"]);

mayChu = spawn("npx", ["next", "start", "-p", String(CONG)], {
  stdio: ["ignore", "ignore", "inherit"],
  env: { ...process.env, GAME_SU_KIEN_CSDL: tep, GAME_SU_KIEN_KHOA_PHIEN: KHOA },
});

for (let i = 0; i < 60; i += 1) {
  try {
    if ((await fetch(`${GOC}/quan-tri/vao`)).ok) break;
  } catch {
    // chưa lên
  }
  await new Promise((r) => setTimeout(r, 500));
}

await chay("node", ["tests/e2e/nen/anh-chup.mjs", tep]);
await chay(
  "node",
  ["scripts/tao-quan-tri.mjs", "sep", "Nguyễn Văn Sếp"],
  { GAME_SU_KIEN_CSDL: tep, GAME_SU_KIEN_KHOA_PHIEN: KHOA },
  "matkhau12345\nmatkhau12345\n",
);

console.log("\n› Chụp ảnh…");
await chay("node", ["tests/e2e/anh-chup.mjs"], { E2E_GOC: GOC });

dong();
rmSync(thuMuc, { recursive: true, force: true });
