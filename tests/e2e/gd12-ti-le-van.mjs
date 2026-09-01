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
const page = await moTrangQuanTri(browser, GOC, { width: 1280, height: 1100 });
const loiConsole = [];
page.on("console", (m) => m.type() === "error" && loiConsole.push(m.text()));
page.on("pageerror", (e) => loiConsole.push(String(e)));

await page.goto(`${GOC}/quan-tri/co-so`, { waitUntil: "networkidle" });
if ((await page.locator("text=Chưa có cơ sở nào").count()) > 0) {
  await page.getByRole("button", { name: "Thêm cơ sở" }).click();
  await page.getByLabel("Tên cơ sở").fill("Trung tâm Sata Robo Hải Châu");
  await page.getByRole("button", { name: "LƯU CƠ SỞ" }).click();
  await page.waitForTimeout(800);
}

await page.goto(`${GOC}/quan-tri/tao`, { waitUntil: "networkidle" });
await page.locator('label:has(input[name="mucDo"][value="de"])').click();
await page.waitForTimeout(300);

/** Đọc con số tỉ lệ lớn (dạng "1/25") và dòng dự báo. */
async function doc() {
  const chu = await page.locator("body").textContent() ?? "";
  const duBao = Number((chu.match(/khoảng ([\d.,]+) giải mỗi ngày/) ?? [0, "0"])[1].replace(",", "."));
  const moiVan = (chu.match(/(1\/[\d.,]+|[\d.,]+%|gần như không thể)\s*mỗi ván/) ?? ["?"])[0];
  return { chu, duBao, moiVan };
}

await page.fill('input[name="soLanChoi"]', "1");
await page.waitForTimeout(250);
const mot = await doc();
ok(`Với 1 lần bấm: đọc được tỉ lệ mỗi ván (${mot.moiVan}) và dự báo ${mot.duBao} giải/ngày`,
  mot.duBao > 0);
ok("Với 1 lần bấm KHÔNG hiện dòng “đẩy tỉ lệ từ … lên …” (không có gì để so)",
  !/đẩy tỉ lệ từ/.test(mot.chu));

await page.fill('input[name="soLanChoi"]', "3");
await page.waitForTimeout(250);
const ba = await doc();
ok(`Đổi sang 3 lần bấm: tỉ lệ nhảy lên (${mot.moiVan} → ${ba.moiVan})`, ba.duBao > mot.duBao);
ok(`… và dự báo nhảy gần gấp ba (${mot.duBao} → ${ba.duBao})`,
  ba.duBao / mot.duBao > 2.5 && ba.duBao / mot.duBao < 3);
ok("… kèm câu nói thẳng số lần bấm đẩy tỉ lệ đi bao nhiêu",
  /3 lần bấm mỗi ván đẩy tỉ lệ từ .+ lên /.test(ba.chu));
ok("… và dòng đối chiếu với trần đã đặt", /Trần bạn đặt là \d+ giải\/ngày/.test(ba.chu));
if (ANH) await page.screenshot({ path: `${ANH}/gd12b-ti-le.png`, fullPage: true });

// Đặt 5 lần bấm → dự báo vượt trần → cảnh báo màu
await page.fill('input[name="soLanChoi"]', "5");
await page.fill('input[name="tranGiaiMoiNgay"]', "2");
await page.waitForTimeout(250);
const nam = await doc();
ok(`Đặt 5 lần bấm với trần 2 → hiện cảnh báo vượt trần (dự báo ${nam.duBao})`,
  nam.chu.includes("Dự báo đã chạm hoặc vượt trần bạn đặt"));
const doDo = await page.locator("p.text-do").count();
ok("Cảnh báo được tô màu, không chỉ là chữ đen lẫn vào bảng", doDo > 0);
if (ANH) await page.screenshot({ path: `${ANH}/gd12b-canh-bao.png`, fullPage: true });

// Nâng trần lên cho khớp → cảnh báo tắt
await page.fill('input[name="tranGiaiMoiNgay"]', "99");
await page.waitForTimeout(250);
ok("Nâng trần lên cho khớp thì cảnh báo tắt",
  !((await doc()).chu.includes("Dự báo đã chạm hoặc vượt trần bạn đặt")));

// Để trần = 0 → nói rõ là KHÔNG GIỚI HẠN
await page.fill('input[name="tranGiaiMoiNgay"]', "0");
await page.waitForTimeout(250);
ok("Trần = 0 thì nói thẳng “KHÔNG GIỚI HẠN”, không im lặng",
  (await doc()).chu.includes("KHÔNG GIỚI HẠN số giải mỗi ngày"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 12.2 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 5));
process.exit(loi.length === 0 ? 0 : 1);
