/**
 * GĐ 4.2 — MÀN LCD VÀ ĐIỆN THOẠI DỪNG CÙNG MỘT Ô.
 *
 * Đây là bài kiểm đắt nhất của giai đoạn, vì nó kiểm đúng thứ mà cả sảnh nhìn
 * thấy: hai màn hình chạy độc lập, mỗi máy tự tính `goc(t)` bằng đồng hồ của
 * mình, mà vẫn phải dừng ở CÙNG một ô và hiện CÙNG một mã xác thực.
 *
 * Và kiểm luôn ca khó: TẢI LẠI màn LCD giữa lúc đang quay — nó phải bắt kịp
 * đúng chỗ chứ không quay lại từ đầu.
 */
import { chromium } from "./playwright.mjs";

const GOC = process.env.E2E_GOC ?? "http://localhost:3220";
const MA = "THUE9";

let hong = 0;
function kiem(dat, cau) {
  console.log(`  ${dat ? "✓" : "✖"} ${cau}`);
  if (!dat) hong += 1;
}

const browser = await chromium.launch();

try {
  // ── Màn LCD: máy tính ở sảnh ────────────────────────────────────────────
  const ctxLcd = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const lcd = await ctxLcd.newPage();
  await lcd.goto(`${GOC}/man-hinh/${MA}`, { waitUntil: "networkidle" });
  kiem(await lcd.getByText("Quét mã để chơi").isVisible(), "LCD hiện màn chờ có mã QR");
  kiem(
    await lcd.locator("svg[aria-label='Vòng quay may mắn']").isVisible(),
    "LCD hiện vòng quay",
  );

  // ── Điện thoại phụ huynh ────────────────────────────────────────────────
  const ctxDt = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const dt = await ctxDt.newPage();
  await dt.goto(`${GOC}/choi/${MA}`, { waitUntil: "networkidle" });

  await dt.getByLabel("Họ và tên phụ huynh").fill("Nguyễn Thị Hoa");
  await dt.getByLabel("Số điện thoại").fill("0912345678");
  await dt.getByRole("button", { name: "Tiếp tục" }).click();

  const nutQuay = dt.getByRole("button", { name: "QUAY", exact: true });
  await nutQuay.waitFor({ state: "visible", timeout: 15000 });
  kiem(true, "điện thoại nhận diện xong, hiện nút QUAY");

  // LCD phải biết có người vào — tin `nguoi-choi-vao` đi qua kênh SSE.
  await lcd.getByText("Nguyễn H. đang quay").waitFor({ timeout: 10000 });
  kiem(true, "LCD nhận được tin có người vào (qua SSE)");

  // ── Bấm QUAY ────────────────────────────────────────────────────────────
  await nutQuay.click();

  // 🔴 TẢI LẠI LCD GIỮA VÁN. Nó phải bắt kịp đúng chỗ đang quay nhờ mốc bắt đầu
  // của MÁY CHỦ cộng độ lệch đồng hồ nó tự đo — không quay lại từ đầu.
  await lcd.waitForTimeout(1500);
  await lcd.reload({ waitUntil: "networkidle" });

  // ── Chờ cả hai dừng ─────────────────────────────────────────────────────
  const oDienThoai = dt.locator("p", { hasText: /^Phần quà của bạn: / });
  await oDienThoai.waitFor({ timeout: 20000 });

  const khoiTrungLcd = lcd.locator("aside").filter({ hasText: "CHÚC MỪNG" });
  await khoiTrungLcd.waitFor({ timeout: 20000 });
  kiem(true, "LCD tải lại giữa ván VẪN nhận được kết quả");

  // ── So từng chữ ─────────────────────────────────────────────────────────
  const tenODt = (await oDienThoai.innerText()).replace("Phần quà của bạn: ", "").trim();
  const tenOLcd = (await khoiTrungLcd.locator("p").nth(2).innerText()).trim();
  console.log(`    điện thoại: "${tenODt}"  ·  LCD: "${tenOLcd}"`);
  kiem(tenODt.length > 0, "điện thoại hiện tên phần quà");
  kiem(tenODt === tenOLcd, "🔴 ô trúng KHỚP TỪNG CHỮ giữa hai màn hình");

  const maDt = (await dt.locator("p.font-mono").innerText()).trim();
  const maLcd = (await khoiTrungLcd.locator("p.font-mono").innerText()).trim();
  console.log(`    mã điện thoại: "${maDt}"  ·  mã LCD: "${maLcd}"`);
  kiem(/^[A-Z0-9]{4}$/.test(maDt), "mã xác thực đúng dạng 4 ký tự");
  kiem(maDt === maLcd, "🔴 mã xác thực KHỚP giữa hai màn hình");

  // ── Một lượt mỗi người mỗi ngày ─────────────────────────────────────────
  // Đóng màn LCD trước: nó đang giữ một luồng SSE mở, và ta muốn phép đo dưới
  // đây nói về LUẬT CHẶN chứ không lẫn với chuyện kết nối.
  await ctxLcd.close();
  await dt.close();

  const dt2 = await ctxDt.newPage();
  await dt2.goto(`${GOC}/choi/${MA}`, { waitUntil: "networkidle" });
  await dt2.getByLabel("Họ và tên phụ huynh").fill("Nguyễn Thị Hoa");
  // Cùng người, viết ở định dạng KHÁC — phải bị nhận ra là một.
  await dt2.getByLabel("Số điện thoại").fill("+84912345678");
  await dt2.getByRole("button", { name: "Tiếp tục" }).click();

  // 🔴 Locator phải trỏ ĐÚNG cái alert của form. `[role=alert]` trần trụi khớp
  // HAI phần tử — Next chèn thêm một phần tử rỗng mang cùng vai trò — nên
  // `textContent()` trên nó vi phạm chế độ nghiêm ngặt và trả về chuỗi rỗng.
  //
  // 🔴 Và phải chờ CÓ CHỮ, đừng đọc ngay khi phần tử vừa xuất hiện: đọc sớm thì
  // bắt được đúng khoảnh khắc form còn "Đang kiểm…" rồi kết luận là sản phẩm
  // treo — một lần báo hỏng hoàn toàn oan.
  const alert = dt2.locator("form p[role=alert]");
  const nutQuay2 = dt2.getByRole("button", { name: "QUAY", exact: true });

  await Promise.race([
    alert.filter({ hasText: /\S/ }).waitFor({ state: "visible", timeout: 20000 }),
    nutQuay2.waitFor({ state: "visible", timeout: 20000 }),
  ]).catch(() => {});

  const loi = ((await alert.count()) > 0 ? await alert.first().textContent() : "").trim();
  const lotVao = await nutQuay2.isVisible().catch(() => false);
  console.log(`    lời từ chối: "${loi}"`);
  kiem(!lotVao, "🔴 cùng SĐT khác định dạng KHÔNG lọt vào màn QUAY lần hai");
  kiem(/đã quay trong hôm nay/i.test(loi), "lời từ chối nói rõ VÌ SAO");
} finally {
  await browser.close();
}

console.log(hong === 0 ? "\n🟢 gd42 ĐẠT" : `\n🔴 gd42 HỎNG ${hong} điểm`);
process.exit(hong === 0 ? 0 : 1);
