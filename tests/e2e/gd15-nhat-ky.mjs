import { chromium } from "./playwright.mjs";
// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };
const browser = await chromium.launch({ headless: true });
const loiConsole = [];

async function dangNhap(ten) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => loiConsole.push(`[${ten}] ${String(e)}`));
  await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
  await p.getByLabel("Tên đăng nhập").fill(ten);
  await p.getByLabel("Mật khẩu").fill("matkhau12345");
  await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });
  return p;
}

// ── Sale: màn khách, SĐT phải CHE ─────────────────────────────────────────
const s1 = await dangNhap("sale1");
await s1.goto(`${GOC}/quan-tri/khach`, { waitUntil: "networkidle" });
const soChe = await s1.locator("[data-sdt]").allTextContents();
ok(`Mở màn Khách tiềm năng: SĐT hiện dạng che (${soChe.join(", ") || "KHÔNG CÓ DÒNG NÀO"})`,
  soChe.length > 0 && soChe.every((s) => s.includes("*")));
ok("🔴 Không để lộ trọn đầu số nhà mạng", soChe.every((s) => !/^09\d/.test(s)));
ok("Có câu giải thích vì sao che",
  ((await s1.locator("body").textContent()) ?? "").includes("người đi ngang qua quầy"));

await s1.getByRole("button", { name: "Hiện đầy đủ" }).click();
await s1.waitForTimeout(300);
const soDu = await s1.locator("[data-sdt]").allTextContents();
ok(`Bấm “Hiện đầy đủ” → hiện hết (${soDu.join(", ")})`, soDu.every((s) => /^0\d{9}$/.test(s)));
ok("Sale CS1 chỉ thấy khách ĐƯỢC GIAO cho mình (1 dòng)", soDu.length === 1);
if (ANH) await s1.screenshot({ path: `${ANH}/gd15-che-sdt.png`, fullPage: false });

ok("Sale KHÔNG có mục Nhật ký trong thanh bên",
  !((await s1.locator("aside").first().textContent()) ?? "").includes("Nhật ký"));
const traNk = await s1.goto(`${GOC}/quan-tri/nhat-ky`, { waitUntil: "networkidle" });
ok(`🔴 Sale gõ thẳng /quan-tri/nhat-ky → bị chặn (HTTP ${traNk?.status()})`, traNk?.status() === 404);

// ── Quản trị: nhật ký thấy đúng dấu vết ───────────────────────────────────
const qt = await dangNhap("sep");
await qt.goto(`${GOC}/quan-tri/khach`, { waitUntil: "networkidle" });
const soKhachQt = await qt.locator("[data-sdt]").count();
ok(`Quản trị thấy TẤT CẢ khách của mọi cơ sở (${soKhachQt} dòng)`, soKhachQt === 4);

await qt.goto(`${GOC}/quan-tri/nhat-ky`, { waitUntil: "networkidle" });
const chuNk = (await qt.locator("body").textContent()) ?? "";
ok("Nhật ký có dòng “Đăng nhập”", chuNk.includes("Đăng nhập"));
ok("Nhật ký có dòng “Xem danh sách khách” kèm SỐ DÒNG đã hiện ra",
  chuNk.includes("Xem danh sách khách"));
const dongXem = await qt.locator("tr", { hasText: "Xem danh sách khách" }).first().textContent();
ok(`Dòng xem danh sách ghi rõ số dòng (${(dongXem ?? "").replace(/\s+/g, " ").trim().slice(0, 70)})`,
  /\d/.test(dongXem ?? ""));
ok("Nhật ký ghi cả người của CƠ SỞ KHÁC — quản trị thấy dấu vết của mọi sale",
  chuNk.includes("Sale Hải Châu"));
if (ANH) await qt.screenshot({ path: `${ANH}/gd15-nhat-ky.png`, fullPage: false });

// ── Xoá theo SĐT ──────────────────────────────────────────────────────────
ok("Màn nhật ký có ô xoá dữ liệu theo SĐT và nói rõ hạn lưu trữ",
  chuNk.includes("Hạn lưu trữ 24 tháng") && chuNk.includes("Xoá sạch dữ liệu"));

qt.once("dialog", (d) => d.accept());
await qt.locator('input[name="soDienThoai"]').fill("0900000003");
await qt.getByRole("button", { name: "XOÁ" }).click();
await qt.waitForTimeout(1500);
const sauXoa = (await qt.locator("body").textContent()) ?? "";
ok(`Xoá xong báo rõ đã xoá mấy dòng (${(sauXoa.match(/Đã xoá[^.]*\./) ?? ["KHÔNG THẤY"])[0]})`,
  /Đã xoá \d+ hồ sơ phụ huynh và \d+ dòng khách tiềm năng/.test(sauXoa));

await qt.goto(`${GOC}/quan-tri/khach`, { waitUntil: "networkidle" });
await qt.getByRole("button", { name: "Hiện đầy đủ" }).click();
await qt.waitForTimeout(300);
const conLai = await qt.locator("[data-sdt]").allTextContents();
ok(`🔴 Tìm lại số đã xoá thì KHÔNG còn ở đâu (còn: ${conLai.join(", ")})`,
  !conLai.includes("0900000003") && conLai.length === 3);

await qt.goto(`${GOC}/quan-tri/nhat-ky`, { waitUntil: "networkidle" });
const nkSau = (await qt.locator("body").textContent()) ?? "";
ok("Việc xoá để lại dấu vết trong nhật ký", nkSau.includes("Xoá dữ liệu theo SĐT"));
ok("🔴 Nhật ký ghi số ĐÃ CHE, không lưu lại chính cái số vừa được yêu cầu xoá",
  !nkSau.includes("0900000003"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 15.3 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
