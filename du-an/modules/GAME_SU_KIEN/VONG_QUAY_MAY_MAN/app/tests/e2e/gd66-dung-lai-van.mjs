/**
 * GĐ 6.3 — DỰNG LẠI VÁN ĐÃ QUAY, kể cả sau khi mặt vòng đã đổi.
 *
 * Đây là câu trả lời cho "có chỉnh kết quả không", và nó phải là một cái NÚT
 * BẤM ĐƯỢC chứ không phải một lời hứa — trò do máy quyết kết quả thì sớm muộn
 * cũng bị hỏi câu đó.
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
  // ── Chơi một ván ────────────────────────────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const dt = await ctx.newPage();
  await dt.goto(`${GOC}/choi/${MA}`, { waitUntil: "networkidle" });
  await dt.getByLabel("Họ và tên phụ huynh").fill("Nguyễn Thị Hoa");
  await dt.getByLabel("Số điện thoại").fill("0912345678");
  await dt.getByRole("button", { name: "Tiếp tục" }).click();
  await dt.getByRole("button", { name: "QUAY", exact: true }).waitFor({ timeout: 15000 });

  const vongLucChoi = (await dt.locator("svg text").allTextContents()).sort();
  await dt.getByRole("button", { name: "QUAY", exact: true }).click();
  const oTrung = dt.locator("p", { hasText: /^Phần quà của bạn: / });
  await oTrung.waitFor({ timeout: 20000 });
  const tenO = (await oTrung.innerText()).replace("Phần quà của bạn: ", "").trim();
  const maXacThuc = (await dt.locator("p.font-mono").innerText()).trim();
  console.log(`    ván vừa chơi: "${tenO}" · mã ${maXacThuc}`);

  // ── Vào quản trị, mở lịch sử ────────────────────────────────────────────
  const q = await moTrangQuanTri(browser, GOC);
  await q.goto(`${GOC}/quan-tri/chuong-trinh/${MA}`, { waitUntil: "networkidle" });

  const hang = q.locator("tbody tr").first();
  kiem((await hang.innerText()).includes("Nguyễn H."), "lịch sử hiện tên RÚT GỌN của người chơi");
  kiem((await hang.innerText()).includes(maXacThuc), "lịch sử hiện đúng mã xác thực vừa nhận");
  kiem(
    !(await hang.innerText()).includes("0912345678"),
    "🔴 lịch sử KHÔNG in số điện thoại đầy đủ",
  );

  // ── Tích "đã trao thưởng" rồi tải lại ───────────────────────────────────
  await hang.getByRole("checkbox", { name: "Đã trao thưởng" }).check();
  await q.waitForTimeout(1200);
  await q.reload({ waitUntil: "networkidle" });
  kiem(
    await q.locator("tbody tr").first().getByRole("checkbox").isChecked(),
    "tích 'đã trao thưởng' rồi tải lại trang vẫn CÒN NGUYÊN",
  );

  // ── Dựng lại ván ────────────────────────────────────────────────────────
  await q.locator("tbody tr").first().getByRole("link", { name: "Dựng lại" }).click();
  await q.waitForURL(/\/dung-lai\//, { timeout: 10000 });

  const vongDungLai = (await q.locator("svg text").allTextContents()).sort();
  kiem(
    JSON.stringify(vongDungLai) === JSON.stringify(vongLucChoi),
    "🔴 vòng dựng lại KHỚP TỪNG Ô với vòng lúc chơi",
  );
  kiem((await q.locator("main").innerText()).includes(tenO), "trang dựng lại ghi đúng ô đã trúng");
  kiem(
    /[0-9a-f]{32}/.test(await q.locator("main").innerText()),
    "in ĐẦY ĐỦ hạt giống — để bên thứ ba tự kiểm lại, không phải tin lời ta",
  );

  // Bấm "Chạy lại" thì vòng phải quay thật.
  await q.getByRole("button", { name: "Chạy lại" }).click();
  await q.waitForTimeout(1000);
  const bienDoi = await q.locator("svg g[transform]").first().getAttribute("transform");
  kiem(/rotate\(-?\d/.test(bienDoi ?? ""), "bấm 'Chạy lại' thì vòng quay thật");
} finally {
  await browser.close();
}

console.log(hong === 0 ? "\n🟢 gd66 ĐẠT" : `\n🔴 gd66 HỎNG ${hong} điểm`);
process.exit(hong === 0 ? 0 : 1);
