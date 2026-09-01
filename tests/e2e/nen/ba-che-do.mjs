/** Nền GĐ 17: 2 cơ sở, 3 chương trình (online tự chọn · online gán sẵn · tại quầy), 1 quản trị. */
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";
const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();
const idSau = () => db.prepare("select last_insert_rowid() as id").get().id;
function bam(mk) {
  const N = 16384, r = 8, p = 1, muoi = randomBytes(16);
  return ["scrypt", N, r, p, muoi.toString("hex"),
    scryptSync(mk.normalize("NFC"), muoi, 32, { N, r, p }).toString("hex")].join("$");
}
const themCoSo = db.prepare(
  "insert into co_so (ma, ten, dia_chi, trang_thai, tao_luc, sua_luc) values (?, ?, ?, 'bat', ?, ?)");
themCoSo.run("CS1", "Cơ sở Hải Châu", "211 Nguyễn Hữu Thọ, Đà Nẵng", luc, luc);
const cs1 = idSau();
themCoSo.run("CS2", "Cơ sở Thanh Khê", "114 Hoàng Diệu, Đà Nẵng", luc, luc);
const cs2 = idSau();

const thamSo = JSON.stringify({
  startSpeed: 2, maxSpeed: 2, rampSeconds: 0, lockSeconds: 0,
  roundLimitSeconds: 180, countdownSeconds: 0,
});
const themCt = db.prepare(
  `insert into chuong_trinh
     (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
      trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi, tao_luc, sua_luc)
   values (?, ?, 20, 'custom', ?, 'Quà', 0, 'dang_chay', ?, ?, ?, 1, 'trung_so', ?, ?)`);
themCt.run("ONCHON", "Cơ sở Hải Châu", thamSo, cs1, "online", "phu_huynh_chon", luc, luc);
themCt.run("ONGAN", "Cơ sở Hải Châu", thamSo, cs1, "online", "gan_san", luc, luc);
themCt.run("QUAY", "Cơ sở Hải Châu", thamSo, cs1, "tai_quay", "gan_san", luc, luc);

db.prepare(
  `insert into nhan_vien (co_so_id, ho_ten, ten_dang_nhap, mat_khau_bam, vai_tro, trang_thai, tao_luc, sua_luc)
   values (null, 'Nguyễn Văn Sếp', 'sep', ?, 'quan_tri', 'dang_lam', ?, ?)`,
).run(bam("matkhau12345"), luc, luc);

console.log("nền GĐ 17 xong (CS2 id =", cs2, ")");
db.close();
