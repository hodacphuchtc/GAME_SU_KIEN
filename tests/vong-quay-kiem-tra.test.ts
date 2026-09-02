import { describe, expect, it } from "vitest";

import { SO_O_TOI_DA, SO_O_TOI_THIEU } from "@/config/vong-quay";
import { kiemVongQuay, type OKhai, type VongQuayKhai } from "@/lib/vong-quay/kiem-tra";
import { chiaDeuTiLe, raPhanTram, tongDung, tuPhanTram } from "@/lib/vong-quay/ti-le";

/**
 * CỬA DUY NHẤT chặn một chương trình Vòng Quay hỏng lọt vào hệ thống.
 *
 * 🔴 Hai luật của TỈ LỆ TRÚNG (ADR-012) là phần mới nhất và cũng nguy hiểm nhất:
 * tổng phải đúng 100 %, và ít nhất một ô phải lớn hơn 0. Thiếu luật thứ hai thì
 * một chương trình mọi ô 0 % vẫn tạo được, mã QR in ra dán ở quầy, và phụ huynh
 * quét vào chỉ nhận về một dòng lỗi.
 */

function o(ten: string, soLuong: number | null, tiLeTrung: number, thuTu = 1): OKhai {
  return { ten, soLuong, tranMoiNgay: 0, tiLeTrung, mau: "#6B21A8", thuTu };
}

/** Khai hợp lệ tối thiểu: hai ô, tổng 100 %, có ô an ủi. */
function hopLe(): VongQuayKhai {
  return {
    coSoId: 1,
    tenDot: "Trung thu 2026",
    dsO: [o("Balo", 10, 0.5, 1), o("Sticker", null, 0.5, 2)],
  };
}

describe("kiemVongQuay — luật chung", () => {
  it("khai hợp lệ thì không lỗi nào", () => {
    expect(kiemVongQuay(hopLe())).toEqual([]);
  });

  it("thiếu cơ sở bị chặn — số phụ huynh để lại sẽ rơi vào hư vô", () => {
    expect(kiemVongQuay({ ...hopLe(), coSoId: null }).join(" ")).toMatch(/cơ sở/i);
  });

  it("thiếu tên đợt bị chặn", () => {
    expect(kiemVongQuay({ ...hopLe(), tenDot: "   " }).join(" ")).toMatch(/tên đợt/i);
  });

  it(`dưới ${SO_O_TOI_THIEU} ô bị chặn`, () => {
    const k = { ...hopLe(), dsO: [o("Sticker", null, 1, 1)] };
    expect(kiemVongQuay(k).join(" ")).toMatch(/ít nhất/i);
  });

  it(`quá ${SO_O_TOI_DA} ô bị chặn`, () => {
    const n = SO_O_TOI_DA + 1;
    const tiLe = chiaDeuTiLe(n);
    const dsO = Array.from({ length: n }, (_, i) =>
      o(`Quà ${i + 1}`, i === n - 1 ? null : 10, tiLe[i], i + 1),
    );
    expect(kiemVongQuay({ ...hopLe(), dsO }).join(" ")).toMatch(/nhiều nhất/i);
  });

  it("🔴 không có ô an ủi bị chặn — hết quà là hết trò", () => {
    const k = { ...hopLe(), dsO: [o("Balo", 10, 0.5, 1), o("Bút", 20, 0.5, 2)] };
    expect(kiemVongQuay(k).join(" ")).toMatch(/để trống số lượng/i);
  });

  it("hai ô trùng tên bị chặn", () => {
    const k = { ...hopLe(), dsO: [o("Balo", 10, 0.5, 1), o(" balo ", null, 0.5, 2)] };
    expect(kiemVongQuay(k).join(" ")).toMatch(/trùng tên/i);
  });

  it("số lượng 0 bị chặn kèm câu chỉ cách sửa", () => {
    const k = { ...hopLe(), dsO: [o("Balo", 0, 0.5, 1), o("Sticker", null, 0.5, 2)] };
    expect(kiemVongQuay(k).join(" ")).toMatch(/để TRỐNG/);
  });
});

