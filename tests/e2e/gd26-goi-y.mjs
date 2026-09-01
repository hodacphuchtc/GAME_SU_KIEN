import { chromium } from "./playwright.mjs";

/**
 * GĐ 26 — dấu `?` giải thích thông số.
 *
 * Kiểm hai thứ máy làm được: dấu `?` có mặt đúng chỗ và bấm ra nội dung; khối
 * giải thích KHÔNG tràn mép trên khung điện thoại. Còn "đọc có hiểu không" thì
 * chỉ người mới trả lời được.
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };
const browser = await chromium.launch({ headless: true });
const loiConsole = [];

const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => loiConsole.push(String(e)));

await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
await p.getByLabel("Tên đăng nhập").fill("sep");
await p.getByLabel("Mật khẩu").fill("matkhau12345");
await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });

await p.goto(`${GOC}/quan-tri/tao`, { waitUntil: "networkidle" });
const cacDauHoi = p.locator("details > summary");
const soDauHoi = await cacDauHoi.count();
ok(`Màn tạo chương trình có ${soDauHoi} dấu “?”`, soDauHoi >= 6);

ok("Dấu ? có nhãn cho trình đọc màn hình, không trơ trọi một ký tự",
  (await cacDauHoi.first().getAttribute("aria-label")) !== null);

// Chưa bấm thì nội dung phải ĐÓNG — mở sẵn hết là biến form thành bức tường chữ.
// Kiểm bằng thuộc tính `open`, KHÔNG bằng textContent: nội dung <details> vẫn
// nằm trong DOM khi đóng, chỉ là trình duyệt không vẽ ra.
ok("Chưa bấm thì mọi lời giải thích đều đang đóng",
  (await p.locator("details[open]").count()) === 0);

// Bấm đúng dấu ? cạnh "Trần số giải mỗi ngày".
await p.locator('label:has-text("Trần số giải mỗi ngày") summary').click();
await p.waitForTimeout(300);
const sau = (await p.locator("body").textContent()) ?? "";
ok("Bấm ? cạnh “Trần số giải mỗi ngày” → hiện đúng lời giải thích của nó",
  sau.includes("Số giải TỐI ĐA phát ra trong một ngày"));
ok("Lời giải thích nói ĐẶT SỐ NÀY THÌ GÌ XẢY RA, không nhắc lại cái nhãn",
  sau.includes("Chạm trần thì người chơi vẫn chơi"));
if (ANH) await p.screenshot({ path: `${ANH}/gd26-goi-y.png`, fullPage: false });

await p.keyboard.press("Escape");
await p.waitForTimeout(200);

// 🔴 Trên khung hẹp: khối giải thích không được tràn ra ngoài mép phải.
const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
dt.on("pageerror", (e) => loiConsole.push(`[dt] ${String(e)}`));
await dt.context().addCookies(await ctx.cookies());
await dt.goto(`${GOC}/quan-tri/tao`, { waitUntil: "networkidle" });
await dt.locator("details > summary").last().click();
await dt.waitForTimeout(300);

const tran = await dt.evaluate(() => {
  const khoi = document.querySelector("details[open] > span");
  if (!khoi) return null;
  const o = khoi.getBoundingClientRect();
  return { phai: o.right, rong: window.innerWidth };
});
ok(
  tran === null
    ? "Không tìm thấy khối giải thích trên khung hẹp"
    : `Khối giải thích không tràn mép phải (${Math.round(tran.phai)} ≤ ${tran.rong})`,
  tran !== null && tran.phai <= tran.rong + 1,
);

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

console.log(buoc.join("\n"));
console.log(loi.length === 0
  ? "\n🟢 GĐ 26 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT"
  : `\n🔴 GĐ 26 — ${loi.length} bước KHÔNG đạt`);
await browser.close();
process.exit(loi.length === 0 ? 0 : 1);
