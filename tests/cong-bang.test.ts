import { describe, expect, it } from "vitest";

import { chamKetQua } from "@/lib/vong-quay/cham";
import { chiaCung, oTaiGoc, type Cung, type OQua } from "@/lib/vong-quay/chia-o";

/**
 * BÀI KIỂM CÔNG BẰNG — bằng chứng đưa ra khi có người hỏi
 * *"vòng quay có bị chỉnh không?"*.
 *
 * 🔴 PHÉP SO ĐÃ ĐỔI ngày 02/09/2026 (ADR-012). Trước đó nó đối chiếu *"Trúng %"*
 * với *"Cung %"* — hợp lý khi kết quả được chọn bằng cách rút một góc đều rồi xem
 * kim rơi vào cung nào. Nay thứ tự bốc đảo ngược: máy rút QUÀ theo tỉ lệ đã khai
 * rồi mới rút góc bên trong cung của quà đó. Nên phép so đúng là *"Trúng %"* với
 * **"Tỉ lệ khai"**, còn *"Cung %"* nay luôn bằng nhau và không nói gì về cơ hội.
 *
 * Ba điều file này kiểm, và mỗi điều là một câu hỏi thật của người đứng xem:
 *   1. Khai bao nhiêu thì trúng bấy nhiêu (sai lệch dưới 1 điểm %).
 *   2. Khai 0 % thì KHÔNG BAO GIỜ trúng — mà ô vẫn hiện trên vòng.
 *   3. Kim dừng ĐÚNG trên ô được công bố, không lệch sang ô bên cạnh.
 *
 * Bài kiểm cuối file chứng minh rằng nếu có phép thiên vị lén thì bộ này ĐỎ,
 * chứ không lặng lẽ cho qua.
 *
 * Dùng hạt giống TẤT ĐỊNH (`hat-0`, `hat-1`, …) chứ không phải `crypto`: bài
 * kiểm phải cho cùng kết quả mọi lần chạy. Ngẫu nhiên thật là việc của
 * `crypto.getRandomValues` lúc mở lượt, không phải việc của bộ test.
 */

const SO_LUOT = 100_000;

/** Sai lệch cho phép, tính bằng ĐIỂM PHẦN TRĂM tuyệt đối. */
const SAI_LECH_TOI_DA_PP = 1;

function o(
  id: number,
  ten: string,
  soLuong: number | null,
  tiLeTrung: number,
  mau: string,
): OQua {
  return { id, ten, thuTu: id, soLuong, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, tiLeTrung, mau };
}

/**
 * Kho mẫu — tổng tỉ lệ đúng 100 %.
 *
 * 🔴 SỐ LƯỢNG cố ý đặt LỆCH HẲN so với tỉ lệ (Bút chỉ có 5 cái mà tỉ lệ 20 %;
 * Kẹo 500 cái mà 25 %). Đó là cả điểm của ADR-012: tồn kho và cơ hội trúng là
 * hai đại lượng khác nhau. Bài kiểm này đỏ nếu ai đó nối chúng lại với nhau.
 */
const KHO: OQua[] = [
  o(1, "Xe đạp", 5, 0, "#6B21A8"),
  o(2, "Balo", 10, 0.05, "#A855F7"),
  o(3, "Áo thun", 20, 0.1, "#F97316"),
  o(4, "Sổ tay", 30, 0.15, "#FACC15"),
  o(5, "Bút", 5, 0.2, "#5EEAD4"),
  o(6, "Kẹo", 500, 0.25, "#22D3EE"),
  o(7, "Sticker", null, 0.25, "#6B6880"),
];

/** Quay `soLuot` lượt, trả về số lần trúng của từng ô. */
function demTrung(
  cung: readonly Cung[],
  soLuot: number,
  thienVi: (o: Cung, i: number) => Cung = (x) => x,
): Map<number, number> {
  const dem = new Map<number, number>();
  for (const c of cung) dem.set(c.oId, 0);
  for (let i = 0; i < soLuot; i++) {
    const kq = chamKetQua({ hatGiong: `hat-${i}`, cung });
    if (kq === null) continue;
    const trung = thienVi(kq.o, i);
    dem.set(trung.oId, (dem.get(trung.oId) ?? 0) + 1);
  }
  return dem;
}

/** Sai lệch lớn nhất giữa "tỉ lệ khai" và "trúng %", tính bằng điểm phần trăm. */
function saiLechLonNhat(cung: readonly Cung[], dem: Map<number, number>, n: number): number {
  let max = 0;
  for (const c of cung) {
    const lech = Math.abs(((dem.get(c.oId) ?? 0) / n) * 100 - c.tiLeTrung * 100);
    if (lech > max) max = lech;
  }
  return max;
}

