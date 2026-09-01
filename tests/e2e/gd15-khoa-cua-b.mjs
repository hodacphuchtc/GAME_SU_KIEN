import { chromium } from "./playwright.mjs";
// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };

const browser = await chromium.launch({ headless: true });
const loiConsole = [];

// ── Cửa sổ ẨN DANH: chưa đăng nhập ────────────────────────────────────────
const an = await browser.newContext();
const p1 = await an.newPage();
p1.on("pageerror", (e) => loiConsole.push(String(e)));
await p1.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });

// Sai mật khẩu
await p1.getByLabel("Tên đăng nhập").fill("sep");
await p1.getByLabel("Mật khẩu").fill("sai-be-bet");
await p1.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
await p1.waitForTimeout(1500);
// Khoanh trong FORM: trang có nhiều phần tử role=alert, để trần thì Playwright
// ném vì strict mode chứ không phải vì app sai.
const loiHien =
  (await p1.locator("form").getByRole("alert").first().textContent().catch(() => "")) ?? "";
ok(`Gõ sai → báo sai, không vào được ("${loiHien.trim()}")`,
  loiHien.includes("không đúng") && p1.url().includes("/quan-tri/vao"));
ok("🔴 Câu báo lỗi KHÔNG tiết lộ tên đăng nhập có thật hay không",
  !/tên .*không tồn tại|không có tài khoản/i.test(loiHien));

// ── Đăng nhập thật ────────────────────────────────────────────────────────
await p1.getByLabel("Tên đăng nhập").fill("sep");
await p1.getByLabel("Mật khẩu").fill("matkhau12345");
await p1.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
await p1.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });
ok(`Đăng nhập đúng → vào được, và quay về ĐÚNG trang đã định (${new URL(p1.url()).pathname})`,
  new URL(p1.url()).pathname === "/quan-tri");
const chu = (await p1.locator("body").textContent()) ?? "";
ok("Góc trên hiện đúng tên người đang đăng nhập, không phải chuỗi cứng cũ",
  chu.includes("Nguyễn Văn Sếp") && !chu.includes("Nhân viên trực quầy"));

const cookie = (await an.cookies()).find((c) => c.name === "gsk_phien");
ok("Cookie phiên là HttpOnly (JavaScript của trang không đọc được)", cookie?.httpOnly === true);
ok("Cookie đặt SameSite=Lax", (cookie?.sameSite ?? "").toLowerCase() === "lax");
ok(`Cookie hết hạn sau đúng 12 giờ (${Math.round(((cookie?.expires ?? 0) * 1000 - Date.now()) / 3600000)} giờ)`,
  Math.abs((cookie?.expires ?? 0) * 1000 - Date.now() - 12 * 3600 * 1000) < 120000);

// ── Đăng xuất ─────────────────────────────────────────────────────────────
await p1.getByRole("button", { name: "Đăng xuất" }).click();
await p1.waitForTimeout(1500);
ok("Bấm Đăng xuất → về màn đăng nhập", p1.url().includes("/quan-tri/vao"));
const p2 = await an.newPage();
await p2.goto(`${GOC}/quan-tri`, { waitUntil: "networkidle" });
ok("Sau khi đăng xuất thì /quan-tri lại bị chắn", p2.url().includes("/quan-tri/vao"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 15.1 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
