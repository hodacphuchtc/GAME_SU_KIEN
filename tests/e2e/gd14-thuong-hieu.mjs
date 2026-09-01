import { chromium } from "./playwright.mjs";
import { moTrangQuanTri } from "./dang-nhap.mjs";

/**
 * LUẬT THƯƠNG HIỆU (GĐ 14.1 · 14.2).
 *
 * Đây là loại luật âm thầm mục đi: ai đó thêm linh vật vào một màn mới, hoặc bọc một
 * `filter` lên logo, và không có gì báo. Bốn luật được canh ở đây:
 *
 *   1. Masthead có logo ở CẢ BỐN trạng thái của màn LCD;
 *   2. Linh vật CHỈ ở màn chờ — `dem-nguoc` và `chay` tuyệt đối không có;
 *   3. Trên điện thoại: linh vật ở bước nhập thông tin và màn THẮNG, **không** ở
 *      `dang-chay`, và **không** ở màn THUA (tư thế đang có là "ăn mừng");
 *   4. Không `filter` / `opacity < 1` / `mix-blend-mode` trên ảnh nhận diện.
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };

const browser = await chromium.launch({ headless: true });
const loiConsole = [];
const theoDoi = (p, n) => {
  p.on("console", (m) => m.type() === "error" && loiConsole.push(`[${n}] ${m.text()}`));
  p.on("pageerror", (e) => loiConsole.push(`[${n}] ${String(e)}`));
};

/** Đếm ảnh nhận diện đang có trên trang, tách logo và linh vật. */
async function anhNhanDien(p) {
  return p.evaluate(() => {
    const anh = [...document.querySelectorAll("img")];
    const nhan = (a) => a.getAttribute("alt") ?? "";
    return {
      logo: anh.filter((a) => nhan(a).includes("SATA ROBO")).length,
      linhVat: anh.filter((a) => nhan(a).includes("Robot Sata Robo")).length,
    };
  });
}

/** Có ảnh nhận diện nào bị bôi filter / làm mờ không. */
async function coHieuUngCam(p) {
  return p.evaluate(() => {
    const xau = [];
    for (const a of document.querySelectorAll("img")) {
      const alt = a.getAttribute("alt") ?? "";
      if (!alt.includes("SATA ROBO") && !alt.includes("Robot Sata Robo")) continue;
      const s = getComputedStyle(a);
      if (s.filter !== "none") xau.push(`${alt}: filter=${s.filter}`);
      if (s.mixBlendMode !== "normal") xau.push(`${alt}: blend=${s.mixBlendMode}`);
      if (Number(s.opacity) < 1) xau.push(`${alt}: opacity=${s.opacity}`);
    }
    return xau;
  });
}

// ── Màn hình LCD ──────────────────────────────────────────────────────────
const lcd = await browser.newPage({ viewport: { width: 1600, height: 900 } });
theoDoi(lcd, "lcd");
await lcd.goto(`${GOC}/man-hinh/QUAY`, { waitUntil: "networkidle" });

let a = await anhNhanDien(lcd);
ok(`Màn CHỜ: có logo (${a.logo}) và có linh vật (${a.linhVat})`, a.logo === 1 && a.linhVat === 1);
ok("Câu định vị hiện dưới masthead",
  ((await lcd.locator("body").textContent()) ?? "").includes("Đào tạo tài năng công nghệ tương lai"));

// ── Điện thoại ────────────────────────────────────────────────────────────
const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
theoDoi(dt, "dt");
await dt.goto(`${GOC}/choi/QUAY`, { waitUntil: "networkidle" });
await dt.getByLabel("Họ và tên").waitFor({ timeout: 20000 });

a = await anhNhanDien(dt);
ok(`Bước NHẬP THÔNG TIN: có logo và có linh vật (${a.logo}/${a.linhVat})`,
  a.logo === 1 && a.linhVat === 1);

await dt.getByLabel("Họ và tên").fill("Nguyễn Thị Hoa");
await dt.getByLabel("Số điện thoại").fill("0912345671");
await dt.getByRole("checkbox").check();
await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
await dt.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await dt.getByRole("button", { name: "BẮT ĐẦU" }).click();
await dt.waitForTimeout(1200);

