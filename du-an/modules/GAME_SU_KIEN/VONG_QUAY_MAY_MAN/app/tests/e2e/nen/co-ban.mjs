/**
 * Dựng nền: một chương trình đang chạy với 3 ô quà thật + 1 ô đáy.
 *
 * Chạy bằng `node:sqlite` thẳng vào tệp CSDL tạm — lược đồ đã do máy chủ dựng
 * khi khởi động, ở đây chỉ chèn dữ liệu.
 *
 * In ra MÃ chương trình ở dòng cuối để bộ chạy/kịch bản đọc lại.
 */
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();
// 🔴 Mã phải HỢP LỆ theo `lib/chuong-trinh/ma.ts`: đúng 5 ký tự, và chỉ dùng
// bảng chữ đã bỏ ký tự dễ đọc nhầm (không có O/0, I/1/L, S/5, B/8, Z/2).
const MA = "THUE9";

db.prepare(
  `INSERT INTO chuong_trinh (ma, ten_co_so, ti_le_o_day, tran_giai_moi_ngay,
                             phien_ban_o, trang_thai, tao_luc, sua_luc)
   VALUES (?, ?, 0.5, 0, 1, 'dang_chay', ?, ?)`,
).run(MA, "Sata Robo Hải Châu", luc, luc);
const ctId = db.prepare("SELECT last_insert_rowid() AS id").get().id;

const themO = db.prepare(
  `INSERT INTO o_qua (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, mau, tao_luc, sua_luc)
   VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
);
themO.run(ctId, "Balo STEM", 1, 5, "#F97316", luc, luc);
themO.run(ctId, "Bút chì màu", 2, 5, "#6B21A8", luc, luc);
themO.run(ctId, "Sổ tay", 3, 5, "#5EEAD4", luc, luc);
// Ô ĐÁY: `so_luong` NULL = không giới hạn. Bắt buộc phải có ít nhất một ô như
// vậy, nếu không hết quà là vòng quay rỗng ngay giữa lúc có phụ huynh đứng đó.
themO.run(ctId, "Lời chúc may mắn", 4, null, "#FACC15", luc, luc);

console.log(MA);
