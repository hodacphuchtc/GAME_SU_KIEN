/**
 * Nền GĐ 21: 2 cơ sở, mỗi cơ sở 1 chương trình, và **ván chơi đã xong kèm hồ sơ
 * phụ huynh** — không có ván thì bảng lịch sử rỗng và không kiểm được cột nào cả.
 *
 * Tài khoản: `sep` (toàn quyền) · `sale1` (CS1) · `sale2` (CS2), mật khẩu
 * `matkhau12345` cho cả ba.
 */
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();
const idSau = () => db.prepare("select last_insert_rowid() as id").get().id;

function bam(mk) {
  const N = 16384, r = 8, p = 1;
  const muoi = randomBytes(16);
  return ["scrypt", N, r, p, muoi.toString("hex"),
    scryptSync(mk.normalize("NFC"), muoi, 32, { N, r, p }).toString("hex")].join("$");
}

const themCoSo = db.prepare(
  "insert into co_so (ma, ten, trang_thai, tao_luc, sua_luc) values (?, ?, 'bat', ?, ?)");
themCoSo.run("CS1", "Cơ sở Hải Châu", luc, luc);
const cs1 = idSau();
themCoSo.run("CS2", "Cơ sở Thanh Khê", luc, luc);
const cs2 = idSau();

const thamSo = JSON.stringify({
  startSpeed: 2, maxSpeed: 2, rampSeconds: 0, lockSeconds: 0,
  roundLimitSeconds: 180, countdownSeconds: 0,
});
const themCt = db.prepare(
  `insert into chuong_trinh
     (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
      trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi, tao_luc, sua_luc)
   values (?, ?, 20, 'custom', ?, 'Quà', 0, 'dang_chay', ?, 'tai_quay', 'gan_san', 1, 'trung_so', ?, ?)`);
themCt.run("CTA", "Cơ sở Hải Châu", thamSo, cs1, luc, luc);
const ctA = idSau();
themCt.run("CTB", "Cơ sở Thanh Khê", thamSo, cs2, luc, luc);

const themNv = db.prepare(
  `insert into nhan_vien (co_so_id, ho_ten, ten_dang_nhap, mat_khau_bam, vai_tro, trang_thai, tao_luc, sua_luc)
   values (?, ?, ?, ?, ?, 'dang_lam', ?, ?)`);
themNv.run(null, "Nguyễn Văn Sếp", "sep", bam("matkhau12345"), "quan_tri", luc, luc);
themNv.run(cs1, "Sale Một", "sale1", bam("matkhau12345"), "sale", luc, luc);
themNv.run(cs2, "Sale Hai", "sale2", bam("matkhau12345"), "sale", luc, luc);

// ── Hai ván ĐÃ XONG ở CTA: một có danh tính, một ẩn danh ────────────────────
// Ván ẩn danh là ca thật: nhân viên bấm thử thẳng trên màn hình lớn, không có
// hồ sơ nào. Bảng phải vẽ được nó mà không vỡ.
const ngay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(luc));

db.prepare(
  `insert into nguoi_choi (so_dien_thoai, ho_ten, dong_y_tu_van, tao_luc, sua_luc)
   values (?, ?, 1, ?, ?)`,
).run("0912345678", "Dương Thị Hoa", luc, luc);
const nc = idSau();

const themLuot = db.prepare(
  `insert into luot_choi
     (chuong_trinh_id, nguoi_choi_id, ngay, bat_dau_luc, ket_thuc_luc, so_da_dung,
      trung, khoang_lech, het_gio, thiet_bi_bam)
   values (?, ?, ?, ?, ?, ?, ?, ?, 0, 'dien_thoai')`);
const themVan = db.prepare(
  `insert into van_choi
     (chuong_trinh_id, nguoi_choi_id, co_so_id, ngay, so_lan_cho_phep, so_lan_da_dung,
      luot_tot_nhat_id, trung, ma_xac_thuc, da_trao_thuong, bat_dau_luc, ket_thuc_luc,
      tao_luc, sua_luc)
   values (?, ?, ?, ?, 1, 1, ?, ?, ?, 0, ?, ?, ?, ?)`);

themLuot.run(ctA, nc, ngay, luc - 6000, luc - 5000, 18, 0, 2);
themVan.run(ctA, nc, cs1, ngay, idSau(), 0, null, luc - 6000, luc - 5000, luc, luc);

themLuot.run(ctA, null, ngay, luc - 4000, luc - 3000, 20, 1, 0);
themVan.run(ctA, null, cs1, ngay, idSau(), 1, "ABC123", luc - 4000, luc - 3000, luc, luc);

// Khách tiềm năng của CS1 — để kiểm rằng xoá/ẩn về sau không đụng tới nó.
db.prepare(
  `insert into khach_tiem_nang (co_so_id, nguoi_choi_id, chuong_trinh_id_dau, trang_thai, tao_luc, sua_luc)
   values (?, ?, ?, 'moi', ?, ?)`,
).run(cs1, nc, ctA, luc, luc);

console.log("nền GĐ 21 xong");
db.close();
