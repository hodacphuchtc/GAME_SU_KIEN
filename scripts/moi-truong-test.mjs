#!/usr/bin/env node
/**
 * MÔI TRƯỜNG TEST — dựng sẵn CẢ BA GAME để bấm thử bằng tay.
 *
 * 🔴 DÙNG MỘT CƠ SỞ DỮ LIỆU RIÊNG (`du-lieu/test-that.db`), KHÔNG đụng một byte
 * nào của `game-su-kien.db` đang phục vụ quầy. Đây không phải cẩn thận thừa: CSDL
 * thật đang giữ hồ sơ khách có họ tên và số điện thoại phụ huynh, và một script
 * dựng dữ liệu thử ghi nhầm vào đó là chuyện không hoàn tác được.
 *
 * 🔴 Mỗi lần chạy là XOÁ SẠCH và dựng lại từ đầu. Test trên dữ liệu còn sót của
 * lần trước là cách chắc chắn để "chạy được" mà không biết vì sao chạy được.
 *
 * Dùng: npm run test-that
 */
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { randomBytes, scryptSync } from "node:crypto";
import { resolve } from "node:path";

const CONG = Number(process.env.PORT ?? 3111);
const TEP = resolve(process.cwd(), "du-lieu", "test-that.db");
const TAI_KHOAN = "test";
const MAT_KHAU = "test12345";

