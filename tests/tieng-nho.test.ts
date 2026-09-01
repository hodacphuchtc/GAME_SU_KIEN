import { afterEach, describe, expect, it, vi } from "vitest";

import { docTuKhoChoTest, luuTatTieng } from "@/lib/tieng-nho";

/**
 * CÔNG TẮC TIẾNG (GĐ 22.2).
 *
 * 🔴 Điều đáng canh nhất: hai màn hình có mặc định NGƯỢC NHAU, và đó là chủ ý.
 * LCD treo giữa sảnh nên mặc định im; điện thoại nằm trong tay người đang chơi
 * nên mặc định kêu. Một mặc định chung cho cả hai là sai ở đúng một trong hai
 * chỗ, và chỗ nào cũng khó chịu.
 */

function gaLapKho(giaTri: string | null | "NEM") {
  const kho = {
    getItem: () => {
      if (giaTri === "NEM") throw new Error("Safari riêng tư chặn đọc localStorage");
      return giaTri;
    },
    setItem: () => {
      if (giaTri === "NEM") throw new Error("Safari riêng tư chặn ghi localStorage");
    },
  };
  vi.stubGlobal("window", { localStorage: kho });
}

afterEach(() => vi.unstubAllGlobals());

describe("chưa ai chọn gì", () => {
  it("LCD im lặng — không bất ngờ phát tiếng giữa sảnh", () => {
    gaLapKho(null);
    expect(docTuKhoChoTest(true)).toBe(true);
  });

  it("điện thoại kêu — người ta cầm máy lên là để chơi", () => {
    gaLapKho(null);
    expect(docTuKhoChoTest(false)).toBe(false);
  });
});

describe("đã chọn rồi thì lựa chọn thắng mặc định", () => {
  it('lưu "0" = bật tiếng, kể cả trên LCD vốn mặc định im', () => {
    gaLapKho("0");
    expect(docTuKhoChoTest(true)).toBe(false);
  });

  it('lưu "1" = tắt tiếng, kể cả trên điện thoại vốn mặc định kêu', () => {
    gaLapKho("1");
    expect(docTuKhoChoTest(false)).toBe(true);
  });

  it("giá trị rác coi như chưa ai chọn gì", () => {
    gaLapKho("xin chào");
    expect(docTuKhoChoTest(true)).toBe(true);
    expect(docTuKhoChoTest(false)).toBe(false);
  });
});

describe("localStorage ném lỗi (chế độ riêng tư Safari)", () => {
  it("đọc: rơi về mặc định, KHÔNG vỡ trang", () => {
    gaLapKho("NEM");
    expect(() => docTuKhoChoTest(true)).not.toThrow();
    expect(docTuKhoChoTest(true)).toBe(true);
    expect(docTuKhoChoTest(false)).toBe(false);
  });

  it("ghi: nuốt lỗi — phiên này vẫn đúng, chỉ là không nhớ sang lần sau", () => {
    gaLapKho("NEM");
    expect(() => luuTatTieng(true)).not.toThrow();
  });
});
