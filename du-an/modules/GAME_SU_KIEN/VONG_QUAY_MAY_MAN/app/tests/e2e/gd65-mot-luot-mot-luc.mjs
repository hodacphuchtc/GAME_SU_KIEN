/**
 * GĐ 6.3 — MỘT LÚC MỘT LƯỢT (Đ6).
 *
 * 🔴 Hai lượt song song có thể CÙNG thấy ô cuối còn hàng rồi cùng thắng nó — và
 * không một bài kiểm đơn vị nào bắt được chuyện đó, vì mỗi bài chỉ chạy một
 * lượt. Chỉ hai trình duyệt bấm cùng lúc mới lộ ra.
 */
import { chromium } from "./playwright.mjs";

const GOC = process.env.E2E_GOC ?? "http://localhost:3220";
const MA = "THUE9";

let hong = 0;
function kiem(dat, cau) {
  console.log(`  ${dat ? "✓" : "✖"} ${cau}`);
  if (!dat) hong += 1;
}

/** Mở một điện thoại tới tận màn có nút QUAY. */
async function sanSang(browser, sdt, ten) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`${GOC}/choi/${MA}`, { waitUntil: "networkidle" });
  await p.getByLabel("Họ và tên phụ huynh").fill(ten);
  await p.getByLabel("Số điện thoại").fill(sdt);
  await p.getByRole("button", { name: "Tiếp tục" }).click();
  await p.getByRole("button", { name: "QUAY", exact: true }).waitFor({ timeout: 15000 });
  return p;
}

const browser = await chromium.launch();

try {
  const a = await sanSang(browser, "0912345678", "Phụ huynh A");
  const b = await sanSang(browser, "0987654321", "Phụ huynh B");

  // Bấm CÙNG LÚC — không chờ máy nào xong trước.
  await Promise.all([
    a.getByRole("button", { name: "QUAY", exact: true }).click(),
    b.getByRole("button", { name: "QUAY", exact: true }).click(),
  ]);

  /** Máy này thắng cửa (nhận quà) hay bị từ chối? */
  async function ketCuc(p) {
    const oTrung = p.locator("p", { hasText: /^Phần quà của bạn: / });
    const loi = p.locator("p[role=alert]").filter({ hasText: /\S/ });
    await Promise.race([
      oTrung.waitFor({ timeout: 25000 }),
      loi.waitFor({ timeout: 25000 }),
    ]).catch(() => {});
    if (await oTrung.count()) return { thang: true };
    if (await loi.count()) return { thang: false, cau: (await loi.first().textContent()).trim() };
    return { thang: false, cau: "" };
  }

  const [ka, kb] = await Promise.all([ketCuc(a), ketCuc(b)]);
  const soThang = [ka, kb].filter((k) => k.thang).length;
  console.log(`    A: ${ka.thang ? "được quay" : `bị từ chối — "${ka.cau}"`}`);
  console.log(`    B: ${kb.thang ? "được quay" : `bị từ chối — "${kb.cau}"`}`);

  kiem(soThang === 1, "🔴 ĐÚNG MỘT máy được quay, máy kia bị từ chối");
  const biTuChoi = [ka, kb].find((k) => !k.thang);
  kiem(
    /đang có người quay/i.test(biTuChoi?.cau ?? ""),
    "máy bị từ chối được nói rõ VÌ SAO, không im lặng",
  );
} finally {
  await browser.close();
}

console.log(hong === 0 ? "\n🟢 gd65 ĐẠT" : `\n🔴 gd65 HỎNG ${hong} điểm`);
process.exit(hong === 0 ? 0 : 1);
