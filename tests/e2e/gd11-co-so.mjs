import { chromium } from "./playwright.mjs";
import { moTrangQuanTri } from "./dang-nhap.mjs";

// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [];
const buoc = [];

function ok(ten, dat) {
  buoc.push(`${dat ? "✅" : "❌"} ${ten}`);
  if (!dat) loi.push(ten);
}

const browser = await chromium.launch({ headless: true });
// Từ GĐ 15, mọi trang /quan-tri đều bị chắn — phải đăng nhập trước.
const page = await moTrangQuanTri(browser, GOC, { width: 1280, height: 900 });
const loiConsole = [];
page.on("console", (m) => m.type() === "error" && loiConsole.push(m.text()));
page.on("pageerror", (e) => loiConsole.push(String(e)));

// ── 11.1 ────────────────────────────────────────────────────────────────────
await page.goto(`${GOC}/quan-tri/co-so`, { waitUntil: "networkidle" });
ok("Vào TỔ CHỨC › Cơ sở, thấy màn rỗng đúng câu nhắc",
  (await page.locator("text=Chưa có cơ sở nào").count()) > 0);

async function themCoSo(ten, diaChi) {
  await page.getByRole("button", { name: "Thêm cơ sở" }).click();
  await page.getByLabel("Tên cơ sở").fill(ten);
  if (diaChi) await page.getByLabel("Địa chỉ").fill(diaChi);
  await page.getByRole("button", { name: "LƯU CƠ SỞ" }).click();
  await page.waitForTimeout(700);
}

await themCoSo("Trung tâm Sata Robo Hải Châu", "");
await themCoSo("Trung tâm Sata Robo Thanh Khê", "");
await themCoSo("Trung tâm Sata Robo Sơn Trà", "");
await page.waitForTimeout(400);

const maHien = await page.locator("td.font-mono").allTextContents();
ok(`Ba cơ sở nhận mã CS1/CS2/CS3 (thấy: ${maHien.join(", ")})`,
  JSON.stringify(maHien) === JSON.stringify(["CS1", "CS2", "CS3"]));

// Thêm cơ sở thứ tư → phải là CS4
await themCoSo("Trung tâm Sata Robo Ngũ Hành Sơn", "123 Lê Văn Hiến, Đà Nẵng");
const ma4 = (await page.locator("td.font-mono").allTextContents()).at(-1);
ok(`Cơ sở thứ tư được mã CS4 tự động (thấy: ${ma4})`, ma4 === "CS4");

// Sửa địa chỉ CS2
await page.locator("tr", { has: page.locator("td", { hasText: /^CS2$/ }) })
  .getByRole("button", { name: "Sửa" }).click();
await page.getByLabel("Địa chỉ").fill("114 Hoàng Diệu, Đà Nẵng");
await page.getByRole("button", { name: "LƯU THAY ĐỔI" }).click();
await page.waitForTimeout(800);
const dongCS2 = await page.locator("tr", { has: page.locator("td", { hasText: /^CS2$/ }) }).textContent();
ok("Sửa địa chỉ CS2 → thấy đổi ngay trên bảng", (dongCS2 ?? "").includes("114 Hoàng Diệu"));

// Trùng tên, viết hoa khác đi
await page.getByRole("button", { name: "Thêm cơ sở" }).click();
await page.getByLabel("Tên cơ sở").fill("  TRUNG TÂM   SATA ROBO   HẢI CHÂU  ");
await page.getByLabel("Địa chỉ").fill("Địa chỉ này phải còn nguyên sau khi báo lỗi");
await page.getByRole("button", { name: "LƯU CƠ SỞ" }).click();
await page.waitForTimeout(800);
// Khoanh trong FORM: trang có nhiều phần tử mang role=alert, để trần thì
// Playwright ném vì strict mode chứ không phải vì app sai.
const canhBao = await page.locator("form").getByRole("alert").first().textContent().catch(() => "");
ok(`Trùng tên khác hoa thường → báo lỗi tiếng Việt tử tế (“${(canhBao ?? "").slice(0, 45)}…”)`,
  (canhBao ?? "").includes("Đã có cơ sở mang tên này"));
