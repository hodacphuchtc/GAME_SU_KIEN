import { describe, expect, it } from "vitest";

import { chiaCung, oTaiGoc, type Cung, type OQua } from "@/lib/vong-quay/chia-o";
import { bocGoc } from "@/lib/vong-quay/goc";

/**
 * BÀI KIỂM CÔNG BẰNG — bằng chứng đưa ra khi có người hỏi
 * *"vòng quay có bị chỉnh không?"*.
 *
 * Nó kiểm đúng một điều: **tỉ lệ trúng thực tế của mỗi ô bám sát độ rộng cung
 * của ô đó**. Vì kết quả được chọn bằng cách rút một GÓC NGẪU NHIÊN ĐỀU rồi xem
 * kim rơi vào cung nào, hai con số ấy buộc phải trùng nhau — trừ khi có ai đó
 * lén thêm một phép thiên vị vào giữa. Bài kiểm cuối file chứng minh rằng nếu
 * có phép thiên vị đó thật thì bài kiểm này ĐỎ, chứ không lặng lẽ cho qua.
 *
 * Dùng hạt giống TẤT ĐỊNH (`hat-0`, `hat-1`, …) chứ không phải `crypto`: bài
 * kiểm phải cho cùng kết quả mọi lần chạy. Ngẫu nhiên thật là việc của
 * `crypto.getRandomValues` lúc mở lượt, không phải việc của bộ test.
 */

const SO_LUOT = 100_000;

/** Sai lệch cho phép, tính bằng ĐIỂM PHẦN TRĂM tuyệt đối. */
const SAI_LECH_TOI_DA_PP = 1;

const KHO: OQua[] = [
  { id: 1, ten: "Balo", thuTu: 1, soLuong: 10, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#6B21A8" },
  { id: 2, ten: "Áo thun", thuTu: 2, soLuong: 20, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#A855F7" },
  { id: 3, ten: "Sổ tay", thuTu: 3, soLuong: 30, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#F97316" },
  { id: 4, ten: "Bút", thuTu: 4, soLuong: 40, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#FACC15" },
  { id: 5, ten: "Kẹo", thuTu: 5, soLuong: 100, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#5EEAD4" },
  { id: 6, ten: "Sticker", thuTu: 9, soLuong: null, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#6B6880" },
];

/** Quay `soLuot` lượt, trả về số lần trúng của từng ô. */
function demTrung(
  cung: readonly Cung[],
  soLuot: number,
  bienDoi: (goc: number) => number = (g) => g,
): Map<number, number> {
  const dem = new Map<number, number>();
  for (const c of cung) dem.set(c.oId, 0);
  for (let i = 0; i < soLuot; i++) {
    const o = oTaiGoc(cung, bienDoi(bocGoc(`hat-${i}`)));
    if (o) dem.set(o.oId, (dem.get(o.oId) ?? 0) + 1);
  }
  return dem;
}

/** Sai lệch lớn nhất giữa "cung %" và "trúng %", tính bằng điểm phần trăm. */
function saiLechLonNhat(cung: readonly Cung[], dem: Map<number, number>, n: number): number {
  let max = 0;
  for (const c of cung) {
    const lech = Math.abs(((dem.get(c.oId) ?? 0) / n) * 100 - (c.doRong / 360) * 100);
    if (lech > max) max = lech;
  }
  return max;
}

describe("Vòng quay có công bằng không", () => {
  const cung = chiaCung(KHO);
  const dem = demTrung(cung, SO_LUOT);

  it(`tỉ lệ trúng bám sát độ rộng cung, sai lệch dưới ${SAI_LECH_TOI_DA_PP} điểm %`, () => {
    const dong: Record<string, string>[] = [];
    for (const c of cung) {
      const trung = dem.get(c.oId) ?? 0;
      const pcCung = (c.doRong / 360) * 100;
      const pcTrung = (trung / SO_LUOT) * 100;
      dong.push({
        "Ô": c.ten,
        "Cung %": pcCung.toFixed(2),
        "Trúng %": pcTrung.toFixed(2),
        "Lệch (điểm %)": Math.abs(pcTrung - pcCung).toFixed(3),
        "Số lượt": String(trung),
      });
      expect(Math.abs(pcTrung - pcCung), `ô "${c.ten}" lệch quá nhiều`).toBeLessThan(
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

  it("mọi lượt đều rơi vào đúng một ô — không lượt nào rơi ra ngoài", () => {
    const tong = [...dem.values()].reduce((s, n) => s + n, 0);
    expect(tong).toBe(SO_LUOT);
  });

  it("không ô nào bị bỏ quên — ô nhỏ nhất vẫn trúng được", () => {
    for (const c of cung) {
      expect(dem.get(c.oId) ?? 0, `ô "${c.ten}" chưa trúng lần nào`).toBeGreaterThan(0);
    }
  });

  it("🔴 BÀI KIỂM CÓ RĂNG: nhét thiên vị vào thì bài kiểm phải ĐỎ", () => {
    // Giả lập đúng kiểu gian lận đáng lo nhất: kéo nhẹ mọi kết quả ra khỏi ô
    // giải to. Chỉ 5% số lượt bị đẩy đi — đủ nhỏ để mắt thường không thấy.
    const oGiaiTo = cung[0];
    const thienVi = (g: number) =>
      g >= oGiaiTo.tu && g < oGiaiTo.den && g < oGiaiTo.tu + oGiaiTo.doRong * 0.5
        ? oGiaiTo.den + 1
        : g;

    const demBan = demTrung(cung, SO_LUOT, thienVi);
    expect(saiLechLonNhat(cung, demBan, SO_LUOT)).toBeGreaterThan(SAI_LECH_TOI_DA_PP);
    // Và bản SẠCH thì vẫn phải qua — nếu không, bài kiểm chỉ đang luôn đỏ.
    expect(saiLechLonNhat(cung, dem, SO_LUOT)).toBeLessThan(SAI_LECH_TOI_DA_PP);
  });
});
