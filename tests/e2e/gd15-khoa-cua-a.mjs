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
await p1.goto(`${GOC}/quan-tri`, { waitUntil: "networkidle" });
ok(`Mở /quan-tri khi chưa đăng nhập → nhảy sang màn đăng nhập (đang ở ${new URL(p1.url()).pathname})`,
  p1.url().includes("/quan-tri/vao"));
ok("Địa chỉ gốc được giữ lại để đăng nhập xong quay về đúng chỗ",
  p1.url().includes("tiep=%2Fquan-tri"));
ok("Màn đăng nhập KHÔNG có thanh bên quản trị (không lộ cấu trúc cho người lạ)",
  (await p1.getByRole("link", { name: "Trúng Số" }).count()) === 0);
ok("Chưa có tài khoản nào → in THẲNG câu lệnh cần chạy, không để người vận hành kẹt ngoài",
  ((await p1.locator("body").textContent()) ?? "").includes("npm run tao-quan-tri"));

// Các trang con cũng phải bị chắn
for (const duong of ["/quan-tri/co-so", "/quan-tri/tao", "/quan-tri/chuong-trinh/CHAM"]) {
  const p = await an.newPage();
  await p.goto(GOC + duong, { waitUntil: "networkidle" });
  ok(`Trang con ${duong} cũng bị chắn`, p.url().includes("/quan-tri/vao"));
  await p.close();
}

// Trang CHƠI của phụ huynh phải mở bình thường
const pc = await an.newPage();
await pc.goto(`${GOC}/choi/CHAM`, { waitUntil: "networkidle" });
ok("Trang chơi của phụ huynh KHÔNG bị chắn (khoá cửa quản trị, không khoá cửa khách)",
  !pc.url().includes("/quan-tri/vao"));
const pm = await an.newPage();
await pm.goto(`${GOC}/man-hinh/CHAM`, { waitUntil: "networkidle" });
ok("Màn hình LCD cũng KHÔNG bị chắn", !pm.url().includes("/quan-tri/vao"));


ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 CHẶNG 1 (chưa có tài khoản) — ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
process.exit(loi.length === 0 ? 0 : 1);
