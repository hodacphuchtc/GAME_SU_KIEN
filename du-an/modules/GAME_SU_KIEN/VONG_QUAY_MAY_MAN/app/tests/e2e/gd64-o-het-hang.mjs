/**
 * GĐ 6.3 — Ô HẾT HÀNG BIẾN MẤT KHỎI VÒNG, không bị thay thầm bằng quà khác.
 *
 * 🔴 Đây là luật TRUNG THỰC của trò này: vòng lúc 8h khác vòng lúc 20h là đúng,
 * không phải lỗi. Thấy "Balo" trên vòng mà nhận sticker mới là thứ không chấp
 * nhận được — đó đúng là vết sẹo đã ghi ở cả hai sổ game trước.
 */
import { chromium } from "./playwright.mjs";

const GOC = process.env.E2E_GOC ?? "http://localhost:3220";
const MA = "HETHG";

let hong = 0;
function kiem(dat, cau) {
  console.log(`  ${dat ? "✓" : "✖"} ${cau}`);
  if (!dat) hong += 1;
}

/** Chơi trọn một lượt bằng một số điện thoại, trả tên ô đã trúng. */
async function choiMot(ctx, sdt, ten) {
  const p = await ctx.newPage();
  await p.goto(`${GOC}/choi/${MA}`, { waitUntil: "networkidle" });
  await p.getByLabel("Họ và tên phụ huynh").fill(ten);
  await p.getByLabel("Số điện thoại").fill(sdt);
  await p.getByRole("button", { name: "Tiếp tục" }).click();
  await p.getByRole("button", { name: "QUAY", exact: true }).waitFor({ timeout: 15000 });

  const tenTrenVong = await p.locator("svg text").allTextContents();
  await p.getByRole("button", { name: "QUAY", exact: true }).click();

  const oTrung = p.locator("p", { hasText: /^Phần quà của bạn: / });
  await oTrung.waitFor({ timeout: 20000 });
  const trung = (await oTrung.innerText()).replace("Phần quà của bạn: ", "").trim();
  await p.close();
  return { trung, tenTrenVong };
}

const browser = await chromium.launch();

try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });

  // Kho khai đúng MỘT cái "Balo cuối cùng" + một ô đáy không giới hạn.
  let daTrungBalo = false;
  let lan = 0;

  // Quay tới khi ai đó trúng Balo. Ô đáy chiếm 50% vòng nên vài lượt là ra.
  while (!daTrungBalo && lan < 12) {
    lan += 1;
    const sdt = `09120000${String(lan).padStart(2, "0")}`;
    const { trung, tenTrenVong } = await choiMot(ctx, sdt, `Phụ huynh ${lan}`);
    // 🔴 Ô nhận được phải NẰM TRÊN vòng mà người chơi vừa nhìn thấy.
    kiem(
      tenTrenVong.includes(trung),
      `lượt ${lan}: nhận "${trung}" — có mặt trên chính vòng vừa nhìn`,
    );
    if (trung === "Balo cuối cùng") daTrungBalo = true;
  }
  kiem(daTrungBalo, `sau ${lan} lượt đã có người trúng "Balo cuối cùng"`);

  // ── Sau khi ô thật hết hàng ─────────────────────────────────────────────
  const p = await ctx.newPage();
  await p.goto(`${GOC}/choi/${MA}`, { waitUntil: "networkidle" });
  await p.getByLabel("Họ và tên phụ huynh").fill("Người tới sau");
  await p.getByLabel("Số điện thoại").fill("0912999999");
  await p.getByRole("button", { name: "Tiếp tục" }).click();
  await p.getByRole("button", { name: "QUAY", exact: true }).waitFor({ timeout: 15000 });

  const conTren = await p.locator("svg text").allTextContents();
  console.log(`    ô còn trên vòng: ${JSON.stringify(conTren)}`);
  kiem(
    !conTren.includes("Balo cuối cùng"),
    "🔴 ô đã hết hàng BIẾN MẤT khỏi vòng của người tới sau",
  );
  kiem(conTren.includes("Lời chúc may mắn"), "ô đáy vẫn còn — người chơi vẫn nhận được quà");
} finally {
  await browser.close();
}

console.log(hong === 0 ? "\n🟢 gd64 ĐẠT" : `\n🔴 gd64 HỎNG ${hong} điểm`);
process.exit(hong === 0 ? 0 : 1);
