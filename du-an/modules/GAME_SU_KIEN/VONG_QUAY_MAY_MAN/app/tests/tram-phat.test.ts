import { afterEach, describe, expect, it } from "vitest";

import {
  dangKy,
  donTramPhat,
  phat,
  soNguoiNghe,
  soPhongDangMo,
} from "@/lib/dong-bo/tram-phat";

/**
 * Trạm phát là CÁI LOA nối màn LCD với điện thoại, không phải cái sổ. Nó giữ
 * tin trong bộ nhớ và mất khi tắt máy — thứ cần nhớ đã nằm ở SQLite.
 */
afterEach(() => donTramPhat());

describe("trạm phát", () => {
  it("người nghe mới nhận được tin của phòng mình", () => {
    const nhan: string[] = [];
    dangKy("AC37", (t) => nhan.push(t));

    expect(phat("AC37", { loai: "roi-di" })).toBe(1);
    expect(nhan).toHaveLength(1);
    expect(JSON.parse(nhan[0])).toEqual({ loai: "roi-di" });
  });

  it("tin KHÔNG lọt sang phòng khác", () => {
    const a: string[] = [];
    const b: string[] = [];
    dangKy("AAAA", (t) => a.push(t));
    dangKy("BBBB", (t) => b.push(t));

    phat("AAAA", { loai: "roi-di" });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(0);
  });

  it("nhiều người cùng phòng đều nhận", () => {
    let dem = 0;
    dangKy("AC37", () => dem++);
    dangKy("AC37", () => dem++);
    dangKy("AC37", () => dem++);

    expect(soNguoiNghe("AC37")).toBe(3);
    expect(phat("AC37", { loai: "roi-di" })).toBe(3);
    expect(dem).toBe(3);
  });

  it("người ngắt kết nối được dọn, và phòng rỗng thì bỏ hẳn khỏi bản đồ", () => {
    // Không dọn thì mỗi mã chương trình từng mở để lại một Set rỗng nằm đó tới
    // khi khởi động lại máy chủ — rò rỉ chậm mà không ai thấy.
    const roi = dangKy("AC37", () => {});
    expect(soPhongDangMo()).toBe(1);

    roi();
    expect(soNguoiNghe("AC37")).toBe(0);
    expect(soPhongDangMo()).toBe(0);
  });

  it("rời phòng hai lần vô hại", () => {
    const roi = dangKy("AC37", () => {});
    roi();
    expect(() => roi()).not.toThrow();
  });

  it("một kết nối CHẾT bị loại, không chặn cả phòng", () => {
    const tot: string[] = [];
    dangKy("AC37", () => {
      throw new Error("kết nối đã ngắt giữa chừng");
    });
    dangKy("AC37", (t) => tot.push(t));

    expect(phat("AC37", { loai: "roi-di" })).toBe(1);
    expect(tot).toHaveLength(1);
    // Kết nối chết đã bị gạt ra khỏi phòng.
    expect(soNguoiNghe("AC37")).toBe(1);
  });

  it("phát vào phòng không ai nghe thì trả 0, không ném", () => {
    expect(phat("KHONG-AI", { loai: "roi-di" })).toBe(0);
  });
});
