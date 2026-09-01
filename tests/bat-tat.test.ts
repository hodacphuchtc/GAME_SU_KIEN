import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import { doiTrangThai, taoChuongTrinh, timTheoMa } from "@/lib/chuong-trinh/kho";
import { giuCho } from "@/lib/phien/giu-cho";
import { moLuot, xinCho } from "@/app/actions/choi";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * Bật/tắt bằng MỘT nút. Trước GĐ 8.3 chỉ tắt được, muốn bật lại phải sửa thẳng
 * SQLite bằng tay — nghĩa là mỗi sự kiện mới phải tạo lại chương trình và in
 * lại mã QR.
 */

let don: () => void;
let ma: string;

function oGiuCho() {
  return csdl()
    .prepare(
      `select token_man_hinh, han_man_hinh, token_nguoi_choi, han_nguoi_choi
         from chuong_trinh where ma = ?`,
    )
    .get(ma) as Record<string, unknown>;
}

beforeEach(() => {
  don = dungCsdlTam();
  ma = taoChuongTrinh({
    tenTrungTam: "Trung tâm thử",
    soTrung: 114,
    mucDo: "vua",
    tenGiaiThuong: "Balo STEM",
    tranGiaiMoiNgay: 0,
  }).ma;
});

afterEach(() => don());

describe("bật lại được", () => {
  it("🔴 tắt rồi bật lại thì giữ chỗ được lại", async () => {
    doiTrangThai(ma, "ket_thuc");
    expect((await xinCho(ma, "nguoi_choi", "t1")).duoc).toBe(false);

    doiTrangThai(ma, "dang_chay");
    expect((await xinCho(ma, "nguoi_choi", "t1")).duoc).toBe(true);
  });

  it("tắt thì moLuot bị chặn, bật lại thì mở được", async () => {
    doiTrangThai(ma, "ket_thuc");
    expect((await moLuot(ma, null)).ok).toBe(false);

    doiTrangThai(ma, "dang_chay");
    expect((await moLuot(ma, null)).ok).toBe(true);
  });

  it("trạng thái lưu đúng ở cả hai chiều", () => {
    doiTrangThai(ma, "ket_thuc");
    expect(timTheoMa(ma)!.trangThai).toBe("ket_thuc");
    doiTrangThai(ma, "dang_chay");
    expect(timTheoMa(ma)!.trangThai).toBe("dang_chay");
  });
});

describe("🔴 ca GHẾ MA — dọn sạch giữ chỗ ở CẢ HAI chiều", () => {
  it("tắt thì xoá sạch token và hạn giữ chỗ", () => {
    giuCho(ma, "nguoi_choi", "dien-thoai-cu");
    giuCho(ma, "man_hinh", "lcd-cu");
    expect(Object.values(oGiuCho()).some((v) => v !== null)).toBe(true);

    doiTrangThai(ma, "ket_thuc");
    expect(oGiuCho()).toEqual({
      token_man_hinh: null,
      han_man_hinh: null,
      token_nguoi_choi: null,
      han_nguoi_choi: null,
    });
  });

  it("bật lại cũng xoá sạch — không để ghế ma chặn người mới", () => {
    doiTrangThai(ma, "ket_thuc");
    giuCho(ma, "nguoi_choi", "ma-cu");
    doiTrangThai(ma, "dang_chay");
    expect(oGiuCho().token_nguoi_choi).toBeNull();
  });

  it("🔴 tắt lúc đang có người giữ chỗ, bật lại thì NGƯỜI MỚI vào được ngay", async () => {
    // Đây đúng là cảnh ở quầy: nhân viên tắt gấp, 20 giây sau bật lại.
    // Không dọn thì suốt 2 phút người mới bị báo "màn hình đang có người chơi"
    // bởi một chiếc điện thoại đã rời đi từ lâu.
    expect((await xinCho(ma, "nguoi_choi", "dien-thoai-cu")).duoc).toBe(true);
    doiTrangThai(ma, "ket_thuc");
    doiTrangThai(ma, "dang_chay");

    const nguoiMoi = await xinCho(ma, "nguoi_choi", "dien-thoai-moi");
    expect(nguoiMoi.duoc).toBe(true);
    expect(nguoiMoi.lyDo).toBeUndefined();
  });
});

describe("gọi lặp không gây tác dụng phụ", () => {
  it("tắt hai lần liên tiếp vẫn là tắt", () => {
    doiTrangThai(ma, "ket_thuc");
    doiTrangThai(ma, "ket_thuc");
    expect(timTheoMa(ma)!.trangThai).toBe("ket_thuc");
  });

  it("bật hai lần liên tiếp vẫn là đang chạy", () => {
    doiTrangThai(ma, "dang_chay");
    doiTrangThai(ma, "dang_chay");
    expect(timTheoMa(ma)!.trangThai).toBe("dang_chay");
  });

  it("mã không tồn tại thì trả false, không ném", () => {
    expect(doiTrangThai("ZZZZ", "ket_thuc")).toBe(false);
  });
});
