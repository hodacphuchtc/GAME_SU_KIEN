import { describe, expect, it } from "vitest";

import { SAN_CUNG_O_DAY, TRAN_TI_LE_O_DAY } from "@/config/vong-quay";
import { chiaCung, conLai, conPhatDuoc, oTaiGoc, type OQua } from "@/lib/vong-quay/chia-o";
import { bocGoc } from "@/lib/vong-quay/goc";

/** Dựng một ô cho gọn. `soLuong: null` = ô đáy. */
function o(
  id: number,
  ten: string,
  soLuong: number | null,
  daTrao = 0,
  thuTu = id,
): OQua {
  return { id, ten, thuTu, soLuong, daTrao, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#000000" };
}

const KHO_MAU: OQua[] = [
  o(1, "Balo", 10),
  o(2, "Bút", 20),
  o(3, "Kẹo", 70),
  o(4, "Sticker", null),
];

describe("conPhatDuoc / conLai", () => {
  it("ô đáy luôn còn — đó là lý do nó tồn tại", () => {
    expect(conPhatDuoc(o(9, "Sticker", null, 999_999))).toBe(true);
    expect(conLai(o(9, "Sticker", null))).toBeNull();
  });

  it("ô hữu hạn hết hàng thì không còn phát được", () => {
    expect(conPhatDuoc(o(1, "Balo", 10, 9))).toBe(true);
    expect(conPhatDuoc(o(1, "Balo", 10, 10))).toBe(false);
  });

  it("trao tay quá số đã khai vẫn không bao giờ báo tồn âm", () => {
    expect(conLai(o(1, "Balo", 10, 13))).toBe(0);
  });
});

describe("chiaCung()", () => {
  it("tổng cung LUÔN đúng 360°, và cung cuối chạm đúng mép", () => {
    for (const tiLe of [0, 0.08, 0.3, 0.5, 0.9, 1]) {
      const cung = chiaCung(KHO_MAU, tiLe);
      const tong = cung.reduce((s, c) => s + c.doRong, 0);
      expect(tong, `tỉ lệ ${tiLe}`).toBeCloseTo(360, 9);
      expect(cung[cung.length - 1].den).toBe(360);
      expect(cung[0].tu).toBe(0);
    }
  });

  it("cung nối liền nhau, không khe hở không chồng lấn", () => {
    const cung = chiaCung(KHO_MAU);
    for (let i = 1; i < cung.length; i++) {
      expect(cung[i].tu).toBeCloseTo(cung[i - 1].den, 9);
    }
  });

  it("🔴 ô HẾT HÀNG biến mất khỏi vòng, không thay thầm bằng ô khác", () => {
    const het = KHO_MAU.map((x) => (x.id === 1 ? { ...x, daTrao: 10 } : x));
    const cung = chiaCung(het);
    expect(cung.map((c) => c.ten)).not.toContain("Balo");
    expect(cung).toHaveLength(3);
    expect(cung.reduce((s, c) => s + c.doRong, 0)).toBeCloseTo(360, 9);
  });

  it("🔴 cung của quà thật TỈ LỆ ĐÚNG với số lượng còn lại", () => {
    const cung = chiaCung(KHO_MAU, 0.5);
    const rong = (ten: string) => cung.find((c) => c.ten === ten)!.doRong;
    // Balo 10 : Bút 20 : Kẹo 70 ⇒ 1 : 2 : 7
    expect(rong("Bút") / rong("Balo")).toBeCloseTo(2, 6);
    expect(rong("Kẹo") / rong("Balo")).toBeCloseTo(7, 6);
    // Ô đáy đúng nửa vòng
    expect(rong("Sticker")).toBeCloseTo(180, 6);
  });

  it("ô đáy không bao giờ mỏng dưới SÀN, dù khai tỉ lệ 0", () => {
    const cung = chiaCung(KHO_MAU, 0);
    const day = cung.find((c) => c.ten === "Sticker")!;
    expect(day.doRong).toBeCloseTo(SAN_CUNG_O_DAY * 360, 6);
  });

  it("khai tỉ lệ 1 vẫn bị kẹp dưới TRẦN — vòng quay không thành cái nút bấm", () => {
    const cung = chiaCung(KHO_MAU, 1);
    const day = cung.find((c) => c.ten === "Sticker")!;
    expect(day.doRong).toBeCloseTo(TRAN_TI_LE_O_DAY * 360, 6);
    expect(cung).toHaveLength(4);
  });

  it("hết sạch quà thật ⇒ đúng MỘT cung 360° của ô đáy", () => {
    const canh = [
      { ...KHO_MAU[0], daTrao: 10 },
      { ...KHO_MAU[1], daTrao: 20 },
      { ...KHO_MAU[2], daTrao: 70 },
      KHO_MAU[3],
    ];
    const cung = chiaCung(canh);
    expect(cung).toHaveLength(1);
    expect(cung[0].ten).toBe("Sticker");
    expect(cung[0].doRong).toBeCloseTo(360, 9);
  });

  it("kho rỗng hoàn toàn trả vòng rỗng, không ném lỗi", () => {
    expect(chiaCung([])).toEqual([]);
    expect(chiaCung([o(1, "Balo", 5, 5)])).toEqual([]);
  });

  it("không có ô đáy vẫn chia được (dù form tạo đã chặn ca này)", () => {
    const cung = chiaCung([o(1, "Balo", 10), o(2, "Bút", 30)]);
    expect(cung).toHaveLength(2);
    expect(cung.reduce((s, c) => s + c.doRong, 0)).toBeCloseTo(360, 9);
    expect(cung[1].doRong / cung[0].doRong).toBeCloseTo(3, 6);
  });

  it("🔴 thứ tự TẤT ĐỊNH — cùng cấu hình luôn cho cùng mặt vòng", () => {
    const xao = [KHO_MAU[2], KHO_MAU[0], KHO_MAU[3], KHO_MAU[1]];
    expect(chiaCung(xao)).toEqual(chiaCung(KHO_MAU));
  });
});

describe("oTaiGoc()", () => {
  const cung = chiaCung(KHO_MAU);

  it("mọi góc trong [0,360) đều tra ra đúng MỘT ô", () => {
    for (let i = 0; i < 10_000; i++) {
      const g = (i / 10_000) * 360;
      const c = oTaiGoc(cung, g)!;
      expect(c, `góc ${g}`).not.toBeNull();
      expect(g >= c.tu && g < c.den, `góc ${g} không nằm trong ${c.ten}`).toBe(true);
    }
  });

  it("nhận cả tổng góc đã quay mấy nghìn độ, và cả góc âm", () => {
    const g = bocGoc("hat-thu");
    expect(oTaiGoc(cung, g + 4 * 360)!.oId).toBe(oTaiGoc(cung, g)!.oId);
    expect(oTaiGoc(cung, g - 7 * 360)!.oId).toBe(oTaiGoc(cung, g)!.oId);
  });

  it("vòng rỗng trả null chứ không ném lỗi", () => {
    expect(oTaiGoc([], 42)).toBeNull();
  });
});
