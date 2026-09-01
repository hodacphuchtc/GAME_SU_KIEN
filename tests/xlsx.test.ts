import { describe, expect, it } from "vitest";
import { inflateRawSync } from "node:zlib";

import { dungXlsx, locXml, serialNgay, tenCot, tenTrangTinhHopLe, chu, gio, so, trong } from "@/lib/xuat/xlsx";

/**
 * BỘ GHI XLSX.
 *
 * 🔴 Bốn cạm bẫy được canh riêng từng cái, vì sai bất kỳ cái nào là Excel từ
 * chối CẢ FILE với câu "unreadable content" — không phải hỏng một ô.
 */

/** Giải nén một file trong gói .xlsx để đọc XML bên trong. */
function docTep(zip: Uint8Array, ten: string): string {
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
  throw new Error(`không thấy ${ten} trong gói`);
}

function danhSachTep(zip: Uint8Array): string[] {
  const ra: string[] = [];
  for (let i = 0; i < zip.length - 30; i += 1) {
    if (zip[i] !== 0x50 || zip[i + 1] !== 0x4b || zip[i + 2] !== 0x03 || zip[i + 3] !== 0x04) continue;
    const daiTen = zip[i + 26] | (zip[i + 27] << 8);
    ra.push(new TextDecoder().decode(zip.slice(i + 30, i + 30 + daiTen)));
  }
  return ra;
}

const MAU = {
  ten: "Khách tiềm năng",
  tieuDe: ["Họ tên", "Số điện thoại", "Ghi chú", "Để lại số lúc"],
  dong: [
    [chu("Nguyễn Thị Hoa"), chu("0912345678"), chu("mẹ & con trai <2 tuổi>"), gio(1_788_000_000_000)],
    [chu("Trần Văn Bình"), chu("0987654321"), trong(), gio(null)],
  ],
};

describe("khung gói xlsx", () => {
  it("đủ 6 file đúng đường dẫn", () => {
    expect(danhSachTep(dungXlsx(MAU))).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]);
  });

  it("🔴 [Content_Types].xml đứng ĐẦU gói — để sau là Excel từ chối cả file", () => {
    expect(danhSachTep(dungXlsx(MAU))[0]).toBe("[Content_Types].xml");
  });

  it("KHÔNG có sharedStrings.xml — dùng chuỗi inline", () => {
    expect(danhSachTep(dungXlsx(MAU))).not.toContain("xl/sharedStrings.xml");
  });
});

describe("kiểu ô", () => {
  const sheet = () => docTep(dungXlsx(MAU), "xl/worksheets/sheet1.xml");

  it("🔴 ô SĐT có s=2 và giữ nguyên 0912345678", () => {
    const s = sheet();
    expect(s).toContain('<c r="B2" s="2" t="inlineStr">');
    expect(s).toContain("<t xml:space=\"preserve\">0912345678</t>");
    // Và định dạng "@" (chữ thuần) phải có trong styles — thứ giữ số 0 đầu.
    expect(docTep(dungXlsx(MAU), "xl/styles.xml")).toContain('numFmtId="164" formatCode="@"');
  });

  it("ô giờ có s=3 và serial khớp mốc đã biết", () => {
    expect(sheet()).toContain(`<c r="D2" s="3"><v>${serialNgay(1_788_000_000_000)}</v></c>`);
  });

  it("serial ngày cộng đúng 7 giờ cho múi giờ Việt Nam", () => {
    // 1970-01-01T00:00:00Z ⇒ 07:00 giờ Việt Nam ⇒ 25569 + 7/24.
    expect(serialNgay(0)).toBeCloseTo(25569 + 7 / 24, 9);
  });

  it("ô rỗng ra kiểu trong, không có thẻ giá trị", () => {
    expect(sheet()).toContain('<c r="C3" s="0"/>');
    expect(sheet()).toContain('<c r="D3" s="0"/>');
  });

  it("ô số ra kiểu so", () => {
    const z = dungXlsx({ ten: "T", tieuDe: ["A"], dong: [[so(42)]] });
    expect(docTep(z, "xl/worksheets/sheet1.xml")).toContain('<c r="A2" s="1"><v>42</v></c>');
  });

  it("chuỗi rỗng và null đều thành ô TRỐNG, không thành chữ rỗng", () => {
    expect(chu("")).toEqual({ kieu: "trong" });
    expect(chu(null)).toEqual({ kieu: "trong" });
    expect(so(null)).toEqual({ kieu: "trong" });
    expect(gio(null)).toEqual({ kieu: "trong" });
  });
});

describe("bốn cạm bẫy làm hỏng CẢ file", () => {
  it("escape & < >", () => {
    const s = docTep(dungXlsx(MAU), "xl/worksheets/sheet1.xml");
    expect(s).toContain("mẹ &amp; con trai &lt;2 tuổi&gt;");
    expect(s).not.toContain("mẹ & con");
  });

  it("🔴 ký tự điều khiển \\x07 bị loại bỏ", () => {
    const ten = `Nguyễn${String.fromCharCode(7)} Thị Hoa`;
    const z = dungXlsx({ ten: "T", tieuDe: ["A"], dong: [[chu(ten)]] });
    const s = docTep(z, "xl/worksheets/sheet1.xml");
    expect(s).toContain("Nguyễn Thị Hoa");
    expect(s).not.toContain(String.fromCharCode(7));
  });

  it("giữ lại tab / xuống dòng — đó là ký tự HỢP LỆ trong XML", () => {
    expect(locXml("a\tb\nc")).toBe("a\tb\nc");
  });

  it("tên trang tính dài hơn 31 ký tự bị cắt", () => {
    const dai = "Khách tiềm năng của cơ sở Hải Châu tháng chín";
    expect(tenTrangTinhHopLe(dai)).toHaveLength(31);
    expect(dungXlsx({ ...MAU, ten: dai })).toBeInstanceOf(Uint8Array);
  });

  it("tên trang tính chứa ký tự cấm bị thay", () => {
    expect(tenTrangTinhHopLe("Báo cáo: 01/09 [CS1]")).toBe("Báo cáo  01 09  CS1");
  });

  it("tên trang tính rỗng rơi về “Trang 1” — tên xấu vẫn hơn file hỏng", () => {
    expect(tenTrangTinhHopLe("   ")).toBe("Trang 1");
    expect(tenTrangTinhHopLe("///")).toBe("Trang 1");
  });
});

describe("ca biên", () => {
  it("0 dòng dữ liệu vẫn ra file hợp lệ", () => {
    const z = dungXlsx({ ten: "Rỗng", tieuDe: ["Họ tên", "SĐT"], dong: [] });
    expect(danhSachTep(z)).toHaveLength(6);
    const s = docTep(z, "xl/worksheets/sheet1.xml");
    expect(s).toContain("Họ tên");
    // Không có dòng dữ liệu nào thì vùng lọc chỉ gồm đúng hàng tiêu đề.
    expect(s).toContain('<autoFilter ref="A1:B1"/>');
  });

  it("hàng tiêu đề được đông cứng", () => {
    expect(docTep(dungXlsx(MAU), "xl/worksheets/sheet1.xml")).toContain('state="frozen"');
  });

  it("tên cột theo kiểu Excel", () => {
    expect([0, 1, 25, 26, 27, 51, 52].map(tenCot)).toEqual(["A", "B", "Z", "AA", "AB", "AZ", "BA"]);
  });

  it("hai lần dựng cùng dữ liệu cho ra byte y hệt", () => {
    expect(dungXlsx(MAU)).toEqual(dungXlsx(MAU));
  });
});
