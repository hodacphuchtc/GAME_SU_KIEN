import { chromium } from "./playwright.mjs";

/**
 * GĐ 3.1 — NHẬN DIỆN XONG THÌ HAI MÀN CÙNG ĐỔI, cho CẢ BA GAME.
 *
 * 🔴 Đây là kịch bản canh đúng lỗi đã đo được ngày 02/09/2026:
 *   · Trúng Số phát tin đổi màn lúc MỞ TRANG, khi người ta chưa điền gì —
 *     màn LCD cất mã QR đi trong lúc phụ huynh còn đang gõ số điện thoại.
 *   · Chọn Số NHẬN được tin mà quên gọi `setMan(...)`, nên LCD treo mã QR
 *     suốt trong khi người ta đã đứng chơi.
 *   · Vòng Quay làm đúng — lấy làm khuôn.
 *
 * Nên kịch bản kiểm HAI mốc, không phải một:
 *   ① Sau khi MỞ trang chơi mà CHƯA điền form → LCD vẫn còn mã QR.
 *   ② Sau khi bấm TIẾP TỤC → LCD rời màn chờ và hiện tên người chơi.
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

/**
 * Chữ hiện trên LCD của một game, sau khi cho kênh đồng bộ kịp truyền tin.
 *
 * ⚠️ Vết sẹo v2: đọc QUÁ SỚM thì bắt được khoảnh khắc trang còn đang dựng và
 * kết luận "sản phẩm hỏng" hoàn toàn oan. Chờ tới khi có CHỮ, đừng chờ mỗi sự
 * xuất hiện của phần tử.
 */
async function chuTren(trang) {
  await trang.waitForFunction(() => (document.body.textContent ?? "").trim().length > 20, {
    timeout: 15000,
  });
  return (await trang.locator("body").textContent()) ?? "";
}

/**
 * LCD còn đang ở MÀN CHỜ không.
 *
 * 🔴 Đo bằng CHỮ của màn chờ, không bằng sự có mặt của tấm QR. Vòng Quay CỐ Ý
 * giữ mã QR bên cạnh vòng suốt buổi để người xếp hàng quét trước — ở đó "còn
 * QR" không hề nghĩa là "chưa ai vào chơi". Mỗi game một câu chờ riêng, khai
 * ngay trong bảng GAME bên dưới.
 */
async function dangCho(trang, chuCho) {
  return (await chuTren(trang)).includes(chuCho);
}

const GAME = [
  {
    ten: "Trúng Số",
    ma: "TSG1",
    ho: "Nguyễn Thị Hoa",
    sdt: "0912345801",
    chuCho: "QUÉT MÃ ĐỂ CHƠI",
    dauHieu: "Đang chơi: Nguyễn H.",
  },
  {
    ten: "Chọn Số",
    ma: "CSG1",
    ho: "Trần Văn Bình",
    sdt: "0912345802",
    chuCho: "Quét mã để chọn số may mắn",
    dauHieu: "Đang chơi: Trần B.",
  },
  {
    ten: "Vòng Quay",
    ma: "VQG1",
    ho: "Lê Thị Cúc",
    sdt: "0912345803",
    // Vòng Quay không cất QR đi; dấu hiệu của nó là dòng trạng thái dưới vòng.
    chuCho: "Đang chờ người chơi",
    dauHieu: "Lê C. đang quay",
  },
];

for (const g of GAME) {
  const lcd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  theoDoi(lcd, `lcd-${g.ma}`);
  await lcd.goto(`${GOC}/man-hinh/${g.ma}`, { waitUntil: "networkidle" });

  // Khung 390px — vết sẹo v2.1: lỗi bố cục chỉ sống ở khung hẹp.
  const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
  theoDoi(dt, `dt-${g.ma}`);
  await dt.goto(`${GOC}/choi/${g.ma}`, { waitUntil: "networkidle" });

  // ⓪ GĐ 3.3 — màn LCD Vòng Quay phải vào THẲNG vòng quay: không còn lớp phủ
  // "BẮT ĐẦU CHIẾU" chắn ngang. Nhân viên mở màn rồi đi làm việc khác thì màn
  // hình vẫn đang chiếu, chứ không treo một cái nút chờ người bấm.
  if (g.ma === "VQG1") {
    const chuLcd = await chuTren(lcd);
    ok("Vòng Quay: LCD KHÔNG còn lớp phủ 'BẮT ĐẦU CHIẾU'", !chuLcd.includes("BẮT ĐẦU CHIẾU"));
    ok(
      "Vòng Quay: mặt vòng hiện ra ngay, không phải bấm gì",
      (await lcd.locator('svg[aria-label="Vòng quay may mắn"]').count()) === 1,
    );
  }

  // ① Mở trang thôi thì CHƯA được đổi màn — người đi ngang quầy vẫn phải quét được.
  await dt.getByLabel("Họ và tên").waitFor({ timeout: 15000 });
  await lcd.waitForTimeout(1200);
  ok(
    `${g.ten}: mở trang chơi mà chưa điền form thì LCD VẪN ở màn chờ`,
    await dangCho(lcd, g.chuCho),
  );

  // ② Bấm TIẾP TỤC là hai màn cùng đổi.
  await dt.getByLabel("Họ và tên").fill(g.ho);
  await dt.getByLabel("Số điện thoại").fill(g.sdt);
  await dt.getByRole("button", { name: "TIẾP TỤC" }).click();

  let doiMan = false;
  try {
    await lcd.waitForFunction(
      (dau) => (document.body.textContent ?? "").includes(dau),
      g.dauHieu,
      { timeout: 15000 },
    );
    doiMan = true;
  } catch {
    doiMan = false;
  }
  ok(`${g.ten}: LCD rời màn chờ và hiện tên người chơi ("${g.dauHieu}")`, doiMan);
  ok(`${g.ten}: LCD KHÔNG còn ở màn chờ nữa`, !(await dangCho(lcd, g.chuCho)));

  await dt.close();
  await lcd.close();
}

ok("không có lỗi console/pageerror ở màn nào", loiConsole.length === 0);
if (loiConsole.length > 0) console.log(loiConsole.slice(0, 6).join("\n"));

console.log(buoc.join("\n"));
await browser.close();
if (loi.length > 0) {
  console.error(`\n❌ ${loi.length} bước hỏng:\n- ${loi.join("\n- ")}`);
  process.exit(1);
}
console.log("\n✅ gd30 — ba game cùng một nhịp vào chơi");
