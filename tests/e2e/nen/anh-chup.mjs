/**
 * Nền cho bộ CHỤP ẢNH: đủ mọi cảnh mà GĐ 20.1 cần trong MỘT cơ sở dữ liệu.
 *
 *   QUAY   tại quầy, 1 lần bấm, mức thường  → màn chờ · đang chạy · kết quả
 *   BALAN  tại quầy, 3 lần bấm              → màn giữa ván "Lần 2/3"
 *   CHAM   tại quầy, chạy CHẬM (2 số/giây)  → bấm trúng chủ động được
 *   ONCHON online, phụ huynh tự chọn cơ sở  → hai cảnh của chế độ online
 */
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();
const idSau = () => db.prepare("select last_insert_rowid() as id").get().id;

const themCoSo = db.prepare(
  "insert into co_so (ma, ten, dia_chi, trang_thai, tao_luc, sua_luc) values (?, ?, ?, 'bat', ?, ?)",
);
themCoSo.run("CS1", "Trung tâm Sata Robo Hải Châu", "211 Nguyễn Hữu Thọ, Đà Nẵng", luc, luc);
const cs1 = idSau();
themCoSo.run("CS2", "Trung tâm Sata Robo Thanh Khê", "114 Hoàng Diệu, Đà Nẵng", luc, luc);

const CHAM = JSON.stringify({
  startSpeed: 2, maxSpeed: 2, rampSeconds: 0, lockSeconds: 0,
  roundLimitSeconds: 180, countdownSeconds: 0,
});
// Mức "de" thật: hàng trăm đổi 4 lần/giây — đúng cảm giác ngoài đời.
const DE = JSON.stringify({
  startSpeed: 150, maxSpeed: 400, rampSeconds: 6, lockSeconds: 6,
  roundLimitSeconds: 60, countdownSeconds: 3,
});

const themCt = db.prepare(
  `insert into chuong_trinh
     (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
      trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi, tao_luc, sua_luc)
   values (?, ?, ?, 'custom', ?, 'Balo STEM', 0, 'dang_chay', ?, ?, ?, ?, 'trung_so', ?, ?)`,
);
themCt.run("QUAY", "Trung tâm Sata Robo Hải Châu", 211, DE, cs1, "tai_quay", "gan_san", 1, luc, luc);
themCt.run("BALAN", "Trung tâm Sata Robo Hải Châu", 211, DE, cs1, "tai_quay", "gan_san", 3, luc, luc);
themCt.run("CHAM", "Trung tâm Sata Robo Hải Châu", 20, CHAM, cs1, "tai_quay", "gan_san", 1, luc, luc);
const idCham = idSau();
themCt.run("ONCHON", "Trung tâm Sata Robo Hải Châu", 20, CHAM, cs1, "online", "phu_huynh_chon", 1, luc, luc);

// Kho quà cho CHAM: một loại có hạn + một loại đáy, để dựng được cảnh chấm ĐỎ.
const themQua = db.prepare(
  `insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, gia_tri, tao_luc, sua_luc)
   values (?, ?, ?, ?, 0, null, ?, ?)`,
);
themQua.run(idCham, "Balo STEM", 0, 5, luc, luc);
themQua.run(idCham, "Buổi học thử", 1, null, luc, luc);

console.log("nền chụp ảnh xong: QUAY · BALAN · CHAM · ONCHON");
db.close();
