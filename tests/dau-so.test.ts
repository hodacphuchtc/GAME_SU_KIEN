import { describe, expect, it } from "vitest";

import { DOI_DAU_SO, doiDauSoCu } from "@/config/dau-so";

/**
 * BẢNG CHUYỂN ĐẦU SỐ 2018 — dữ kiện NGOÀI ĐỜI, không phải quy ước ta tự đặt.
 *
 * 🔴 Bài kiểm này canh máy làm ĐÚNG THEO BẢNG. Nó KHÔNG canh được bảng có đúng
 * ngoài đời hay không — đó là việc của người (hạng mục `N.1` của sổ). Sai một dòng
 * ở đây là gộp nhầm hai người xa lạ thành một, và việc gộp KHÔNG hoàn tác được.
 */

/** Bảng đối chiếu viết ĐỘC LẬP với `config/dau-so.ts`: nếu import chính nó thì bài
 *  kiểm chỉ khớp với chính mình và không canh được gì. */
const CONG_BO: ReadonlyArray<[cu: string, moi: string, nhaMang: string]> = [
  ["0162", "032", "Viettel"],
  ["0163", "033", "Viettel"],
  ["0164", "034", "Viettel"],
  ["0165", "035", "Viettel"],
  ["0166", "036", "Viettel"],
  ["0167", "037", "Viettel"],
  ["0168", "038", "Viettel"],
  ["0169", "039", "Viettel"],
  ["0123", "083", "VinaPhone"],
  ["0124", "084", "VinaPhone"],
  ["0125", "085", "VinaPhone"],
  ["0127", "081", "VinaPhone"],
  ["0129", "082", "VinaPhone"],
  ["0120", "070", "MobiFone"],
  ["0121", "079", "MobiFone"],
  ["0122", "077", "MobiFone"],
  ["0126", "076", "MobiFone"],
  ["0128", "078", "MobiFone"],
  ["0186", "056", "Vietnamobile"],
  ["0188", "058", "Vietnamobile"],
  ["0199", "059", "Gmobile"],
];

describe("bảng chuyển đầu số 11 → 10 chữ số", () => {
  it.each(CONG_BO.map(([cu, moi, nm]) => [nm, cu, moi] as const))(
    "%s: %s… → %s…",
    (_nm, cu, moi) => {
      expect(doiDauSoCu(`${cu}9123456`)).toBe(`${moi}9123456`);
    },
  );

  it("bảng trong config khớp ĐÚNG bảng công bố, không thừa không thiếu", () => {
    expect(Object.keys(DOI_DAU_SO).sort()).toEqual(CONG_BO.map(([cu]) => cu).sort());
    for (const [cu, moi] of CONG_BO) expect(DOI_DAU_SO[cu]).toBe(moi);
  });

  it("🔴 đầu số 11 chữ số KHÔNG có trong bảng thì GIỮ NGUYÊN", () => {
    // `0177` không nằm trong đợt chuyển. Đoán bừa là gộp nhầm hai người xa lạ.
    expect(doiDauSoCu("01779123456")).toBe("01779123456");
    expect(doiDauSoCu("01119123456")).toBe("01119123456");
  });

  it("số 10 chữ số đi qua nguyên vẹn — hàm chỉ đụng dãy 11 số", () => {
    expect(doiDauSoCu("0912345678")).toBe("0912345678");
    expect(doiDauSoCu("0329123456")).toBe("0329123456");
  });

  it("🔴 giữ nguyên BẢY chữ số cuối — chỉ đầu số đổi", () => {
    // Nhà mạng chỉ đổi mã mạng; phần thuê bao không đụng tới. Một lỗi cắt chuỗi ở
    // đây sẽ đổi luôn số của khách mà vẫn trông như một số hợp lệ.
    expect(doiDauSoCu("01620000001")).toBe("0320000001");
    expect(doiDauSoCu("01629999999")).toBe("0329999999");
  });

  it("mọi đầu số MỚI đều dài 3 và mọi đầu số CŨ đều dài 4", () => {
    for (const [cu, moi] of Object.entries(DOI_DAU_SO)) {
      expect(cu).toHaveLength(4);
      expect(moi).toHaveLength(3);
      expect(cu.startsWith("0")).toBe(true);
      expect(moi.startsWith("0")).toBe(true);
    }
  });

  it("🔴 không có hai đầu số cũ nào trỏ về cùng một đầu số mới", () => {
    // Trùng đích nghĩa là hai dải thuê bao khác nhau bị gộp về một — bảng sai.
    const dich = Object.values(DOI_DAU_SO);
    expect(new Set(dich).size).toBe(dich.length);
  });
});
