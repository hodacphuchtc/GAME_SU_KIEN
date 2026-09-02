/** Nền cho kịch bản thương hiệu: một chương trình mức "Dễ" và một chương trình chạy chậm. */
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();
const idSau = () => db.prepare("select last_insert_rowid() as id").get().id;

db.prepare(
  "insert into co_so (ma, ten, dia_chi, trang_thai, tao_luc, sua_luc) values (?, ?, ?, 'bat', ?, ?)",
).run("CS1", "Trung tâm Sata Robo Hải Châu", "211 Nguyễn Hữu Thọ, Đà Nẵng", luc, luc);
const cs1 = idSau();

const CHAM = JSON.stringify({
  startSpeed: 2, maxSpeed: 2, rampSeconds: 0, lockSeconds: 0,
  roundLimitSeconds: 180, countdownSeconds: 0,
});
// 🔴 Bản mức "Dễ" SAU 02/09/2026: phẳng hẳn (`ramp = lock = 0`, `startSpeed =
// maxSpeed`) và `roundLimitSeconds` rút đi đúng 6 giây để bù — xem hạng mục 2.1
// của `PLAN_TONG_HOP_V2.md` và bài kiểm "phép bù" ở `tests/bo-dem.test.ts`.
//
// 🔴 Nền này BẮT BUỘC phải theo kịp: từ khi bỏ chữ "ĐANG TĂNG TỐC", nút trên
// điện thoại luôn mang nhãn "DỪNG" — kể cả trong 6 giây còn khoá của bản cũ.
// Kịch bản chờ nút "DỪNG" rồi bấm liền, và cú bấm ấy rơi vào một nút ĐANG BỊ VÔ
// HIỆU: không có gì xảy ra, màn thua không bao giờ hiện, và bài kiểm đỏ vì một
// lý do chẳng liên quan gì tới thương hiệu.
const DE = JSON.stringify({
  startSpeed: 400, maxSpeed: 400, rampSeconds: 0, lockSeconds: 0,
  roundLimitSeconds: 54, countdownSeconds: 3,
});

const themCt = db.prepare(
  `insert into chuong_trinh
     (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
      trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi, tao_luc, sua_luc)
   values (?, ?, ?, 'custom', ?, 'Balo STEM', 0, 'dang_chay', ?, 'tai_quay', 'gan_san', 1, 'trung_so', ?, ?)`,
);
themCt.run("QUAY", "Trung tâm Sata Robo Hải Châu", 211, DE, cs1, luc, luc);
themCt.run("CHAM", "Trung tâm Sata Robo Hải Châu", 20, CHAM, cs1, luc, luc);

console.log("nền thương hiệu xong: QUAY (mức Dễ) · CHAM (chạy chậm)");
db.close();
