import { chromium } from "./playwright.mjs";

/**
 * GĐ 21 — bảng lịch sử hiện đủ thông tin khách, và CHỈ cho người có quyền.
 *
 * Hai nửa của cùng một việc:
 *   · nửa trên  — nhân viên có quyền phải ĐỌC ĐƯỢC tên và số của khách mình;
 *   · nửa dưới  — người ngoài phạm vi gõ đúng mã cũng KHÔNG vào được.
 * Thiếu nửa dưới thì nửa trên là một vụ rò rỉ danh bạ.
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };
const browser = await chromium.launch({ headless: true });
const loiConsole = [];

async function dangNhap(ten) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => loiConsole.push(`[${ten}] ${String(e)}`));
  await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
  await p.getByLabel("Tên đăng nhập").fill(ten);
  await p.getByLabel("Mật khẩu").fill("matkhau12345");
  await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });
  return p;
}

// ── QUẢN TRỊ: đọc được đủ thông tin ────────────────────────────────────────
const sep = await dangNhap("sep");
await sep.goto(`${GOC}/quan-tri/chuong-trinh/CTA`, { waitUntil: "networkidle" });

const than = (await sep.locator("body").textContent()) ?? "";
ok("Hiện HỌ TÊN ĐẦY ĐỦ, không rút gọn thành “Dương t.”",
  than.includes("Dương Thị Hoa") && !than.includes("Dương t."));

const soChe = await sep.locator("[data-sdt]").allTextContents();
ok(`Có cột số điện thoại, che sẵn (${soChe.join(", ") || "KHÔNG CÓ DÒNG NÀO"})`,
  soChe.some((s) => s.includes("*")));
ok("🔴 Số đã che KHÔNG để lộ trọn đầu số nhà mạng",
  soChe.every((s) => !/^09\d/.test(s)));
ok("Ván ẩn danh vẫn vẽ được, hiện gạch ngang chứ không vỡ trang",
  soChe.includes("—"));

await sep.getByRole("button", { name: "Hiện đầy đủ" }).click();
await sep.waitForTimeout(300);
const soDu = await sep.locator("[data-sdt]").allTextContents();
ok(`Bấm “Hiện đầy đủ” → ra trọn số (${soDu.join(", ")})`,
  soDu.some((s) => /^0\d{9}$/.test(s)));
ok("Có cột “Đồng ý tư vấn” — căn cứ hợp pháp để gọi điện",
  than.includes("Đồng ý tư vấn"));
if (ANH) await sep.screenshot({ path: `${ANH}/gd21-lich-su-day-du.png`, fullPage: false });

// ── SALE CS1: cơ sở của mình thì vào được ──────────────────────────────────
const s1 = await dangNhap("sale1");
const traA = await s1.goto(`${GOC}/quan-tri/chuong-trinh/CTA`, { waitUntil: "networkidle" });
ok(`Sale CS1 mở chương trình của CHÍNH cơ sở mình (HTTP ${traA?.status()})`,
  traA?.status() === 200);

// ── SALE CS2: gõ đúng mã của CS1 vẫn không vào được ────────────────────────
const s2 = await dangNhap("sale2");
const traCheo = await s2.goto(`${GOC}/quan-tri/chuong-trinh/CTA`, { waitUntil: "networkidle" });
ok(`🔴 Sale CS2 gõ thẳng mã của CS1 → bị chặn (HTTP ${traCheo?.status()})`,
  traCheo?.status() === 404);

const thanCheo = (await s2.locator("body").textContent()) ?? "";
ok("🔴 Trang bị chặn KHÔNG rò một chữ nào của khách",
  !thanCheo.includes("Dương Thị Hoa") && !thanCheo.includes("0912345678"));

await s2.goto(`${GOC}/quan-tri`, { waitUntil: "networkidle" });
const dsCheo = (await s2.locator("body").textContent()) ?? "";
ok("Danh sách của sale CS2 không có chương trình CS1",
  dsCheo.includes("CTB") && !dsCheo.includes("CTA"));

// ── File Excel cũng phải lọc, không chỉ trang HTML ─────────────────────────
const traXuat = await s2.goto(`${GOC}/api/xuat/chuong-trinh/CTA`);
ok(`🔴 Sale CS2 tải file Excel của CS1 → bị chặn (HTTP ${traXuat?.status()})`,
  traXuat?.status() === 404);

// ── Nhật ký: mỗi lần mở trang là một dòng ──────────────────────────────────
await sep.goto(`${GOC}/quan-tri/nhat-ky`, { waitUntil: "networkidle" });
const nk = (await sep.locator("body").textContent()) ?? "";
ok("Nhật ký ghi lại việc XEM danh sách khách kèm mã chương trình",
  nk.includes("Xem danh sách khách") && nk.includes("chuong-trinh:CTA"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

console.log(buoc.join("\n"));
console.log(loi.length === 0
  ? "\n🟢 GĐ 21 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT"
  : `\n🔴 GĐ 21 — ${loi.length} bước KHÔNG đạt`);
await browser.close();
process.exit(loi.length === 0 ? 0 : 1);
