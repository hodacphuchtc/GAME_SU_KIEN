/**
 * Tạo tài khoản quản trị đầu tiên.
 *
 *   node scripts/tao-quan-tri.mjs <tên đăng nhập> [họ tên]
 *
 * 🔴 Mật khẩu hỏi qua stdin, KHÔNG nhận qua tham số dòng lệnh: tham số lọt vào
 * `.zsh_history` và vào `ps` của mọi tiến trình khác trên máy.
 */
import { createInterface } from "node:readline";
import { randomBytes, scryptSync } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { resolve, dirname } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";

const tenDangNhap = (process.argv[2] ?? "").trim();
const hoTen = (process.argv[3] ?? tenDangNhap).trim();

if (tenDangNhap === "") {
  console.error("Thiếu tên đăng nhập.\n  node scripts/tao-quan-tri.mjs <tên đăng nhập> [họ tên]");
  process.exit(1);
}

function duongDanCsdl() {
  return (
    process.env.GAME_SU_KIEN_CSDL ??
    process.env.DEM_SO_CSDL ??
    resolve(process.cwd(), "du-lieu", "game-su-kien.db")
  );
}

/**
 * Đọc mật khẩu mà KHÔNG hiện lên màn hình — người đứng sau lưng cũng đọc được,
 * và ở quầy lễ tân thì luôn có người đứng sau lưng.
 *
 * 🔴 Hai đường hoàn toàn khác nhau, và phải khác nhau:
 *
 * - **Bàn phím thật:** readline che từng ký tự khi gõ.
 * - **Ống dẫn** (bài nghiệm thu tự động): readline phát hết các dòng ngay khi
 *   dữ liệu tới, nên câu hỏi thứ hai đăng ký sau thời điểm đó sẽ chờ mãi một
 *   dòng đã trôi qua. Đọc trọn stdin TRƯỚC rồi mới cắt dòng là hết treo.
 */
const banPhimThat = process.stdin.isTTY === true;

async function docTronStdin() {
  const manh = [];
  for await (const khuc of process.stdin) manh.push(khuc);
  return manh.join("").split(/\r?\n/);
}

async function hoiHaiLan(nhac1, nhac2) {
  if (!banPhimThat) {
    const dong = await docTronStdin();
    return [(dong[0] ?? "").trim(), (dong[1] ?? "").trim()];
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let dangHoi = "";
  const ghi = rl._writeToOutput?.bind(rl);
  rl._writeToOutput = function (chuoi) {
    // Chỉ cho hiện đúng câu nhắc; nuốt mọi ký tự người dùng gõ.
    if (dangHoi && chuoi.includes(dangHoi)) ghi?.(chuoi);
  };
  const hoi = (nhac) =>
    new Promise((tra) => {
      dangHoi = nhac;
      rl.question(nhac, (traLoi) => {
        dangHoi = "";
        process.stdout.write("\n");
        tra(traLoi.trim());
      });
    });

  const a = await hoi(nhac1);
  const b = await hoi(nhac2);
  rl.close();
  return [a, b];
}

const [matKhau, lai] = await hoiHaiLan(
  "Mật khẩu (không hiện lên màn hình): ",
  "Gõ lại mật khẩu: ",
);

if (matKhau.length < 8) {
  console.error("Mật khẩu phải từ 8 ký tự trở lên.");
  process.exit(1);
}
if (lai !== matKhau) {
  console.error("Hai lần gõ không khớp.");
  process.exit(1);
}

const N = 16384, r = 8, p = 1;
const muoi = randomBytes(16);
const bam = scryptSync(matKhau.normalize("NFC"), muoi, 32, { N, r, p });
const chuoiBam = ["scrypt", N, r, p, muoi.toString("hex"), bam.toString("hex")].join("$");

const duongDan = duongDanCsdl();
mkdirSync(dirname(duongDan), { recursive: true });
const db = new DatabaseSync(duongDan);
const luc = Date.now();

const daCo = db
  .prepare("select id from nhan_vien where ten_dang_nhap = ?")
  .get(tenDangNhap);

if (daCo) {
  db.prepare("update nhan_vien set mat_khau_bam = ?, vai_tro = 'quan_tri', trang_thai = 'dang_lam', sua_luc = ? where id = ?")
    .run(chuoiBam, luc, daCo.id);
  console.log(`Đã ĐỔI mật khẩu cho tài khoản "${tenDangNhap}".`);
} else {
  db.prepare(
    `insert into nhan_vien (co_so_id, ho_ten, ten_dang_nhap, mat_khau_bam, vai_tro, trang_thai, tao_luc, sua_luc)
     values (null, ?, ?, ?, 'quan_tri', 'dang_lam', ?, ?)`,
  ).run(hoTen, tenDangNhap, chuoiBam, luc, luc);
  console.log(`Đã tạo tài khoản quản trị "${tenDangNhap}".`);
}
db.close();

/**
 * Đã có khoá ký phiên chưa — hỏi CẢ HAI nơi.
 *
 * `npm run trung-tam` tự sinh khoá và giữ ở `du-lieu/khoa-phien.txt`. Chỉ nhìn biến môi
 * trường thì script này báo "chưa có khoá" trong khi khoá đã nằm sẵn trên đĩa — một cảnh
 * báo sai khiến nhân viên đi tìm một vấn đề không tồn tại.
 */
function daCoKhoa() {
  if ((process.env.GAME_SU_KIEN_KHOA_PHIEN ?? "").length >= 32) return true;
  try {
    return readFileSync("du-lieu/khoa-phien.txt", "utf8").trim().length >= 32;
  } catch {
    return false;
  }
}

if (!daCoKhoa()) {
  console.log(
    "\n⚠️  CHƯA CÓ KHOÁ KÝ PHIÊN — chưa ai đăng nhập được.\n" +
      "   Cách dễ nhất: chạy `npm run trung-tam`, nó tự sinh và giữ khoá lại.\n" +
      "   Hoặc tự đặt: export GAME_SU_KIEN_KHOA_PHIEN=<chuỗi ngẫu nhiên ≥ 32 ký tự>\n" +
      "   Sinh nhanh một chuỗi:\n" +
      "   node -e \"console.log(require('node:crypto').randomBytes(32).toString('hex'))\"",
  );
}
