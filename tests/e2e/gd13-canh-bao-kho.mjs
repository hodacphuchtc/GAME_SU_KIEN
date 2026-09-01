import { chromium } from "./playwright.mjs";
import { moTrangQuanTri } from "./dang-nhap.mjs";
// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };

const browser = await chromium.launch({ headless: true });
const loiConsole = [];
const theoDoi = (p, n) => {
  p.on("console", (m) => m.type() === "error" && loiConsole.push(`[${n}] ${m.text()}`));
  p.on("pageerror", (e) => loiConsole.push(`[${n}] ${String(e)}`));
};

const qt = await moTrangQuanTri(browser, GOC, { width: 1280, height: 1000 });
theoDoi(qt, "quan-tri");

// Kho vừa dựng: Balo 20 cái (chưa trao) + Buổi học thử đáy ⇒ phải XANH, không dải
await qt.goto(`${GOC}/quan-tri/chuong-trinh/CHAM`, { waitUntil: "networkidle" });
let chu = (await qt.locator("body").textContent()) ?? "";
ok("Kho còn nhiều → KHÔNG có dải cảnh báo (không doạ người dùng vô cớ)",
  !chu.includes("còn") || !/còn \d+\/\d+ Balo STEM/.test(chu));

const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
theoDoi(lcd, "lcd");
await lcd.goto(`${GOC}/man-hinh/CHAM`, { waitUntil: "networkidle" });
ok("Chấm chỉ báo kho trên LCD đang XÁM (còn quà)",
  (await lcd.locator("[data-cham-kho]").getAttribute("data-cham-kho")) === "xanh");

// Hạ số lượng Balo xuống còn 4/20 → ngưỡng vàng
await qt.locator("tr", { hasText: "Balo STEM" }).getByRole("button", { name: "Sửa" }).click();
await qt.getByLabel("Số lượng").fill("20");
await qt.getByRole("button", { name: "LƯU THAY ĐỔI" }).click();
await qt.waitForTimeout(1000);
// (đã trao 0) → đặt số lượng 20 nhưng "đã trao" là 0 ⇒ vẫn xanh; ép vàng bằng cách hạ tổng
await qt.locator("tr", { hasText: "Balo STEM" }).getByRole("button", { name: "Sửa" }).click();
await qt.getByLabel("Số lượng").fill("1");
await qt.getByRole("button", { name: "LƯU THAY ĐỔI" }).click();
await qt.waitForTimeout(1000);
chu = (await qt.locator("body").textContent()) ?? "";
ok(`Hạ Balo xuống còn 1 → hiện dải VÀNG nói rõ còn mấy trên mấy (${(chu.match(/còn \d+\/\d+ [^"]{0,20}/) ?? ["KHÔNG THẤY"])[0].trim()})`,
  /còn 1\/1 Balo STEM/.test(chu));
const daiVang = await qt.locator('[role="status"].bg-vang\\/20').count();
ok("Dải đó được tô VÀNG, không phải chữ đen lẫn vào trang", daiVang > 0);
if (ANH) await qt.screenshot({ path: `${ANH}/gd13b-dai-vang.png`, fullPage: false });

// Xoá loại đáy → kho chỉ còn Balo ⇒ khi Balo hết thì cạn; trước đó thêm đã trao
// Đặt số lượng Balo = 0 (đã trao 0) ⇒ hết hàng ⇒ tụt xuống loại đáy ⇒ ĐỎ
await qt.locator("tr", { hasText: "Balo STEM" }).getByRole("button", { name: "Sửa" }).click();
await qt.getByLabel("Số lượng").fill("0");
await qt.getByRole("button", { name: "LƯU THAY ĐỔI" }).click();
await qt.waitForTimeout(1000);
chu = (await qt.locator("body").textContent()) ?? "";
ok("Hết Balo → dải chuyển ĐỎ và nói đang trao loại đáy kho",
  /đã hết quà có hạn, đang trao "Buổi học thử"/.test(chu));
const daiDo = await qt.locator('[role="status"].bg-do\\/10').count();
ok("Dải đỏ được tô đỏ", daiDo > 0);
if (ANH) await qt.screenshot({ path: `${ANH}/gd13b-dai-do.png`, fullPage: false });

// Danh sách cũng phải thấy
await qt.goto(`${GOC}/quan-tri`, { waitUntil: "networkidle" });
ok("Dải cảnh báo hiện ở CẢ trang danh sách, không chỉ trang chi tiết",
  /đã hết quà có hạn/.test((await qt.locator("body").textContent()) ?? ""));

// LCD: chấm chuyển đỏ
await lcd.reload({ waitUntil: "networkidle" });
ok("Chấm trên LCD chuyển ĐỎ",
  (await lcd.locator("[data-cham-kho]").getAttribute("data-cham-kho")) === "do");
const hop = await lcd.locator("[data-cham-kho]").boundingBox();
ok(`Chấm đủ nhỏ để đứng xa không nhận ra (${hop?.width}×${hop?.height}px)`,
  (hop?.width ?? 99) <= 8 && (hop?.height ?? 99) <= 8);
ok("Chấm KHÔNG kèm chữ nào — phụ huynh nhìn không biết là gì",
  ((await lcd.locator("[data-cham-kho]").textContent()) ?? "") === "");
if (ANH) await lcd.screenshot({ path: `${ANH}/gd13b-lcd-cham.png`, fullPage: false });

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 13.2 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
