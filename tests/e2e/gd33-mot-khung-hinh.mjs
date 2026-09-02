import { chromium } from "./playwright.mjs";

/**
 * GĐ 5.1 — MÀN ĐIỆN THOẠI GỌN TRONG MỘT KHUNG HÌNH.
 *
 * 🔴 Chưa bài kiểm nào canh cuộn DỌC: hai kịch bản cũ (gd19-chon-so, gd26-goi-y)
 * chỉ đo tràn NGANG. Mà lỗi người vận hành nêu là phải VUỐT mới thấy nút — tức
 * tràn DỌC, ở đúng khung điện thoại thật.
 *
 * Phép đo: document.body.scrollHeight <= window.innerHeight + 1, tại khung
 * 390×844 (iPhone 14) và 375×667 (iPhone SE — máy nhỏ nhất còn gặp ở quầy), cho
 * TỪNG BƯỚC của cả ba game.
 *
 * ⚠️ Cộng 1 pixel vì trình duyệt làm tròn chiều cao khung nhìn ở màn hình có tỉ
 * lệ lẻ; không có nó thì bài kiểm đỏ vì đúng một pixel chẳng ai thấy.
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const loi = [];
const buoc = [];
const ok = (ten, dat) => {
  // In NGAY từng bước: kịch bản này chạy 24 phép đo qua sáu vòng lặp, và nếu nó
  // chết giữa chừng thì bảng in ở cuối file không bao giờ tới — người đọc không
  // biết nó gãy ở vòng nào.
  const dong = `${dat ? "✅" : "❌"} ${ten}`;
  console.log(dong);
  buoc.push(dong);
  if (!dat) loi.push(ten);
};

const browser = await chromium.launch({ headless: true });
const loiConsole = [];

const KHUNG = [
  { ten: "390×844", w: 390, h: 844 },
  { ten: "375×667 (SE)", w: 375, h: 667 },
];

const GAME = [
  { ten: "Trúng Số", ma: "TSG1", ho: "Ngô Thị Lan", sdt: "0912345811" },
  { ten: "Chọn Số", ma: "CSG1", ho: "Bùi Văn Long", sdt: "0912345812" },
  { ten: "Vòng Quay", ma: "VQG1", ho: "Hồ Thị Mây", sdt: "0912345813" },
];

/** Trang có phải cuộn dọc không. */
async function phaiCuon(p) {
  return p.evaluate(() => document.body.scrollHeight > window.innerHeight + 1);
}

let stt = 0;
for (const k of KHUNG) {
  for (const g of GAME) {
    stt += 1;
    // 🔴 Ba game này đều ở chế độ TẠI QUẦY, và chế độ đó đòi có màn hình lớn
    // đang mở — không mở thì điện thoại dừng ở màn "chưa chơi được" và form
    // không bao giờ hiện. (Chỉ chế độ ONLINE mới chơi được một mình.)
    const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await lcd.goto(`${GOC}/man-hinh/${g.ma}`, { waitUntil: "networkidle" });

    const dt = await browser.newPage({ viewport: { width: k.w, height: k.h } });
    dt.on("console", (m) => m.type() === "error" && loiConsole.push(`[${g.ma}] ${m.text()}`));
    dt.on("pageerror", (e) => loiConsole.push(`[${g.ma}] ${String(e)}`));
    await dt.goto(`${GOC}/choi/${g.ma}`, { waitUntil: "networkidle" });

    // Bước 1 — NHẬP THÔNG TIN.
    await dt.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
    ok(`${k.ten} · ${g.ten} · bước nhập thông tin: không phải cuộn`, !(await phaiCuon(dt)));

    // Bước 2 — SẴN SÀNG (đã nhận diện, chưa chơi).
    await dt.getByLabel("Họ và tên").fill(g.ho);
    await dt.getByLabel("Số điện thoại").fill(`${g.sdt.slice(0, 9)}${stt % 10}`);
    await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
    const nutChoi = dt.getByRole("button", { name: g.ma === "VQG1" ? "QUAY" : "BẮT ĐẦU" });
    await nutChoi.waitFor({ timeout: 20000 });
    ok(`${k.ten} · ${g.ten} · bước sẵn sàng: không phải cuộn`, !(await phaiCuon(dt)));

    // Bước 3 — ĐANG CHƠI.
    await nutChoi.click();
    await dt.waitForTimeout(1500);
    ok(`${k.ten} · ${g.ten} · lúc đang chơi: không phải cuộn`, !(await phaiCuon(dt)));

    // Bước 4 — KẾT QUẢ.
    if (g.ma === "VQG1") {
      // Vòng quay tự dừng sau vài giây rồi hiện thẻ quà.
      await dt.waitForTimeout(7000);
    } else {
      const nutDung = dt.getByRole("button", { name: "DỪNG", exact: true });
      await nutDung.waitFor({ timeout: 20000 });
      // Đợi dãy số chạy được một quãng rồi mới bấm. Bấm ngay khi nút vừa hiện thì
      // mốc thời gian gửi lên máy chủ sát 0, và luật chống khai bừa mili-giây từ
      // chối lượt đó — lượt không đóng, chỗ không được nhả, và LẦN SAU của cùng
      // chương trình bị báo "đang có người chơi". Đúng cách gd20 đang làm.
      await dt.waitForTimeout(2200);
      await nutDung.dispatchEvent("pointerdown");
      await dt.waitForTimeout(2000);
    }
    ok(`${k.ten} · ${g.ten} · màn kết quả: không phải cuộn`, !(await phaiCuon(dt)));

    await dt.close();
    await lcd.close();
  }
}

ok("không có lỗi console/pageerror", loiConsole.length === 0);
if (loiConsole.length > 0) console.log(loiConsole.slice(0, 6).join("\n"));

await browser.close();
if (loi.length > 0) {
  console.error(`\n❌ ${loi.length} bước hỏng:\n- ${loi.join("\n- ")}`);
  process.exit(1);
}
console.log("\n✅ gd33 — ba game gọn trong một khung hình");
