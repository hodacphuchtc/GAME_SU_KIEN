/**
 * Bộ chạy kiểm thử đầu–cuối của VÒNG QUAY MAY MẮN.
 *
 *   npm run e2e            chạy hết
 *   npm run e2e -- gd42    chỉ kịch bản có tên chứa "gd42"
 *
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/tests/e2e/chay.mjs` @ 3d96358, giữ
 * nguyên MỌI bản vá đã trả giá; sửa: cổng 3220, biến môi trường của app này,
 * và bỏ bước tạo tài khoản (bản này chỉ có MỘT mật khẩu qua biến môi trường).
 *
 * 🔴 Bốn thứ đã trả giá để học và được cài cứng ở đây:
 *   1. CSDL luôn là tệp TẠM — không kịch bản nào được đụng vào dữ liệu thật;
 *   2. chạy trên `next start`, KHÔNG phải `next dev`;
 *   3. tắt theo PID — `pkill -f "next start"` không khớp, tiến trình thật tên
 *      `next-server`, và máy chủ cũ còn sống sẽ trả lời thay bản mới;
 *   4. chờ tới khi KHÔNG AI còn trả lời trên cổng rồi mới mở máy chủ mới.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

const CONG = Number(process.env.E2E_CONG ?? 3220);
const GOC = `http://localhost:${CONG}`;

/** Kịch bản → tệp dựng nền (nếu cần) chạy trước. */
const KICH_BAN = [
  { ten: "gd42-hai-man-hinh", nen: "co-ban" },
  { ten: "gd63-chan-quan-tri", nen: "co-ban" },
  { ten: "gd64-o-het-hang", nen: "sap-het" },
  { ten: "gd65-mot-luot-mot-luc", nen: "co-ban" },
  { ten: "gd66-dung-lai-van", nen: "co-ban" },
];

const thuMuc = mkdtempSync(join(tmpdir(), "vqmm-e2e-"));
const KHOA = randomBytes(32).toString("hex");

/** Băm sẵn mật khẩu e2e — cùng thuật toán `lib/bao-ve/mat-khau.ts`. */
const MAT_KHAU = "matkhau-e2e-12345";
const MAT_KHAU_BAM = (() => {
  const N = 16384;
  const r = 8;
  const p = 1;
  const muoi = randomBytes(16);
  const bam = scryptSync(MAT_KHAU.normalize("NFC"), muoi, 32, { N, r, p });
  return ["scrypt", N, r, p, muoi.toString("hex"), bam.toString("hex")].join("$");
})();

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
 * Chờ tới khi máy chủ SẴN SÀNG — và "sẵn sàng" nghĩa là CSDL đã có lược đồ.
 *
 * 🔴 Không dùng `/api/gio`: nó chỉ trả về giờ, không mở cơ sở dữ liệu.
 *
 * 🔴 Và mã trong đường dẫn phải HỢP LỆ (đúng 5 ký tự thuộc bảng chữ ở
 * `lib/chuong-trinh/ma.ts`). Đã trả giá: `timTheoMa` chặn sớm mã sai định dạng
 * và trả `null` TRƯỚC KHI chạm CSDL, nên `/choi/KHONGCO` trả 200 vui vẻ trong
 * khi tệp CSDL còn chưa ra đời — rồi tệp nền ném "no such table".
 *
 * 🔴 Và không tin mã 200: kiểm SỰ TỒN TẠI VẬT LÝ của tệp CSDL. Một lệnh kiểm
 * báo xanh có thể xanh vì KHÔNG CÓ GÌ để kiểm.
 */
async function doiSanSang(tepCsdl, giay = 30) {
  for (let i = 0; i < giay * 2; i += 1) {
    try {
      const tra = await fetch(`${GOC}/choi/KHACC`);
      if (tra.ok && existsSync(tepCsdl)) return;
    } catch {
      // chưa lên, thử lại
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `máy chủ không lên, hoặc lên rồi mà CSDL ${tepCsdl} chưa được dựng lược đồ`,
  );
}

/**
 * 🔴 Gọi THẲNG `node_modules/.bin/next`, KHÔNG qua `npx`.
 *
 * `npx` là một lớp bọc: nó sinh ra `next-server` làm con. Giết `npx` thì
 * `next-server` thành mồ côi, VẪN SỐNG và VẪN GIỮ CỔNG — kịch bản sau khởi động
 * máy chủ mới thất bại vì cổng bận, rồi đo nhầm phiên bản cũ.
 */
function moMayChu(tepCsdl) {
  mayChu = spawn("node_modules/.bin/next", ["start", "-p", String(CONG)], {
    stdio: ["ignore", "ignore", "inherit"],
    env: {
      ...process.env,
      VONG_QUAY_CSDL: tepCsdl,
      VONG_QUAY_KHOA_PHIEN: KHOA,
      VONG_QUAY_MAT_KHAU_BAM: MAT_KHAU_BAM,
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
 * Vết sẹo: một máy chủ cũ còn sống giữ cổng và trả lời mọi yêu cầu, nên cả bộ
 * kiểm thử đo phiên bản CŨ mà báo xanh. Thà hỏng ồn ào.
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

for (const kb of danhSach) {
  const tep = `${thuMuc}/${kb.ten}.db`;
  try {
    dongMayChu();
    await doiCongTrong();
    for (const hau of ["", "-wal", "-shm"]) rmSync(tep + hau, { force: true });
    moMayChu(tep);
    await doiSanSang(tep);
    if (kb.nen) await chay("node", [`tests/e2e/nen/${kb.nen}.mjs`, tep]);

    console.log(`\n──── ${kb.ten} ────`);
    try {
      await chay("node", [`tests/e2e/${kb.ten}.mjs`], { E2E_GOC: GOC, E2E_CSDL: tep });
    } catch {
      hong.push(kb.ten);
    }
  } catch (loi) {
    // Nền hỏng cũng là HỎNG — nhưng chỉ hỏng kịch bản đó, không kéo sập cả bộ.
    console.error(`  ✖ ${kb.ten}: ${loi instanceof Error ? loi.message : String(loi)}`);
    if (!hong.includes(kb.ten)) hong.push(kb.ten);
  }
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
