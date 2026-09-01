/** Nền GĐ 16: 2 cơ sở, mỗi cơ sở 1 chương trình chạy chậm, 1 quản trị + 2 sale. */
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
themCt.run("CTB", "Cơ sở Thanh Khê", thamSo, cs2, luc, luc);

const themNv = db.prepare(
  `insert into nhan_vien (co_so_id, ho_ten, ten_dang_nhap, mat_khau_bam, vai_tro, trang_thai, tao_luc, sua_luc)
   values (?, ?, ?, ?, ?, 'dang_lam', ?, ?)`);
themNv.run(null, "Nguyễn Văn Sếp", "sep", bam("matkhau12345"), "quan_tri", luc, luc);
themNv.run(cs1, "Sale Một", "sale1", bam("matkhau12345"), "sale", luc, luc);
themNv.run(cs1, "Sale Hai", "sale2", bam("matkhau12345"), "sale", luc, luc);

console.log("nền GĐ 16 xong");
db.close();
