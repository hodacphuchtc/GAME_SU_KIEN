import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  anCoSo,
  coSoDangBat,
  danhSachCoSo,
  demRangBuocCoSo,
  taoCoSo,
  timCoSo,
  xoaCoSo,
} from "@/lib/co-so/kho";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { danhSachLead, sinhLead } from "@/lib/lead/kho";
import { danhSachNhanVien, themNhanVien } from "@/lib/nhan-vien/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * XOÁ / ẨN CƠ SỞ (GĐ 23.2).
 *
 * 🔴 Vì sao ngưỡng ở đây CHẶT HƠN chương trình, đo trên lược đồ thật:
 * `khach_tiem_nang.co_so_id` và `nhan_vien.co_so_id` đều là `ON DELETE CASCADE`.
 * Một câu `delete from co_so` là **cuốn theo toàn bộ khách tiềm năng và nhân
 * viên của cơ sở đó, im lặng, không hỏi**. Nên cơ sở chỉ được xoá cứng khi sạch
 * trơn; còn lại là ẩn.
 */

const TOAN_BO = { coSoId: null, nhanVienId: null };

let don: () => void;

beforeEach(() => {
  don = dungCsdlTam();
});

afterEach(() => don());

describe("đếm ràng buộc", () => {
  it("cơ sở mới toanh: cả bốn con số bằng 0", () => {
    const cs = taoCoSo({ ten: "Cơ sở Trắng" });
    expect(demRangBuocCoSo(cs.id)).toEqual({
      soLead: 0,
      soNhanVien: 0,
      soChuongTrinh: 0,
      soVan: 0,
    });
  });

  it("đếm đúng từng loại ràng buộc", () => {
    const cs = taoCoSo({ ten: "Cơ sở Bận" });
    themNhanVien({ hoTen: "Sale Một", coSoId: cs.id, vaiTro: "sale" });
    taoChuongTrinh({
      tenTrungTam: "Cơ sở Bận",
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
      coSoId: cs.id,
    });
    const nc = nhanDien("Dương Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs.id, nc.id, null);

    const rb = demRangBuocCoSo(cs.id);
    expect(rb.soNhanVien).toBe(1);
    expect(rb.soChuongTrinh).toBe(1);
    expect(rb.soLead).toBe(1);
  });
});

describe("cơ sở TRẮNG thì xoá hẳn", () => {
  it("xoá xong không còn trong danh sách", () => {
    const cs = taoCoSo({ ten: "Cơ sở Trắng" });
    expect(xoaCoSo(cs.id)).toBe(true);
    expect(timCoSo(cs.id)).toBeNull();
    expect(danhSachCoSo()).toHaveLength(0);
  });

  it("xoá id không tồn tại trả false, không ném", () => {
    expect(xoaCoSo(99999)).toBe(false);
  });
});

describe("🔴 CƠ SỞ CÒN DẤU VẾT: ẨN, và KHÔNG được mất một dòng dữ liệu nào", () => {
  it("khách tiềm năng và nhân viên còn nguyên sau khi ẩn", () => {
    const cs = taoCoSo({ ten: "Cơ sở Hải Châu" });
    themNhanVien({ hoTen: "Sale Một", coSoId: cs.id, vaiTro: "sale" });
    const nc = nhanDien("Dương Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs.id, nc.id, null);

    expect(danhSachLead(TOAN_BO)).toHaveLength(1);
    expect(danhSachNhanVien()).toHaveLength(1);

    expect(anCoSo(cs.id)).toBe(true);

    // Đây là câu quan trọng nhất của cả bài test.
    expect(danhSachLead(TOAN_BO)).toHaveLength(1);
    expect(danhSachNhanVien()).toHaveLength(1);
    expect(timCoSo(cs.id)?.trangThai).toBe("da_an");
  });

  it("biến khỏi danh sách mặc định, hiện lại khi xin xem cả mục đã ẩn", () => {
    const giu = taoCoSo({ ten: "Cơ sở Giữ" });
    const an = taoCoSo({ ten: "Cơ sở Ẩn" });
    anCoSo(an.id);

    expect(danhSachCoSo().map((c) => c.id)).toEqual([giu.id]);
    expect(danhSachCoSo(true).map((c) => c.id).sort()).toEqual([giu.id, an.id].sort());
  });

  it("🔴 cơ sở đã ẩn KHÔNG hiện ra ở ô chọn — không ai tạo chương trình mới ở đó nữa", () => {
    const cs = taoCoSo({ ten: "Cơ sở Ẩn" });
    anCoSo(cs.id);
    expect(coSoDangBat().map((c) => c.id)).not.toContain(cs.id);
  });

  it("ẩn rồi bật lại được — ẩn là dọn giao diện, không phải xoá", () => {
    const cs = taoCoSo({ ten: "Cơ sở Quay Lại" });
    anCoSo(cs.id);
    expect(timCoSo(cs.id)?.trangThai).toBe("da_an");
    expect(danhSachCoSo(true)).toHaveLength(1);
  });
});
