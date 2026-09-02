/**
 * Dựng nền: chương trình mà ô quà THẬT chỉ còn ĐÚNG MỘT cái.
 *
 * Dùng cho kịch bản "ô hết hàng biến mất khỏi vòng" — quay một lượt là ô đó
 * hết, và vòng tiếp theo phải không còn nó nữa.
 */
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();
const MA = "HETHG";

db.prepare(
  `INSERT INTO chuong_trinh (ma, ten_co_so, ti_le_o_day, tran_giai_moi_ngay,
                             phien_ban_o, trang_thai, tao_luc, sua_luc)
   VALUES (?, ?, 0.5, 0, 1, 'dang_chay', ?, ?)`,
).run(MA, "Sata Robo Thanh Khê", luc, luc);
const ctId = db.prepare("SELECT last_insert_rowid() AS id").get().id;

const themO = db.prepare(
  `INSERT INTO o_qua (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, mau, tao_luc, sua_luc)
   VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
);
// Ô thật CHỈ CÒN MỘT CÁI — quay trúng nó là nó biến mất khỏi vòng.
themO.run(ctId, "Balo cuối cùng", 1, 1, "#F97316", luc, luc);
themO.run(ctId, "Lời chúc may mắn", 2, null, "#FACC15", luc, luc);

console.log(MA);
