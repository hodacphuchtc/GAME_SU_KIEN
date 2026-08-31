import { beforeEach, describe, expect, it, vi } from "vitest";

import { dangKy, phat, soNguoiNghe, soPhongDangMo } from "@/lib/dong-bo/tram-phat";

/** Dọn sạch trạm phát giữa các ca test — nó sống ở globalThis nên không tự mất. */
function donSach() {
  const kho = globalThis as Record<symbol, unknown>;
  delete kho[Symbol.for("dem-so.tram-phat")];
}

beforeEach(donSach);

describe("trạm phát tin", () => {
  it("tin chỉ tới ĐÚNG phòng — hai cơ sở chạy song song không lẫn kết quả", () => {
    const a = vi.fn();
    const b = vi.fn();
    dangKy("AAAA", a);
    dangKy("BBBB", b);

    expect(phat("AAAA", { loai: "bat-dau" })).toBe(1);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    expect(JSON.parse(a.mock.calls[0][0] as string)).toEqual({ loai: "bat-dau" });
  });

  it("mọi máy trong cùng phòng đều nhận được", () => {
    const m1 = vi.fn();
    const m2 = vi.fn();
    dangKy("AAAA", m1);
    dangKy("AAAA", m2);
    expect(phat("AAAA", { loai: "roi-di" })).toBe(2);
  });

  it("phát vào phòng không ai nghe thì không nổ, chỉ trả về 0", () => {
    expect(phat("TRONG", { loai: "roi-di" })).toBe(0);
  });

  it("người nghe rời đi thì KHÔNG rò bộ nhớ — phòng rỗng bị bỏ hẳn", () => {
    const roi = dangKy("AAAA", vi.fn());
    expect(soNguoiNghe("AAAA")).toBe(1);
    expect(soPhongDangMo()).toBe(1);
    roi();
    expect(soNguoiNghe("AAAA")).toBe(0);
    expect(soPhongDangMo()).toBe(0);
  });

  it("một kết nối chết không chặn cả phòng", () => {
    const hong = vi.fn(() => {
      throw new Error("kết nối đã đứt");
    });
    const lanh = vi.fn();
    dangKy("AAAA", hong);
    dangKy("AAAA", lanh);

    expect(phat("AAAA", { loai: "roi-di" })).toBe(1);
    expect(lanh).toHaveBeenCalledTimes(1);
    // Máy chết bị loại luôn, lượt sau không thử lại nữa.
    expect(soNguoiNghe("AAAA")).toBe(1);
  });
});
