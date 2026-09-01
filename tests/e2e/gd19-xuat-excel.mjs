import { chromium } from "./playwright.mjs";
import { inflateRawSync } from "node:zlib";

// Cổng do bộ chạy quyết định — đừng khoá cứng, hai kịch bản chạy song song
// trên cùng một cổng là hai kịch bản phá nhau.
const GOC = process.env.E2E_GOC ?? "http://localhost:3111";
const loi = [], buoc = [];
const ok = (t, d) => { buoc.push(`${d ? "✅" : "❌"} ${t}`); if (!d) loi.push(t); };

/** Giải nén một file XML bên trong gói .xlsx. */
function docTep(zip, ten) {
  const canTim = new TextEncoder().encode(ten);
  for (let i = 0; i < zip.length - 30; i += 1) {
    if (zip[i] !== 0x50 || zip[i + 1] !== 0x4b || zip[i + 2] !== 0x03 || zip[i + 3] !== 0x04) continue;
    const daiTen = zip[i + 26] | (zip[i + 27] << 8);
    const daiThem = zip[i + 28] | (zip[i + 29] << 8);
    const tenTep = zip.slice(i + 30, i + 30 + daiTen);
    if (tenTep.length !== canTim.length || !tenTep.every((b, k) => b === canTim[k])) continue;
    const daiNen = zip[i + 18] | (zip[i + 19] << 8) | (zip[i + 20] << 16) | (zip[i + 21] << 24);
    const batDau = i + 30 + daiTen + daiThem;
    return new TextDecoder().decode(inflateRawSync(zip.slice(batDau, batDau + daiNen)));
  }
  throw new Error(`không thấy ${ten}`);
}

const browser = await chromium.launch({ headless: true });
const loiConsole = [];
const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => loiConsole.push(String(e)));

// Chưa đăng nhập thì route xuất phải trả 401, KHÔNG trả trang HTML đăng nhập
const chuaVao = await p.request.get(`${GOC}/api/xuat/khach-tiem-nang`);
ok(`🔴 Chưa đăng nhập → route xuất trả 401, không trả trang HTML (HTTP ${chuaVao.status()})`,
  chuaVao.status() === 401);

await p.goto(`${GOC}/quan-tri/vao`, { waitUntil: "networkidle" });
await p.getByLabel("Tên đăng nhập").fill("sep");
await p.getByLabel("Mật khẩu").fill("matkhau12345");
await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 10000 });

/**
 * Tải một file xuống bằng chính yêu cầu HTTP của trang (mang theo cookie phiên).
 *
 * Đo bằng `page.request` thay vì bấm nút: nó kiểm được CẢ header — kiểu nội
 * dung và tên file — vốn mới là thứ quyết định Excel có mở được hay không, và
 * trình duyệt có đặt đúng tên khi lưu hay không.
 */
async function tai(duong) {
  const tra = await p.request.get(GOC + duong);
  return {
    zip: new Uint8Array(await tra.body()),
    kieu: tra.headers()["content-type"] ?? "",
    dinhKem: tra.headers()["content-disposition"] ?? "",
    trangThai: tra.status(),
  };
}

// ── Xuất khách tiềm năng, KHÔNG lọc ───────────────────────────────────────
const tatCa = await tai("/api/xuat/khach-tiem-nang?chiDongY=0");
ok(`Tải được file .xlsx (${tatCa.zip.length} byte, bắt đầu bằng "PK")`,
  tatCa.zip.length > 500 && [...tatCa.zip.slice(0, 2)].join(",") === "80,75");
ok(`Kiểu nội dung đúng chuẩn xlsx (${tatCa.kieu.slice(0, 60)}…)`,
  tatCa.kieu.includes("spreadsheetml.sheet"));
ok("Tên file gửi kèm ở dạng UTF-8, không vỡ mã dấu tiếng Việt",
  tatCa.dinhKem.includes("filename*=UTF-8''"));
