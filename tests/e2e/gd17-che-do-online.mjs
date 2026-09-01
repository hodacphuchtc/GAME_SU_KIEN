import { chromium } from "./playwright.mjs";
// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };
const browser = await chromium.launch({ headless: true });
const loiConsole = [];
const dt = () => browser.newPage({ viewport: { width: 390, height: 844 } });

/** Số đang hiện trên bảng LED của CHÍNH trang này (chế độ online). */
const soTrenMay = async (p) =>
  Number(((await p.locator('[role="img"]').first().getAttribute("aria-label")) ?? "").replace(/\D/g, ""));

// ── 17.1 · ONLINE: dãy số chạy NGAY trên điện thoại, KHÔNG cần màn LCD ────
const a = await dt();
a.on("pageerror", (e) => loiConsole.push(String(e)));
await a.goto(`${GOC}/choi/ONGAN`, { waitUntil: "networkidle" });
await a.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
ok("Chế độ ONLINE + gán sẵn → form KHÔNG hỏi cơ sở",
  (await a.locator('select[name="coSoId"]').count()) === 0);
await a.getByLabel("Họ và tên").fill("Người Online Một");
await a.getByLabel("Số điện thoại").fill("0900000001");
await a.getByRole("checkbox").check();
await a.getByRole("button", { name: "TIẾP TỤC" }).click();
await a.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
ok("🔴 KHÔNG mở màn LCD nào mà vẫn vào chơi được",
  (await a.getByRole("button", { name: "BẮT ĐẦU" }).count()) === 1);

// Người thứ hai mở CÙNG LÚC — không ai phải chờ ai
const b = await dt();
b.on("pageerror", (e) => loiConsole.push(String(e)));
await b.goto(`${GOC}/choi/ONGAN`, { waitUntil: "networkidle" });
await b.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
ok("🔴 Người thứ HAI mở cùng lúc vẫn vào được, không báo “đang có người chơi”",
  (await b.getByLabel("Họ và tên").count()) === 1);
await b.getByLabel("Họ và tên").fill("Người Online Hai");
await b.getByLabel("Số điện thoại").fill("0900000002");
await b.getByRole("checkbox").check();
await b.getByRole("button", { name: "TIẾP TỤC" }).click();
await b.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await b.getByRole("button", { name: "BẮT ĐẦU" }).click();
await a.getByRole("button", { name: "BẮT ĐẦU" }).click();
await a.waitForTimeout(2500);

const so1 = await soTrenMay(a);
await a.waitForTimeout(1200);
const so2 = await soTrenMay(a);
ok(`🔴 Bảng số chạy NGAY trên điện thoại (${so1} → ${so2})`, so2 > so1);
ok("Cả hai máy cùng chơi được một lúc",
  (await b.getByRole("button", { name: "DỪNG", exact: true }).count()) === 1);
if (ANH) await a.screenshot({ path: `${ANH}/gd17-online.png`, fullPage: true });

await a.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await a.waitForTimeout(1800);
ok("Chơi trọn ván trên điện thoại, có kết quả",
  /KHÔNG TRÚNG THƯỞNG|CHÚC MỪNG/.test((await a.locator("body").textContent()) ?? ""));
await a.close();
await b.close();

// ── Chế độ TẠI QUẦY: hành vi cũ KHÔNG đổi ────────────────────────────────
const q1 = await dt();
await q1.goto(`${GOC}/choi/QUAY`, { waitUntil: "networkidle" });
await q1.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
const q2 = await dt();
await q2.goto(`${GOC}/choi/QUAY`, { waitUntil: "networkidle" });
await q2.waitForTimeout(1500);
ok("🔴 Chế độ TẠI QUẦY: máy thứ hai VẪN bị báo bận (hành vi cũ không đổi)",
  ((await q2.locator("body").textContent()) ?? "").includes("đang có người chơi"));
ok("Tại quầy KHÔNG vẽ bảng số trên điện thoại (dãy số sống ở màn LCD)",
  (await q1.locator('[role="img"]').count()) === 0);
await q1.close();
await q2.close();

// ── 17.2 · Phụ huynh tự chọn cơ sở ───────────────────────────────────────
const c = await dt();
c.on("pageerror", (e) => loiConsole.push(String(e)));
await c.goto(`${GOC}/choi/ONCHON`, { waitUntil: "networkidle" });
await c.getByLabel("Họ và tên").waitFor({ timeout: 20000 });
const luaChon = await c.locator('select[name="coSoId"] option').allTextContents();
ok(`Form hỏi cơ sở bằng DANH SÁCH ĐỊA CHỈ (${luaChon.slice(1).join(" | ")})`,
  luaChon.some((t) => t.includes("CS2 — 114 Hoàng Diệu")));
ok("Không có lựa chọn “để trống” chọn được",
  (await c.locator('select[name="coSoId"] option:not([disabled])').count()) === 2);

await c.getByLabel("Họ và tên").fill("Người Tự Chọn");
await c.getByLabel("Số điện thoại").fill("0900000003");
await c.getByRole("checkbox").check();
await c.locator('select[name="coSoId"]').selectOption({ label: "CS2 — 114 Hoàng Diệu, Đà Nẵng" });
await c.getByRole("button", { name: "TIẾP TỤC" }).click();
await c.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
await c.getByRole("button", { name: "BẮT ĐẦU" }).click();
await c.waitForTimeout(2500);
await c.getByRole("button", { name: "DỪNG", exact: true }).dispatchEvent("pointerdown");
await c.waitForTimeout(1800);
await c.close();

// ── Màn quản trị: lead về ĐÚNG cơ sở, có nhãn chưa xác thực ──────────────
const qt = await browser.newPage({ viewport: { width: 1400, height: 950 } });
qt.on("pageerror", (e) => loiConsole.push(String(e)));
await qt.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
await qt.getByLabel("Tên đăng nhập").fill("sep");
await qt.getByLabel("Mật khẩu").fill("matkhau12345");
await qt.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
await qt.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });

await qt.goto(`${GOC}/quan-tri/khach?coSo=2`, { waitUntil: "networkidle" });
const chuCs2 = (await qt.locator("tbody").textContent()) ?? "";
ok("🔴 Lọc CS2 → thấy đúng khách vừa TỰ CHỌN cơ sở đó", chuCs2.includes("Người Tự Chọn"));
ok("Khách online mang nhãn “Số chưa xác thực”",
  (await qt.locator("[data-chua-xac-thuc]").count()) >= 1);
if (ANH) await qt.screenshot({ path: `${ANH}/gd17-lead-online.png`, fullPage: false });

await qt.goto(`${GOC}/quan-tri/khach?coSo=1`, { waitUntil: "networkidle" });
const chuCs1 = (await qt.locator("tbody").textContent()) ?? "";
ok("Chế độ GÁN SẴN: lead vẫn về đúng cơ sở đã gán (CS1)",
  chuCs1.includes("Người Online Một") && !chuCs1.includes("Người Tự Chọn"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 17 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
