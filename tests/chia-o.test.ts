import { describe, expect, it } from "vitest";

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
  return { id, ten, thuTu, soLuong, daTrao, tranMoiNgay: 0, daTraoHomNay: 0, tiLeTrung: 0.25, mau: "#000000" };
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
    // Chạy với nhiều SỐ LƯỢNG ô khác nhau — từ khi cung chia đều, số ô là biến
    // duy nhất còn ảnh hưởng tới mặt vòng.
    for (let soO = 2; soO <= 12; soO++) {
      const kho = Array.from({ length: soO }, (_, i) => o(i + 1, `Ô ${i + 1}`, i === 0 ? null : 10));
      const cung = chiaCung(kho);
      const tong = cung.reduce((s, c) => s + c.doRong, 0);
      expect(tong, `${soO} ô`).toBeCloseTo(360, 9);
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

  /**
   * 🔴 LUẬT CŨ (tới 02/09/2026): *"cung của quà thật tỉ lệ đúng với số lượng còn
   * lại"* — kho 10 : 20 : 70 cho ra cung 1 : 2 : 7, và ô đáy ăn trọn
   * `ti_le_o_day`. Hai bài kiểm nữa canh SÀN 8 % và TRẦN 95 % của ô đáy.
   *
   * ĐẢO bởi ADR-012: luật đó đánh đồng TỒN KHO với XÁC SUẤT. Người vận hành khai
   * "10 cái Balo, 30 cái Bút" với nghĩa số lượng trong kho, máy đọc thành "Bút dễ
   * trúng gấp ba Balo". Nay cung chia ĐỀU, còn cơ hội trúng nằm ở
   * `o_qua.ti_le_trung` và được `cham.ts` áp dụng.
   *
   * Ba bài kiểm cũ bị thay bằng bài này. Đừng khôi phục chúng mà chưa đọc ADR-012.
   */
  it("🔴 MỌI cung BẰNG NHAU, bất kể tồn kho lệch bao nhiêu", () => {
    const cung = chiaCung(KHO_MAU);
    const rong = (ten: string) => cung.find((c) => c.ten === ten)!.doRong;
    // Kho lệch hẳn: Balo 10 · Bút 20 · Kẹo 70 · Sticker không giới hạn.
    for (const ten of ["Balo", "Bút", "Kẹo", "Sticker"]) {
      expect(rong(ten), ten).toBeCloseTo(90, 9);
    }
  });

  it("🔴 một ô hết hàng thì ba ô còn lại TỰ CHIA ĐỀU LẠI", () => {
    const het = KHO_MAU.map((x) => (x.id === 1 ? { ...x, daTrao: 10 } : x));
    const cung = chiaCung(het);
    expect(cung).toHaveLength(3);
    for (const c of cung) expect(c.doRong, c.ten).toBeCloseTo(120, 9);
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
    // 10 và 30 là TỒN KHO, không phải cơ hội — hai cung vẫn bằng nhau (ADR-012).
    expect(cung[0].doRong).toBeCloseTo(180, 9);
    expect(cung[1].doRong).toBeCloseTo(180, 9);
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
