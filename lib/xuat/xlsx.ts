import { dungZip, MOC_MAC_DINH, type TepTrongZip } from "@/lib/xuat/zip";

/**
 * BỘ GHI XLSX TỰ VIẾT — không thêm thư viện nào.
 *
 * Vì sao không dùng CSV: Excel đọc `0912345678` trong CSV thành SỐ rồi ăn mất
 * số 0 đầu, và đội sale nhận file về không gọi được cho ai. Đó là lỗi có thật,
 * không phải giả định.
 *
 * Vì sao không thêm gói npm: ứng dụng có luật TỰ CHỨA. Chừng này dòng đổi lấy
 * việc không bao giờ phải nâng cấp một cây phụ thuộc chỉ để xuất một bảng.
 *
 * 🔴 BỐN CẠM BẪY — sai bất kỳ cái nào là Excel báo "unreadable content" và từ
 * chối CẢ file, không phải chỉ một ô:
 *   1. escape `& < > "` trong mọi chuỗi;
 *   2. LOẠI ký tự điều khiển < 0x20 (trừ tab/LF/CR) — họ tên gõ trên điện thoại
 *      hoàn toàn có thể dính, và XML 1.0 cấm chúng;
 *   3. tên trang tính ≤ 31 ký tự, không chứa `: \\ / ? * [ ]`;
 *   4. `[Content_Types].xml` phải nằm ĐẦU ZIP (lo ở `zip.ts`).
 */

export type KieuO = "chu" | "so" | "gio" | "trong";

export interface O {
  kieu: KieuO;
  gt?: string | number;
}

export interface TrangTinh {
  ten: string;
  tieuDe: string[];
  dong: O[][];
}

export const chu = (gt: string | null | undefined): O =>
  gt === null || gt === undefined || gt === "" ? { kieu: "trong" } : { kieu: "chu", gt };
export const so = (gt: number | null | undefined): O =>
  gt === null || gt === undefined ? { kieu: "trong" } : { kieu: "so", gt };
export const gio = (luc: number | null | undefined): O =>
  luc === null || luc === undefined ? { kieu: "trong" } : { kieu: "gio", gt: luc };
export const trong = (): O => ({ kieu: "trong" });

/** Chỉ số kiểu ô trong `styles.xml`. Thứ tự phải khớp `<cellXfs>` bên dưới. */
const STYLE: Record<KieuO, number> = { chu: 2, so: 1, gio: 3, trong: 0 };

/**
 * Ký tự điều khiển mà XML 1.0 CẤM — mọi thứ dưới 0x20 trừ tab, LF, CR.
 *
 * Viết bằng `new RegExp` với dãy thoát thay vì gõ thẳng: một ký tự điều khiển
 * nằm trong mã nguồn thì trình soạn thảo không hiện, và người sau sửa nhầm mà
 * không thấy mình vừa sửa gì.
 */
const KY_TU_CAM = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", "g");

/**
 * Escape cho XML VÀ loại ký tự điều khiển.
 *
 * LOẠI chứ không escape: `&#x7;` vẫn là ký tự cấm trong XML 1.0 — escape nó
 * không cứu được file, chỉ đổi cách nó hỏng.
 */