ok("🔴 Ô địa chỉ KHÔNG bị React xoá trắng sau khi form báo lỗi",
  (await page.getByLabel("Địa chỉ").inputValue()) === "Địa chỉ này phải còn nguyên sau khi báo lỗi");
await page.getByRole("button", { name: "Huỷ" }).click();
await page.waitForTimeout(300);

// Tắt CS1 → xám đi
page.once("dialog", (d) => d.accept());
await page.locator("tr", { has: page.locator("td", { hasText: /^CS1$/ }) })
  .getByRole("button", { name: "Tắt" }).click();
await page.waitForTimeout(900);
const lopCS1 = await page.locator("tr", { has: page.locator("td", { hasText: /^CS1$/ }) })
  .getAttribute("class");
ok("Tắt CS1 → dòng xám đi (opacity)", (lopCS1 ?? "").includes("opacity-45"));
if (ANH) await page.screenshot({ path: `${ANH}/gd11-co-so.png`, fullPage: true });

// ── 11.2 ────────────────────────────────────────────────────────────────────
await page.goto(`${GOC}/quan-tri/tao`, { waitUntil: "networkidle" });
ok("Trang tạo KHÔNG còn ô gõ tay tên trung tâm",
  (await page.locator('input[name="tenTrungTam"]').count()) === 0);

const luaChon = await page.locator('select[name="coSoId"] option').allTextContents();
ok(`Chỉ còn danh sách xổ xuống dạng “CS2 — …” (thấy: ${luaChon.join(" | ")})`,
  luaChon.length === 3 && luaChon.some((t) => t.startsWith("CS2 — 114 Hoàng Diệu")));
ok("Cơ sở ĐÃ TẮT không xuất hiện trong danh sách chọn",
  !luaChon.some((t) => t.startsWith("CS1")));

await page.selectOption('select[name="coSoId"]',
  { label: "CS2 — 114 Hoàng Diệu, Đà Nẵng" });
ok("Chọn được chế độ Tại quầy",
  await page.locator('input[name="cheDo"][value="tai_quay"]').isChecked());
ok("Ô cơ sở của người chơi chỉ hiện khi chơi ONLINE",
  (await page.locator('select[name="nguonCoSo"]').count()) === 0);
// Radio là `sr-only` — người thật bấm vào NHÃN bọc ngoài, kịch bản cũng phải vậy.
await page.locator('label:has(input[name="cheDo"][value="online"])').click();
await page.waitForTimeout(200);
ok("Chọn Online thì ô cơ sở của người chơi hiện ra",
  (await page.locator('select[name="nguonCoSo"]').count()) === 1);
await page.locator('label:has(input[name="cheDo"][value="tai_quay"])').click();

await page.fill('input[name="soLanChoi"]', "1");
await page.getByRole("button", { name: "TẠO CHƯƠNG TRÌNH" }).click();
await page.waitForURL(/\/quan-tri\/chuong-trinh\//, { timeout: 10000 });
await page.waitForLoadState("networkidle");
const tieuDe = await page.locator("h1").first().textContent();
ok(`Trang chi tiết hiện đúng “CS2 — 114 Hoàng Diệu, Đà Nẵng” (thấy: “${tieuDe}”)`,
  (tieuDe ?? "").trim() === "CS2 — 114 Hoàng Diệu, Đà Nẵng");
if (ANH) await page.screenshot({ path: `${ANH}/gd11-chi-tiet.png`, fullPage: false });

// Tắt hết cơ sở rồi vào lại trang tạo
await page.goto(`${GOC}/quan-tri/co-so`, { waitUntil: "networkidle" });
for (const ma of ["CS2", "CS3", "CS4"]) {
  page.once("dialog", (d) => d.accept());
  await page.locator("tr", { has: page.locator("td", { hasText: new RegExp(`^${ma}$`) }) })
    .getByRole("button", { name: "Tắt" }).click();
  await page.waitForTimeout(700);
}
await page.goto(`${GOC}/quan-tri/tao`, { waitUntil: "networkidle" });
const nhac = await page.locator("body").textContent();
ok("Tắt hết cơ sở → trang tạo nhắc “Chưa có cơ sở nào…”",
  (nhac ?? "").includes("Chưa có cơ sở nào. Vào mục Cơ sở thêm một cái trước đã."));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 11 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 5));
process.exit(loi.length === 0 ? 0 : 1);
