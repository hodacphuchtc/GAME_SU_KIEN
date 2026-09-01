import { crc32, deflateRawSync } from "node:zlib";

/**
 * DỰNG ZIP THỦ CÔNG — không thêm thư viện nào.
 *
 * Một file .xlsx chỉ là một ZIP chứa mấy file XML. Cả hai thứ Node 24 đã có sẵn
 * (`zlib.crc32` và `zlib.deflateRawSync`), nên viết ~90 dòng ở đây rẻ hơn kéo
 * về một cây phụ thuộc chỉ để nén vài kilobyte — và ứng dụng này có luật TỰ
 * CHỨA: `git clone` + `npm start` là chạy.
 *
 * 🔴 `[Content_Types].xml` phải là file ĐẦU TIÊN trong ZIP. Excel đọc nó trước
 * để biết các phần còn lại là gì; để sau thì Excel báo "unreadable content" và
 * từ chối cả file.
 */

export interface TepTrongZip {
  ten: string;
  noiDung: Uint8Array;
}

/**
 * Mốc thời gian MẶC ĐỊNH cố định (01/01/2026 00:00) thay vì `Date.now()`.
 *
 * Vì sao: hai lần dựng cùng một dữ liệu phải cho ra byte y hệt nhau. Nhờ vậy
 * bài test so được cả mã băm, và ai đó đổi một dòng trong bộ ghi thì thấy ngay.
 * Ngày giờ bên trong ZIP không ai đọc; ngày của FILE do hệ điều hành đặt.
 */
export const MOC_MAC_DINH = new Date("2026-01-01T00:00:00Z");

/** Định dạng ngày giờ kiểu MS-DOS mà ZIP dùng — độ phân giải 2 giây. */
function gioDos(luc: Date): { gio: number; ngay: number } {
  return {
    gio: (luc.getUTCHours() << 11) | (luc.getUTCMinutes() << 5) | (luc.getUTCSeconds() >> 1),
    ngay:
      ((luc.getUTCFullYear() - 1980) << 9) | ((luc.getUTCMonth() + 1) << 5) | luc.getUTCDate(),
  };
}

function so16(gt: number): Uint8Array {
  return new Uint8Array([gt & 0xff, (gt >> 8) & 0xff]);
}

function so32(gt: number): Uint8Array {
  return new Uint8Array([gt & 0xff, (gt >>> 8) & 0xff, (gt >>> 16) & 0xff, (gt >>> 24) & 0xff]);
}

function noi(...manh: Uint8Array[]): Uint8Array {
  const dai = manh.reduce((s, m) => s + m.length, 0);
  const ra = new Uint8Array(dai);
  let vt = 0;
  for (const m of manh) {
    ra.set(m, vt);
    vt += m.length;
  }
  return ra;
}

export function dungZip(tep: readonly TepTrongZip[], luc = MOC_MAC_DINH): Uint8Array {
  const { gio, ngay } = gioDos(luc);
  const cucBo: Uint8Array[] = [];
  const trungTam: Uint8Array[] = [];
  let viTri = 0;

  for (const t of tep) {
    const ten = new TextEncoder().encode(t.ten);
    const nen = new Uint8Array(deflateRawSync(t.noiDung));
    const ma = crc32(t.noiDung) >>> 0;

    const dauCucBo = noi(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // "PK\x03\x04"
      so16(20), // cần bản giải nén 2.0
      so16(0), // cờ
      so16(8), // phương pháp nén: deflate
      so16(gio),
      so16(ngay),
      so32(ma),
      so32(nen.length),
      so32(t.noiDung.length),
      so16(ten.length),
      so16(0), // độ dài phần thêm
      ten,
    );

    cucBo.push(dauCucBo, nen);

    trungTam.push(
      noi(
        new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // "PK\x01\x02"
        so16(20), // bản đã dựng
        so16(20), // cần bản giải nén
        so16(0),
        so16(8),
        so16(gio),
        so16(ngay),
        so32(ma),
        so32(nen.length),
        so32(t.noiDung.length),
        so16(ten.length),
        so16(0), // phần thêm
        so16(0), // chú thích
        so16(0), // số đĩa
        so16(0), // thuộc tính trong
        so32(0), // thuộc tính ngoài
        so32(viTri),
        ten,
      ),
    );

    viTri += dauCucBo.length + nen.length;
  }

  const khoiTrungTam = noi(...trungTam);
  const ketThuc = noi(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]), // "PK\x05\x06" — EOCD
    so16(0),
    so16(0),
    so16(tep.length),
    so16(tep.length),
    so32(khoiTrungTam.length),
    so32(viTri),
    so16(0),
  );

  return noi(...cucBo, khoiTrungTam, ketThuc);
}
