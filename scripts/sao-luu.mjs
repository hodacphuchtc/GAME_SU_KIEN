#!/usr/bin/env node
/**
 * SAO LƯU CƠ SỞ DỮ LIỆU — lưới an toàn DUY NHẤT của dữ liệu khách hàng.
 *
 * Vì sao phải có: `du-lieu/` nằm trong `.gitignore`, nên KHÔNG có bản nào trong
 * git. Bản duy nhất của mọi phụ huynh từng để lại số điện thoại nằm trên đĩa một
 * chiếc máy đặt ở quầy lễ tân. Đổ nước, mất cắp, hay SSD chết là mất sạch.
 *
 * 🔴 VÌ SAO `VACUUM INTO` CHỨ KHÔNG PHẢI `cp`: cơ sở dữ liệu chạy chế độ WAL nên
 * dữ liệu mới nhất nằm ở tệp `.db-wal` cho tới lúc SQLite gộp lại. Trên máy thật
 * hiện `.db` là 40 KB còn `.db-wal` là 399 KB — chép mỗi tệp `.db` là cầm về một
 * bản sao THIẾU gần hết dữ liệu mới, mà lại trông y như một bản sao đầy đủ.
 * `VACUUM INTO` bắt SQLite tự viết ra một bản nhất quán, gộp sẵn WAL vào.
 *
 * Viết bằng `.mjs` thay vì `.ts` để vừa chạy thẳng bằng `node` (không cần dựng)
 * vừa nạp được vào Vitest — một bản mã, không có bản sao thứ hai để lệch nhau.
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Giữ 14 bản — hai tuần. Đủ để phát hiện ra hỏng dữ liệu kiểu âm thầm (ai đó xoá
 * nhầm hôm thứ Ba, thứ Sáu mới có người nhận ra) mà vẫn chỉ tốn vài trăm KB.
 */
export const SO_BAN_GIU_LAI = Number(process.env.GAME_SU_KIEN_SAO_LUU_GIU ?? 14);

const MUI_GIO = "Asia/Ho_Chi_Minh";

/** Cùng quy ước với `lib/db/ket-noi.ts`. Giữ tên biến cũ để bản đang chạy không gãy. */
export function duongDanCsdl() {
  return (
    process.env.GAME_SU_KIEN_CSDL ??
    process.env.DEM_SO_CSDL ??
    resolve(process.cwd(), "du-lieu", "game-su-kien.db")
  );
}

/**
 * Mặc định để bản sao NGOÀI thư mục dự án. Nằm trong thì `git clean -fdx` hoặc
 * một lần xoá thư mục dự án là cuốn theo luôn cả bản sao — đúng lúc cần nó nhất.
 */
export function thuMucSaoLuu() {
  return process.env.GAME_SU_KIEN_SAO_LUU ?? resolve(process.cwd(), "..", "sao-luu-game-su-kien");
}

/**
 * Tên bản sao theo GIỜ VIỆT NAM, dạng `YYYY-MM-DD-HHmm.db`.
 * Chốt múi giờ chứ không lấy giờ máy: máy chủ đặt múi khác thì tên tệp nhảy ngày
 * giữa buổi làm, và người đi tìm bản sao "hôm qua" sẽ tìm nhầm.
 * Đặt tên tăng dần theo thời gian nên **xếp theo bảng chữ cái = xếp theo thời gian**
 * — nhờ vậy khâu xoay vòng không cần đọc `mtime` của từng tệp.
 */
/**
 * @param {Date} [luc]
 * @returns {string}
 */
