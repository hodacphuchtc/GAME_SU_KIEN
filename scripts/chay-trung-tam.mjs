#!/usr/bin/env node
/**
 * Chạy MỘT LỆNH cho cả trung tâm: máy chủ trung chuyển (cho màn hình LCD) và
 * web (cho điện thoại phụ huynh), rồi in sẵn các địa chỉ cần mở.
 *
 * Vì sao cần script này thay vì hai lệnh: quên bật một trong hai là hỏng theo
 * kiểu rất khó đoán — mã QR vẫn hiện, điện thoại vẫn chơi được, nhưng màn hình
 * LCD im lìm không chiếu gì. Gộp lại thì không quên được nữa, và Ctrl-C tắt cả
 * hai chứ không bỏ sót tiến trình chạy ngầm.
 */

import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

const WEB_PORT = Number(process.env.PORT ?? 3000);
const RELAY_PORT = Number(process.env.PORT_RELAY ?? 3001);

function lanAddress() {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

const host = lanAddress();
const children = [];

function run(label, command, args, env) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  const tag = (line) => `[${label}] ${line}`;
  child.stdout.on("data", (d) =>
    String(d).split("\n").filter(Boolean).forEach((l) => console.log(tag(l))),
  );
  child.stderr.on("data", (d) =>
    String(d).split("\n").filter(Boolean).forEach((l) => console.error(tag(l))),
  );
  child.on("exit", (code) => {
    console.error(tag(`đã dừng (mã ${code})`));
    stopAll(code ?? 1);
  });
  children.push(child);
  return child;
}

let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

run("trung-chuyen", process.execPath, ["server/relay.mjs"], {
  PORT_RELAY: String(RELAY_PORT),
});
run("web", "npx", ["next", "dev", "-H", "0.0.0.0", "-p", String(WEB_PORT)]);

setTimeout(() => {
  console.log("");
  console.log("──────────────────────────────────────────────────────────────");
  console.log("  MỞ TRÊN MÁY NỐI VỚI MÀN HÌNH LCD (rồi bật toàn màn hình):");
  console.log(`    http://${host}:${WEB_PORT}/man-hinh/?so=0211&muc=vua`);
  console.log("");
  console.log("  TRANG NHÂN VIÊN (đổi số trúng, chọn độ khó, in mã QR):");
  console.log(`    http://${host}:${WEB_PORT}/cai-dat/`);
  console.log("");
  console.log("  Phụ huynh chỉ cần QUÉT MÃ QR đang hiện trên màn hình LCD.");
  console.log(`  Máy chủ trung chuyển: http://${host}:${RELAY_PORT}/suc-khoe`);
  console.log("──────────────────────────────────────────────────────────────");
  console.log("");
}, 2500);
