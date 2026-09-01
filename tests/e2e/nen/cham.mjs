/**
 * Dựng nền cho bài nghiệm thu GĐ 13: một chương trình chạy CHẬM (2 số/giây) để
 * bấm trúng chủ động được, kho quà 2 Balo + 1 loại đáy không giới hạn.
 *
 * Chạy bằng node:sqlite thẳng vào tệp CSDL tạm — lược đồ đã do máy chủ dựng khi
 * khởi động, ở đây chỉ chèn dữ liệu.
 */
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();

db.prepare(
  "insert into co_so (ma, ten, dia_chi, trang_thai, tao_luc, sua_luc) values (?, ?, ?, 'bat', ?, ?)",
).run("CS1", "Trung tâm Sata Robo Hải Châu", "114 Hoàng Diệu, Đà Nẵng", luc, luc);
const coSoId = db.prepare("select last_insert_rowid() as id").get().id;

const thamSo = JSON.stringify({
  startSpeed: 2,
  maxSpeed: 2,
  rampSeconds: 0,
  lockSeconds: 0,
  roundLimitSeconds: 180,
  countdownSeconds: 0,
});

db.prepare(
  `insert into chuong_trinh
     (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
      trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi, tao_luc, sua_luc)
   values (?, ?, ?, 'custom', ?, ?, 0, 'dang_chay', ?, 'tai_quay', 'gan_san', 1, 'trung_so', ?, ?)`,
).run("CHAM", "Trung tâm Sata Robo Hải Châu", 20, thamSo, "Giải khai lúc tạo", coSoId, luc, luc);
const ctId = db.prepare("select last_insert_rowid() as id").get().id;

const themQua = db.prepare(
  `insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, gia_tri, tao_luc, sua_luc)
   values (?, ?, ?, ?, 0, null, ?, ?)`,
);
themQua.run(ctId, "Balo STEM", 0, 2, luc, luc);
themQua.run(ctId, "Buổi học thử", 1, null, luc, luc);

console.log("đã dựng nền: chương trình CHAM, số trúng 0020, kho 2 Balo + đáy Buổi học thử");
db.close();
