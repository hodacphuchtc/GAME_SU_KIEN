import { chromium } from "./playwright.mjs";

/**
 * GĐ 24 — sửa số trúng thưởng ngay trong chương trình đang chạy.
 *
 * Điều đáng kiểm nhất không phải "ô nhập có lưu không", mà là **mã phòng không
 * đổi**: tờ giấy dán ở quầy phải còn dùng được sau khi sửa. Đổi mã là bắt nhân
 * viên in lại toàn bộ, và đó chính là thứ tính năng này sinh ra để tránh.
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

// CTA của nền `lich-su-day-du`: số trúng 0020, đã có 2 ván.
await p.goto(`${GOC}/quan-tri/chuong-trinh/CTA`, { waitUntil: "networkidle" });
ok("Trang chi tiết có nút “Sửa thiết lập”", (await p.locator("[data-mo-sua]").count()) === 1);

await p.locator("[data-mo-sua]").click();
await p.waitForTimeout(300);
ok("Bấm vào thì form mở ngay tại chỗ, không chuyển trang",
  (await p.locator("[data-luu-sua]").count()) === 1);

// 🔴 Đổi CON SỐ không đổi tỉ lệ — đó là sự thật của trò này, không phải lỗi:
// tỉ lệ = (giới hạn lượt − thời gian khoá nút) ÷ (10000 × 0,08), con số triệt
// tiêu khỏi phép tính. Nên kiểm bảng LED (thứ thật sự đổi theo số), còn bảng
// tỉ lệ thì kiểm bằng cách đổi ĐỘ KHÓ.
const tiLeTruoc = (await p.locator("body").textContent()) ?? "";
// Radio ở đây là `sr-only` bọc trong label (để bấm được cả ô lớn trên điện
// thoại), nên phải bấm vào LABEL — click thẳng vào radio bị chính label chắn.
await p.locator('form label:has(input[name="mucDo"][value="kho"])').click();
await p.waitForTimeout(400);
const tiLeSau = (await p.locator("body").textContent()) ?? "";
ok("Đổi độ khó → bảng tỉ lệ và dự báo tiền quà đổi NGAY, không đợi bấm Lưu",
  tiLeTruoc !== tiLeSau);
await p.locator('form label:has(input[name="mucDo"][value="vua"])').click();
await p.waitForTimeout(200);

// Chương trình này đã có ván ⇒ phải hỏi trước khi đổi số.
let daHoi = false;
p.on("dialog", async (d) => {
  daHoi = /đã có 2 ván chơi/.test(d.message());
  await d.accept();
});

await p.locator('input[name="soTrung"]').fill("0250");
await p.locator('input[name="tenGiaiThuong"]').fill("Balo STEM");
if (ANH) await p.screenshot({ path: `${ANH}/gd24-form-sua.png`, fullPage: false });
await p.locator("[data-luu-sua]").click();
await p.waitForTimeout(1500);

ok("🔴 Đã có ván thì hộp xác nhận nói rõ SỐ VÁN sẽ lệch khỏi số mới", daHoi);

await p.reload({ waitUntil: "networkidle" });
const thanSau = (await p.locator("body").textContent()) ?? "";
ok("Số trúng thưởng mới đã lưu và hiện trên khối in mã QR", thanSau.includes("0250"));
ok("Phần thưởng mới cũng lưu", thanSau.includes("Balo STEM"));
ok("🔴 MÃ PHÒNG KHÔNG ĐỔI — tờ giấy đã dán ở quầy còn dùng được",
  new URL(p.url()).pathname === "/quan-tri/chuong-trinh/CTA");

// Lịch sử cũ giữ nguyên: ván trước được chấm theo số cũ, không bị sửa lại.
ok("Lịch sử ván cũ vẫn còn nguyên, không bị chấm lại theo số mới",
  thanSau.includes("Dương Thị Hoa"));

await p.goto(`${GOC}/quan-tri/nhat-ky`, { waitUntil: "networkidle" });
const nk = (await p.locator("body").textContent()) ?? "";
ok("Nhật ký ghi lại việc sửa, kèm số cũ → số mới",
  nk.includes("Sửa thiết lập chương trình") && nk.includes("20 → 250"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

console.log(buoc.join("\n"));
console.log(loi.length === 0
  ? "\n🟢 GĐ 24 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT"
  : `\n🔴 GĐ 24 — ${loi.length} bước KHÔNG đạt`);
await browser.close();
process.exit(loi.length === 0 ? 0 : 1);
