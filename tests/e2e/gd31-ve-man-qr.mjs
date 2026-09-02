import { chromium } from "./playwright.mjs";

/**
 * GĐ 3.2 — CHƠI XONG THÌ MÀN LCD TỰ VỀ MÀN CHỜ.
 *
 * 🔴 Vòng Quay là game DUY NHẤT chưa có nhịp này: thẻ kết quả treo VÔ HẠN tới
 * tận ván sau, nên người kế tiếp bước tới quầy là nhìn thấy phần quà của người
 * trước, còn nhân viên phải tải lại trang bằng tay. Hai game kia đã có hẹn giờ
 * từ lâu.
 *
 * Kịch bản chơi trọn một ván thật rồi ĐỢI, và khẳng định màn hình tự trở lại —
 * không tải lại trang, không bấm gì.
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const loi = [];
const buoc = [];
const ok = (ten, dat) => {
  buoc.push(`${dat ? "✅" : "❌"} ${ten}`);
  if (!dat) loi.push(ten);
};

const browser = await chromium.launch({ headless: true });
const loiConsole = [];
const theoDoi = (p, nhan) => {
  p.on("console", (m) => m.type() === "error" && loiConsole.push(`[${nhan}] ${m.text()}`));
  p.on("pageerror", (e) => loiConsole.push(`[${nhan}] ${String(e)}`));
};

const chuTren = async (trang) => (await trang.locator("body").textContent()) ?? "";

const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
theoDoi(lcd, "lcd");
await lcd.goto(`${GOC}/man-hinh/VQG1`, { waitUntil: "networkidle" });

const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
theoDoi(dt, "dt");
await dt.goto(`${GOC}/choi/VQG1`, { waitUntil: "networkidle" });

await dt.getByLabel("Họ và tên").fill("Phạm Thị Duyên");
await dt.getByLabel("Số điện thoại").fill("0912345804");
await dt.getByRole("button", { name: "TIẾP TỤC" }).click();

const nutQuay = dt.getByRole("button", { name: "QUAY", exact: true });
await nutQuay.waitFor({ timeout: 15000 });
await nutQuay.click();

// Chờ thẻ kết quả hiện trên MÀN LCD — đó là mốc bắt đầu đếm 5 giây.
let coKetQua = false;
try {
  await lcd.waitForFunction(
    () => (document.body.textContent ?? "").includes("CHÚC MỪNG"),
    undefined,
    { timeout: 20000 },
  );
  coKetQua = true;
} catch {
  coKetQua = false;
}
ok("LCD hiện thẻ kết quả sau khi quay xong", coKetQua);

// 🔴 Đo bằng chính con số cấu hình: 5 giây, cộng đệm mạng. Đừng chờ "một lúc".
let veCho = false;
try {
  await lcd.waitForFunction(
    () => (document.body.textContent ?? "").includes("Đang chờ người chơi"),
    undefined,
    { timeout: 12000 },
  );
  veCho = true;
} catch {
  veCho = false;
}
ok("🔴 LCD TỰ về màn chờ trong vòng 12 giây, không ai bấm gì", veCho);
ok("và thẻ kết quả đã biến mất", !(await chuTren(lcd)).includes("CHÚC MỪNG"));

// Mã QR chưa từng bị cất đi ở game này, nên phải còn nguyên để người sau quét.
ok("mã QR vẫn còn cho người kế tiếp", (await lcd.locator("img[alt]").count()) > 0);

ok("không có lỗi console/pageerror", loiConsole.length === 0);
if (loiConsole.length > 0) console.log(loiConsole.slice(0, 6).join("\n"));

console.log(buoc.join("\n"));
await browser.close();
if (loi.length > 0) {
  console.error(`\n❌ ${loi.length} bước hỏng:\n- ${loi.join("\n- ")}`);
  process.exit(1);
}
console.log("\n✅ gd31 — Vòng Quay tự trả màn về mã QR");
