#!/usr/bin/env node
/**
 * MỘT LỆNH dựng cả hệ thống cho trung tâm: dựng bản thật rồi chạy máy chủ, và in
 * sẵn các địa chỉ cần mở.
 *
 * Vì sao có script này: `npm run dev` chỉ nghe `localhost` nên điện thoại không
 * vào được, mà bản dev cũng chậm hơn bản thật rõ rệt trên máy yếu. Gộp lại thì
 * nhân viên không phải nhớ hai lệnh và không mở nhầm bản.
 */

import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

import { SO_BAN_GIU_LAI, duongDanCsdl, saoLuu, thuMucSaoLuu } from "./sao-luu.mjs";

const CONG = Number(process.env.PORT ?? 3000);
const TEP_KHOA = "du-lieu/khoa-phien.txt";

/**
 * Khoá ký cookie phiên — sinh MỘT LẦN rồi giữ lại.
 *
 * 🔴 Từ GĐ 15, thiếu khoá này thì **không ai đăng nhập được** vào `/quan-tri`, và màn hình
 * chỉ nói "chưa đặt khoá" chứ không tự sửa được. Bắt nhân viên lễ tân tự sinh chuỗi ngẫu
 * nhiên rồi `export` biến môi trường trước mỗi lần mở máy là cách chắc chắn để một sáng nào
 * đó không ai vào được trang quản trị.
 *
 * Sinh rồi GIỮ trong `du-lieu/` (đã gitignore, nằm cạnh chính cơ sở dữ liệu chứa dữ liệu
 * cá nhân — không mở thêm cửa nào mới). Giữ lại là điều bắt buộc: sinh mới mỗi lần khởi
 * động thì mọi phiên đang đăng nhập bị đá ra sau mỗi lần khởi động lại.
 *
 * Đặt sẵn biến môi trường `GAME_SU_KIEN_KHOA_PHIEN` thì script tôn trọng, không ghi đè.
 */
function khoaPhien() {
  if (process.env.GAME_SU_KIEN_KHOA_PHIEN) return process.env.GAME_SU_KIEN_KHOA_PHIEN;

  mkdirSync("du-lieu", { recursive: true });
  if (existsSync(TEP_KHOA)) {
    const cu = readFileSync(TEP_KHOA, "utf8").trim();
    if (cu.length >= 32) return cu;
  }

  const moi = randomBytes(32).toString("hex");
  // 0600: chỉ chủ máy đọc được. Cùng mức với chính tệp cơ sở dữ liệu.
  writeFileSync(TEP_KHOA, `${moi}\n`, { mode: 0o600 });
  console.log(`› Đã sinh khoá ký phiên mới và giữ ở ${TEP_KHOA} (không đưa lên git).`);
  return moi;
}

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

function cacChuongTrinhDangChay() {
  // Dùng `duongDanCsdl()` chứ KHÔNG gõ cứng đường dẫn: chạy với
  // `GAME_SU_KIEN_CSDL` trỏ chỗ khác thì danh sách in ra phải là của CHÍNH cơ sở
  // dữ liệu đang phục vụ — in danh sách của một tệp khác là đưa nhân viên những
  // địa chỉ màn hình LCD không tồn tại.
  const tep = duongDanCsdl();
  if (!existsSync(tep)) return [];
  try {
    // Chỉ ĐỌC: một lệnh chẩn đoán cũng ghi được vào đĩa, và mở nhầm đường dẫn là
    // TẠO ra một tệp rỗng (đã trả giá 01/09).
    const db = new DatabaseSync(tep, { readOnly: true });
    const ds = db
      .prepare(
        "select ma, ten_trung_tam, so_trung from chuong_trinh where trang_thai = 'dang_chay' order by id desc limit 5",
      )
      .all();
    db.close();
    return ds;
  } catch {
    return [];
  }
}

/**
 * Dữ liệu khách hàng chỉ có MỘT bản, nằm trên đĩa máy này. Chạy máy mà không sao
 * lưu được thì phải BÁO TO — im lặng bỏ qua là đúng cách để một hôm nào đó mất
 * sạch mà không ai kịp biết. Nhưng không chặn máy khởi động: trung tâm đang có
 * khách xếp hàng thì mất bản sao còn đỡ hơn mất cả buổi kinh doanh.
 */