describe("🔴 kiemVongQuay — hai luật của TỈ LỆ TRÚNG (ADR-012)", () => {
  it("tổng 90% bị chặn, và câu lỗi nói rõ THIẾU bao nhiêu", () => {
    const k = { ...hopLe(), dsO: [o("Balo", 10, 0.4, 1), o("Sticker", null, 0.5, 2)] };
    const loi = kiemVongQuay(k).join(" ");
    expect(loi).toMatch(/phải đúng 100%/);
    expect(loi).toMatch(/thiếu 10%/i);
  });

  it("tổng 120% bị chặn, và câu lỗi nói rõ THỪA bao nhiêu", () => {
    const k = { ...hopLe(), dsO: [o("Balo", 10, 0.7, 1), o("Sticker", null, 0.5, 2)] };
    const loi = kiemVongQuay(k).join(" ");
    expect(loi).toMatch(/thừa 20%/i);
  });

  it("🔴 mọi ô 0% bị chặn — vòng quay không bao giờ ra được kết quả", () => {
    const k = { ...hopLe(), dsO: [o("Balo", 10, 0, 1), o("Sticker", null, 0, 2)] };
    const loi = kiemVongQuay(k).join(" ");
    // Tổng 0% cũng sai, nhưng câu nói riêng về "mọi ô đều 0" phải có mặt: nó là
    // thứ chỉ đúng chỗ cần sửa.
    expect(loi).toMatch(/không bao giờ ra được kết quả/i);
  });

  it("MỘT ô 0% giữa các ô khác thì HỢP LỆ — nó vẫn hiện trên vòng", () => {
    const k = {
      ...hopLe(),
      dsO: [o("Xe đạp", 1, 0, 1), o("Balo", 10, 0.5, 2), o("Sticker", null, 0.5, 3)],
    };
    expect(kiemVongQuay(k)).toEqual([]);
  });

  it("tỉ lệ âm hoặc quá 100% bị chặn", () => {
    const am = { ...hopLe(), dsO: [o("Balo", 10, -0.5, 1), o("Sticker", null, 1.5, 2)] };
    const loi = kiemVongQuay(am).join(" ");
    expect(loi).toMatch(/khoảng 0% đến 100%/);
  });

  it("🔴 chia đều cho BA ô không bị chặn oan vì số thực", () => {
    // 1/3 làm tròn là 33,33% — ba ô cộng lại 99,99%. Nếu luật so bằng `=== 1`
    // thì một cấu hình hoàn toàn hợp lệ bị chặn, và người vận hành không có
    // cách nào sửa được. `chiaDeuTiLe` dồn phần dư vào ô cuối để tránh đúng đó.
    const tiLe = chiaDeuTiLe(3);
    const k = {
      ...hopLe(),
      dsO: [o("Balo", 10, tiLe[0], 1), o("Bút", 20, tiLe[1], 2), o("Sticker", null, tiLe[2], 3)],
    };
    expect(kiemVongQuay(k)).toEqual([]);
  });
});

describe("chiaDeuTiLe / raPhanTram / tuPhanTram", () => {
  it("chia đều cho 2, 4, 5, 10 ô: mỗi ô bằng nhau và tổng đúng 100%", () => {
    for (const n of [2, 4, 5, 10]) {
      const ds = chiaDeuTiLe(n);
      expect(ds).toHaveLength(n);
      expect(tongDung(ds), `${n} ô`).toBe(true);
      for (const t of ds) expect(raPhanTram(t)).toBeCloseTo(100 / n, 9);
    }
  });

  it("🔴 chia cho 3, 6, 7 ô: tổng VẪN đúng 100% dù không chia hết", () => {
    for (const n of [3, 6, 7, 9, 11, 12]) {
      const ds = chiaDeuTiLe(n);
      expect(tongDung(ds), `${n} ô`).toBe(true);
      // Phần dư dồn hết vào ô CUỐI. Nó gánh sai số làm tròn của ${n-1} ô trước,
      // mỗi ô lệch nhiều nhất nửa đơn vị hiển thị (0,005 điểm %) — nên trần đúng
      // là 0,005 × n, không phải một hằng số cố định. Với 12 ô là 0,06 điểm %,
      // vẫn nhỏ hơn mọi con số người vận hành gõ được.
      const lech = Math.abs(raPhanTram(ds[n - 1]) - 100 / n);
      expect(lech, `${n} ô lệch quá nhiều`).toBeLessThan(0.005 * n);
    }
  });

  it("thêm rồi bớt một ô thì tổng vẫn đúng 100%", () => {
    expect(tongDung(chiaDeuTiLe(4))).toBe(true);
    expect(tongDung(chiaDeuTiLe(5))).toBe(true);
    expect(tongDung(chiaDeuTiLe(4))).toBe(true);
  });

  it("đi và về giữa phân số với phần trăm không mất mát", () => {
    for (const pc of [0, 0.5, 12.34, 25, 33.33, 99.99, 100]) {
      expect(raPhanTram(tuPhanTram(pc))).toBeCloseTo(pc, 9);
    }
  });

  it("0 ô trả mảng rỗng, không ném và không chia cho 0", () => {
    expect(chiaDeuTiLe(0)).toEqual([]);
    expect(chiaDeuTiLe(-3)).toEqual([]);
  });
});
