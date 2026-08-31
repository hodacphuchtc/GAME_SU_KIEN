import { describe, expect, it } from "vitest";

import { ROOM_ALPHABET, ROOM_CODE_LENGTH } from "@/config/game";
import { chuanHoaMa, sinhMa } from "@/lib/chuong-trinh/ma-chuong-trinh";

describe("mã chương trình", () => {
  it("đủ 4 ký tự và chỉ dùng chữ dễ đọc", () => {
    for (let i = 0; i < 200; i += 1) {
      const ma = sinhMa();
      expect(ma).toHaveLength(ROOM_CODE_LENGTH);
      for (const k of ma) expect(ROOM_ALPHABET).toContain(k);
    }
  });

  it("không chứa ký tự dễ đọc nhầm — nhân viên phải đọc to được cho khách", () => {
    for (const nham of ["B", "8", "I", "1", "O", "0", "S", "5", "Z", "2", "6"]) {
      expect(ROOM_ALPHABET).not.toContain(nham);
    }
  });

  it("sinh theo nguồn ngẫu nhiên cho trước thì đoán được", () => {
    expect(sinhMa(() => 0)).toBe(ROOM_ALPHABET[0].repeat(ROOM_CODE_LENGTH));
  });

  it("chuẩn hoá mã gõ tay: hoa hết, bỏ ký tự lạ, cắt đúng độ dài", () => {
    expect(chuanHoaMa("ac37")).toBe("AC37");
    expect(chuanHoaMa(" a c - 3 7 ")).toBe("AC37");
    expect(chuanHoaMa("AC37XYZW")).toBe("AC37");
    expect(chuanHoaMa("!!!")).toBe("");
  });
});