export function locXml(tho: string): string {
  return tho
    .replace(KY_TU_CAM, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Tên trang tính hợp lệ: ≤ 31 ký tự, không chứa `: \\ / ? * [ ]`.
 * Rỗng sau khi lọc thì rơi về "Trang 1" — một cái tên xấu vẫn hơn một file hỏng.
 */
export function tenTrangTinhHopLe(tho: string): string {
  const sach = tho.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31);
  return sach === "" ? "Trang 1" : sach;
}

/** `A`, `B`, … `Z`, `AA`, … — tên cột theo kiểu Excel. */
export function tenCot(chiSo: number): string {
  let n = chiSo + 1;
  let ten = "";
  while (n > 0) {
    const du = (n - 1) % 26;
    ten = String.fromCharCode(65 + du) + ten;
    n = Math.floor((n - 1) / 26);
  }
  return ten;
}

/**
 * Số sê-ri ngày của Excel.
 *
 * Excel KHÔNG có khái niệm múi giờ — nó chỉ có một con số. Cộng 7 giờ để con số
 * ấy đọc lên đúng giờ Việt Nam; không cộng thì mọi mốc trước 7h sáng bị lùi
 * sang ngày hôm trước, và báo cáo theo ngày sai một cách rất khó nhìn ra.
 * 25569 là số ngày từ mốc 30/12/1899 của Excel tới mốc 01/01/1970 của Unix.
 */
export function serialNgay(ms: number): number {
  return (ms + 7 * 3_600_000) / 86_400_000 + 25569;
}

function veO(o: O, cot: string, hang: number): string {
  const dc = `${cot}${hang}`;
  const s = STYLE[o.kieu];
  if (o.kieu === "trong" || o.gt === undefined) return `<c r="${dc}" s="${s}"/>`;
  if (o.kieu === "so") return `<c r="${dc}" s="${s}"><v>${Number(o.gt)}</v></c>`;
  if (o.kieu === "gio") return `<c r="${dc}" s="${s}"><v>${serialNgay(Number(o.gt))}</v></c>`;
  // Chuỗi INLINE, không dùng `sharedStrings.xml`: bớt một file XML và cả lượt
  // gom chuỗi trùng; Excel, Google Sheets và Numbers đều đọc được.
  return `<c r="${dc}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${locXml(String(o.gt))}</t></is></c>`;
}

function veHang(o: readonly O[], hang: number): string {
  return `<row r="${hang}">${o.map((x, i) => veO(x, tenCot(i), hang)).join("")}</row>`;
}

const XML_DAU = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function tepXml(ten: string, noiDung: string): TepTrongZip {
  return { ten, noiDung: new TextEncoder().encode(noiDung) };
}

export function dungXlsx(trang: TrangTinh, luc = MOC_MAC_DINH): Uint8Array {
  const ten = tenTrangTinhHopLe(trang.ten);
  const soCot = Math.max(trang.tieuDe.length, ...trang.dong.map((d) => d.length), 1);
  const cuoi = `${tenCot(soCot - 1)}${trang.dong.length + 1}`;

  const hangTieuDe = veHang(
    trang.tieuDe.map((t) => ({ kieu: "chu" as const, gt: t })),
    1,
  );
  const hangDuLieu = trang.dong.map((d, i) => veHang(d, i + 2)).join("");

  const sheet =
    `${XML_DAU}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0">` +
    // Đông cứng hàng tiêu đề: gần như miễn phí, đội sale cuộn 300 dòng hưởng ngay.
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    `<cols><col min="1" max="${soCot}" width="22" customWidth="1"/></cols>` +
    `<sheetData>${hangTieuDe}${hangDuLieu}</sheetData>` +
    `<autoFilter ref="A1:${cuoi}"/>` +
    `</worksheet>`;

  const tep: TepTrongZip[] = [
    tepXml(
      "[Content_Types].xml",
      `${XML_DAU}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    ),
    tepXml(
      "_rels/.rels",
      `${XML_DAU}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    ),
    tepXml(
      "xl/workbook.xml",
      `${XML_DAU}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${locXml(ten)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    tepXml(
      "xl/_rels/workbook.xml.rels",
      `${XML_DAU}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    ),
    tepXml(
      "xl/styles.xml",
      `${XML_DAU}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        // 164 = "@" (chữ thuần) — thứ giữ số 0 đầu của số điện thoại.
        `<numFmts count="2">` +
        `<numFmt numFmtId="164" formatCode="@"/>` +
        `<numFmt numFmtId="165" formatCode="dd/mm/yyyy\\ hh:mm"/>` +
        `</numFmts>` +
        `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>` +
        `<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
        `<fills count="2"><fill><patternFill patternType="none"/></fill>` +
        `<fill><patternFill patternType="gray125"/></fill></fills>` +
        `<borders count="1"><border/></borders>` +
        `<cellStyleXfs count="1"><xf/></cellStyleXfs>` +
        // Thứ tự PHẢI khớp hằng `STYLE` ở trên: 0 trong · 1 số · 2 chữ · 3 giờ.
        `<cellXfs count="4">` +
        `<xf xfId="0"/>` +
        `<xf xfId="0" numFmtId="0" applyNumberFormat="1"/>` +
        `<xf xfId="0" numFmtId="164" applyNumberFormat="1"/>` +
        `<xf xfId="0" numFmtId="165" applyNumberFormat="1"/>` +
        `</cellXfs></styleSheet>`,
    ),
    tepXml("xl/worksheets/sheet1.xml", sheet),
  ];

  return dungZip(tep, luc);
}