const sheetTatCa = docTep(tatCa.zip, "xl/worksheets/sheet1.xml");
const demDong = (s) => (s.match(/<row r="/g) ?? []).length - 1;

/** Số dòng đang hiện trên MÀN HÌNH với đúng bộ lọc đó. */
async function dongTrenMan(truyVan) {
  await p.goto(`${GOC}/quan-tri/khach?${truyVan}`, { waitUntil: "networkidle" });
  return p.locator("tbody tr").count();
}

// 🔴 Tính chất cần chứng minh không phải "đúng N dòng" mà là "file khớp màn
// hình". Viết thẳng con số vào bài test thì đổi dữ liệu nền là bài test gãy vì
// một lý do chẳng liên quan gì tới thứ nó canh.
const manTatCa = await dongTrenMan("chiDongY=0");
ok(`Không lọc → file có ĐÚNG số dòng đang hiện trên màn (${demDong(sheetTatCa)} = ${manTatCa})`,
  demDong(sheetTatCa) === manTatCa && manTatCa > 0);

// ── Xuất ĐÚNG bộ lọc đang hiện trên màn ───────────────────────────────────
const locCs2 = await tai("/api/xuat/khach-tiem-nang?chiDongY=0&coSo=2");
const sheetCs2 = docTep(locCs2.zip, "xl/worksheets/sheet1.xml");
const manCs2 = await dongTrenMan("chiDongY=0&coSo=2");
ok(`🔴 Lọc CS2 → file chỉ chứa ĐÚNG dòng đang hiện (${demDong(sheetCs2)} = ${manCs2}, ít hơn ${manTatCa} khi không lọc)`,
  demDong(sheetCs2) === manCs2 && manCs2 < manTatCa);
ok("File lọc CS2 KHÔNG chứa khách của CS1", !sheetCs2.includes("Người Online Một"));

// ── Bốn thứ CSV làm hỏng ─────────────────────────────────────────────────
ok("🔴 SĐT giữ nguyên số 0 đầu và ở kiểu CHỮ (s=2)",
  /<c r="B\d+" s="2" t="inlineStr"><is><t xml:space="preserve">0900000003<\/t>/.test(sheetCs2));
ok("Chữ tiếng Việt đúng dấu trong file", sheetCs2.includes("Người Tự Chọn"));
ok("Cột thời gian ở kiểu NGÀY THÁNG (s=3), sắp xếp được như ngày chứ không như chữ",
  /<c r="I\d+" s="3"><v>4[0-9.]+<\/v><\/c>/.test(sheetCs2));
ok("Định dạng '@' có trong styles — thứ giữ số 0 đầu",
  docTep(locCs2.zip, "xl/styles.xml").includes('numFmtId="164" formatCode="@"'));
ok("Cột “Đồng ý tư vấn” có mặt trong file", sheetCs2.includes("Đồng ý tư vấn"));
ok("Hàng tiêu đề được đông cứng + có bộ lọc sẵn",
  sheetCs2.includes('state="frozen"') && sheetCs2.includes("<autoFilter"));

// ── Hai điểm xuất còn lại ────────────────────────────────────────────────
const lichSu = await tai("/api/xuat/chuong-trinh/ONGAN");
ok(`Xuất lịch sử ván của một chương trình (${decodeURIComponent(lichSu.dinhKem.split("''")[1] ?? "")})`,
  lichSu.dinhKem.includes("lich-su-ONGAN"));
const khoQua = await tai("/api/xuat/kho-qua/ONGAN");
ok(`Xuất kho quà để đối soát ngân sách (${decodeURIComponent(khoQua.dinhKem.split("''")[1] ?? "")})`,
  khoQua.dinhKem.includes("kho-qua-ONGAN"));

// ── Nhật ký ghi lại mọi lần xuất ─────────────────────────────────────────
await p.goto(`${GOC}/quan-tri/nhat-ky`, { waitUntil: "networkidle" });
const chuNk = (await p.locator("body").textContent()) ?? "";
const soDongXuat = await p.locator("tr", { hasText: "Xuất file" }).count();
// Đếm TỪ ĐẦU đến giờ, không so với một con số cứng: máy chủ này có thể đã
// phục vụ vài lần xuất từ lần chạy trước, và bài test không nên gãy vì thế.
ok(`Nhật ký ghi lại mọi lần xuất file, kèm số dòng (${soDongXuat} dòng ≥ 4 lần vừa xuất)`,
  soDongXuat >= 4);
const dongDau = (await p.locator("tr", { hasText: "Xuất file" }).first().textContent()) ?? "";
ok(`Dòng xuất gần nhất ghi rõ SỐ DÒNG đã mang ra ngoài (${dongDau.replace(/\s+/g, " ").trim().slice(0, 70)})`,
  /\d/.test(dongDau));
ok("Dòng nhật ký ghi rõ đã xuất bộ lọc nào", chuNk.includes("khach-tiem-nang?"));

ok(`Không lỗi console (${loiConsole.length} lỗi)`, loiConsole.length === 0);
await browser.close();
console.log(buoc.join("\n"));
console.log(`\n${loi.length === 0 ? "🟢 GĐ 19 — TẤT CẢ BƯỚC DEMO ĐỀU ĐẠT" : `🔴 HỎNG ${loi.length} bước`}`);
if (loiConsole.length) console.log("Lỗi console:", loiConsole.slice(0, 6));
process.exit(loi.length === 0 ? 0 : 1);
