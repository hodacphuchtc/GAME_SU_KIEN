/**
 * Nền cho kịch bản "nhận diện xong thì HAI MÀN cùng đổi" (GĐ 3.1 sổ v2).
 *
 * Dựng MỘT cơ sở và BA chương trình, mỗi game một cái:
 *   TSG1 — Trúng Số  (số trúng 211, 2 số/giây, không khoá nút)
 *   CSG1 — Chọn Số   (dải 1→100, loại trừ TẮT)
 *   VQG1 — Vòng Quay (4 ô, tổng tỉ lệ trúng đúng 100 %)
 *
 * 🔴 Ba game cùng một nền là chủ ý: cú "rời màn chờ" phải giống nhau ở cả ba, và
 * dựng riêng từng nền là cách chắc chắn để một game bị sót mà không ai thấy.
 */
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();

db.prepare(
  "insert into co_so (ma, ten, dia_chi, trang_thai, tao_luc, sua_luc) values (?, ?, ?, 'bat', ?, ?)",
).run("CS1", "Trung tâm Sata Robo Hải Châu", "114 Hoàng Diệu, Đà Nẵng", luc, luc);
const coSoId = db.prepare("select last_insert_rowid() as id").get().id;

// Nhịp chậm và KHÔNG khoá nút — bấm chủ động được thay vì rình may rủi.
const thamSo = JSON.stringify({
  startSpeed: 2,
  maxSpeed: 2,
  rampSeconds: 0,
  lockSeconds: 0,
  roundLimitSeconds: 180,
  countdownSeconds: 0,
});

const themCt = db.prepare(
  `insert into chuong_trinh
     (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
      trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi,
      dai_tu, dai_den, loai_tru_da_ra, tao_luc, sua_luc)
   values (?, ?, ?, 'custom', ?, ?, 0, 'dang_chay', ?, ?, 'gan_san', 1, ?,
           ?, ?, 0, ?, ?)`,
);

themCt.run("TSG1", "Trung tâm Sata Robo Hải Châu", 211, thamSo, "Balo STEM", coSoId, "tai_quay", "trung_so", 1, 100, luc, luc);
// TSG2 — chế độ THỨ BA: vẫn tại quầy, nhưng điện thoại vẽ luôn dãy số (GĐ 4.2).
themCt.run("TSG2", "Trung tâm Sata Robo Hải Châu", 211, thamSo, "Balo STEM", coSoId, "tai_quay_hai_man", "trung_so", 1, 100, luc, luc);
const idTS2 = db.prepare("select id from chuong_trinh where ma = 'TSG2'").get().id;
const idTS = db.prepare("select id from chuong_trinh where ma = 'TSG1'").get().id;
themCt.run("CSG1", "Trung tâm Sata Robo Hải Châu", 0, thamSo, "Quà Tết 2026", coSoId, "tai_quay", "chon_so", 1, 100, luc, luc);
// CSG2 — Chọn Số ở chế độ THỨ BA (GĐ 4.3).
themCt.run("CSG2", "Trung tâm Sata Robo Hải Châu", 0, thamSo, "Quà Tết 2026", coSoId, "tai_quay_hai_man", "chon_so", 1, 100, luc, luc);
themCt.run("VQG1", "Trung tâm Sata Robo Hải Châu", 0, thamSo, "Trung thu 2026", coSoId, "tai_quay", "vong_quay", 1, 100, luc, luc);
const idVQ = db.prepare("select id from chuong_trinh where ma = 'VQG1'").get().id;

db.prepare(
  `insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, tao_luc, sua_luc)
   values (?, 'Balo STEM', 0, null, 0, ?, ?)`,
).run(idTS, luc, luc);
db.prepare(
  `insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, tao_luc, sua_luc)
   values (?, 'Balo STEM', 0, null, 0, ?, ?)`,
).run(idTS2, luc, luc);

// 🔴 Tổng tỉ lệ trúng phải đúng 1 (ADR-012); ô cuối để trống số lượng = ô an ủi.
const O = [
  ["Balo STEM", 3, 0.1, "#6B21A8"],
  ["Bút chì", 10, 0.3, "#F97316"],
  ["Voucher 50k", 5, 0.15, "#5EEAD4"],
  ["Lời chúc may mắn", null, 0.45, "#FACC15"],
];
const themO = db.prepare(
  `insert into o_qua (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, ti_le_trung,
                      mau, phien_ban, tao_luc, sua_luc)
   values (?, ?, ?, ?, 0, ?, ?, 1, ?, ?)`,
);
O.forEach(([ten, sl, tiLe, mau], i) => themO.run(idVQ, ten, i, sl, tiLe, mau, luc, luc));

console.log(
  "đã dựng nền: TSG1 · TSG2 (Trúng Số hai màn) · CSG1 · CSG2 (Chọn Số hai màn) · VQG1",
);
db.close();
