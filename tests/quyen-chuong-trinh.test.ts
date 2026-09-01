import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { phamViCua, type NguoiDung } from "@/lib/bao-ve/quyen";
import {
  danhSachChonSo,
  danhSachChuongTrinh,
  taoChuongTrinh,
  timTheoMa,
  timTheoMaBatKeTroChoi,
  timTheoMaChonSo,
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

/**
 * HAI GAME TRÊN CÙNG MỘT BẢNG (C.1 · v3).
 *
 * 🔴 Vì sao có bài test này: `chuong_trinh` giờ chứa cả Trúng Số lẫn Chọn Số,
 * phân biệt bằng cột `tro_choi`. Quên mệnh đề lọc ở một câu truy vấn nào đó thì
 * màn quản trị của game này hiện chương trình của game kia — và nút Sửa sẽ ghi
 * những cột mà game kia không bao giờ đọc.
 *
 * Hướng lệch nguy hiểm hơn nằm ở phía ngược lại: gõ nhầm hằng trong mệnh đề lọc
 * là danh sách chương trình TRÚNG SỐ đang chạy thật biến mất khỏi màn hình quản
 * trị của quầy, mà không một dòng lỗi nào.
 */
describe("hai game không thấy nhau", () => {
  function chonSoThu(ten: string, coSoId: number | null): string {
    return taoChuongTrinh({
      tenTrungTam: ten,
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: "Quà Tết 2026",
      tranGiaiMoiNgay: 0,
      coSoId,
      troChoi: "chon_so",
      daiTu: 1,
      daiDen: 100,
      loaiTruDaRa: true,
    }).ma;
  }

  it("🔴 danh sách của mỗi game chỉ chứa chương trình của chính nó", () => {
    const maCs = chonSoThu("Hải Châu", cs1);
    const pv = phamViCua(TOAN_QUYEN);

    const dsTrungSo = danhSachChuongTrinh(pv).map((c) => c.ma);
    expect(dsTrungSo).toContain(maCs1);
    expect(dsTrungSo).not.toContain(maCs);

    const dsChonSo = danhSachChonSo(pv).map((c) => c.ma);
    expect(dsChonSo).toContain(maCs);
    expect(dsChonSo).not.toContain(maCs1);
  });

  it("🔴 cửa quản trị của game này KHÔNG mở được chương trình của game kia", () => {
    const maCs = chonSoThu("Hải Châu", cs1);
    const pv = phamViCua(TOAN_QUYEN);
    expect(timTheoMa(maCs, pv)).toBeNull();
    expect(timTheoMaChonSo(maCs1, pv)).toBeNull();
    expect(timTheoMaChonSo(maCs, pv)?.ma).toBe(maCs);
  });

  it("đường CÔNG KHAI phục vụ CẢ HAI game — phụ huynh quét mã nào cũng chơi được", () => {
    const maCs = chonSoThu("Hải Châu", cs1);
    expect(timTheoMaCongKhai(maCs)?.ma).toBe(maCs);
    expect(timTheoMaCongKhai(maCs1)?.ma).toBe(maCs1);
  });

  it("chọn số đọc lại đúng dải số và công tắc loại trừ đã khai", () => {
    const maCs = chonSoThu("Hải Châu", cs1);
    const ct = timTheoMaChonSo(maCs, phamViCua(TOAN_QUYEN))!;
    expect(ct.troChoi).toBe("chon_so");
    expect(ct.daiTu).toBe(1);
    expect(ct.daiDen).toBe(100);
    expect(ct.loaiTruDaRa).toBe(true);
  });

  it("chương trình trúng số cũ vẫn mang thân phận trúng số và dải mặc định", () => {
    const ct = timTheoMa(maCs1, phamViCua(TOAN_QUYEN))!;
    expect(ct.troChoi).toBe("trung_so");
    expect(ct.loaiTruDaRa).toBe(false);
  });

  it("🔴 sale của cơ sở khác không mở được chương trình chọn số", () => {
    const maCs = chonSoThu("Hải Châu", cs1);
    const saleCs2: NguoiDung = { id: 9, vaiTro: "sale", coSoId: cs2 };
    expect(timTheoMaChonSo(maCs, phamViCua(saleCs2))).toBeNull();
    expect(danhSachChonSo(phamViCua(saleCs2)).map((c) => c.ma)).not.toContain(maCs);
  });

  it("hai cửa tắt/ẩn làm việc với CẢ HAI game", () => {
    const maCs = chonSoThu("Hải Châu", cs1);
    const pv = phamViCua(TOAN_QUYEN);
    expect(timTheoMaBatKeTroChoi(maCs, pv)?.ma).toBe(maCs);
    expect(timTheoMaBatKeTroChoi(maCs1, pv)?.ma).toBe(maCs1);
  });
});
