/**
 * Mở cơ sở dữ liệu MỘT lần cho cả tiến trình.
 *
 * Chép từ GAME_SU_KIEN/app/lib/db/ket-noi.ts @ 3d96358. Sửa so với bản gốc:
 * đổi biến môi trường sang VONG_QUAY_CSDL, bỏ lớp đổi tên tệp cũ (app này chưa
 * từng mang tên khác), thêm `moDeDoc()`.
 *
 * 🔴 Giữ ở `globalThis` chứ không phải biến module: `next dev` nạp lại module
 * mỗi lần sửa code, để ở biến module thì mỗi lần lưu file lại mở thêm một kết
 * nối và bỏ rơi kết nối cũ — chạy vài chục lần là hết bộ nhớ.
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { LUOC_DO } from "./luoc-do";
import { nangCap } from "./nang-cap";

const KHOA = Symbol.for("vong-quay.csdl");

type Kho = typeof globalThis & { [KHOA]?: DatabaseSync };

export function duongDanCsdl(): string {
  return process.env.VONG_QUAY_CSDL ?? resolve(process.cwd(), "du-lieu", "vong-quay.db");
}

export function moCsdl(duongDan = duongDanCsdl()): DatabaseSync {
  const db = new DatabaseSync(duongDan);
  db.exec(LUOC_DO);
  // Lược đồ dựng hình dạng lý tưởng cho CSDL trắng; nâng cấp kéo CSDL cũ về đó.
  nangCap(db);
  return db;
}

/**
 * 🔴 MỞ CHỈ ĐỌC — dùng cho MỌI lệnh chẩn đoán, script soi, việc chỉ xem dữ liệu.
 *
 * Vì sao phải có hàm riêng: `new DatabaseSync(duongDan)` vào một đường dẫn KHÔNG
 * tồn tại là TẠO ra một tệp rỗng. Ở app Trúng Số, một lệnh chẩn đoán gõ nhầm
 * đường dẫn đã đẻ ra tệp 0 byte, rồi tệp rỗng đó bị mang đặt vào chỗ CSDL thật —
 * app vẫn khởi động, trang vẫn mở, TRẮNG TRƠN, không một dòng báo lỗi.
 *
 * Hàm này ném lỗi thay vì tạo tệp. Đọc dữ liệu thì gọi nó, đừng gọi `moCsdl`.
 */
export function moDeDoc(duongDan = duongDanCsdl()): DatabaseSync {
  if (duongDan !== ":memory:" && !existsSync(duongDan)) {
    throw new Error(`Không có cơ sở dữ liệu tại: ${duongDan}`);
  }
  return new DatabaseSync(duongDan, { readOnly: true });
}

export function csdl(): DatabaseSync {
  const kho = globalThis as Kho;
  if (!kho[KHOA]) {
    const duongDan = duongDanCsdl();
    if (duongDan !== ":memory:") mkdirSync(dirname(duongDan), { recursive: true });
    kho[KHOA] = moCsdl(duongDan);
  }
  return kho[KHOA];
}

/** Chỉ dùng trong test — đóng và quên kết nối đang giữ. */
export function dongCsdl(): void {
  const kho = globalThis as Kho;
  kho[KHOA]?.close();
  delete kho[KHOA];
}
