/**
 * Dọn dữ liệu CHƠI THỬ, giữ lại danh mục tổ chức và tài khoản đăng nhập.
 *
 *   node scripts/don-du-lieu-thu.mjs --xem            ← chỉ xem, KHÔNG xoá gì
 *   node scripts/don-du-lieu-thu.mjs --xoa-that       ← xoá thật
 *   node scripts/don-du-lieu-thu.mjs --xoa-that --bo-co-so CS3,CS4
 *
 * 🔴 Dùng khi nào: sau đợt chạy thử, trước khi giao máy cho quầy. Nó xoá lịch sử
 * chơi thử để nhân viên không nhìn nhầm số liệu test thành số liệu thật.
 *
 * 🔴 Ba lớp chặn lỡ tay, cố ý làm phiền:
 *   1. Không có `--xoa-that` thì chỉ in ra, không đụng gì.
 *   2. Bắt buộc chạy `npm run sao-luu` trước — script tự kiểm có bản sao trong
 *      24 giờ qua không, không có thì từ chối chạy.
 *   3. In bảng trước/sau để người chạy đối chiếu ngay tại chỗ.
 *
 * GIỮ LẠI: `co_so` (trừ mã liệt kê ở `--bo-co-so`) · `nhan_vien` (tài khoản đăng
 * nhập — mất nó là không ai vào được trang quản trị nữa).
 * XOÁ: chương trình · ván · lượt · kho quà · hồ sơ phụ huynh · khách tiềm năng ·
 * nhật ký truy cập.
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const thamSo = process.argv.slice(2);
const xoaThat = thamSo.includes("--xoa-that");
const boCoSo = (() => {
  const i = thamSo.indexOf("--bo-co-so");
  if (i === -1 || !thamSo[i + 1]) return [];
  return thamSo[i + 1].split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
})();

const duongDan =
  process.env.GAME_SU_KIEN_CSDL ?? resolve(process.cwd(), "du-lieu", "game-su-kien.db");

// 🔴 Mở `DatabaseSync` vào đường dẫn không tồn tại là TẠO tệp rỗng — đã trả giá
// một lần, CSDL thật bị thay bằng tệp 0 byte. Kiểm trước, luôn luôn.
if (!existsSync(duongDan)) {
  console.error(`Không thấy cơ sở dữ liệu: ${duongDan}`);
  process.exit(1);
}

/** Có bản sao lưu nào trong 24 giờ qua không. Không có thì không cho xoá. */
function coSaoLuuMoi() {
  const thuMuc =
    process.env.GAME_SU_KIEN_SAO_LUU ?? resolve(process.cwd(), "..", "sao-luu-game-su-kien");
  if (!existsSync(thuMuc)) return false;
  const gioiHan = Date.now() - 24 * 60 * 60 * 1000;
  return readdirSync(thuMuc)
    .filter((t) => t.endsWith(".db"))
    .some((t) => statSync(resolve(thuMuc, t)).mtimeMs > gioiHan);
}

const BANG = [
  "co_so",
  "chuong_trinh",
  "van_choi",
  "luot_choi",
  "nguoi_choi",
  "khach_tiem_nang",
  "qua_tang",
  "nhan_vien",
  "nhat_ky_truy_cap",
];

const db = new DatabaseSync(duongDan);
db.exec("PRAGMA foreign_keys = ON");

function dem() {
  return Object.fromEntries(
    BANG.map((b) => [b, db.prepare(`select count(*) as n from ${b}`).get().n]),
  );
}

function inCoSo(nhan) {
  console.log(`\n${nhan}`);
  for (const c of db.prepare("select ma, ten, dia_chi, trang_thai from co_so order by id").all()) {
    console.log(`  ${c.ma} · ${c.ten} · ${c.dia_chi ?? "—"} · ${c.trang_thai}`);
  }
}

const truoc = dem();
console.log(`Cơ sở dữ liệu: ${duongDan}\n`);
console.log("=== ĐANG CÓ ===");
for (const b of BANG) console.log(`  ${b.padEnd(20)} ${truoc[b]}`);
inCoSo("=== CƠ SỞ ===");
if (boCoSo.length) console.log(`\nSẽ xoá thêm cơ sở: ${boCoSo.join(", ")}`);

if (!xoaThat) {
  console.log(
    "\n👀 Chế độ XEM — chưa xoá gì.\n" +
      "   Muốn xoá thật: node scripts/don-du-lieu-thu.mjs --xoa-that",
  );
  db.close();
  process.exit(0);
}

if (!coSaoLuuMoi()) {
  console.error(
    "\n🛑 TỪ CHỐI XOÁ — không thấy bản sao lưu nào trong 24 giờ qua.\n" +
      "   Chạy `npm run sao-luu` trước rồi gọi lại lệnh này.",
  );
  db.close();
  process.exit(1);
}

// Thứ tự TAY, không dựa vào cascade: `van_choi.luot_tot_nhat_id` trỏ sang
// `luot_choi` nên phải xoá ván TRƯỚC lượt, nếu không khoá ngoại chặn giữa chừng.
const BUOC = [
  ["nhật ký truy cập", "delete from nhat_ky_truy_cap"],
  ["khách tiềm năng", "delete from khach_tiem_nang"],
  ["ván chơi", "delete from van_choi"],
  ["lượt bấm", "delete from luot_choi"],
  ["kho quà", "delete from qua_tang"],
  ["chương trình", "delete from chuong_trinh"],
  ["hồ sơ phụ huynh", "delete from nguoi_choi"],
];

console.log("\n=== ĐANG XOÁ ===");
db.exec("begin");
try {
  for (const [ten, cau] of BUOC) {
    const kq = db.prepare(cau).run();
    console.log(`  ${String(kq.changes).padStart(4)} dòng · ${ten}`);
  }
  for (const ma of boCoSo) {
    const kq = db.prepare("delete from co_so where ma = ?").run(ma);
    console.log(`  ${String(kq.changes).padStart(4)} dòng · cơ sở ${ma}`);
  }
  db.exec("commit");
} catch (loi) {
  db.exec("rollback");
  console.error(`\n✗ HỎNG GIỮA CHỪNG — đã hoàn tác sạch, dữ liệu y như trước: ${loi.message}`);
  db.close();
  process.exit(1);
}

const sau = dem();
console.log("\n=== TRƯỚC → SAU ===");
for (const b of BANG) {
  const dau = truoc[b] === sau[b] ? "  " : "→ ";
  console.log(`  ${dau}${b.padEnd(20)} ${String(truoc[b]).padStart(4)} → ${sau[b]}`);
}
inCoSo("=== CƠ SỞ GIỮ LẠI ===");
console.log("\n=== TÀI KHOẢN GIỮ LẠI ===");
for (const n of db.prepare("select ho_ten, ten_dang_nhap, vai_tro from nhan_vien").all()) {
  console.log(`  ${n.ho_ten} · ${n.ten_dang_nhap ?? "(chưa cấp)"} · ${n.vai_tro}`);
}
db.close();
console.log("\n✅ Xong. Bản sao trước khi xoá nằm trong thư mục sao lưu.");