export function tenBanSaoLuu(luc = new Date()) {
  const phan = new Intl.DateTimeFormat("en-CA", {
    timeZone: MUI_GIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(luc);
  const lay = (loai) => phan.find((p) => p.type === loai)?.value ?? "00";
  return `${lay("year")}-${lay("month")}-${lay("day")}-${lay("hour")}${lay("minute")}.db`;
}

/** Nháy đơn trong đường dẫn phải nhân đôi — SQLite không nhận tham số cho VACUUM INTO. */
function chuoiSql(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

/**
 * Tạo MỘT bản sao nhất quán. Ném lỗi tiếng Việt rõ ràng thay vì im lặng, vì một
 * bản sao hỏng mà không ai biết còn tệ hơn không có bản sao nào.
 */
/**
 * @param {{ nguon?: string, dich?: string, luc?: Date }} [tuyChon]
 * @returns {{ duongDan: string, soByte: number }}
 */
export function taoBanSaoLuu({ nguon = duongDanCsdl(), dich = thuMucSaoLuu(), luc } = {}) {
  if (!existsSync(nguon)) {
    throw new Error(`Không tìm thấy cơ sở dữ liệu để sao lưu: ${nguon}`);
  }
  mkdirSync(dich, { recursive: true });

  const duongDan = join(dich, tenBanSaoLuu(luc));
  if (existsSync(duongDan)) {
    throw new Error(
      `Bản sao lưu ${basename(duongDan)} đã tồn tại — dừng lại thay vì ghi đè. ` +
        `Đợi sang phút sau rồi chạy lại, hoặc xoá tệp đó nếu chắc chắn không cần.`,
    );
  }

  // 🔴 CHỈ ĐỌC. Một script sao lưu mà tự đẻ ra CSDL rỗng thì nó chính là thứ
  // gây mất dữ liệu. `VACUUM INTO` chạy được trên kết nối chỉ đọc vì nó ghi ra
  // TỆP KHÁC. Hái về từ app Vòng Quay khi gộp (ADR-011).
  const db = new DatabaseSync(nguon, { readOnly: true });
  try {
    db.exec(`VACUUM INTO ${chuoiSql(duongDan)}`);
  } finally {
    db.close();
  }
  return { duongDan, soByte: statSync(duongDan).size };
}

/**
 * Xoá bớt bản cũ, giữ lại `giuLai` bản mới nhất. Chỉ đụng tệp `.db` do chính
 * hàm này đặt tên — thư mục sao lưu có thể có tệp ghi chú của người dùng, xoá
 * nhầm một lần là mất niềm tin vào cả cơ chế.
 */
/**
 * @param {{ dich?: string, giuLai?: number }} [tuyChon]
 * @returns {string[]} tên các bản đã xoá
 */
export function xoayVong({ dich = thuMucSaoLuu(), giuLai = SO_BAN_GIU_LAI } = {}) {
  if (!existsSync(dich)) return [];
  const ten = readdirSync(dich)
    .filter((t) => /^\d{4}-\d{2}-\d{2}-\d{4}\.db$/.test(t))
    .sort();
  const thua = ten.slice(0, Math.max(0, ten.length - giuLai));
  for (const t of thua) rmSync(join(dich, t), { force: true });
  return thua;
}

/** Một lượt trọn vẹn: tạo bản mới rồi dọn bản cũ. */
/**
 * @param {{ nguon?: string, dich?: string, giuLai?: number, luc?: Date }} [tuyChon]
 * @returns {{ duongDan: string, soByte: number, daXoa: string[] }}
 */
export function saoLuu({
  nguon = duongDanCsdl(),
  dich = thuMucSaoLuu(),
  giuLai = SO_BAN_GIU_LAI,
  luc,
} = {}) {
  const { duongDan, soByte } = taoBanSaoLuu({ nguon, dich, luc });
  return { duongDan, soByte, daXoa: xoayVong({ dich, giuLai }) };
}

// ── Chạy thẳng bằng `node scripts/sao-luu.mjs` ────────────────────────────────
const laChayThang =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (laChayThang) {
  const nguon = duongDanCsdl();
  const dich = thuMucSaoLuu();
  try {
    const { duongDan, soByte, daXoa } = saoLuu({ nguon, dich });
    const kb = (soByte / 1024).toFixed(1);
    console.log(`✅ Đã sao lưu: ${duongDan}  (${kb} KB)`);
    if (daXoa.length > 0) console.log(`   Dọn ${daXoa.length} bản cũ: ${daXoa.join(", ")}`);
    console.log(`   Đang giữ tối đa ${SO_BAN_GIU_LAI} bản trong ${dirname(duongDan)}`);
  } catch (loi) {
    console.error(`❌ Sao lưu THẤT BẠI: ${loi.message}`);
    console.error(`   Nguồn: ${nguon}`);
    console.error(`   Đích:  ${dich}`);
    process.exit(1);
  }
}
