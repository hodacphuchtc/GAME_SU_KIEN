import { mkdirSync } from "node:fs";

import { chromium } from "./playwright.mjs";
import { moTrangQuanTri } from "./dang-nhap.mjs";

/**
 * CHỤP ẢNH NGHIỆM THU (GĐ 20.1).
 *
 * Không phải bài test đạt/hỏng — nó dựng ra bộ ảnh để NGƯỜI nhìn bằng mắt. Ba
 * phép soi bắt buộc (xem `PLAN_TRUNG_SO.md` GĐ 20.1) đều là phép soi bằng mắt,
 * và dự án đã trả giá đúng bài này: *"bảng LED vẽ đoạn tắt quá sáng thì `0000`
 * đọc thành `8888` — chỉ lộ ra khi nhìn ảnh chụp thật, build và test đều xanh"*.
 *
 * Chạy: `npm run anh-chup` (bộ chạy lo máy chủ + nền, xem `chay-anh.mjs`).
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const THU_MUC = process.env.E2E_ANH ?? "tests/anh-chup";
mkdirSync(THU_MUC, { recursive: true });

const daChup = [];
async function chup(trang, ten, tuyChon = {}) {
  await trang.screenshot({ path: `${THU_MUC}/${ten}.png`, ...tuyChon });
  daChup.push(ten);
  console.log(`  · ${ten}.png`);
}

const browser = await chromium.launch({ headless: true });
const LCD = { width: 1600, height: 900 };
const DT = { width: 390, height: 844 };

/** Con số đang hiện trên bảng LED của một trang. */
const soTrenMay = async (p) =>
  Number(((await p.locator('[role="img"]').first().getAttribute("aria-label")) ?? "").replace(/\D/g, ""));

// ── Màn hình LCD ──────────────────────────────────────────────────────────
const lcd = await browser.newPage({ viewport: LCD });
await lcd.goto(`${GOC}/man-hinh/QUAY`, { waitUntil: "networkidle" });
await chup(lcd, "01-lcd-cho");

const dt = await browser.newPage({ viewport: DT });
await dt.goto(`${GOC}/choi/QUAY`, { waitUntil: "networkidle" });
await dt.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
await chup(dt, "07-dt-quay-nhap-thong-tin");

await dt.getByLabel("Họ và tên").fill("Nguyễn Thị Hoa");
await dt.getByLabel("Số điện thoại").fill("0912345671");
await dt.getByRole("checkbox").check();
await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
await dt.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await dt.getByRole("button", { name: "BẮT ĐẦU" }).click();

await chup(dt, "08-dt-quay-dang-chay");

await lcd.waitForTimeout(2500);
await chup(lcd, "02-lcd-dang-chay");

await dt.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await dt.waitForTimeout(1500);
await chup(lcd, "05-lcd-ket-qua-thua");
await chup(dt, "11-dt-quay-ket-qua-thua");

// ── Giữa ván "Lần 2/3" ────────────────────────────────────────────────────
const dt3 = await browser.newPage({ viewport: DT });
await dt3.goto(`${GOC}/choi/BALAN`, { waitUntil: "networkidle" });
await dt3.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
await dt3.getByLabel("Họ và tên").fill("Trần Văn Bình");
await dt3.getByLabel("Số điện thoại").fill("0912345672");
await dt3.getByRole("checkbox").check();
await dt3.getByRole("button", { name: "TIẾP TỤC" }).click();
await dt3.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await dt3.getByRole("button", { name: "BẮT ĐẦU" }).click();
await dt3.waitForTimeout(2000);
await dt3.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await dt3.getByRole("button", { name: "BẤM TIẾP" }).waitFor({ timeout: 15000 });
await chup(dt3, "09-dt-giua-van-lan-2-tren-3");
await dt3.close();

// ── Màn THẮNG (chương trình chạy chậm, bấm đúng lúc) ─────────────────────
const lcd2 = await browser.newPage({ viewport: LCD });
await lcd2.goto(`${GOC}/man-hinh/CHAM`, { waitUntil: "networkidle" });
const dtT = await browser.newPage({ viewport: DT });
await dtT.goto(`${GOC}/choi/CHAM`, { waitUntil: "networkidle" });
await dtT.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
await dtT.getByLabel("Họ và tên").fill("Lê Thị Cúc");
await dtT.getByLabel("Số điện thoại").fill("0912345673");
await dtT.getByRole("checkbox").check();
await dtT.getByRole("button", { name: "TIẾP TỤC" }).click();
await dtT.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await dtT.getByRole("button", { name: "BẮT ĐẦU" }).click();

