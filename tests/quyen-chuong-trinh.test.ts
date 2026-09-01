import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { phamViCua, type NguoiDung } from "@/lib/bao-ve/quyen";
import {
  danhSachChuongTrinh,
  taoChuongTrinh,
  timTheoMa,
  timTheoMaCongKhai,
} from "@/lib/chuong-trinh/kho";
import { taoCoSo } from "@/lib/co-so/kho";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * PHÂN QUYỀN CHO CHƯƠNG TRÌNH (GĐ 21.1).
 *
 * 🔴 Vì sao có bài test này: trước GĐ 21, `app/quan-tri/chuong-trinh/[ma]/page.tsx`
 * không gọi `nguoiDangDangNhap()` lần nào. Một sale của CS1 gõ đúng đường dẫn là
 * đọc được trọn lịch sử của CS2 — và GĐ 21.2 sắp đưa họ tên đầy đủ cùng số điện
 * thoại lên chính trang đó.
 *
 * Lọc phải nằm ở TẦNG TRUY VẤN. Ẩn nút trên giao diện mà câu SQL vẫn trả đủ dòng
 * thì dữ liệu đã nằm trong HTML gửi ra khỏi máy chủ.
 */

let don: () => void;
let cs1: number;
let cs2: number;
let maCs1: string;
let maCs2: string;
let maKhongCoSo: string;

const TOAN_QUYEN: NguoiDung = { id: 1, vaiTro: "quan_tri", coSoId: null };

function chuongTrinhThu(ten: string, coSoId: number | null): string {
  return taoChuongTrinh({
    tenTrungTam: ten,
    soTrung: 211,
    mucDo: "vua",
    tenGiaiThuong: "Voucher",
    tranGiaiMoiNgay: 0,
    coSoId,
  }).ma;
}

beforeEach(() => {
  don = dungCsdlTam();
  cs1 = taoCoSo({ ten: "Cơ sở Hải Châu" }).id;
  cs2 = taoCoSo({ ten: "Cơ sở Thanh Khê" }).id;
  maCs1 = chuongTrinhThu("Hải Châu", cs1);
  maCs2 = chuongTrinhThu("Thanh Khê", cs2);
  maKhongCoSo = chuongTrinhThu("Chưa gán cơ sở", null);
});

afterEach(() => don());

describe("danh sách chương trình lọc theo phạm vi", () => {
  it("quản trị toàn hệ thống thấy cả ba", () => {
    const ds = danhSachChuongTrinh(phamViCua(TOAN_QUYEN));
    expect(ds.map((c) => c.ma).sort()).toEqual([maCs1, maCs2, maKhongCoSo].sort());
  });

  it("quản lý cơ sở chỉ thấy chương trình của cơ sở mình", () => {
    const ds = danhSachChuongTrinh(
      phamViCua({ id: 2, vaiTro: "quan_ly_co_so", coSoId: cs1 }),
    );
    expect(ds.map((c) => c.ma)).toEqual([maCs1]);
  });

  it("sale chỉ thấy chương trình của cơ sở mình", () => {
    const ds = danhSachChuongTrinh(phamViCua({ id: 3, vaiTro: "sale", coSoId: cs2 }));
    expect(ds.map((c) => c.ma)).toEqual([maCs2]);
  });

  it("chương trình CHƯA GÁN CƠ SỞ chỉ quản trị toàn hệ thống thấy", () => {
    // Không thuộc cơ sở nào ⇒ không có cơ sở nào để mà nhận nó về. Hướng lệch an
    // toàn là giấu, không phải là cho mọi người thấy.
    const cua1 = danhSachChuongTrinh(phamViCua({ id: 2, vaiTro: "quan_ly_co_so", coSoId: cs1 }));
    expect(cua1.map((c) => c.ma)).not.toContain(maKhongCoSo);
  });

  it("vai trò lạ không thấy gì — mặc định phải là ĐÓNG", () => {
    const ds = danhSachChuongTrinh(
      // @ts-expect-error cố tình truyền vai trò không tồn tại, mô phỏng dữ liệu cũ
      phamViCua({ id: 9, vaiTro: "nguoi_la", coSoId: cs1 }),
    );
    expect(ds).toEqual([]);
  });
});

describe("mở thẳng bằng mã chương trình", () => {
  it("🔴 sale CS2 gõ đúng mã của CS1 vẫn KHÔNG mở được", () => {
    const pv = phamViCua({ id: 3, vaiTro: "sale", coSoId: cs2 });
    expect(timTheoMa(maCs1, pv)).toBeNull();
    expect(timTheoMa(maCs2, pv)?.ma).toBe(maCs2);
  });

  it("quản trị mở được mọi mã, kể cả chương trình chưa gán cơ sở", () => {
    const pv = phamViCua(TOAN_QUYEN);
    expect(timTheoMa(maCs1, pv)?.ma).toBe(maCs1);
    expect(timTheoMa(maKhongCoSo, pv)?.ma).toBe(maKhongCoSo);
  });

  it("đường CÔNG KHAI (màn chơi, màn hình LCD) không lọc — ở đó không có ai đăng nhập", () => {
    // Phụ huynh quét mã QR thì không đăng nhập gì cả; lọc ở đây là khoá cửa
    // chính trò chơi. Hai đường phải tách tên rõ ràng để không ai gọi nhầm.
    expect(timTheoMaCongKhai(maCs1)?.ma).toBe(maCs1);
    expect(timTheoMaCongKhai(maKhongCoSo)?.ma).toBe(maKhongCoSo);
  });

  it("mã không tồn tại trả null ở cả hai đường", () => {
    expect(timTheoMa("ZZZZ", phamViCua(TOAN_QUYEN))).toBeNull();
    expect(timTheoMaCongKhai("ZZZZ")).toBeNull();
  });
});
