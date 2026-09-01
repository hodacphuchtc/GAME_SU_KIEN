import { chromium } from "./playwright.mjs";
// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };
const browser = await chromium.launch({ headless: true });
const loiConsole = [];

/**
 * Phụ huynh mở trang chơi và bấm TIẾP TỤC — KHÔNG chơi tiếp.
 *
 * Dùng CHUNG MỘT trang cho cả bốn người: chỗ chơi được giữ theo token của trang,
 * và mỗi trang mới là một token mới phải chờ chỗ cũ hết hạn (120 giây). Một
 * trang thì token không đổi, nên vào lại chính chương trình đó là được nhận
 * ngay — đúng luật `token = ?` trong `giuCho`.
 */
const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
dt.on("pageerror", (e) => loiConsole.push(String(e)));

async function deLaiSo(maCt, ten, sdt, dongY) {
  await dt.goto(`${GOC}/choi/${maCt}`, { waitUntil: "networkidle" });
  await dt.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
  await dt.getByLabel("Họ và tên").fill(ten);
  await dt.getByLabel("Số điện thoại").fill(sdt);
  if (dongY) await dt.getByRole("checkbox").check();
  await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
  await dt.waitForTimeout(900);
}

await deLaiSo("CTA", "Nguyễn Thị Hoa", "0900000001", true);
await deLaiSo("CTA", "Trần Văn Bình", "0900000002", false);
await deLaiSo("CTB", "Lê Thị Cúc", "0900000003", true);
// CÙNG số 0900000001 nhưng ở cơ sở khác ⇒ phải thành lead thứ hai
await deLaiSo("CTB", "Nguyễn Thị Hoa", "0900000001", true);

const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => loiConsole.push(String(e)));
await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
await p.getByLabel("Tên đăng nhập").fill("sep");
await p.getByLabel("Mật khẩu").fill("matkhau12345");
await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });

const demDong = async () => (await p.locator("tbody tr").count());

await p.goto(`${GOC}/quan-tri/khach`, { waitUntil: "networkidle" });
ok(`Mặc định CHỈ hiện người đồng ý nhận tư vấn (${await demDong()} dòng, không có Trần Văn Bình)`,
  (await demDong()) === 3 && !((await p.locator("tbody").textContent()) ?? "").includes("Trần Văn Bình"));

await p.goto(`${GOC}/quan-tri/khach?chiDongY=0`, { waitUntil: "networkidle" });
ok(`Bỏ tick “chỉ người đồng ý” → thấy thêm người không tick (${await demDong()} dòng)`,
  (await demDong()) === 4);
ok("🔴 Cùng SĐT chơi ở HAI cơ sở → thành HAI dòng khách",
  (await p.locator("tbody tr", { hasText: "Nguyễn Thị Hoa" }).count()) === 2);

// Chơi lại bằng SĐT cũ → vẫn 4 dòng
await deLaiSo("CTA", "Nguyễn Thị Hoa", "0900000001", true);
await p.reload({ waitUntil: "networkidle" });
ok(`🔴 Người cũ quay lại: VẪN 4 dòng, không đẻ thêm (${await demDong()} dòng)`,
  (await demDong()) === 4);

// Lọc theo cơ sở
await p.goto(`${GOC}/quan-tri/khach?chiDongY=0&coSo=2`, { waitUntil: "networkidle" });
ok(`Lọc theo CS2 → chỉ còn khách của CS2 (${await demDong()} dòng)`, (await demDong()) === 2);

// Gán tay 1 dòng cho Sale Một, rồi chia luân phiên CS1
await p.goto(`${GOC}/quan-tri/khach?chiDongY=0&coSo=1`, { waitUntil: "networkidle" });
const truocChia = await demDong();
await p.locator("tbody tr").first().getByLabel("Ai chăm sóc").selectOption({ label: "Sale Một" });
await p.waitForTimeout(1200);
const daGan = await p.locator("tbody tr").first().getByLabel("Ai chăm sóc").inputValue();
ok("Gán tay một dòng cho Sale Một", daGan !== "");

p.once("dialog", (d) => d.accept());
await p.getByRole("button", { name: "Chia luân phiên cho sale đang bật" }).click();
await p.waitForTimeout(1500);
const tin = (await p.locator('[role="status"], [role="alert"]').first().textContent()) ?? "";
ok(`Bấm Chia luân phiên → báo đã chia mấy khách ("${tin.trim()}")`, /Đã chia \d+ khách/.test(tin));

await p.reload({ waitUntil: "networkidle" });
const oGan = await p.locator("tbody tr").locator("select[aria-label='Ai chăm sóc']").all();
const giaTri = await Promise.all(oGan.map((o) => o.inputValue()));
ok(`Sau khi chia: MỌI dòng của CS1 đều có người chăm sóc (${giaTri.join(", ")})`,
  giaTri.length === truocChia && giaTri.every((v) => v !== ""));
if (ANH) await p.screenshot({ path: `${ANH}/gd16-khach.png`, fullPage: false });

p.once("dialog", (d) => d.accept());
await p.getByRole("button", { name: "Chia luân phiên cho sale đang bật" }).click();
await p.waitForTimeout(1500);
const tin2 = (await p.locator('[role="alert"]').first().textContent()) ?? "";
ok(`Bấm lần nữa → báo “Không còn khách nào chưa giao” ("${tin2.trim()}")`,
  tin2.includes("Không còn khách nào chưa giao"));

// Chưa chọn cơ sở thì phải nhắc, không im lặng
await p.goto(`${GOC}/quan-tri/khach?chiDongY=0`, { waitUntil: "networkidle" });
p.once("dialog", (d) => d.accept());
await p.getByRole("button", { name: "Chia luân phiên cho sale đang bật" }).click();
await p.waitForTimeout(1200);
ok("Chưa chọn cơ sở → nhắc chọn cơ sở trước, không im lặng",
  ((await p.locator('[role="alert"]').first().textContent()) ?? "").includes("Chọn một cơ sở trước"));

// Ghi chú + đổi trạng thái, tải lại vẫn còn
await p.goto(`${GOC}/quan-tri/khach?chiDongY=0&coSo=1`, { waitUntil: "networkidle" });
const dong1 = p.locator("tbody tr").first();
await dong1.getByLabel("Trạng thái").selectOption("chot");
await p.waitForTimeout(1200);
await dong1.getByLabel("Ghi chú").fill("hẹn thứ 7");
await dong1.getByRole("button", { name: "Lưu" }).click();
await p.waitForTimeout(1200);
await p.reload({ waitUntil: "networkidle" });
const lai = p.locator("tbody tr").first();
ok("Đổi trạng thái sang “Đã chốt” → tải lại vẫn còn",
  (await lai.getByLabel("Trạng thái").inputValue()) === "chot");
ok("Ghi chú “hẹn thứ 7” → tải lại vẫn còn",
  (await lai.getByLabel("Ghi chú").inputValue()) === "hẹn thứ 7");

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 16 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
