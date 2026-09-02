import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inflateRawSync } from "node:zlib";

import { ketThucLuot, quayMot } from "@/app/actions/quay";
import { T } from "@/config/locale";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { lichSuLuot } from "@/lib/luot/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { bangLichSu, toanBoLichSu } from "@/lib/xuat/bang-lich-su";
import { dungXlsx, locXml, tenCot, tenTrangTinhHopLe } from "@/lib/xuat/xlsx";
import { dungZip } from "@/lib/xuat/zip";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

/**
 * Bản xuất Excel là nơi ĐỐI SOÁT khi phụ huynh cầm mã xác thực tới đòi quà. Nó
 * phải MỞ ĐƯỢC (một tệp .xlsx sai một byte là Excel từ chối CẢ file, không phải
 * chỉ một ô), phải ĐỦ DÒNG, và phải giữ nguyên tiếng Việt có dấu.
 */

// ── Bộ đọc ZIP tối giản, chỉ dùng trong test ──────────────────────────────────
//
// Cố ý KHÔNG dùng thư viện giải nén sẵn có: nếu bộ đọc và bộ ghi dùng chung một
// thư viện thì bài kiểm chỉ chứng minh "thư viện tự đọc được chính nó". Đọc tay
// theo đúng đặc tả ZIP mới thật sự chứng minh tệp đúng chuẩn.
function docZip(goi: Uint8Array): Map<string, string> {
  const xem = new DataView(goi.buffer, goi.byteOffset, goi.byteLength);
  const ra = new Map<string, string>();
  let vt = 0;
  while (vt + 4 <= goi.length && xem.getUint32(vt, true) === 0x04034b50) {
    const phuongPhap = xem.getUint16(vt + 8, true);
    const coNen = xem.getUint32(vt + 18, true);
    const daiTen = xem.getUint16(vt + 26, true);
    const daiThem = xem.getUint16(vt + 28, true);
    const dauTen = vt + 30;
    const ten = new TextDecoder().decode(goi.subarray(dauTen, dauTen + daiTen));
    const dauDl = dauTen + daiTen + daiThem;
    const tho = goi.subarray(dauDl, dauDl + coNen);
    const bung = phuongPhap === 8 ? new Uint8Array(inflateRawSync(tho)) : tho;
    ra.set(ten, new TextDecoder().decode(bung));
    vt = dauDl + coNen;
  }
  return ra;
}

function dungChuongTrinh(tenCoSo = "Cơ sở Nguyễn Trãi") {
  return taoChuongTrinh({
    tenCoSo,
    tiLeODay: 0.5,
    tranGiaiMoiNgay: 0,
    dsO: [
      { ten: "Balo STEM", soLuong: 10, tranMoiNgay: 0, mau: "#F97316", thuTu: 1 },
      { ten: "Lời chúc may mắn", soLuong: null, tranMoiNgay: 0, mau: "#6B21A8", thuTu: 2 },
    ],
  });
}

async function choiNLuot(ma: string, n: number) {
  for (let i = 0; i < n; i++) {
    const nguoi = nhanDien(`Nguyễn Thị Hoa${i}`, `09123456${String(i).padStart(2, "0")}`, true)
      .nguoiChoi!;
    const kq = await quayMot(ma, nguoi.id);
    if (!kq.luot) throw new Error(`lượt ${i} không mở được: ${kq.loi}`);
    await ketThucLuot(kq.luot.id);
  }
}

