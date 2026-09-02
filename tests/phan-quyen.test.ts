import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { taoCoSo } from "@/lib/co-so/kho";
import { phamViCua, quanLyDuocNhanVien, suaDuocCoSo, xemDuocNhatKy } from "@/lib/bao-ve/quyen";
import { danhSachLead, demLead, ganLead, sinhLead, timLead } from "@/lib/lead/kho";
import { taoChuongTrinh, timTheoMaBatKeTroChoi } from "@/lib/chuong-trinh/kho";
import { danhSachNhanVien, datTrangThaiNhanVien, themNhanVien } from "@/lib/nhan-vien/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * PHÂN QUYỀN THEO CƠ SỞ (GĐ 15.2).
 *
 * 🔴 Bài test này canh đúng MỘT điều, và nó là điều quan trọng nhất của cả giai
 * đoạn: việc lọc phải xảy ra ở TẦNG TRUY VẤN. Ẩn nút trên giao diện mà câu SQL
 * vẫn trả đủ dòng thì danh bạ khách đã nằm trong HTML gửi ra khỏi máy chủ —
 * người xem chỉ cần bấm "xem mã nguồn trang".
 */

let don: () => void;
let cs1: number;
let cs2: number;
let saleCs1: number;
let saleCs1Hai: number;
let saleCs2: number;

function themKhach(sdt: string, coSoId: number, nhanVienId: number | null) {
  const nc = nhanDien(`Phụ huynh ${sdt}`, sdt, true).nguoiChoi!;
  sinhLead(coSoId, nc.id, null);
  if (nhanVienId !== null) {
    const lead = danhSachLead({ coSoId: null, nhanVienId: null }).find(
      (l) => l.nguoiChoiId === nc.id,
    )!;
    ganLead(lead.id, nhanVienId, { coSoId: null, nhanVienId: null });
  }
  return nc.id;
}

beforeEach(() => {
  don = dungCsdlTam();
  cs1 = taoCoSo({ ten: "Cơ sở Hải Châu" }).id;
  cs2 = taoCoSo({ ten: "Cơ sở Thanh Khê" }).id;
  saleCs1 = themNhanVien({ hoTen: "Sale Một", coSoId: cs1, vaiTro: "sale" });
  saleCs1Hai = themNhanVien({ hoTen: "Sale Một Rưỡi", coSoId: cs1, vaiTro: "sale" });
  saleCs2 = themNhanVien({ hoTen: "Sale Hai", coSoId: cs2, vaiTro: "sale" });

  themKhach("0900000001", cs1, saleCs1);
  themKhach("0900000002", cs1, saleCs1Hai);
  themKhach("0900000003", cs1, null);
  themKhach("0900000004", cs2, saleCs2);
  themKhach("0900000005", cs2, null);
});

afterEach(() => don());

describe("phạm vi suy từ vai trò", () => {
  it("quan_tri thấy tất cả", () => {
    const pv = phamViCua({ id: 99, vaiTro: "quan_tri", coSoId: null });
    expect(pv).toEqual({ coSoId: null, nhanVienId: null });
    expect(danhSachLead(pv)).toHaveLength(5);
    expect(demLead(pv)).toBe(5);
  });

  it("quan_ly_co_so thấy toàn bộ lead của cơ sở mình", () => {
    const pv = phamViCua({ id: 98, vaiTro: "quan_ly_co_so", coSoId: cs1 });
    const ds = danhSachLead(pv);
    expect(ds).toHaveLength(3);
    expect(ds.every((l) => l.coSoId === cs1)).toBe(true);
  });

  it("sale chỉ thấy lead được giao cho mình", () => {
    const pv = phamViCua({ id: saleCs1, vaiTro: "sale", coSoId: cs1 });
    const ds = danhSachLead(pv);
    expect(ds).toHaveLength(1);
    expect(ds[0].soDienThoai).toBe("0900000001");
  });

  it("🔴 sale CS1 truy vấn không ra dòng nào của CS2", () => {
    const pv = phamViCua({ id: saleCs1, vaiTro: "sale", coSoId: cs1 });
    expect(danhSachLead(pv).some((l) => l.coSoId === cs2)).toBe(false);

    const pvQuanLy = phamViCua({ id: 98, vaiTro: "quan_ly_co_so", coSoId: cs1 });
    expect(danhSachLead(pvQuanLy).some((l) => l.coSoId === cs2)).toBe(false);
  });

  it("🔴 gõ thẳng id khách của CS2 cũng KHÔNG đọc được", () => {
    const tatCa = danhSachLead({ coSoId: null, nhanVienId: null });
    const khachCs2 = tatCa.find((l) => l.coSoId === cs2)!;

    const pvSale = phamViCua({ id: saleCs1, vaiTro: "sale", coSoId: cs1 });
    expect(timLead(khachCs2.id, pvSale)).toBeNull();

    const pvQuanLy = phamViCua({ id: 98, vaiTro: "quan_ly_co_so", coSoId: cs1 });
    expect(timLead(khachCs2.id, pvQuanLy)).toBeNull();

    // Quản trị thì đọc được — để chứng minh dòng đó CÓ THẬT, không phải id sai.
    expect(timLead(khachCs2.id, { coSoId: null, nhanVienId: null })).not.toBeNull();
  });

  it("🔴 sale KHÔNG gán được khách của cơ sở khác cho chính mình", () => {
    const tatCa = danhSachLead({ coSoId: null, nhanVienId: null });
    // Chỉ ĐÍCH DANH khách đã được gán cho sale CS2 — danh sách sắp giảm dần nên
    // `find` theo cơ sở sẽ bắt phải khách chưa gán, và bài test hoá ra kiểm nhầm dòng.
    const khachCs2 = tatCa.find((l) => l.soDienThoai === "0900000004")!;
    const pvSale = phamViCua({ id: saleCs1, vaiTro: "sale", coSoId: cs1 });

    expect(ganLead(khachCs2.id, saleCs1, pvSale)).toBe(false);
    // Vẫn thuộc về sale của CS2, không bị cướp sang CS1.
    expect(timLead(khachCs2.id, { coSoId: null, nhanVienId: null })!.nhanVienId).toBe(saleCs2);
  });

  it("quản lý cơ sở KHÔNG khai cơ sở thì không thấy gì — mặc định phải là ĐÓNG", () => {
    const pv = phamViCua({ id: 97, vaiTro: "quan_ly_co_so", coSoId: null });
    expect(danhSachLead(pv)).toHaveLength(0);
  });

  it("vai trò LẠ thì không thấy gì, không rơi về thấy tất cả", () => {
    // @ts-expect-error — cố tình truyền vai trò không có trong danh sách
    const pv = phamViCua({ id: 96, vaiTro: "sep_tong", coSoId: cs1 });
    expect(danhSachLead(pv)).toHaveLength(0);
  });
});

