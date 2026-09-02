import { chromium } from "./playwright.mjs";

/**
 * GĐ 4.2 — CHẾ ĐỘ THỨ BA: hai màn cùng vẽ MỘT dãy số.
 *
 * 🔴 Vì sao cần kịch bản riêng: gd19 chỉ so hai màn SAU khi đã có kết quả, mà
 * con số cuối thì luôn khớp — nó được SNAP về từ máy chủ. Lớp lỗi thật của chế
 * độ này nằm ở LÚC ĐANG CHẠY: hai máy tự dựng dãy số bằng cùng một hàm thuần
 * của thời gian, và nếu một bên quy sai mốc đồng hồ thì chúng lệch pha suốt ván
 * mà con số cuối vẫn đúng.
 *
 * 🔴 Không đòi khớp TUYỆT ĐỐI ở mọi lần đọc, và đây là chỗ đã trả giá: hai lệnh
 * đọc đi qua hai lượt gọi CDP NỐI TIẾP nhau, cách nhau vài chục mili-giây. Ở
 * Trúng Số nền chạy 2 số/giây nên chênh đó vô hình; ở Chọn Số dải 1–100 chạy
 * khoảng 60 số/giây, tức MỘT BƯỚC mỗi 16 ms — và mọi mẫu đều lệch đúng một bước
 * một cách hoàn toàn hợp lệ.
 *
 * Nên phép đo là KHOẢNG CÁCH TRÊN VÒNG, không phải bằng nhau tuyệt đối. Ngưỡng 2
 * bước vẫn có răng: lệch pha thật (quy sai mốc đồng hồ) làm hai màn cách nhau
 * hàng chục bước, không phải một.
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

/** Bốn chữ số đang hiện trên bảng LED của một trang. */
async function docSo(trang) {
  const nhan = await trang.locator('[role="img"]').first().getAttribute("aria-label");
  return (nhan ?? "").replace(/\D/g, "");
}

const GAME = [
  // `coVong` = độ dài vòng số, để tính khoảng cách trên vòng khép kín.
  { ten: "Trúng Số", ma: "TSG2", ho: "Đỗ Thị Mai", sdt: "0912345805", coVong: 10000 },
  { ten: "Chọn Số", ma: "CSG2", ho: "Vũ Văn Nam", sdt: "0912345806", coVong: 100 },
];

for (const g of GAME) {
  const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  theoDoi(lcd, `lcd-${g.ma}`);
  await lcd.goto(`${GOC}/man-hinh/${g.ma}`, { waitUntil: "networkidle" });

  const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
  theoDoi(dt, `dt-${g.ma}`);
  await dt.goto(`${GOC}/choi/${g.ma}`, { waitUntil: "networkidle" });

  await dt.getByLabel("Họ và tên").fill(g.ho);
  await dt.getByLabel("Số điện thoại").fill(g.sdt);
  await dt.getByRole("button", { name: "TIẾP TỤC" }).click();

  const nutBatDau = dt.getByRole("button", { name: "BẮT ĐẦU" });
  await nutBatDau.waitFor({ timeout: 15000 });

  // 🔴 Trước khi bấm, ĐIỆN THOẠI đã phải có bảng LED của riêng nó — đó chính là
  // điều chế độ thứ ba thêm vào. Chế độ tại quầy thuần thì không có bảng nào.
  ok(
    `${g.ten}: điện thoại CÓ bảng LED riêng ở chế độ hai màn`,
    (await dt.locator('[role="img"]').count()) >= 1,
  );

  await nutBatDau.click();

  const nutDung = dt.getByRole("button", { name: "DỪNG", exact: true });
  await nutDung.waitFor({ timeout: 15000 });
  await dt.waitForTimeout(1500);

  let sat = 0;
  const mau = [];
  for (let i = 0; i < 6; i++) {
    const a = await dt.evaluate(
      () => document.querySelector('[role="img"]')?.getAttribute("aria-label") ?? "",
    );
    const b = await lcd.evaluate(
      () => document.querySelector('[role="img"]')?.getAttribute("aria-label") ?? "",
    );
    const sa = a.replace(/\D/g, "");
    const sb = b.replace(/\D/g, "");
    mau.push(`${sa}/${sb}`);
    if (sa !== "" && sb !== "") {
      const d = Math.abs(Number(sa) - Number(sb));
      // Vòng khép kín: 0099 và 0001 chỉ cách nhau hai bước ở dải 1–100.
      if (Math.min(d, g.coVong - d) <= 2) sat += 1;
    }
    await dt.waitForTimeout(400);
  }
  ok(
    `${g.ten}: hai màn bám sát nhau lúc đang chạy (${sat}/6 mẫu trong 2 bước: ${mau.join(" ")})`,
    sat >= 5,
  );

  await nutDung.dispatchEvent("pointerdown");
  await dt.waitForTimeout(1800);

  // 🔴 Sau khi bấm, ĐIỆN THOẠI bỏ bảng LED đi và thay bằng thẻ kết quả — nên
  // không đọc được nó bằng docSo() nữa. Phép so đúng: con số cuối trên màn LCD
  // phải XUẤT HIỆN trong thẻ kết quả của điện thoại.
  // 🔴 Hai game trình bày con số cuối theo hai kiểu: Trúng Số viết thành CHỮ
  // trong thẻ kết quả, Chọn Số vẽ lại bằng chính bảng LED (aria-label). Đọc cả
  // hai đường rồi mới kết luận — bắt một kiểu duy nhất là đỏ oan ở game kia.
  const cuoiLcd = await docSo(lcd);
  const conLed = (await dt.locator('[role="img"]').count()) > 0;
  const soLed = conLed ? await docSo(dt) : "";
  const chuKetQua = ((await dt.locator("body").textContent()) ?? "").replace(/\s+/g, "");
  ok(
    `${g.ten}: bấm DỪNG thì hai màn chốt CÙNG con số (LCD ${cuoiLcd}${
      soLed === "" ? "" : `, điện thoại ${soLed}`
    })`,
    cuoiLcd !== "" && (soLed === cuoiLcd || chuKetQua.includes(cuoiLcd)),
  );

  await dt.close();
  await lcd.close();
}

ok("không có lỗi console/pageerror", loiConsole.length === 0);
if (loiConsole.length > 0) console.log(loiConsole.slice(0, 6).join("\n"));

console.log(buoc.join("\n"));
await browser.close();
if (loi.length > 0) {
  console.error(`\n❌ ${loi.length} bước hỏng:\n- ${loi.join("\n- ")}`);
  process.exit(1);
}
console.log("\n✅ gd32 — chế độ hai màn: cùng một dãy số");
