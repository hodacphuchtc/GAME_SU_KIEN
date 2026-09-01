import { describe, expect, it } from "vitest";
import { crc32, inflateRawSync } from "node:zlib";

import { dungZip, MOC_MAC_DINH } from "@/lib/xuat/zip";

/**
 * BỘ DỰNG ZIP TỰ VIẾT.
 *
 * Một file .xlsx là một ZIP. Nếu ZIP sai một byte thì Excel không báo "ô này
 * lỗi" — nó từ chối MỞ CẢ FILE. Nên tầng này được canh ở mức byte.
 */

const chu = (s: string) => new TextEncoder().encode(s);

describe("khung ZIP", () => {
  it('PK\\x03\\x04 ở 4 byte đầu', () => {
    const zip = dungZip([{ ten: "a.txt", noiDung: chu("xin chào") }]);
    expect([...zip.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("tìm thấy EOCD ở cuối", () => {
    const zip = dungZip([{ ten: "a.txt", noiDung: chu("xin chào") }]);
    expect([...zip.slice(-22, -18)]).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it("số bản ghi central directory bằng số file", () => {
    const zip = dungZip([
      { ten: "a.txt", noiDung: chu("một") },
      { ten: "b.txt", noiDung: chu("hai") },
      { ten: "c/d.txt", noiDung: chu("ba") },
    ]);
    const eocd = zip.length - 22;
    const soTrenDia = zip[eocd + 8] | (zip[eocd + 9] << 8);
    const tong = zip[eocd + 10] | (zip[eocd + 11] << 8);
    expect(soTrenDia).toBe(3);
    expect(tong).toBe(3);
  });

  it("giải nén ngược bằng inflateRawSync trả đúng nội dung", () => {
    const goc = chu("Nguyễn Thị Hoa — 0912345678 & con trai");
    const zip = dungZip([{ ten: "a.txt", noiDung: goc }]);

    // Đọc phần dữ liệu ngay sau đầu mục cục bộ.
    const daiTen = zip[26] | (zip[27] << 8);
    const daiThem = zip[28] | (zip[29] << 8);
    const daiNen = zip[18] | (zip[19] << 8) | (zip[20] << 16) | (zip[21] << 24);
    const batDau = 30 + daiTen + daiThem;
    const nen = zip.slice(batDau, batDau + daiNen);

    expect(new Uint8Array(inflateRawSync(nen))).toEqual(goc);
  });

  it("CRC khớp zlib.crc32", () => {
    const goc = chu("kiểm tra mã băm");
    const zip = dungZip([{ ten: "a.txt", noiDung: goc }]);
    const ma = zip[14] | (zip[15] << 8) | (zip[16] << 16) | (zip[17] << 24);
    expect(ma >>> 0).toBe(crc32(goc) >>> 0);
  });

  it("🔴 chạy hai lần cho ra hai Uint8Array bằng nhau", () => {
    const tep = [{ ten: "a.txt", noiDung: chu("cùng một dữ liệu") }];
    // Mốc thời gian mặc định CỐ ĐỊNH chính là thứ làm được điều này — nhờ vậy
    // đổi một dòng trong bộ ghi là thấy ngay ở byte, không phải đoán.
    expect(dungZip(tep)).toEqual(dungZip(tep));
  });

  it("mốc thời gian khác nhau thì byte khác nhau — chứng minh mốc thật sự đi vào file", () => {
    const tep = [{ ten: "a.txt", noiDung: chu("x") }];
    expect(dungZip(tep, MOC_MAC_DINH)).not.toEqual(
      dungZip(tep, new Date("2030-06-15T10:30:00Z")),
    );
  });

  it("tên file có dấu tiếng Việt vẫn ghi được", () => {
    const zip = dungZip([{ ten: "khách-tiềm-năng.xml", noiDung: chu("x") }]);
    const daiTen = zip[26] | (zip[27] << 8);
    expect(new TextDecoder().decode(zip.slice(30, 30 + daiTen))).toBe("khách-tiềm-năng.xml");
  });

  it("file rỗng cũng dựng được, không ném", () => {
    expect(dungZip([]).length).toBe(22);
  });
});
