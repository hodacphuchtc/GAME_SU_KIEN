/**
 * Mở cơ sở dữ liệu MỘT lần cho cả tiến trình.
 *
 * Giữ ở `globalThis` chứ không phải biến module: `next dev` nạp lại module mỗi
 * lần sửa code, nếu để biến module thì mỗi lần lưu file lại mở thêm một kết nối
 * và bỏ rơi kết nối cũ — chạy vài chục lần là hết bộ nhớ.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { doiTenTep } from "./doi-ten-tep";
import { LUOC_DO } from "./luoc-do";
import { nangCap } from "./nang-cap";

const KHOA = Symbol.for("game-su-kien.csdl");

type Kho = typeof globalThis & { [KHOA]?: DatabaseSync };

/** Tên cũ giữ lại để đổi tên được; sau vài phiên bản không còn máy nào dùng thì bỏ. */
const TEN_TEP_CU = "dem-so.db";
const TEN_TEP = "game-su-kien.db";

export function duongDanCsdl(): string {
  return (
    process.env.GAME_SU_KIEN_CSDL ??
    process.env.DEM_SO_CSDL ??
    resolve(process.cwd(), "du-lieu", TEN_TEP)
  );
}

/**
 * Chỉ đổi tên khi dùng ĐƯỜNG DẪN MẶC ĐỊNH. Có biến môi trường nghĩa là người
 * dùng (hoặc bộ test) đang tự chỉ định chỗ — đụng vào là vượt quyền.
 */
function doiTenNeuCan(duongDan: string): void {
  if (process.env.GAME_SU_KIEN_CSDL || process.env.DEM_SO_CSDL) return;
  doiTenTep(resolve(process.cwd(), "du-lieu", TEN_TEP_CU), duongDan);
}

export function moCsdl(duongDan = duongDanCsdl()): DatabaseSync {
  // TRƯỚC khi mở: đổi tên tệp đang có tiến trình giữ là cách chắc chắn để hỏng.
  doiTenNeuCan(duongDan);
  const db = new DatabaseSync(duongDan);
  db.exec(LUOC_DO);
  // Lược đồ dựng hình dạng lý tưởng cho CSDL trắng; nâng cấp kéo CSDL cũ về đó.
  nangCap(db);
  return db;
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
