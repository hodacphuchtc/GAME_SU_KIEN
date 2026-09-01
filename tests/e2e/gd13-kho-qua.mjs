import { chromium } from "./playwright.mjs";
import { moTrangQuanTri } from "./dang-nhap.mjs";

// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [];
const buoc = [];
const ok = (ten, dat) => { buoc.push(`${dat ? "✅" : "❌"} ${ten}`); if (!dat) loi.push(ten); };

const browser = await chromium.launch({ headless: true });
const loiConsole = [];
const theoDoi = (p, nhan) => {
  p.on("console", (m) => m.type() === "error" && loiConsole.push(`[${nhan}] ${m.text()}`));
  p.on("pageerror", (e) => loiConsole.push(`[${nhan}] ${String(e)}`));
};

// Màn hình LCD: nơi DUY NHẤT hiện dãy số, và cũng là chỗ ta đọc con số đang chạy.
const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
theoDoi(lcd, "lcd");
await lcd.goto(`${GOC}/man-hinh/CHAM`, { waitUntil: "networkidle" });

const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
theoDoi(dt, "dt");

/** Chơi MỘT ván và bấm DỪNG đúng lúc bảng số hiện 0020. */
async function choiVaTrung(hoTen, sdt) {
  await dt.goto(`${GOC}/choi/CHAM`, { waitUntil: "networkidle" });
  await dt.getByLabel("Họ và tên").fill(hoTen);
  await dt.getByLabel("Số điện thoại").fill(sdt);
  await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
  await dt.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
  await dt.getByRole("button", { name: "BẮT ĐẦU" }).click();

  const nut = dt.getByRole("button", { name: "DỪNG", exact: true });
  await nut.waitFor({ timeout: 15000 });

  // Bảng số chạy 2 số/giây ⇒ mỗi con số đứng nửa giây. Rình trên LCD rồi bấm.
  const den = Date.now() + 60000;
  for (;;) {
    const nhan = await lcd.locator('[role="img"]').first().getAttribute("aria-label");
    const so = Number((nhan ?? "").replace(/\D/g, ""));
    if (so >= 20) break;
    if (Date.now() > den) throw new Error("chờ quá lâu mà bảng số chưa tới 0020");
  }
  await nut.dispatchEvent("pointerdown");
  await dt.waitForTimeout(1800);
  return (await dt.locator("body").textContent()) ?? "";
}

const a = await choiVaTrung("Nguyễn Thị Hoa", "0912345671");
ok(`Ván 1 TRÚNG (${/CHÚC MỪNG/.test(a) ? "có" : "KHÔNG"} thấy CHÚC MỪNG)`, /CHÚC MỪNG/.test(a));
ok("Ván 1 nhận Balo STEM", a.includes("Balo STEM"));
if (ANH) await dt.screenshot({ path: `${ANH}/gd13-trung-1.png`, fullPage: true });

const b = await choiVaTrung("Trần Văn Bình", "0912345672");
ok("Ván 2 vẫn TRÚNG và vẫn nhận Balo STEM", /CHÚC MỪNG/.test(b) && b.includes("Balo STEM"));

const c = await choiVaTrung("Lê Thị Cúc", "0912345673");
ok("🔴 Ván 3 hết Balo → TỰ tụt xuống loại đáy “Buổi học thử”",
  c.includes("Buổi học thử") && !c.includes("Balo STEM"));
ok("🔴 Ván 3 vẫn reo “CHÚC MỪNG” y hệt hai ván trước — người ở đáy kho không bị lộ",
  /CHÚC MỪNG/.test(c));
if (ANH) await dt.screenshot({ path: `${ANH}/gd13-day-kho.png`, fullPage: true });

// ── Bảng kho quà trong trang quản trị ──────────────────────────────────────
const qt = await moTrangQuanTri(browser, GOC, { width: 1280, height: 1000 });
theoDoi(qt, "quan-tri");
await qt.goto(`${GOC}/quan-tri/chuong-trinh/CHAM`, { waitUntil: "networkidle" });
const chuKho = (await qt.locator("section", { hasText: "Kho quà" }).first().textContent()) ?? "";
ok("Kho hiện tồn thật: Balo đã trao 2, còn 0", /Balo STEM/.test(chuKho) && /\b2\b/.test(chuKho));
ok("Loại đáy hiện “Không giới hạn” và còn ∞", chuKho.includes("Không giới hạn") && chuKho.includes("∞"));
ok("Kho ĐỦ loại đáy thì KHÔNG hiện cảnh báo",
  !chuKho.includes("Kho chưa có loại nào ĐỂ TRỐNG số lượng"));
if (ANH) await qt.screenshot({ path: `${ANH}/gd13-kho-qua.png`, fullPage: true });

// Xoá loại đã trao → phải bị từ chối tử tế
qt.once("dialog", (d) => d.accept());
await qt.locator("tr", { hasText: "Balo STEM" }).getByRole("button", { name: "Xoá" }).click();
await qt.waitForTimeout(1200);
const sauXoa = (await qt.locator("body").textContent()) ?? "";
ok("Không cho xoá loại ĐÃ TRAO, báo bằng tiếng Việt tử tế",
  sauXoa.includes("đã trao cho người chơi rồi nên không xoá được"));

// Xoá loại đáy (chưa trao? đã trao 1 rồi) → thử thêm loại mới rồi xoá nó
await qt.getByRole("button", { name: "Thêm loại quà" }).click();
await qt.getByLabel("Tên phần quà").fill("Bút chì màu");
await qt.getByLabel("Số lượng").fill("10");
await qt.getByRole("button", { name: "LƯU LOẠI QUÀ" }).click();
await qt.waitForTimeout(1200);
// Khoanh trong đúng khối Kho quà: trang này còn một bảng LỊCH SỬ bên dưới,
// để trần thì `tbody tr` bắt luôn cả dòng lịch sử và phép đo nói về bảng khác.
const dongKho = () =>
  qt.locator("section", { hasText: "Kho quà" }).locator("tbody tr").allTextContents();
ok("Thêm loại mới thì nó nối vào CUỐI kho, không chen lên đầu",
  ((await dongKho()).at(-1) ?? "").includes("Bút chì màu"));

// Đưa loại mới lên đầu bằng nút ↑
const soDong = await qt.locator("section", { hasText: "Kho quà" }).locator("tbody tr").count();
for (let i = 0; i < soDong - 1; i += 1) {
  await qt.locator("tr", { hasText: "Bút chì màu" }).getByRole("button", { name: "Lên trên" }).click();
  await qt.waitForTimeout(900);
}
ok("Nút ↑ đổi được thứ tự bốc (Bút chì màu lên đầu kho)",
  ((await qt.locator("section", { hasText: "Kho quà" }).locator("tbody tr").allTextContents())[0] ?? "")
    .includes("Bút chì màu"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 13.1 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
