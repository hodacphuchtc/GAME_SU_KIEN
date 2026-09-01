/**
 * Bộ chạy kiểm thử đầu–cuối.
 *
 *   npm run e2e            chạy hết
 *   npm run e2e -- gd11    chỉ kịch bản có tên chứa "gd11"
 *
 * Nó lo trọn vòng: khởi động máy chủ trên BẢN BUILD với một CSDL tạm, dựng nền
 * cho từng kịch bản, chạy, rồi tắt máy chủ THEO PID.
 *
 * 🔴 Ba thứ đã trả giá để học và được cài cứng ở đây:
 *   1. CSDL luôn là tệp TẠM — không kịch bản nào được đụng vào dữ liệu thật;
 *   2. chạy trên `next start`, KHÔNG phải `next dev` (dev chặn tài nguyên từ
 *      địa chỉ khác localhost và hành xử khác ở nhiều chỗ);
 *   3. tắt theo PID — `pkill -f "next start"` không khớp, tiến trình thật tên
 *      `next-server`, và máy chủ cũ còn sống sẽ trả lời thay bản mới.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const CONG = Number(process.env.E2E_CONG ?? 3111);
const GOC = `http://localhost:${CONG}`;

/** Kịch bản → tệp dựng nền (nếu cần) chạy trước. */
const KICH_BAN = [
  { ten: "gd11-co-so", nen: null },
  { ten: "gd12-van-nhieu-lan", nen: null },
  { ten: "gd12-ti-le-van", nen: null },
  { ten: "gd13-kho-qua", nen: "cham" },
  { ten: "gd13-canh-bao-kho", nen: "cham" },
  { ten: "gd14-am-thanh", nen: "cham" },
  { ten: "gd14-thuong-hieu", nen: "hai-che-do-cham" },
  // 🔴 Kịch bản này kiểm ĐÚNG trạng thái "chưa có tài khoản nào" — nên nó là
  // ngoại lệ duy nhất KHÔNG được tạo sẵn tài khoản.
  { ten: "gd15-khoa-cua-a", nen: "cham", taiKhoan: false },
  { ten: "gd15-khoa-cua-b", nen: "cham" },
  { ten: "gd15-phan-quyen", nen: "phan-quyen" },
  { ten: "gd15-nhat-ky", nen: "phan-quyen" },
  { ten: "gd16-khach-tiem-nang", nen: "hai-co-so" },
  { ten: "gd17-che-do-online", nen: "ba-che-do" },
  { ten: "gd19-xuat-excel", nen: "ba-che-do", chayCung: "gd17-che-do-online" },
  { ten: "gd21-lich-su-day-du", nen: "lich-su-day-du" },
];

const thuMuc = mkdtempSync(join(tmpdir(), "gsk-e2e-"));
const KHOA = randomBytes(32).toString("hex");
let mayChu = null;

function chay(lenh, tham, moiTruong = {}) {
  return new Promise((xong, hong) => {
    const con = spawn(lenh, tham, {
      stdio: "inherit",
      env: { ...process.env, ...moiTruong },
    });
    con.on("exit", (ma) => (ma === 0 ? xong() : hong(new Error(`${lenh} thoát mã ${ma}`))));
  });
}

/**
 * Chờ tới khi máy chủ SẴN SÀNG — và "sẵn sàng" ở đây nghĩa là CSDL đã có lược đồ.
 *
 * 🔴 Không dùng `/api/gio`: nó chỉ trả về giờ, không mở cơ sở dữ liệu. Đợi ở đó
 * rồi chạy tệp dựng nền thì nền ném "no such table: co_so" — lược đồ chỉ được
 * dựng ở lần đầu ai đó thật sự mở CSDL. `/quan-tri/vao` có đọc bảng nhân viên,
 * nên nó lên nghĩa là bảng đã có.
 */
