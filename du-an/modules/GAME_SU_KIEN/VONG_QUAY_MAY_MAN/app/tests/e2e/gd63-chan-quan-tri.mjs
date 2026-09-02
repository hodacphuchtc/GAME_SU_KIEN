/**
 * GĐ 6.3 — LỚP CHẮN CỬA TRANG QUẢN TRỊ.
 *
 * 🔴 Đây là kịch bản đắt nhất về hậu quả nếu thiếu: mã QR dán tại quầy in thẳng
 * địa chỉ máy chủ vào tay từng phụ huynh. Xoá đuôi URL gõ `/quan-tri` là vào —
 * ta vừa tự tay đưa địa chỉ cho họ. Và lớp chắn hỏng thì KHÔNG có lỗi nào cả.
 */
import { chromium } from "./playwright.mjs";
import { moTrangQuanTri } from "./dang-nhap.mjs";

const GOC = process.env.E2E_GOC ?? "http://localhost:3220";
const MA = "THUE9";

let hong = 0;
function kiem(dat, cau) {
  console.log(`  ${dat ? "✓" : "✖"} ${cau}`);
  if (!dat) hong += 1;
}

const browser = await chromium.launch();

try {
  // ── Chưa đăng nhập: mọi cửa quản trị đều đóng ───────────────────────────
  const la = await browser.newContext();
  const p = await la.newPage();

  for (const duong of [
    "/quan-tri",
    "/quan-tri/tao",
    `/quan-tri/chuong-trinh/${MA}`,
    `/quan-tri/chuong-trinh/${MA}/dung-lai/1`,
  ]) {
    await p.goto(`${GOC}${duong}`, { waitUntil: "domcontentloaded" });
    const bi = p.url().includes("/quan-tri/vao");
    kiem(bi, `chưa đăng nhập, gõ thẳng ${duong} → bị đá về màn đăng nhập`);
  }

  // API xuất phải trả 401, KHÔNG chuyển hướng: một công cụ tải file mà nhận về
  // trang HTML đăng nhập sẽ lưu nguyên trang đó thành tệp .xlsx hỏng.
  const traApi = await p.request.get(`${GOC}/api/xuat/${MA}`, { maxRedirects: 0 });
  kiem(traApi.status() === 401, `/api/xuat trả 401 (thật: ${traApi.status()}), không chuyển hướng`);

  // ── Sai mật khẩu thì không vào được ─────────────────────────────────────
  await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
  await p.getByLabel("Mật khẩu quản trị").fill("mat-khau-sai-hoan-toan");
  await p.getByRole("button", { name: "Đăng nhập" }).click();
  await p.locator("form p[role=alert]").filter({ hasText: /\S/ }).waitFor({ timeout: 10000 });
  kiem(p.url().includes("/quan-tri/vao"), "gõ sai mật khẩu thì vẫn ở màn đăng nhập");
  const loi = (await p.locator("form p[role=alert]").first().textContent()).trim();
  // Không nói "sai tên" hay "tài khoản không tồn tại" — chỉ MỘT câu cho mọi ca.
  kiem(/không đúng/i.test(loi), `báo lỗi đúng một câu chung: "${loi}"`);
  await la.close();

  // ── Đăng nhập đúng thì vào được và ở lại được ───────────────────────────
  const q = await moTrangQuanTri(browser, GOC);
  kiem(!q.url().includes("/vao"), "đăng nhập đúng mật khẩu thì vào được");

  await q.goto(`${GOC}/quan-tri/chuong-trinh/${MA}`, { waitUntil: "networkidle" });
  kiem(
    !q.url().includes("/vao"),
    "🔴 vào rồi thì KHÔNG bị đá ra ở trang sau (cookie secure không bật nhầm trên HTTP)",
  );

  // ── Đăng xuất thì cửa đóng lại ──────────────────────────────────────────
  await q.goto(`${GOC}/quan-tri`, { waitUntil: "networkidle" });
  await q.getByRole("button", { name: "Đăng xuất" }).click();
  await q.waitForURL((u) => u.pathname.includes("/quan-tri/vao"), { timeout: 10000 });

  await q.goto(`${GOC}/quan-tri`, { waitUntil: "domcontentloaded" });
  kiem(q.url().includes("/quan-tri/vao"), "đăng xuất xong thì cửa đóng lại");

  // ── Trang CÔNG KHAI vẫn phải mở ─────────────────────────────────────────
  // Máy chiếu ở sảnh không có ai ngồi đăng nhập cho nó, và phụ huynh quét QR
  // thì không có tài khoản nào cả.
  for (const duong of [`/choi/${MA}`, `/man-hinh/${MA}`]) {
    await q.goto(`${GOC}${duong}`, { waitUntil: "domcontentloaded" });
    kiem(!q.url().includes("/quan-tri/vao"), `trang công khai ${duong} vẫn mở`);
  }
} finally {
  await browser.close();
}

console.log(hong === 0 ? "\n🟢 gd63 ĐẠT" : `\n🔴 gd63 HỎNG ${hong} điểm`);
process.exit(hong === 0 ? 0 : 1);