describe("bộ dựng ZIP", () => {
  it("🔴 mang chữ ký PK\\x03\\x04 ngay từ byte đầu", () => {
    const goi = dungZip([{ ten: "a.txt", noiDung: new TextEncoder().encode("xin chào") }]);
    expect([...goi.subarray(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("đọc lại đúng nội dung đã nén, kể cả tiếng Việt có dấu", () => {
    const chuoi = "Phần quà: Balo STEM — Nguyễn Thị Hoa · 0912345678";
    const goi = dungZip([{ ten: "vn.txt", noiDung: new TextEncoder().encode(chuoi) }]);
    expect(docZip(goi).get("vn.txt")).toBe(chuoi);
  });

  it("hai lần dựng cùng dữ liệu cho ra BYTE Y HỆT nhau", () => {
    // Mốc thời gian trong ZIP là hằng số, không phải `Date.now()` — nhờ vậy một
    // thay đổi lặng lẽ trong bộ ghi sẽ lộ ra ở đây.
    const lam = () => dungZip([{ ten: "a.txt", noiDung: new TextEncoder().encode("abc") }]);
    expect([...lam()]).toEqual([...lam()]);
  });
});

describe("bộ ghi XLSX", () => {
  it("có đủ các phần bắt buộc, và [Content_Types].xml nằm ĐẦU tệp", () => {
    const goi = dungXlsx({ ten: "Thử", tieuDe: ["A"], dong: [] });
    const phan = [...docZip(goi).keys()];
    // Excel đọc [Content_Types].xml trước để biết các phần còn lại là gì; để nó
    // ở sau thì Excel báo "unreadable content" và từ chối cả file.
    expect(phan[0]).toBe("[Content_Types].xml");
    expect(phan).toContain("xl/workbook.xml");
    expect(phan).toContain("xl/worksheets/sheet1.xml");
    expect(phan).toContain("xl/styles.xml");
  });

  it("🔴 LOẠI ký tự điều khiển — escape chúng không cứu được file, XML 1.0 cấm hẳn", () => {
    // Dựng ký tự cấm bằng mã, KHÔNG gõ thẳng: gõ thẳng thì trình soạn thảo
    // không hiện, và người sau sửa nhầm mà không thấy mình vừa sửa gì.
    const chuong = String.fromCharCode(7);
    expect(locXml(`Hoa${chuong}Lan`)).toBe("HoaLan");
    expect(locXml('a & b < c > d "e"')).toBe("a &amp; b &lt; c &gt; d &quot;e&quot;");
  });

  it("tên trang tính bị cắt 31 ký tự và bỏ ký tự Excel cấm", () => {
    expect(tenTrangTinhHopLe("a/b:c*d?e[f]g")).toBe("a b c d e f g");
    expect(tenTrangTinhHopLe("x".repeat(50))).toHaveLength(31);
    expect(tenTrangTinhHopLe("///")).toBe("Trang 1");
  });

  it("tên cột chạy đúng qua mốc Z → AA", () => {
    expect([tenCot(0), tenCot(25), tenCot(26), tenCot(27)]).toEqual(["A", "Z", "AA", "AB"]);
  });
});

describe("xuất lịch sử lượt quay", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("🔴 tệp sinh ra là ZIP HỢP LỆ và có ĐỦ SỐ DÒNG (tiêu đề + 5 lượt)", async () => {
    const ct = dungChuongTrinh();
    await choiNLuot(ct.ma, 5);

    const dong = toanBoLichSu(ct.id);
    expect(dong).toHaveLength(5);

    const goi = dungXlsx(bangLichSu(T.xuatTenTrang(ct.ma), dong));
    expect([...goi.subarray(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);

    const sheet = docZip(goi).get("xl/worksheets/sheet1.xml")!;
    const soHang = [...sheet.matchAll(/<row r="\d+">/g)].length;
    expect(soHang).toBe(6);
  });

  it("🔴 tiếng Việt ĐỦ DẤU đọc lại được từ trong tệp", async () => {
    const ct = dungChuongTrinh();
    await choiNLuot(ct.ma, 1);

    const goi = dungXlsx(bangLichSu(T.xuatTenTrang(ct.ma), toanBoLichSu(ct.id)));
    const phan = docZip(goi);
    const sheet = phan.get("xl/worksheets/sheet1.xml")!;

    for (const tieuDe of [T.xuatCotGio, T.xuatCotHoTen, T.xuatCotSdt, T.xuatCotHatGiong]) {
      expect(sheet).toContain(tieuDe);
    }
    expect(sheet).toContain("Nguyễn Thị Hoa0");
    // Tên trang tính nằm ở workbook.xml, cũng phải còn dấu.
    expect(phan.get("xl/workbook.xml")).toContain("Lịch sử");
  });

  it("🔴 số điện thoại và họ tên ra ĐẦY ĐỦ — đây là bản để ĐỐI SOÁT trao thưởng", async () => {
    const ct = dungChuongTrinh();
    const nguoi = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    const kq = await quayMot(ct.ma, nguoi.id);
    await ketThucLuot(kq.luot!.id);

    // Màn hình quản trị thì CHE (`lichSuLuot`), bản xuất thì KHÔNG. Hai chỗ, hai
    // luật — bài kiểm này giữ cả hai cùng lúc để không ai "sửa cho nhất quán".
    expect(lichSuLuot(ct.id)[0].sdtChe).toBe("09*****678");

    const d = toanBoLichSu(ct.id)[0];
    expect(d.hoTen).toBe("Nguyễn Thị Hoa");
    expect(d.soDienThoai).toBe("0912345678");

    const sheet = docZip(dungXlsx(bangLichSu("Lịch sử", toanBoLichSu(ct.id)))).get(
      "xl/worksheets/sheet1.xml",
    )!;
    expect(sheet).toContain("0912345678");
    expect(sheet).not.toContain("09*****678");
  });

  it("🔴 số điện thoại là Ô CHỮ, không phải ô số — Excel ăn mất số 0 đầu", async () => {
    const ct = dungChuongTrinh();
    await choiNLuot(ct.ma, 1);

    const sheet = docZip(dungXlsx(bangLichSu("Lịch sử", toanBoLichSu(ct.id)))).get(
      "xl/worksheets/sheet1.xml",
    )!;
    // Cột C = số điện thoại. `t="inlineStr"` + style 2 (định dạng "@").
    expect(sheet).toMatch(/<c r="C2" s="2" t="inlineStr">/);
  });

  it("giữ đủ mã xác thực + hạt giống — hai thứ dùng để bác bỏ nghi ngờ chỉnh kết quả", async () => {
    const ct = dungChuongTrinh();
    await choiNLuot(ct.ma, 1);

    const d = toanBoLichSu(ct.id)[0];
    expect(d.maXacThuc).toMatch(/^[A-Z0-9]{4}$/);
    expect(d.hatGiong).toMatch(/^[0-9a-f]{32}$/);

    const sheet = docZip(dungXlsx(bangLichSu("Lịch sử", toanBoLichSu(ct.id)))).get(
      "xl/worksheets/sheet1.xml",
    )!;
    expect(sheet).toContain(d.hatGiong);
    expect(sheet).toContain(d.maXacThuc!);
  });

  it("bảng xếp CŨ TRƯỚC MỚI SAU — ngược với màn hình, đúng dòng thời gian", async () => {
    const ct = dungChuongTrinh();
    await choiNLuot(ct.ma, 3);

    const dong = toanBoLichSu(ct.id);
    expect(dong[0].luc).toBeLessThanOrEqual(dong[2].luc);
    expect(dong.map((d) => d.hoTen)).toEqual([
      "Nguyễn Thị Hoa0",
      "Nguyễn Thị Hoa1",
      "Nguyễn Thị Hoa2",
    ]);
  });

  it("chương trình chưa ai chơi: vẫn ra tệp HỢP LỆ, chỉ có hàng tiêu đề", () => {
    const ct = dungChuongTrinh();
    const goi = dungXlsx(bangLichSu("Lịch sử", toanBoLichSu(ct.id)));
    expect([...goi.subarray(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const sheet = docZip(goi).get("xl/worksheets/sheet1.xml")!;
    expect([...sheet.matchAll(/<row r="\d+">/g)]).toHaveLength(1);
  });

  it("KHÔNG lẫn lượt của chương trình khác", async () => {
    const a = dungChuongTrinh("Cơ sở A");
    const b = dungChuongTrinh("Cơ sở B");
    await choiNLuot(a.ma, 2);

    expect(toanBoLichSu(a.id)).toHaveLength(2);
    expect(toanBoLichSu(b.id)).toHaveLength(0);
  });
});
