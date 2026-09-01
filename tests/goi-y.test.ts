import { describe, expect, it } from "vitest";

import { T } from "@/config/locale";

/**
 * CHẤT LƯỢNG NỘI DUNG GỢI Ý (GĐ 26).
 *
 * 🔴 `tests/locale.test.ts` đã canh chuyện khoá có được dùng hay không. Bài này
 * canh thứ khác: gợi ý có ĐÁNG ĐỌC không. Một dòng "Trần giải mỗi ngày: số giải
 * mỗi ngày" là hợp lệ về mọi mặt kỹ thuật và vô dụng về mọi mặt còn lại — người
 * dùng bấm một lần, thấy nó nhắc lại cái nhãn, rồi không bao giờ bấm nữa.
 */

const KHOA_GOI_Y = Object.entries(T).filter(
  ([khoa, giaTri]) => khoa.startsWith("gy") && typeof giaTri === "string",
) as [string, string][];

describe("nội dung gợi ý", () => {
  it("có đủ gợi ý cho các thông số quan trọng", () => {
    expect(KHOA_GOI_Y.length).toBeGreaterThanOrEqual(8);
  });

  it("mỗi gợi ý phải đủ dài để nói được điều gì đó — dưới 40 ký tự là nhắc lại cái nhãn", () => {
    const ngan = KHOA_GOI_Y.filter(([, chu]) => chu.length < 40).map(([k]) => k);
    expect(ngan, `Gợi ý quá ngắn: ${ngan.join(" · ")}`).toEqual([]);
  });

  it("không gợi ý nào kết thúc bằng dấu hai chấm — đó là nhãn, không phải lời giải thích", () => {
    const sai = KHOA_GOI_Y.filter(([, chu]) => chu.trim().endsWith(":")).map(([k]) => k);
    expect(sai).toEqual([]);
  });

  it("gợi ý viết thành câu hoàn chỉnh, kết thúc bằng dấu chấm", () => {
    const sai = KHOA_GOI_Y.filter(([, chu]) => !/[.…]$/.test(chu.trim())).map(([k]) => k);
    expect(sai, `Thiếu dấu chấm cuối: ${sai.join(" · ")}`).toEqual([]);
  });

  it("nhãn cho trình đọc màn hình có tồn tại — dấu ? trơ trọi thì máy đọc không nói được gì", () => {
    expect(typeof T.goiYNhan).toBe("string");
    expect(T.goiYNhan.length).toBeGreaterThan(3);
  });
});
