/** Nền cho nghiệm thu 15.2: 2 cơ sở, 3 tài khoản, 4 khách chia hai bên. */
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";

const db = new DatabaseSync(process.argv[2]);
const luc = Date.now();

function bam(mk) {
  const N = 16384, r = 8, p = 1;
  const muoi = randomBytes(16);
  const h = scryptSync(mk.normalize("NFC"), muoi, 32, { N, r, p });
  return ["scrypt", N, r, p, muoi.toString("hex"), h.toString("hex")].join("$");
}

const themCoSo = db.prepare(
  "insert into co_so (ma, ten, trang_thai, tao_luc, sua_luc) values (?, ?, 'bat', ?, ?)",
);
const idSau = () => db.prepare("select last_insert_rowid() as id").get().id;

themCoSo.run("CS1", "Cơ sở Hải Châu", luc, luc);
const cs1 = idSau();
themCoSo.run("CS2", "Cơ sở Thanh Khê", luc, luc);
const cs2 = idSau();

const themNv = db.prepare(
  `insert into nhan_vien (co_so_id, ho_ten, ten_dang_nhap, mat_khau_bam, vai_tro, trang_thai, tao_luc, sua_luc)
   values (?, ?, ?, ?, ?, 'dang_lam', ?, ?)`,
);
themNv.run(null, "Nguyễn Văn Sếp", "sep", bam("matkhau12345"), "quan_tri", luc, luc);
themNv.run(cs1, "Sale Hải Châu", "sale1", bam("matkhau12345"), "sale", luc, luc);
const sale1 = idSau();
themNv.run(cs2, "Sale Thanh Khê", "sale2", bam("matkhau12345"), "sale", luc, luc);
const sale2 = idSau();

const themNguoi = db.prepare(
  "insert into nguoi_choi (so_dien_thoai, ho_ten, dong_y_tu_van, tao_luc, sua_luc) values (?, ?, 1, ?, ?)",
);
const themLead = db.prepare(
  `insert into khach_tiem_nang (co_so_id, nguoi_choi_id, nhan_vien_id, trang_thai, tao_luc, sua_luc)
   values (?, ?, ?, 'moi', ?, ?)`,
);

for (const [sdt, ten, cs, nv] of [
  ["0900000001", "Khách Của Hải Châu", cs1, sale1],
  ["0900000002", "Khách Chưa Giao HC", cs1, null],
  ["0900000003", "Khách Của Thanh Khê", cs2, sale2],
  ["0900000004", "Khách Chưa Giao TK", cs2, null],
]) {
  themNguoi.run(sdt, ten, luc, luc);
  themLead.run(cs, idSau(), nv, luc, luc);
}

console.log("nền 15.2: 2 cơ sở, 3 tài khoản, 4 khách");
db.close();
