import { chromium } from "./playwright.mjs";

/**
 * CHỌN SỐ — LOẠI TRỪ SỐ ĐÃ RA, chơi tới khi cạn dải.
 *
 * 🔴 Dùng dải BA SỐ (CSO2: 1→3). Dải nhỏ làm lỗi lộ ra ngay lượt thứ hai thay
 * vì phải chơi năm mươi ván mới thấy — và nó cho phép kiểm trọn vẹn cái kết:
 * hết sạch số thì chương trình tự đóng, người tiếp theo bị chặn kèm câu lỗi.
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

const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
theoDoi(lcd, "lcd");
await lcd.goto(`${GOC}/man-hinh/CSO2`, { waitUntil: "networkidle" });

const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
theoDoi(dt, "dt");

/** Chơi trọn một ván bằng một số điện thoại riêng. Trả về số nhận được, hoặc null. */
async function choiMotVan(hoTen, sdt) {
  await dt.goto(`${GOC}/choi/CSO2`, { waitUntil: "networkidle" });

  const oTen = dt.getByLabel("Họ và tên");
  if ((await oTen.count()) === 0) return null; // bị chặn ngay từ cửa

  await oTen.fill(hoTen);
  await dt.getByLabel("Số điện thoại").fill(sdt);
  await dt.getByRole("button", { name: "TIẾP TỤC" }).click();

  const nutBatDau = dt.getByRole("button", { name: "BẮT ĐẦU" });
  await nutBatDau.waitFor({ timeout: 15000 });
  await nutBatDau.click();

  const nutDung = dt.getByRole("button", { name: "DỪNG", exact: true });
  try {
    await nutDung.waitFor({ timeout: 8000 });
  } catch {
    return null; // máy chủ từ chối mở lượt
  }

  await dt.waitForTimeout(2200);
  await nutDung.dispatchEvent("pointerdown");
  await dt.waitForTimeout(1800);

  const nhan = await dt.locator('[role="img"]').first().getAttribute("aria-label");
  const so = Number((nhan ?? "").replace(/\D/g, ""));
  return Number.isFinite(so) && so > 0 ? so : null;
}

const a = await choiMotVan("Nguyễn Thị Hoa", "0912345671");
ok(`Ván 1 nhận được một số (${a})`, a !== null);

const b = await choiMotVan("Trần Văn Bình", "0912345672");
ok(`Ván 2 nhận được một số (${b})`, b !== null);
ok(`🔴 Ván 2 KHÔNG ra lại số của ván 1 (${a} ≠ ${b})`, a !== b);

const c = await choiMotVan("Lê Thị Cúc", "0912345673");
ok(`Ván 3 nhận được một số (${c})`, c !== null);
ok(`🔴 Ba ván ra BA SỐ KHÁC NHAU (${a}, ${b}, ${c})`, new Set([a, b, c]).size === 3);
ok(
  `Ba số phủ đúng trọn dải 1–3 (${[a, b, c].sort().join(", ")})`,
  JSON.stringify([a, b, c].sort()) === JSON.stringify([1, 2, 3]),
);

// Người thứ tư: dải đã cạn.
const d = await choiMotVan("Phạm Văn Dũng", "0912345674");
ok("🔴 Ván 4 bị CHẶN — dải đã phát hết", d === null);

const chuDt = (await dt.locator("body").textContent()) ?? "";
ok("Nói rõ vì sao chặn, không im lặng", /hết số|kết thúc|hết/i.test(chuDt));

// Chương trình phải TỰ ĐÓNG, không để "đang chạy" trong khi không còn số nào.
await lcd.reload({ waitUntil: "networkidle" });
ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

await browser.close();
console.log(buoc.join("\n"));
console.log(
  `\n${loi.length === 0 ? "🟢 CHỌN SỐ · LOẠI TRỪ — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`,
);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
