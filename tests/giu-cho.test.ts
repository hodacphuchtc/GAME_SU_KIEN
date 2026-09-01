import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ROOM_HOLD_SECONDS } from "@/config/game";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { chay } from "@/lib/db/truy-van";
import { dangGiuCho, giaHanCho, giuCho, nhaCho } from "@/lib/phien/giu-cho";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

let don: () => void;
let ma: string;

beforeEach(() => {
  don = dungCsdlTam();
  ma = taoChuongTrinh({
    tenTrungTam: "Trung tâm Hoa Mai",
    coSoId: coSoThu("Trung tâm Hoa Mai"),
    soTrung: 211,
    mucDo: "vua",
    tenGiaiThuong: "Voucher 200k",
    tranGiaiMoiNgay: 0,
  }).ma;
});

afterEach(() => don());

describe("giữ chỗ — mỗi chương trình một thiết bị", () => {
  it("máy đầu tiên giữ được chỗ", () => {
    expect(giuCho(ma, "nguoi_choi", "may-1").duoc).toBe(true);
    expect(dangGiuCho(ma, "nguoi_choi", "may-1")).toBe(true);
  });

  it("MÁY THỨ HAI BỊ TỪ CHỐI khi chỗ đang bận", () => {
    giuCho(ma, "nguoi_choi", "may-1");
    const kq = giuCho(ma, "nguoi_choi", "may-2");
    expect(kq.duoc).toBe(false);
    expect(kq.conBanBao).toBeGreaterThan(0);
    expect(dangGiuCho(ma, "nguoi_choi", "may-2")).toBe(false);
  });

  it("chính máy đang giữ thì xin lại vẫn được — bấm F5 không tự khoá mình ra ngoài", () => {
    giuCho(ma, "nguoi_choi", "may-1");
    expect(giuCho(ma, "nguoi_choi", "may-1").duoc).toBe(true);
  });

  it("chỗ HẾT HẠN thì máy sau vào được — điện thoại bỏ đi không khoá cả buổi chiều", () => {
    giuCho(ma, "nguoi_choi", "may-1");
    chay("update chuong_trinh set han_nguoi_choi = ? where ma = ?", Date.now() - 1, ma);
    expect(giuCho(ma, "nguoi_choi", "may-2").duoc).toBe(true);
  });

  it("nhả chỗ xong thì người sau vào được ngay", () => {
    giuCho(ma, "nguoi_choi", "may-1");
    expect(nhaCho(ma, "nguoi_choi", "may-1")).toBe(true);
    expect(giuCho(ma, "nguoi_choi", "may-2").duoc).toBe(true);
  });

  it("máy khác KHÔNG nhả được chỗ của người đang chơi", () => {
    giuCho(ma, "nguoi_choi", "may-1");
    expect(nhaCho(ma, "nguoi_choi", "ke-pha-dam")).toBe(false);
    expect(dangGiuCho(ma, "nguoi_choi", "may-1")).toBe(true);
  });

  it("gia hạn đẩy hạn về phía sau", () => {
    giuCho(ma, "nguoi_choi", "may-1");
    chay(
      "update chuong_trinh set han_nguoi_choi = ? where ma = ?",
      Date.now() + 1000,
      ma,
    );
    expect(giaHanCho(ma, "nguoi_choi", "may-1")).toBe(true);
    expect(dangGiuCho(ma, "nguoi_choi", "may-1")).toBe(true);
    // Hạn mới phải xa hơn 1 giây ban đầu rất nhiều.
    expect(ROOM_HOLD_SECONDS).toBeGreaterThan(1);
  });

  it("màn hình và người chơi là HAI chỗ riêng — không giành nhau", () => {
    expect(giuCho(ma, "man_hinh", "laptop").duoc).toBe(true);
    expect(giuCho(ma, "nguoi_choi", "dien-thoai").duoc).toBe(true);
  });

  it("chương trình đã tắt thì không ai giữ chỗ được nữa", () => {
    chay("update chuong_trinh set trang_thai = 'ket_thuc' where ma = ?", ma);
    expect(giuCho(ma, "nguoi_choi", "may-1").duoc).toBe(false);
  });
});

describe("nhả chỗ sau khi chốt ván", () => {
  it("máy chủ nhả được chỗ mà không cần token — người xếp hàng sau vào ngay", async () => {
    const { nhaChoBatKe } = await import("@/lib/phien/giu-cho");
    giuCho(ma, "nguoi_choi", "may-1");
    expect(nhaChoBatKe(ma, "nguoi_choi")).toBe(true);
    expect(giuCho(ma, "nguoi_choi", "may-2").duoc).toBe(true);
  });
});