// 🔴 ẢNH QUAN TRỌNG NHẤT CỦA CẢ BỘ: bảng LED đang hiện 0000.
//
// Chụp từ chương trình CHẠY CHẬM (2 số/giây) chứ không phải mức "Dễ": ở 150
// số/giây con số 0000 chỉ tồn tại chừng 7 mili-giây, không máy nào bắt kịp —
// và một bộ ảnh "nghiệm thu" bắt hụt đúng cái cảnh cần soi thì vô dụng.
await lcd2.waitForTimeout(120);
await chup(lcd2, "03-lcd-chay-0000");

await dtT.getByRole("button", { name: "DỪNG", exact: true }).waitFor({ timeout: 15000 });
{
  const den = Date.now() + 60000;
  for (;;) {
    if ((await soTrenMay(lcd2)) >= 20) break;
    if (Date.now() > den) throw new Error("bảng số không tới 0020");
  }
}
await dtT.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await dtT.waitForTimeout(1500);
await chup(lcd2, "04-lcd-ket-qua-thang");
await chup(dtT, "10-dt-quay-ket-qua-thang");
await dtT.close();

// ── Đếm ngược ─────────────────────────────────────────────────────────────
await chup(lcd2, "12-lcd-sau-ket-qua");

// ── Chấm chỉ báo kho ĐỎ trên màn chờ ─────────────────────────────────────
const qt = await moTrangQuanTri(browser, GOC, { width: 1400, height: 950 });
await qt.goto(`${GOC}/quan-tri/chuong-trinh/CHAM`, { waitUntil: "networkidle" });
if ((await qt.locator("tr", { hasText: "Balo STEM" }).count()) > 0) {
  await qt.locator("tr", { hasText: "Balo STEM" }).getByRole("button", { name: "Sửa" }).click();
  await qt.getByLabel("Số lượng").fill("0");
  await qt.getByRole("button", { name: "LƯU THAY ĐỔI" }).click();
  await qt.waitForTimeout(1200);
}
await lcd2.goto(`${GOC}/man-hinh/CHAM`, { waitUntil: "networkidle" });
await chup(lcd2, "06-lcd-cho-cham-kho-do");

// ── Chế độ ONLINE ─────────────────────────────────────────────────────────
const dtO = await browser.newPage({ viewport: DT });
await dtO.goto(`${GOC}/choi/ONCHON`, { waitUntil: "networkidle" });
await dtO.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
await chup(dtO, "13-dt-online-chon-co-so");
await dtO.getByLabel("Họ và tên").fill("Phạm Thị Dung");
await dtO.getByLabel("Số điện thoại").fill("0912345674");
await dtO.getByRole("checkbox").check();
await dtO.locator('select[name="coSoId"]').selectOption({ index: 1 });
await dtO.getByRole("button", { name: "TIẾP TỤC" }).click();
await dtO.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await dtO.getByRole("button", { name: "BẮT ĐẦU" }).click();
await dtO.waitForTimeout(120);
// 🔴 Ảnh quan trọng thứ hai: bảng LED trên MÀN NHỎ đang hiện 0000 — màn nhỏ
// còn dễ nhoè hơn màn lớn.
await chup(dtO, "14-dt-online-chay-0000");
await dtO.waitForTimeout(2500);
await chup(dtO, "15-dt-online-dang-chay");

await browser.close();
console.log(`\n🖼  Đã chụp ${daChup.length} ảnh vào ${THU_MUC}/`);
console.log(
  "\nBA PHÉP SOI BẮT BUỘC (làm bằng MẮT, không tự động được):\n" +
    "  1. Mở 03-lcd-chay-0000.png và 14-dt-online-chay-0000.png — phải đọc ra 0000,\n" +
    "     KHÔNG phải 8888. Đây là vết sẹo đã trả giá một lần.\n" +
    "  2. Thu nhỏ mọi ảnh xuống 25% — 4 chữ số phải đập vào mắt ĐẦU TIÊN.\n" +
    "  3. Chuyển sang xám — bảng LED phải là vật tương phản cao nhất.\n" +
    "  Thêm: chấm chỉ báo kho trong 06-*.png ở 25% phải KHÔNG nhận ra được.",
);