async function doiSanSang(giay = 30) {
  for (let i = 0; i < giay * 2; i += 1) {
    try {
      const tra = await fetch(`${GOC}/quan-tri/vao`);
      if (tra.ok) return;
    } catch {
      // chưa lên, thử lại
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("máy chủ không lên sau khi chờ");
}

/**
 * 🔴 Gọi THẲNG `node_modules/.bin/next`, KHÔNG qua `npx`.
 *
 * `npx` là một lớp bọc: nó sinh ra tiến trình `next-server` làm con. Giết `npx`
 * thì `next-server` thành mồ côi, **vẫn sống và vẫn giữ cổng** — kịch bản sau
 * khởi động máy chủ mới thất bại vì cổng bận, rồi đo nhầm phiên bản cũ. Đây
 * đúng là vết sẹo "máy chủ cũ trả lời thay bản mới", ở một hình dạng khác.
 */
function moMayChu(tepCsdl) {
  mayChu = spawn("node_modules/.bin/next", ["start", "-p", String(CONG)], {
    stdio: ["ignore", "ignore", "inherit"],
    env: {
      ...process.env,
      GAME_SU_KIEN_CSDL: tepCsdl,
      GAME_SU_KIEN_KHOA_PHIEN: KHOA,
    },
  });
}

/** Chờ tới khi KHÔNG ai còn trả lời trên cổng — tắt xong không có nghĩa là đã nhả cổng. */
async function doiCongTrong(giay = 15) {
  for (let i = 0; i < giay * 4; i += 1) {
    try {
      await fetch(`${GOC}/api/gio`);
    } catch {
      return; // không ai trả lời ⇒ cổng đã trống
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`cổng ${CONG} vẫn bận sau khi tắt máy chủ`);
}

function dongMayChu() {
  // Tắt theo PID của tiến trình ta tự sinh — không dò theo tên.
  if (mayChu && !mayChu.killed) mayChu.kill("SIGTERM");
  mayChu = null;
}

process.on("exit", dongMayChu);
process.on("SIGINT", () => {
  dongMayChu();
  process.exit(130);
});

const loc = process.argv[2] ?? "";
const danhSach = KICH_BAN.filter((k) => k.ten.includes(loc));
if (danhSach.length === 0) {
  console.error(`Không có kịch bản nào khớp "${loc}".`);
  process.exit(1);
}

/**
 * 🔴 Cổng đang bận thì DỪNG, không chạy tiếp.
 *
 * Đây chính là vết sẹo đã trả giá: một máy chủ cũ còn sống giữ cổng và trả lời
 * mọi yêu cầu, nên cả bộ kiểm thử đo phiên bản CŨ mà báo xanh. Thà hỏng ồn ào.
 */
try {
  const tra = await fetch(`${GOC}/api/gio`);
  if (tra.ok) {
    console.error(
      `✖ Cổng ${CONG} ĐANG CÓ máy chủ khác trả lời. Tắt nó đi rồi chạy lại —\n` +
        "  chạy tiếp là đo nhầm phiên bản cũ mà vẫn báo xanh.\n" +
        "  Tìm tiến trình:  ps -eo pid,command | grep next-server",
    );
    process.exit(1);
  }
} catch {
  // Không ai trả lời — đúng như mong đợi.
}

console.log("› Dựng bản build…");
await chay("npm", ["run", "build"]);

const hong = [];
let truocDo = null;

for (const kb of danhSach) {
  // Kịch bản khai `chayCung` dùng lại nguyên trạng thái của kịch bản trước —
  // GĐ 19 xuất chính dữ liệu mà GĐ 17 vừa tạo ra.
  const dungLai = kb.chayCung && kb.chayCung === truocDo;
  const tep = dungLai ? `${thuMuc}/${kb.chayCung}.db` : `${thuMuc}/${kb.ten}.db`;

  try {
  if (!dungLai) {
    dongMayChu();
    await doiCongTrong();
    for (const hau of ["", "-wal", "-shm"]) rmSync(tep + hau, { force: true });
    moMayChu(tep);
    await doiSanSang();
    if (kb.nen) await chay("node", [`tests/e2e/nen/${kb.nen}.mjs`, tep]);
    // Từ GĐ 15 mọi trang quản trị đều bị chắn, nên MỌI kịch bản cần một tài
    // khoản. Tệp nền nào đã tự tạo `sep` thì lệnh này chỉ đổi mật khẩu.
    if (kb.taiKhoan !== false) {
      await new Promise((xong, loi) => {
        const con = spawn("node", ["scripts/tao-quan-tri.mjs", "sep", "Nguyễn Văn Sếp"], {
          stdio: ["pipe", "ignore", "inherit"],
          env: { ...process.env, GAME_SU_KIEN_CSDL: tep, GAME_SU_KIEN_KHOA_PHIEN: KHOA },
        });
        con.stdin.end("matkhau12345\nmatkhau12345\n");
        con.on("exit", (ma) => (ma === 0 ? xong() : loi(new Error("không tạo được tài khoản"))));
      });
    }
  }

  console.log(`\n──── ${kb.ten} ────`);
  try {
    await chay("node", [`tests/e2e/${kb.ten}.mjs`], { E2E_GOC: GOC });
  } catch {
    hong.push(kb.ten);
  }
  } catch (loi) {
    // Nền hỏng cũng là HỎNG — nhưng chỉ hỏng kịch bản đó, không kéo sập cả bộ.
    console.error(`  ✖ ${kb.ten}: ${(loi instanceof Error ? loi.message : String(loi))}`);
    if (!hong.includes(kb.ten)) hong.push(kb.ten);
  }
  truocDo = dungLai ? truocDo : kb.ten;
}

dongMayChu();
rmSync(thuMuc, { recursive: true, force: true });

console.log(`\n${"═".repeat(56)}`);
if (hong.length === 0) {
  console.log(`🟢 ${danhSach.length}/${danhSach.length} kịch bản e2e ĐỀU ĐẠT`);
  process.exit(0);
}
console.log(`🔴 HỎNG ${hong.length}/${danhSach.length}: ${hong.join(", ")}`);
process.exit(1);