describe("mục chỉ dành cho quản trị", () => {
  const quanTri = { id: 1, vaiTro: "quan_tri" as const, coSoId: null };
  const quanLy = { id: 2, vaiTro: "quan_ly_co_so" as const, coSoId: 1 };
  const sale = { id: 3, vaiTro: "sale" as const, coSoId: 1 };

  it("chỉ quan_tri xem được nhật ký", () => {
    expect(xemDuocNhatKy(quanTri)).toBe(true);
    expect(xemDuocNhatKy(quanLy)).toBe(false);
    expect(xemDuocNhatKy(sale)).toBe(false);
  });

  it("chỉ quan_tri quản lý được nhân viên và cơ sở", () => {
    expect([quanLyDuocNhanVien(quanTri), suaDuocCoSo(quanTri)]).toEqual([true, true]);
    expect([quanLyDuocNhanVien(sale), suaDuocCoSo(sale)]).toEqual([false, false]);
  });
});

describe("cho nghỉ chứ không xoá", () => {
  it("cho nhân viên nghỉ không làm mất lead của họ", () => {
    datTrangThaiNhanVien(saleCs1, "da_nghi");

    const pvAll = { coSoId: null, nhanVienId: null };
    const khach = danhSachLead(pvAll).find((l) => l.soDienThoai === "0900000001")!;
    // Khách vẫn còn, vẫn giữ dấu vết ai từng phụ trách.
    expect(khach.nhanVienId).toBe(saleCs1);
    expect(khach.tenNhanVien).toBe("Sale Một");

    // Người đó vẫn còn trong danh sách, chỉ đổi trạng thái.
    const nv = danhSachNhanVien().find((n) => n.id === saleCs1)!;
    expect(nv.trangThai).toBe("da_nghi");
  });
});

describe("🔴 R2 — cửa TẮT/BẬT chương trình phải lọc phạm vi", () => {
  /**
   * Đây là cửa DÙNG CHUNG của cả ba game, và trước bản vá nó KHÔNG đọc phiên,
   * KHÔNG lọc phạm vi. Lớp chắn duy nhất là `proxy.ts` — mà nó chỉ hỏi "đã đăng
   * nhập chưa", không hỏi "được đụng dữ liệu của ai". Nghĩa là một sale của Cơ sở
   * 1 gọi được hành động tắt chương trình đang phục vụ khách của Cơ sở 2.
   *
   * Đúng vết sẹo đã ghi ở `CLAUDE.md`: "đã có lớp chặn ở cửa" KHÔNG có nghĩa là
   * từng phòng đã khoá.
   *
   * Kiểm ở TẦNG KHO (`timTheoMaBatKeTroChoi`) vì đó là nơi phép lọc thật sự xảy
   * ra; server action chỉ là lớp mỏng gọi xuống đây rồi `redirect`.
   */
  function ctCua(coSoId: number, troChoi: "trung_so" | "chon_so" | "vong_quay") {
    return taoChuongTrinh({
      tenTrungTam: `CT ${troChoi}`,
      coSoId,
      soTrung: 7,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
      troChoi,
    });
  }

  it("🔴 sale cơ sở A KHÔNG mở được chương trình cơ sở B — cả ba game", () => {
    const saleCs1 = phamViCua({ id: 1, vaiTro: "sale", coSoId: cs1 });
    for (const tc of ["trung_so", "chon_so", "vong_quay"] as const) {
      const ct = ctCua(cs2, tc);
      expect(timTheoMaBatKeTroChoi(ct.ma, saleCs1)).toBeNull();
    }
  });

  it("sale mở được chương trình CỦA CHÍNH cơ sở mình, bất kể game", () => {
    const saleCs1 = phamViCua({ id: 1, vaiTro: "sale", coSoId: cs1 });
    for (const tc of ["trung_so", "chon_so", "vong_quay"] as const) {
      const ct = ctCua(cs1, tc);
      expect(timTheoMaBatKeTroChoi(ct.ma, saleCs1)?.ma).toBe(ct.ma);
    }
  });

  it("quản trị toàn hệ thống mở được của mọi cơ sở", () => {
    const quanTri = phamViCua({ id: 9, vaiTro: "quan_tri", coSoId: null });
    const ct = ctCua(cs2, "vong_quay");
    expect(timTheoMaBatKeTroChoi(ct.ma, quanTri)?.ma).toBe(ct.ma);
  });
});
