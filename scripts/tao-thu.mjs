#!/usr/bin/env node
/** Tạo nhanh một chương trình để thử tay. Dùng: node scripts/tao-thu.mjs [số] [mức] */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";

const so = Number(process.argv[2] ?? 211);
const muc = process.argv[3] ?? "vua";
mkdirSync("du-lieu", { recursive: true });
const db = new DatabaseSync("du-lieu/game-su-kien.db");

const BANG_CHU = "ACDEFGHJKLMNPQRTUVWXY3479";
const ma = Array.from(
  { length: 4 },
  () => BANG_CHU[Math.floor(Math.random() * BANG_CHU.length)],
).join("");
const luc = Date.now();

db.prepare(
  `insert into chuong_trinh (ma, ten_trung_tam, so_trung, muc_do, ten_giai_thuong,
     tran_giai_moi_ngay, trang_thai, tao_luc, sua_luc)
   values (?, ?, ?, ?, ?, 0, 'dang_chay', ?, ?)`,
).run(ma, "Trung tâm Hoa Mai", so, muc, "Voucher 200k", luc, luc);

console.log(ma);
