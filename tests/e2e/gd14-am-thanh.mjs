import { chromium } from "./playwright.mjs";
// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };

const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const loiConsole = [];
const theoDoi = (p, n) => {
  p.on("console", (m) => m.type() === "error" && loiConsole.push(`[${n}] ${m.text()}`));
  p.on("pageerror", (e) => loiConsole.push(`[${n}] ${String(e)}`));
};

// ── Màn LCD: nút bật tiếng + nhớ trạng thái ────────────────────────────────
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lcd = await ctx.newPage();
theoDoi(lcd, "lcd");
await lcd.goto(`${GOC}/man-hinh/CHAM`, { waitUntil: "networkidle" });

ok("Màn chờ LCD có nút “🔊 Bật tiếng” (LCD không có cú chạm nào khác)",
  (await lcd.getByRole("button", { name: "🔊 Bật tiếng" }).count()) === 1);
ok("Mặc định là TẮT — không tự phát tiếng giữa sảnh",
  (await lcd.locator("[data-nut-tieng]").getAttribute("data-nut-tieng")) === "tat");
ok("Kèm câu giải thích vì sao phải bấm một lần",
  ((await lcd.locator("body").textContent()) ?? "").includes("chỉ cho phát tiếng sau khi có người chạm"));

await lcd.getByRole("button", { name: "🔊 Bật tiếng" }).click();
await lcd.waitForTimeout(400);
ok("Bấm một lần → chuyển sang “🔇 Tắt tiếng”",
  (await lcd.locator("[data-nut-tieng]").getAttribute("data-nut-tieng")) === "bat");
ok("Ghi nhớ vào localStorage",
  (await lcd.evaluate(() => window.localStorage.getItem("game-su-kien.tat-tieng"))) === "0");

await lcd.reload({ waitUntil: "networkidle" });
ok("🔴 Tải lại trang thì VẪN BẬT — không tự tắt giữa ca làm",
  (await lcd.locator("[data-nut-tieng]").getAttribute("data-nut-tieng")) === "bat");

await lcd.getByRole("button", { name: "🔇 Tắt tiếng" }).click();
await lcd.waitForTimeout(400);
await lcd.reload({ waitUntil: "networkidle" });
ok("🔴 Tắt tiếng rồi tải lại trang thì VẪN IM — nhớ đúng cả hai chiều",
  (await lcd.locator("[data-nut-tieng]").getAttribute("data-nut-tieng")) === "tat");
if (ANH) await lcd.screenshot({ path: `${ANH}/gd14-nut-tieng.png`, fullPage: false });

// Nút chỉ ở màn chờ, không lởn vởn lúc đang chơi
await lcd.getByRole("button", { name: "🔊 Bật tiếng" }).click();
await lcd.waitForTimeout(300);

const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
theoDoi(dt, "dt");
await dt.goto(`${GOC}/choi/CHAM`, { waitUntil: "networkidle" });
await dt.getByLabel("Họ và tên").fill("Nguyễn Thị Hoa");
await dt.getByLabel("Số điện thoại").fill("0912345699");
await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
await dt.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await dt.getByRole("button", { name: "BẮT ĐẦU" }).click();
await dt.waitForTimeout(2500);

ok("🔴 Lúc dãy số đang chạy, nút bật tiếng KHÔNG còn trong khung LCD",
  (await lcd.locator("[data-nut-tieng]").count()) === 0);

// Chế độ tại quầy: điện thoại KHÔNG được có tick
const coTick = await dt.evaluate(() => {
  // Không có cách nào nghe được tiếng trong headless; thay vào đó kiểm bằng
  // chính điều kiện quyết định: chế độ chơi của chương trình này là tại quầy.
  return document.body.innerText.includes("Nhìn màn hình lớn");
});
ok("Chương trình này là chế độ TẠI QUẦY (điện thoại chỉ là nút bấm)", coTick);

await dt.getByRole("button", { name: "DỪNG", exact: true }).waitFor({ timeout: 20000 });
await dt.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await dt.waitForTimeout(1800);
ok("Chơi trọn ván với âm thanh bật: vẫn ra kết quả bình thường",
  /KHÔNG TRÚNG THƯỞNG|CHÚC MỪNG/.test((await dt.locator("body").textContent()) ?? ""));

// ── GĐ 22.2: công tắc tiếng trên ĐIỆN THOẠI (trước đó không hề có) ─────────
const nutDt = dt.locator("[data-nut-tieng]");
ok(
  "Điện thoại CÓ nút tiếng — trước GĐ 22 màn này không hề đọc công tắc",
  (await nutDt.count()) === 1,
);
ok(
  "🔴 Mặc định BẬT trên điện thoại, ngược với LCD — máy nằm trong tay người đang chơi",
  (await nutDt.getAttribute("data-nut-tieng")) === "bat",
);

await nutDt.click();
await dt.waitForTimeout(250);
ok("Bấm một lần → chuyển sang tắt", (await nutDt.getAttribute("data-nut-tieng")) === "tat");

await dt.reload({ waitUntil: "networkidle" });
await dt.waitForTimeout(400);
ok(
  "🔴 Tải lại trang thì nhớ đúng lựa chọn, không tự bật lại",
  (await dt.locator("[data-nut-tieng]").getAttribute("data-nut-tieng")) === "tat",
);

// ── GĐ 22.2: dải nhắc trên LCD hiện ở MỌI màn, không chỉ màn chờ ───────────
const lcd2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
theoDoi(lcd2, "lcd2");
await lcd2.goto(GOC + "/man-hinh/CHAM", { waitUntil: "networkidle" });
await lcd2.evaluate(() => window.localStorage.setItem("game-su-kien.tat-tieng", "1"));
await lcd2.reload({ waitUntil: "networkidle" });
await lcd2.waitForTimeout(400);
ok("Đang tắt tiếng → LCD hiện dải nhắc", (await lcd2.locator("[data-nhac-tieng]").count()) === 1);

await lcd2.evaluate(() => window.localStorage.setItem("game-su-kien.tat-tieng", "0"));
await lcd2.reload({ waitUntil: "networkidle" });
await lcd2.waitForTimeout(400);
ok(
  "Bật tiếng rồi thì dải nhắc biến mất, không chiếm chỗ vô ích",
  (await lcd2.locator("[data-nhac-tieng]").count()) === 0,
);

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 14.3 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