a = await anhNhanDien(dt);
ok(`🔴 Điện thoại lúc ĐANG CHẠY: KHÔNG có linh vật (${a.linhVat}) — ảnh mount lúc này có nguy cơ hụt khung ngay trên đường đo bấm`,
  a.linhVat === 0);
ok(`Nhưng logo ở header VẪN còn (${a.logo})`, a.logo === 1);

const lcdChay = await anhNhanDien(lcd);
ok(`🔴 Màn LCD lúc ĐANG CHẠY: KHÔNG có linh vật (${lcdChay.linhVat}) — cả sảnh đang nhìn 4 chữ số`,
  lcdChay.linhVat === 0);
ok(`Masthead LCD vẫn giữ logo khi đang chạy (${lcdChay.logo})`, lcdChay.logo === 1);

await dt.getByRole("button", { name: "DỪNG", exact: true }).waitFor({ timeout: 20000 });
await dt.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await dt.waitForTimeout(1800);

const chuThua = (await dt.locator("body").textContent()) ?? "";
a = await anhNhanDien(dt);
ok(`🔴 Màn THUA: KHÔNG có linh vật (${a.linhVat}) — tư thế đang có là "ăn mừng", đặt cạnh "KHÔNG TRÚNG THƯỞNG" là trêu người vừa hụt`,
  chuThua.includes("KHÔNG TRÚNG THƯỞNG") && a.linhVat === 0);

// ── Màn THẮNG (chương trình chạy chậm, bấm trúng chủ động) ────────────────
const lcd2 = await browser.newPage({ viewport: { width: 1600, height: 900 } });
theoDoi(lcd2, "lcd-cham");
await lcd2.goto(`${GOC}/man-hinh/CHAM`, { waitUntil: "networkidle" });
const dtT = await browser.newPage({ viewport: { width: 390, height: 844 } });
theoDoi(dtT, "dt-thang");
await dtT.goto(`${GOC}/choi/CHAM`, { waitUntil: "networkidle" });
await dtT.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
await dtT.getByLabel("Họ và tên").fill("Lê Thị Cúc");
await dtT.getByLabel("Số điện thoại").fill("0912345673");
await dtT.getByRole("checkbox").check();
await dtT.getByRole("button", { name: "TIẾP TỤC" }).click();
await dtT.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await dtT.getByRole("button", { name: "BẮT ĐẦU" }).click();
await dtT.getByRole("button", { name: "DỪNG", exact: true }).waitFor({ timeout: 15000 });
{
  const den = Date.now() + 60000;
  for (;;) {
    const nhan = await lcd2.locator('[role="img"]').first().getAttribute("aria-label");
    if (Number((nhan ?? "").replace(/\D/g, "")) >= 20) break;
    if (Date.now() > den) throw new Error("bảng số không tới 0020");
  }
}
await dtT.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await dtT.waitForTimeout(1800);

const chuThang = (await dtT.locator("body").textContent()) ?? "";
a = await anhNhanDien(dtT);
ok(`Màn THẮNG: CÓ linh vật (${a.linhVat}) — đúng chỗ của tư thế ăn mừng`,
  chuThang.includes("CHÚC MỪNG") && a.linhVat === 1);

// ── Luật cấm hiệu ứng ────────────────────────────────────────────────────
const xau = [
  ...(await coHieuUngCam(lcd)),
  ...(await coHieuUngCam(dt)),
  ...(await coHieuUngCam(dtT)),
];
ok(`🔴 Không ảnh nhận diện nào bị filter / mờ / blend (${xau.length === 0 ? "sạch" : xau.join(" · ")})`,
  xau.length === 0);

// ── Trang quản trị ───────────────────────────────────────────────────────
const qt = await moTrangQuanTri(browser, GOC, { width: 1280, height: 900 });
theoDoi(qt, "quan-tri");
const aQt = await anhNhanDien(qt);
ok(`Thanh bên quản trị dùng LOGO ẢNH THẬT, không phải chữ dựng bằng CSS (${aQt.logo})`,
  aQt.logo === 1);

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 14.1 + 14.2 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
