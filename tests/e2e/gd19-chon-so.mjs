import { chromium } from "./playwright.mjs";

/**
 * GAME CHỌN SỐ — chơi một ván thật trên hai màn hình cùng lúc.
 *
 * 🔴 Bài kiểm QUAN TRỌNG NHẤT ở đây là điều mà 18 kịch bản cũ KHÔNG kịch bản nào
 * làm: mở CẢ màn hình LCD LẪN điện thoại rồi so BỐN CHỮ SỐ đọc từ hai DOM. Đó
 * đúng là lớp lỗi mà một game có vòng chạy riêng đẻ ra — hai máy tự chạy dãy số
 * của mình, và nếu chúng không dùng chung một hàm thuần thì chúng lệch nhau.
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
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

const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
theoDoi(lcd, "lcd");
await lcd.goto(`${GOC}/man-hinh/CSO1`, { waitUntil: "networkidle" });

// Khung 390px — vết sẹo v2.1: lỗi bố cục chỉ sống ở khung hẹp.
const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
theoDoi(dt, "dt");
await dt.goto(`${GOC}/choi/CSO1`, { waitUntil: "networkidle" });

const chuLcd = (await lcd.locator("body").textContent()) ?? "";
ok("LCD màn chờ mời quét mã, KHÔNG có ô 'SỐ TRÚNG THƯỞNG'", !chuLcd.includes("SỐ TRÚNG THƯỞNG"));

await dt.getByLabel("Họ và tên").fill("Nguyễn Thị Hoa");
await dt.getByLabel("Số điện thoại").fill("0912345671");
await dt.getByRole("button", { name: "TIẾP TỤC" }).click();

const nutBatDau = dt.getByRole("button", { name: "BẮT ĐẦU" });
await nutBatDau.waitFor({ timeout: 15000 });
await nutBatDau.click();

const nutDung = dt.getByRole("button", { name: "DỪNG", exact: true });
await nutDung.waitFor({ timeout: 15000 });

/** Đọc bốn chữ số đang hiện trên bảng LED của một trang. */
async function docSo(trang) {
  const nhan = await trang.locator('[role="img"]').first().getAttribute("aria-label");
  return (nhan ?? "").replace(/\D/g, "");
}

// Chờ dãy số chạy một lúc rồi bấm.
await dt.waitForTimeout(2500);
const soTruocKhiBam = await docSo(lcd);
ok(`LCD đang chạy dãy số (đọc được "${soTruocKhiBam}")`, /^\d{4}$/.test(soTruocKhiBam));

await nutDung.dispatchEvent("pointerdown");
await dt.waitForTimeout(2000);

const soLcd = await docSo(lcd);
const soDt = await docSo(dt);

ok(`🔴 HAI MÀN HÌNH cùng một con số (LCD ${soLcd} · điện thoại ${soDt})`, soLcd === soDt);
ok(`Số hiện đủ BỐN chữ số, đệm 0 (${soLcd})`, /^\d{4}$/.test(soLcd));

const soNguyen = Number(soLcd);
ok(`Số nằm trong dải đã khai 1–100 (${soNguyen})`, soNguyen >= 1 && soNguyen <= 100);

const chuDt = (await dt.locator("body").textContent()) ?? "";
ok("Điện thoại nói CHÚC MỪNG, không nói trúng/thua", /Chúc mừng/i.test(chuDt));
ok("KHÔNG có chữ 'Trượt' hay 'Không trúng' ở đâu cả", !/Trượt|KHÔNG TRÚNG/i.test(chuDt));
ok("Có mã xác thực để nhân viên soi trước khi đưa quà", /Mã xác thực/i.test(chuDt));
ok("Nói rõ phải đưa số cho nhân viên", /nhân viên/i.test(chuDt));

const chuLcdSau = (await lcd.locator("body").textContent()) ?? "";
ok("LCD cũng nói CHÚC MỪNG", /Chúc mừng/i.test(chuLcdSau));

if (ANH) {
  await dt.screenshot({ path: `${ANH}/gd19-chon-so-dien-thoai.png`, fullPage: true });
  await lcd.screenshot({ path: `${ANH}/gd19-chon-so-lcd.png`, fullPage: true });
}

// 🔴 Khối kết quả không được tràn mép phải khung 390px — vết sẹo v2.1.
const tranMep = await dt.evaluate(() => {
  const than = document.body;
  return than.scrollWidth > than.clientWidth + 1;
});
ok("Khối kết quả không tràn mép phải khung 390px", !tranMep);

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

await browser.close();
console.log(buoc.join("\n"));
console.log(
  `\n${loi.length === 0 ? "🟢 CHỌN SỐ — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`,
);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