/** IP LAN để in ra địa chỉ điện thoại quét được. `localhost` thì QR vô dụng. */
function diaChiLan() {
  for (const ds of Object.values(networkInterfaces())) {
    for (const net of ds ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

function chay(lenh, thamSo, moiTruong = {}) {
  return new Promise((xong, hong) => {
    const con = spawn(lenh, thamSo, {
      stdio: "inherit",
      shell: false,
      env: { ...process.env, ...moiTruong },
    });
    con.on("exit", (ma) => (ma === 0 ? xong() : hong(new Error(`${lenh} thoát mã ${ma}`))));
    con.on("error", hong);
  });
}

// ── Dọn sạch ────────────────────────────────────────────────────────────────
mkdirSync("du-lieu", { recursive: true });
for (const hau of ["", "-wal", "-shm"]) rmSync(TEP + hau, { force: true });
console.log("\n› Đã xoá cơ sở dữ liệu test cũ, dựng lại từ đầu.");

// ── Dựng bản build (lược đồ + nâng cấp chạy khi máy chủ khởi động) ───────────
console.log("› Đang dựng bản chạy…\n");
await chay("node_modules/.bin/next", ["build"]);

// Khởi động một lần cho `nangCap()` dựng trọn lược đồ, rồi tắt — cách chắc chắn
// nhất để lược đồ test khớp 100% lược đồ thật, thay vì chép tay một bản dễ lệch.
console.log("\n› Dựng lược đồ bằng chính máy chủ (không chép tay)…");
const KHOA_TAM = randomBytes(32).toString("hex");
await new Promise((xong, hong) => {
  const con = spawn("node_modules/.bin/next", ["start", "-p", String(CONG + 900)], {
    stdio: "ignore",
    env: { ...process.env, GAME_SU_KIEN_CSDL: TEP, GAME_SU_KIEN_KHOA_PHIEN: KHOA_TAM },
  });
  const thoi = setTimeout(() => {
    con.kill("SIGTERM");
    xong();
  }, 6000);
  con.on("error", (e) => {
    clearTimeout(thoi);
    hong(e);
  });
});
// Chờ tiến trình nhả tệp.
await new Promise((r) => setTimeout(r, 800));

const db = new DatabaseSync(TEP);
db.exec("PRAGMA foreign_keys = ON");
const luc = Date.now();
const q = (sql, ...t) => db.prepare(sql).run(...t);
const idMoi = () => Number(db.prepare("select last_insert_rowid() as id").get().id);

// ── Cơ sở ───────────────────────────────────────────────────────────────────
q("insert into co_so (ma, ten, trang_thai, tao_luc, sua_luc) values ('CS1','Cơ sở Hoa Mai','bat',?,?)", luc, luc);
const cs1 = idMoi();
q("insert into co_so (ma, ten, trang_thai, tao_luc, sua_luc) values ('CS2','Cơ sở Hoàng Diệu','bat',?,?)", luc, luc);
const cs2 = idMoi();

// ── Tài khoản quản trị ──────────────────────────────────────────────────────
const muoi = randomBytes(16);
const [N, r, p] = [16384, 8, 1];
const bam = scryptSync(MAT_KHAU.normalize("NFC"), muoi, 32, { N, r, p });
q(
  `insert into nhan_vien (co_so_id, ho_ten, ten_dang_nhap, mat_khau_bam, vai_tro, trang_thai, tao_luc, sua_luc)
   values (null, 'Người test', ?, ?, 'quan_tri', 'dang_lam', ?, ?)`,
  TAI_KHOAN,
  ["scrypt", N, r, p, muoi.toString("hex"), bam.toString("hex")].join("$"),
  luc,
  luc,
);

// ── Ba chương trình, mỗi game một cái ───────────────────────────────────────
function taoChuongTrinh({ ma, ten, troChoi, soTrung = 0, daiTu = 1, daiDen = 100, coSoId }) {
  q(
    `insert into chuong_trinh
       (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong, tran_giai_moi_ngay,
        trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi, tro_choi,
        dai_tu, dai_den, loai_tru_da_ra, ti_le_o_day, phien_ban_o, tao_luc, sua_luc)
     values (?, ?, ?, 'vua', null, ?, 0, 'dang_chay', ?, 'tai_quay', 'gan_san', 1, ?,
             ?, ?, 0, 0.5, 1, ?, ?)`,
    ma, ten, soTrung, ten, coSoId, troChoi, daiTu, daiDen, luc, luc,
  );
  return idMoi();
}

const idTS = taoChuongTrinh({ ma: "TEST", ten: "Thử Trúng Số", troChoi: "trung_so", soTrung: 211, coSoId: cs1 });
// Chọn Số không có kho quà riêng (dải số CHÍNH LÀ phần quà), nên không giữ id.
taoChuongTrinh({ ma: "CHON", ten: "Thử Chọn Số", troChoi: "chon_so", daiTu: 1, daiDen: 20, coSoId: cs1 });
const idVQ = taoChuongTrinh({ ma: "QUAY", ten: "Thử Vòng Quay", troChoi: "vong_quay", coSoId: cs2 });

// Kho quà cho Trúng Số — 🔴 phải có ít nhất một loại KHÔNG giới hạn, nếu không
// hết quà là hết trò ngay giữa lúc đang thử.
q(`insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, tao_luc, sua_luc)
   values (?,'Balo STEM',0,5,0,?,?)`, idTS, luc, luc);
q(`insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, tao_luc, sua_luc)
   values (?,'Sticker',1,null,0,?,?)`, idTS, luc, luc);

// Ô quà cho Vòng Quay — ô CUỐI để trống số lượng: đó là ô an ủi bắt buộc.
const O = [
  ["Balo STEM", 3, "#6B21A8"],
  ["Bút chì", 10, "#F97316"],
  ["Voucher 50k", 5, "#5EEAD4"],
  ["Lời chúc may mắn", null, "#FACC15"],
];
O.forEach(([ten, sl, mau], i) => {
  q(`insert into o_qua (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, mau, phien_ban, tao_luc, sua_luc)
     values (?,?,?,?,0,?,1,?,?)`, idVQ, ten, i, sl, mau, luc, luc);
});

db.close();

// ── In bảng hướng dẫn ───────────────────────────────────────────────────────
const may = diaChiLan();
const G = `http://${may}:${CONG}`;
const gach = "─".repeat(74);
console.log(`\n${gach}`);
console.log("  MÔI TRƯỜNG TEST — BA GAME ĐÃ DỰNG SẴN");
console.log(gach);
console.log("\n  ĐĂNG NHẬP QUẢN TRỊ");
console.log(`    ${G}/quan-tri`);
console.log(`    tài khoản: ${TAI_KHOAN}      mật khẩu: ${MAT_KHAU}`);
console.log("\n  BA GAME — mỗi game một MÀN LCD và một ĐƯỜNG CHƠI");
for (const [ten, ma] of [["Trúng Số", "TEST"], ["Chọn Số", "CHON"], ["Vòng Quay", "QUAY"]]) {
  console.log(`\n    ${ten}`);
  console.log(`      màn LCD   ${G}/man-hinh/${ma}`);
  console.log(`      điện thoại ${G}/choi/${ma}`);
}
console.log("\n  🔴 MỞ MÀN LCD BẰNG ĐỊA CHỈ IP Ở TRÊN, ĐỪNG DÙNG localhost.");
console.log("     Mã QR sinh từ địa chỉ đang mở; mở bằng localhost thì điện thoại");
console.log("     quét vào sẽ trỏ về CHÍNH NÓ. Màn LCD có dải cảnh báo cho ca đó.");
console.log("\n  Dữ liệu test nằm ở:");
console.log(`    ${TEP}`);
console.log("    Cơ sở dữ liệu THẬT (game-su-kien.db) KHÔNG bị đụng tới.");
console.log("    Chạy lại lệnh này là xoá sạch và dựng lại từ đầu.");
console.log(`${gach}\n`);

await chay("node_modules/.bin/next", ["start", "-H", "0.0.0.0", "-p", String(CONG)], {
  GAME_SU_KIEN_CSDL: TEP,
  GAME_SU_KIEN_KHOA_PHIEN: randomBytes(32).toString("hex"),
});