describe("Vòng quay có công bằng không", () => {
  const cung = chiaCung(KHO);
  const dem = demTrung(cung, SO_LUOT);

  it(`tỉ lệ trúng bám sát TỈ LỆ KHAI, sai lệch dưới ${SAI_LECH_TOI_DA_PP} điểm %`, () => {
    const dong: Record<string, string>[] = [];
    for (const c of cung) {
      const trung = dem.get(c.oId) ?? 0;
      const pcKhai = c.tiLeTrung * 100;
      const pcTrung = (trung / SO_LUOT) * 100;
      dong.push({
        "Ô": c.ten,
        "Tỉ lệ khai %": pcKhai.toFixed(2),
        "Cung %": ((c.doRong / 360) * 100).toFixed(2),
        "Trúng %": pcTrung.toFixed(2),
        "Lệch (điểm %)": Math.abs(pcTrung - pcKhai).toFixed(3),
        "Số lượt": String(trung),
      });
      expect(Math.abs(pcTrung - pcKhai), `ô "${c.ten}" lệch quá nhiều`).toBeLessThan(
        SAI_LECH_TOI_DA_PP,
      );
    }

    // `npm run bang-tra` in bảng này ra để đọc bằng mắt. Cố ý dùng CHUNG đường
    // code với phần khẳng định ở trên: con số in ra đúng là con số được kiểm.
    if (process.env.VQ_IN_BANG) {
      console.log(`\nĐối chiếu trên ${SO_LUOT.toLocaleString("vi-VN")} lượt quay:`);
      console.table(dong);
    }
  });

  it("mọi cung BẰNG NHAU — nhìn vòng không còn đoán được cơ hội (ADR-012)", () => {
    for (const c of cung) expect(c.doRong, c.ten).toBeCloseTo(360 / KHO.length, 9);
  });

  it("mọi lượt đều rơi vào đúng một ô — không lượt nào rơi ra ngoài", () => {
    const tong = [...dem.values()].reduce((s, n) => s + n, 0);
    expect(tong).toBe(SO_LUOT);
  });

  it("🔴 ô khai 0 % KHÔNG trúng lần nào trong 100.000 lượt — mà VẪN nằm trên vòng", () => {
    const xeDap = cung.find((c) => c.ten === "Xe đạp")!;
    expect(xeDap, "ô 0 % phải còn trên vòng để người ta thấy phần thưởng lớn").toBeDefined();
    expect(xeDap.doRong).toBeGreaterThan(0);
    expect(dem.get(xeDap.oId)).toBe(0);
  });

  it("không ô nào có tỉ lệ dương bị bỏ quên", () => {
    for (const c of cung.filter((x) => x.tiLeTrung > 0)) {
      expect(dem.get(c.oId) ?? 0, `ô "${c.ten}" chưa trúng lần nào`).toBeGreaterThan(0);
    }
  });

  it("🔴 KIM LUÔN DỪNG TRONG CUNG CỦA Ô ĐƯỢC CÔNG BỐ", () => {
    // Đây là lời hứa mà cả ADR-012 đứng trên: "tránh quay hiển thị một đường,
    // kết quả một nẻo". Tra ngược từ góc dừng ra ô, phải ra đúng ô đã công bố.
    for (let i = 0; i < 20_000; i++) {
      const kq = chamKetQua({ hatGiong: `hat-${i}`, cung })!;
      const taiGoc = oTaiGoc(cung, kq.gocDung)!;
      expect(taiGoc.oId, `lượt ${i}: kim ở "${taiGoc.ten}" mà công bố "${kq.o.ten}"`).toBe(
        kq.o.oId,
      );
      expect(kq.gocDung).toBeGreaterThanOrEqual(kq.o.tu);
      expect(kq.gocDung).toBeLessThan(kq.o.den);
    }
  });

  it("🔴 BÀI KIỂM CÓ RĂNG: nhét thiên vị vào thì bài kiểm phải ĐỎ", () => {
    // Giả lập đúng kiểu gian lận đáng lo nhất: kéo nhẹ kết quả ra khỏi ô có tỉ
    // lệ cao nhất. Một phần năm số lần trúng Kẹo bị đẩy sang Sticker — khoảng 5
    // điểm %, đủ nhỏ để mắt thường không thấy qua vài chục lượt ở quầy.
    const keo = cung.find((c) => c.ten === "Kẹo")!;
    const sticker = cung.find((c) => c.ten === "Sticker")!;
    const thienVi = (x: Cung, i: number) => (x.oId === keo.oId && i % 5 === 0 ? sticker : x);

    const demBan = demTrung(cung, SO_LUOT, thienVi);
    expect(saiLechLonNhat(cung, demBan, SO_LUOT)).toBeGreaterThan(SAI_LECH_TOI_DA_PP);
    // Và bản SẠCH thì vẫn phải qua — nếu không, bài kiểm chỉ đang luôn đỏ.
    expect(saiLechLonNhat(cung, dem, SO_LUOT)).toBeLessThan(SAI_LECH_TOI_DA_PP);
  });
});
