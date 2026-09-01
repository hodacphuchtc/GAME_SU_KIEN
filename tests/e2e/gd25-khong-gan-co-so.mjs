import { chromium } from "./playwright.mjs";

/**
 * GĐ 25 — chương trình KHÔNG gán cơ sở, phụ huynh tự chọn.
 *
 * Chạy trọn vòng đời thật: nhân viên tạo chương trình không gán cơ sở → phụ
 * huynh quét mã trên điện thoại → thấy ô chọn cơ sở → chọn xong thì lead phải
 * về ĐÚNG cơ sở họ chọn. Bước cuối là bước đáng tiền: một lead không thuộc cơ
 * sở nào sẽ rơi ra ngoài mọi báo cáo, và không ai gọi cho họ.
 */

const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const ANH = process.env.THU_MUC_ANH;
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };
const browser = await chromium.launch({ headless: true });
const loiConsole = [];

const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => loiConsole.push(String(e)));

await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
await p.getByLabel("Tên đăng nhập").fill("sep");
await p.getByLabel("Mật khẩu").fill("matkhau12345");
await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });

// ── Nhân viên: tạo chương trình KHÔNG gán cơ sở ────────────────────────────
await p.goto(`${GOC}/quan-tri/tao`, { waitUntil: "networkidle" });

const oCoSo = p.locator('select[name="coSoId"]');
const cacLuaChon = await oCoSo.locator("option").allTextContents();
ok(`Ô cơ sở có mục “Không gán cơ sở” (${cacLuaChon.length} lựa chọn)`,
  cacLuaChon.some((t) => t.includes("Không gán cơ sở")));

await oCoSo.selectOption("");
await p.waitForTimeout(300);
const than = (await p.locator("body").textContent()) ?? "";
ok("Chọn nó thì hiện ngay lời giải thích phụ huynh sẽ tự chọn cơ sở",
  than.includes("TỰ CHỌN cơ sở"));
if (ANH) await p.screenshot({ path: `${ANH}/gd25-khong-gan-co-so.png`, fullPage: false });

await p.locator('input[name="soTrung"]').fill("0020");
await p.locator('input[name="tenGiaiThuong"]').fill("Balo STEM");
await p.getByRole("button", { name: "TẠO CHƯƠNG TRÌNH" }).click();
await p.waitForURL(/\/quan-tri\/chuong-trinh\//, { timeout: 15000 });

const ma = new URL(p.url()).pathname.split("/").pop();
ok(`Tạo được chương trình không gán cơ sở (mã ${ma})`, Boolean(ma));

const thanCt = (await p.locator("body").textContent()) ?? "";
ok("Tiêu đề hiện “Chưa gán cơ sở” chứ không để trống",
  thanCt.includes("Chưa gán cơ sở"));

// ── Phụ huynh: quét mã, phải được hỏi cơ sở ────────────────────────────────
const dt = await browser.newPage({ viewport: { width: 390, height: 844 } });
dt.on("pageerror", (e) => loiConsole.push(`[dt] ${String(e)}`));
await dt.goto(`${GOC}/choi/${ma}`, { waitUntil: "networkidle" });

const oChonCoSo = dt.locator('select[name="coSoId"]');
ok("🔴 Điện thoại hiện ô “Bạn đang ở gần cơ sở nào?”", (await oChonCoSo.count()) === 1);

const dsCoSo = (await oChonCoSo.locator("option").allTextContents()).filter(
  (t) => !t.includes("— Chọn"),
);
ok(`Danh sách xổ ra đúng các cơ sở đã khai (${dsCoSo.join(" · ")})`, dsCoSo.length >= 2);

await dt.getByLabel("Họ và tên").fill("Trần Thị Mai");
await dt.getByLabel("Số điện thoại").fill("0912345677");
await oChonCoSo.selectOption({ label: dsCoSo[1] });
// Tick ô đồng ý tư vấn: màn Khách tiềm năng mặc định CHỈ hiện người đã đồng ý
// (`chiDongY` bật sẵn), nên không tick thì lead có sinh cũng không nhìn thấy.
await dt.getByRole("checkbox", { name: /đồng ý nhận tư vấn/i }).check();
await dt.getByRole("button", { name: "TIẾP TỤC" }).click();
await dt.getByRole("button", { name: "BẮT ĐẦU" }).waitFor({ timeout: 15000 });
ok("Chọn cơ sở xong thì vào được màn chơi", true);

// ── Lead phải về ĐÚNG cơ sở phụ huynh đã chọn ──────────────────────────────
await p.goto(`${GOC}/quan-tri/khach`, { waitUntil: "networkidle" });
const thanKhach = (await p.locator("body").textContent()) ?? "";
// SĐT che vẫn giữ 3 số cuối, nên "677" là dấu vân tay đủ chắc mà không phụ
// thuộc vào việc bảng đang che hay đang hiện đầy đủ.
const cacSdt = await p.locator("[data-sdt]").allTextContents();
ok(`Lead sinh ra ngay khi bấm TIẾP TỤC, không đợi chơi xong (${cacSdt.join(", ") || "KHÔNG CÓ DÒNG NÀO"})`,
  cacSdt.some((s) => s.endsWith("677")));

// Nhãn cơ sở có dạng "CS2 — Cơ sở Thanh Khê"; lấy phần MÃ ở đầu để so, vì bảng
// khách chỉ hiện mã chứ không hiện trọn nhãn.
const maCoSoDaChon = dsCoSo[1].trim().split(/\s/)[0];
ok(`🔴 Lead nằm dưới ĐÚNG cơ sở phụ huynh vừa chọn (${maCoSoDaChon})`,
  thanKhach.includes(maCoSoDaChon));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);

console.log(buoc.join("\n"));
console.log(loi.length === 0
  ? "\n🟢 GĐ 25 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT"
  : `\n🔴 GĐ 25 — ${loi.length} bước KHÔNG đạt`);
await browser.close();
process.exit(loi.length === 0 ? 0 : 1);
