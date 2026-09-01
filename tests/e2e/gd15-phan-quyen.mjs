import { chromium } from "./playwright.mjs";
// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };
const browser = await chromium.launch({ headless: true });
const loiConsole = [];

async function dangNhap(ten) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  p.on("pageerror", (e) => loiConsole.push(`[${ten}] ${String(e)}`));
  await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
  await p.getByLabel("Tên đăng nhập").fill(ten);
  await p.getByLabel("Mật khẩu").fill("matkhau12345");
  await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });
  return p;
}

// ── Tài khoản sale của CS1 ────────────────────────────────────────────────
const s1 = await dangNhap("sale1");
const thanhBenS1 = (await s1.locator("aside").first().textContent()) ?? "";
ok("Sale CS1: thanh bên KHÔNG có mục Cơ sở", !thanhBenS1.includes("Cơ sở"));
ok("Sale CS1: thanh bên KHÔNG có mục Nhân viên", !thanhBenS1.includes("Nhân viên"));
ok("Sale CS1: góc trên hiện đúng vai trò “Chăm sóc khách”",
  ((await s1.locator("header").first().textContent()) ?? "").includes("Chăm sóc khách"));

// Gõ thẳng địa chỉ vẫn phải bị chặn
for (const duong of ["/quan-tri/co-so", "/quan-tri/nhan-vien"]) {
  const tra = await s1.goto(GOC + duong, { waitUntil: "networkidle" });
  ok(`🔴 Sale gõ thẳng ${duong} → bị chặn (HTTP ${tra?.status()})`, tra?.status() === 404);
}

// ── Tài khoản quản trị ────────────────────────────────────────────────────
const qt = await dangNhap("sep");
const thanhBenQt = (await qt.locator("aside").first().textContent()) ?? "";
ok("Quản trị: thanh bên CÓ mục Cơ sở và Nhân viên",
  thanhBenQt.includes("Cơ sở") && thanhBenQt.includes("Nhân viên"));
const traQt = await qt.goto(`${GOC}/quan-tri/nhan-vien`, { waitUntil: "networkidle" });
ok(`Quản trị vào được màn Nhân viên (HTTP ${traQt?.status()})`, traQt?.status() === 200);
const chuNv = (await qt.locator("body").textContent()) ?? "";
ok("Màn Nhân viên liệt kê đủ 3 tài khoản",
  ["Nguyễn Văn Sếp", "Sale Hải Châu", "Sale Thanh Khê"].every((t) => chuNv.includes(t)));
ok("🔴 Không có nút Cho nghỉ cho CHÍNH MÌNH (người quản trị cuối không tự khoá mình ra ngoài)",
  (await qt.locator("tr", { hasText: "Nguyễn Văn Sếp" }).getByRole("button", { name: "Cho nghỉ" }).count()) === 0);
ok("Vẫn có nút Cho nghỉ cho người khác",
  (await qt.locator("tr", { hasText: "Sale Hải Châu" }).getByRole("button", { name: "Cho nghỉ" }).count()) === 1);

// ── Kiểm phần quan trọng nhất: dữ liệu KHÔNG rời máy chủ ───────────────────
// Trang khách tiềm năng chưa dựng (GĐ 16), nên đo bằng mã nguồn HTML thô của
// những trang ĐANG có: không trang nào của sale được chứa tên khách CS2.
const nguon = await s1.evaluate(() => document.documentElement.outerHTML);
ok("🔴 Mã nguồn trang của sale CS1 KHÔNG chứa tên khách của CS2",
  !nguon.includes("Khách Của Thanh Khê") && !nguon.includes("0900000003"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 15.2 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
