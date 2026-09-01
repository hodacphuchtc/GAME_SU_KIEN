#!/usr/bin/env node
/**
 * KIỂM MÁY CHỦ SAU KHI KHỞI ĐỘNG — chạy được từ máy khác trong mạng.
 *
 *   node scripts/kiem-may-chu.mjs                    # kiểm http://localhost:3000
 *   node scripts/kiem-may-chu.mjs http://192.168.1.5:3000
 *
 * Vì sao cần: "trang mở được" không có nghĩa là "chạy đúng". Ba thứ dưới đây từng hỏng mà
 * vẫn mở được trang, nên chúng được kiểm riêng từng cái:
 *
 *   1. \`/api/gio\` trả 200 — phép đo lệch đồng hồ sống thì trò chơi mới công bằng;
 *   2. \`/quan-tri\` **chuyển hướng** về màn đăng nhập khi không có cookie — nếu nó trả 200
 *      thì cửa quản trị đang mở toang (\`proxy.ts\` đặt sai tên là đúng ca này, và nó KHÔNG
 *      báo lỗi gì cả);
 *   3. \`/api/xuat/*\` trả **401**, không trả trang HTML — công cụ tải file mà nhận HTML sẽ
 *      lưu nguyên trang đăng nhập thành một tệp .xlsx hỏng.
 */

const GOC = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const buoc = [];
const loi = [];

function ok(ten, dat, them = "") {
  buoc.push(`${dat ? "✅" : "❌"} ${ten}${them ? ` — ${them}` : ""}`);
  if (!dat) loi.push(ten);
}

async function thu(duong, tuyChon = {}) {
  try {
    return await fetch(GOC + duong, { redirect: "manual", ...tuyChon });
  } catch (e) {
    return { status: 0, loi: e instanceof Error ? e.message : String(e), headers: new Headers() };
  }
}

const gio = await thu("/api/gio");
ok("/api/gio trả 200", gio.status === 200, `HTTP ${gio.status}${gio.loi ? ` (${gio.loi})` : ""}`);

const quanTri = await thu("/quan-tri");
const den = quanTri.headers?.get?.("location") ?? "";
ok(
  "/quan-tri chuyển hướng về màn đăng nhập khi chưa có cookie",
  (quanTri.status === 307 || quanTri.status === 302) && den.includes("/quan-tri/vao"),
  `HTTP ${quanTri.status}${den ? ` → ${den}` : ""}`,
);

const vao = await thu("/quan-tri/vao");
ok("/quan-tri/vao mở được (nếu không thì không ai vào được để mà đăng nhập)", vao.status === 200,
  `HTTP ${vao.status}`);

const xuat = await thu("/api/xuat/khach-tiem-nang");
ok("/api/xuat/* trả 401, KHÔNG trả trang HTML", xuat.status === 401, `HTTP ${xuat.status}`);

const theLe = await thu("/the-le");
ok("Trang công khai (/the-le) KHÔNG bị chắn", theLe.status === 200, `HTTP ${theLe.status}`);

console.log(`\nKiểm máy chủ tại ${GOC}\n`);
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 MÁY CHỦ SẴN SÀNG" : `🔴 HỎNG ${loi.length} mục — chưa mở cho khách`}`);
process.exit(loi.length === 0 ? 0 : 1);
