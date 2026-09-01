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
import { existsSync, mkdirSync } from "node:fs";

import { SO_BAN_GIU_LAI, saoLuu, thuMucSaoLuu } from "./sao-luu.mjs";

const CONG = Number(process.env.PORT ?? 3000);

function diaChiLan() {
  for (const ds of Object.values(networkInterfaces())) {
    for (const net of ds ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

function chay(lenh, thamSo) {
  return new Promise((xong, hong) => {
    const con = spawn(lenh, thamSo, { stdio: "inherit", shell: false });
    con.on("exit", (ma) => (ma === 0 ? xong() : hong(new Error(`${lenh} thoát mã ${ma}`))));
    con.on("error", hong);
  });
}

function cacChuongTrinhDangChay() {
  if (!existsSync("du-lieu/dem-so.db")) return [];
  try {
    const db = new DatabaseSync("du-lieu/dem-so.db");
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

await chay("npx", ["next", "build"]);

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
console.log("  Dữ liệu nằm ở du-lieu/dem-so.db — tắt máy bật lại vẫn còn.");
console.log(`  Bản sao lưu: ${thuMucSaoLuu()} (giữ ${SO_BAN_GIU_LAI} bản gần nhất).`);
console.log("──────────────────────────────────────────────────────────────\n");

await chay("npx", ["next", "start", "-H", "0.0.0.0", "-p", String(CONG)]);