function saoLuuKhiKhoiDong() {
  try {
    const { duongDan, soByte, daXoa } = saoLuu();
    console.log(`› Đã sao lưu dữ liệu: ${duongDan} (${(soByte / 1024).toFixed(1)} KB)`);
    if (daXoa.length > 0) console.log(`  Dọn ${daXoa.length} bản cũ, đang giữ ${SO_BAN_GIU_LAI} bản.`);
  } catch (loi) {
    console.error("\n╔══════════════════════════════════════════════════════════════╗");
    console.error("║  ⚠️  KHÔNG SAO LƯU ĐƯỢC — DỮ LIỆU KHÁCH HÀNG ĐANG KHÔNG CÓ  ║");
    console.error("║      BẢN THỨ HAI. Máy vẫn chạy, nhưng hãy xử lý sớm.        ║");
    console.error("╚══════════════════════════════════════════════════════════════╝");
    console.error(`  Lý do: ${loi.message}`);
    console.error(`  Nơi định để bản sao: ${thuMucSaoLuu()}`);
    console.error("  Đổi chỗ khác bằng biến môi trường GAME_SU_KIEN_SAO_LUU=<đường dẫn>\n");
  }
}

const may = diaChiLan();

console.log("\n› Đang dựng bản thật (lần đầu hơi lâu, các lần sau nhanh hơn)…\n");
mkdirSync("du-lieu", { recursive: true });

// Sao lưu TRƯỚC khi dựng: nếu bản mới có lỗi làm hỏng dữ liệu thì bản sao của
// lần chạy trước vẫn còn nguyên. Sao lưu sau khi dựng là sao lưu đúng cái đã hỏng.
saoLuuKhiKhoiDong();

const KHOA = khoaPhien();

await chay("node_modules/.bin/next", ["build"]);

console.log("\n──────────────────────────────────────────────────────────────");
console.log("  TRANG NHÂN VIÊN (tạo chương trình, in mã QR):");
console.log(`    http://${may}:${CONG}/quan-tri`);
console.log("");
const ds = cacChuongTrinhDangChay();
if (ds.length === 0) {
  console.log("  Chưa có chương trình nào — vào trang trên bấm “Tạo chương trình”.");
} else {
  console.log("  MÀN HÌNH LCD (mở trên máy nối TV rồi bật toàn màn hình):");
  for (const c of ds) {
    const so = String(c.so_trung).padStart(4, "0");
    console.log(`    http://${may}:${CONG}/man-hinh/${c.ma}   ← ${c.ten_trung_tam} · số ${so}`);
  }
}
console.log("");
console.log("  Phụ huynh chỉ cần QUÉT MÃ QR đang hiện trên màn hình LCD.");
console.log(`  Dữ liệu nằm ở ${duongDanCsdl()} — tắt máy bật lại vẫn còn.`);
console.log(`  Bản sao lưu: ${thuMucSaoLuu()} (giữ ${SO_BAN_GIU_LAI} bản gần nhất).`);
console.log("");
console.log("  ⚠️  ĐANG CHẠY TRONG MẠNG NỘI BỘ, KHÔNG CÓ HTTPS.");
console.log("      Chỉ dùng cho máy trong cùng wifi của trung tâm. ĐỪNG mở cổng ra");
console.log("      Internet ở chế độ này — đường truyền chưa mã hoá mà đang đi qua");
console.log("      họ tên và số điện thoại phụ huynh. Chạy online thật cần tên miền");
console.log("      + HTTPS (hạng mục N.6 trong sổ lộ trình).");
console.log("──────────────────────────────────────────────────────────────\n");

// 🔴 Gọi THẲNG `node_modules/.bin/next`, không qua `npx`: `npx` là lớp bọc, Ctrl-C
// giết nó mà `next-server` bên dưới vẫn sống và vẫn giữ cổng.
await chay("node_modules/.bin/next", ["start", "-H", "0.0.0.0", "-p", String(CONG)], {
  GAME_SU_KIEN_KHOA_PHIEN: KHOA,
});
