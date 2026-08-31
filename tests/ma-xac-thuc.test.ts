import { describe, expect, it } from "vitest";

import { minuteStamp, verifyCode } from "@/lib/ma-xac-thuc";

const MINUTE = 60_000;

describe("mã xác thực màn TRÚNG", () => {
  it("luôn 4 ký tự, không có ký tự dễ đọc nhầm", () => {
    for (let target = 0; target < 10000; target += 617) {
      const code = verifyCode(target, new Date(1_800_000_000_000));
      expect(code).toHaveLength(4);
      expect(code).toMatch(/^[ACDEFGHJKLMNPQRTUVWXY3479]{4}$/);
    }
  });

  it("cùng số và cùng phút thì cùng mã — hai máy đối chiếu được", () => {
    const at = new Date(1_800_000_012_345);
    expect(verifyCode(211, at)).toBe(verifyCode(211, new Date(1_800_000_059_000)));
  });

  it("đổi phút thì đổi mã — ảnh chụp cũ không dùng lại được", () => {
    const now = 1_800_000_000_000;
    const codes = new Set(
      Array.from({ length: 30 }, (_, i) => verifyCode(211, new Date(now + i * MINUTE))),
    );
    // Cho phép trùng lặp đôi chút (chỉ có 4 ký tự), nhưng phải đa dạng rõ rệt.
    expect(codes.size).toBeGreaterThan(25);
  });

  it("số cài khác nhau thì mã khác nhau trong cùng một phút", () => {
    const at = new Date(1_800_000_000_000);
    const codes = new Set(
      Array.from({ length: 30 }, (_, i) => verifyCode(i * 137, at)),
    );
    expect(codes.size).toBeGreaterThan(25);
  });

  it("mốc phút tính đúng", () => {
    expect(minuteStamp(new Date(0))).toBe(0);
    expect(minuteStamp(new Date(MINUTE))).toBe(1);
    expect(minuteStamp(new Date(MINUTE * 3 + 59_999))).toBe(3);
  });
});
