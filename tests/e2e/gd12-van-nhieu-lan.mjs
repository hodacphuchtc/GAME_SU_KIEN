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
const page = await moTrangQuanTri(browser, GOC, { width: 1280, height: 900 });
const loiConsole = [];
page.on("console", (m) => m.type() === "error" && loiConsole.push(m.text()));
page.on("pageerror", (e) => loiConsole.push(String(e)));

// ── Dựng nền: một cơ sở, một chương trình 3 lần bấm ────────────────────────
await page.goto(`${GOC}/quan-tri/co-so`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Thêm cơ sở" }).click();
await page.getByLabel("Tên cơ sở").fill("Trung tâm Sata Robo Hải Châu");
await page.getByLabel("Địa chỉ").fill("114 Hoàng Diệu, Đà Nẵng");
await page.getByRole("button", { name: "LƯU CƠ SỞ" }).click();
await page.waitForTimeout(800);

await page.goto(`${GOC}/quan-tri/tao`, { waitUntil: "networkidle" });
await page.locator('label:has(input[name="mucDo"][value="de"])').click();
await page.fill('input[name="soLanChoi"]', "3");
await page.getByRole("button", { name: "TẠO CHƯƠNG TRÌNH" }).click();
await page.waitForURL(/\/quan-tri\/chuong-trinh\//, { timeout: 10000 });
const maCt = page.url().split("/").pop();
ok(`Trang chi tiết nói rõ chương trình 3 lần bấm mỗi ván`,
  (await page.locator("body").textContent() ?? "").includes("3 lần bấm mỗi ván"));

// ── Chơi trên màn điện thoại ───────────────────────────────────────────────
const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
dt.on("console", (m) => m.type() === "error" && loiConsole.push("[dt] " + m.text()));
dt.on("pageerror", (e) => loiConsole.push("[dt] " + String(e)));
await dt.goto(`${GOC}/choi/${maCt}`, { waitUntil: "networkidle" });

await dt.getByLabel("Họ và tên").fill("Nguyễn Thị Hoa");
await dt.getByLabel("Số điện thoại").fill("0912345678");
await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
await dt.waitForTimeout(600);
ok("Vào được màn sẵn sàng sau khi khai họ tên + SĐT",
  (await dt.getByRole("button", { name: "BẮT ĐẦU" }).count()) > 0);

/** Một lần bấm: BẮT ĐẦU (hoặc BẤM TIẾP) → chờ nút DỪNG sáng → bấm DỪNG. */
async function motLanBam(nhanNut) {
  await dt.getByRole("button", { name: nhanNut }).click();
  await dt.getByRole("button", { name: "DỪNG", exact: true }).waitFor({ timeout: 20000 });
  await dt.waitForTimeout(300);
  await dt.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
  await dt.waitForTimeout(1500);
}

await motLanBam("BẮT ĐẦU");
let chu = await dt.locator("body").textContent() ?? "";
ok(`Sau lần bấm 1: màn hình nói “Lần 1/3”`, chu.includes("Lần 1/3"));
// Ở LẦN BẤM ĐẦU, chip "tốt nhất" cố ý bị ẩn: nó sẽ lặp lại đúng con số ngay
// trên nó. Nên lần 1 chỉ đòi có dòng "lệch N số"; chip được đòi từ lần 2.
ok(`Lần 1 hiện độ lệch của chính lần vừa bấm (${(chu.match(/lệch \d+ số/) ?? ["KHÔNG THẤY"])[0]})`,
  /lệch \d+ số/.test(chu));
ok("Lần 1 KHÔNG lặp lại chip “tốt nhất” trùng y con số ngay trên nó",
  !/tốt nhất đang là lệch/.test(chu));
ok("… và “Còn 2 lần bấm”", chu.includes("Còn 2 lần bấm"));
ok("… có nút BẤM TIẾP", (await dt.getByRole("button", { name: "BẤM TIẾP" }).count()) > 0);
/** Lệch TỐT NHẤT đang giữ: lấy ở chip nếu có, không thì chính lần vừa bấm. */
function lechTotNhat(vanBan) {
  const chip = vanBan.match(/tốt nhất đang là lệch (\d+)/);
  if (chip) return Number(chip[1]);
  return Number((vanBan.match(/lệch (\d+) số/) ?? [0, "0"])[1]);
}
const lech1 = lechTotNhat(chu);
if (ANH) await dt.screenshot({ path: `${ANH}/gd12-giua-van.png`, fullPage: true });

await motLanBam("BẤM TIẾP");
chu = await dt.locator("body").textContent() ?? "";
ok("Sau lần bấm 2: “Lần 2/3” và “Còn 1 lần bấm”",
  chu.includes("Lần 2/3") && chu.includes("Còn 1 lần bấm"));
const lech2 = lechTotNhat(chu);
ok(`Số “tốt nhất” không xấu đi sau lần bấm tệ hơn (${lech1} → ${lech2})`, lech2 <= lech1);

await motLanBam("BẤM TIẾP");
chu = await dt.locator("body").textContent() ?? "";
ok("Hết 3 lần: vào màn tổng kết, không còn nút BẤM TIẾP",
  (await dt.getByRole("button", { name: "BẤM TIẾP" }).count()) === 0);
ok("Màn tổng kết nói rõ đây là LẦN LỆCH ÍT NHẤT trong ván",
  chu.includes("Lần lệch ít nhất trong ván"));
const lechCuoi = Number((chu.match(/lệch (\d+)/) ?? [0, "0"])[1]);
// Bất biến đúng: "tốt nhất" chỉ được GIỮ NGUYÊN hoặc TỐT LÊN. Lần bấm thứ ba
// có thể tốt hơn thật, nên đòi bằng đúng `lech2` là đòi sai. Nhưng nếu màn
// tổng kết quay lại vẽ lần CUỐI (lỗi đã bắt được 01/09) thì con số sẽ XẤU ĐI —
// và đó chính là thứ dòng này canh.
ok(`Tổng kết không bao giờ xấu hơn lần tốt nhất đang giữ (${lechCuoi} ≤ ${lech2})`,
  lechCuoi <= lech2);
if (ANH) await dt.screenshot({ path: `${ANH}/gd12-tong-ket.png`, fullPage: true });

// ── Ván thứ hai cùng SĐT trong ngày ────────────────────────────────────────
await dt.getByRole("button", { name: "THỬ LẠI" }).click();
await dt.waitForTimeout(800);
await dt.getByRole("button", { name: "BẮT ĐẦU" }).click();
await dt.waitForTimeout(1200);
chu = await dt.locator("body").textContent() ?? "";
ok("Ván thứ hai cùng SĐT trong ngày bị chặn, nói đúng câu “một ván mỗi ngày”",
  chu.includes("một ván mỗi ngày"));

// ── Bảng đối soát của nhân viên ────────────────────────────────────────────
await page.goto(`${GOC}/quan-tri/chuong-trinh/${maCt}`, { waitUntil: "networkidle" });
const soDong = await page.locator("tbody tr").count();
ok(`Lịch sử hiện MỘT dòng ván, không phải ba dòng lượt (thấy ${soDong} dòng)`, soDong === 1);
const dong = await page.locator("tbody tr").first().textContent() ?? "";
ok(`Dòng đó mang đúng số lệch tổng kết của ván (${lechCuoi})`,
  dong.includes(String(lechCuoi)));
if (ANH) await page.screenshot({ path: `${ANH}/gd12-lich-su.png`, fullPage: false });

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 12.1 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 5));
process.exit(loi.length === 0 ? 0 : 1);
