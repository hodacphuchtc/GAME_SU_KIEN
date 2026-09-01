/**
 * Nền cho hai bài nghiệm thu game CHỌN SỐ.
 *
 * Dựng HAI chương trình, cố ý khác nhau ở đúng công tắc loại trừ:
 *   CSO1 — dải 1→100, loại trừ TẮT  (trùng số là hợp lệ)
 *   CSO2 — dải 1→3,   loại trừ BẬT  (dải nhỏ để lỗi lộ ra ngay lượt thứ hai)
 *
 * Cả hai chạy 2 số/giây, không khoá nút: bấm chủ động được thay vì rình may rủi.
 */
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();

db.prepare(
  "insert into co_so (ma, ten, dia_chi, trang_thai, tao_luc, sua_luc) values (?, ?, ?, 'bat', ?, ?)",
).run("CS1", "Trung tâm Sata Robo Hải Châu", "114 Hoàng Diệu, Đà Nẵng", luc, luc);
const coSoId = db.prepare("select last_insert_rowid() as id").get().id;

const themCt = db.prepare(
  `insert into chuong_trinh
     (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
      trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi,
      dai_tu, dai_den, loai_tru_da_ra, tao_luc, sua_luc)
   values (?, ?, 0, 'custom', ?, ?, 0, 'dang_chay', ?, 'tai_quay', 'gan_san', 1, 'chon_so',
           ?, ?, ?, ?, ?)`,
);

// `tham_so` không được game Chọn Số đọc (nó tự tính nhịp theo độ dài dải), nhưng
// cột vẫn phải có giá trị hợp lệ cho `doiDong`.
const thamSo = JSON.stringify({
  startSpeed: 2,
  maxSpeed: 2,
  rampSeconds: 0,
  lockSeconds: 0,
  roundLimitSeconds: 180,
  countdownSeconds: 0,
});

themCt.run("CSO1", "Trung tâm Sata Robo Hải Châu", thamSo, "Quà Tết 2026", coSoId, 1, 100, 0, luc, luc);
themCt.run("CSO2", "Trung tâm Sata Robo Hải Châu", thamSo, "Quà nhỏ ba số", coSoId, 1, 3, 1, luc, luc);

console.log("đã dựng nền: CSO1 (1–100, loại trừ TẮT) và CSO2 (1–3, loại trừ BẬT)");
db.close();
