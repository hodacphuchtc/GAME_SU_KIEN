import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  anChuongTrinh,
  danhSachChuongTrinh,
  demRangBuoc,
  taoChuongTrinh,
  timTheoMaCongKhai,
  xoaChuongTrinh,
} from "@/lib/chuong-trinh/kho";
import { taoCoSo } from "@/lib/co-so/kho";
import { danhSachLead, sinhLead } from "@/lib/lead/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { themQua, danhSachQua } from "@/lib/qua/kho-qua";
import { layMot } from "@/lib/db/truy-van";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * XOÁ / ẨN CHƯƠNG TRÌNH (GĐ 23.1).
 *
 * 🔴 Ca quan trọng nhất của cả bài: **xoá chương trình KHÔNG được đụng tới khách
 * tiềm năng**. Lược đồ đã bảo vệ sẵn (`khach_tiem_nang.chuong_trinh_id_dau` là
 * `ON DELETE SET NULL`), nhưng "đã bảo vệ sẵn" là thứ chỉ đúng cho tới ngày ai
 * đó sửa lược đồ — nên phải có một bài kiểm nói thẳng điều đó ra.
 */

const TOAN_BO = { coSoId: null, nhanVienId: null };

let don: () => void;
let coSo: number;

function ctThu(ten = "Chương trình thử") {
  return taoChuongTrinh({
    tenTrungTam: ten,
    soTrung: 211,
    mucDo: "vua",
    tenGiaiThuong: "Voucher",
    tranGiaiMoiNgay: 0,
    coSoId: coSo,
  });
}

beforeEach(() => {
  don = dungCsdlTam();
  coSo = taoCoSo({ ten: "Cơ sở Hải Châu" }).id;
});

afterEach(() => don());

describe("đếm ràng buộc trước khi xoá", () => {
  it("chương trình mới toanh: không có gì cả", () => {
    const ct = ctThu();
    expect(demRangBuoc(ct.id)).toEqual({ soVan: 0, soGiaiDaTrao: 0 });
  });
});

describe("chương trình SẠCH thì xoá hẳn", () => {
  it("xoá xong không còn tìm thấy", () => {
    const ct = ctThu();
    expect(xoaChuongTrinh(ct.id)).toBe(true);
    expect(timTheoMaCongKhai(ct.ma)).toBeNull();
    expect(danhSachChuongTrinh(TOAN_BO)).toHaveLength(0);
  });

  it("kho quà của nó bị dọn theo — không để lại dòng mồ côi", () => {
    const ct = ctThu();
    themQua(ct.id, { ten: "Balo STEM", thuTu: 1, soLuong: 5, tranMoiNgay: 0, giaTri: null });
    expect(danhSachQua(ct.id)).toHaveLength(1);

    xoaChuongTrinh(ct.id);
    expect(danhSachQua(ct.id)).toHaveLength(0);
  });

  it("xoá id không tồn tại trả false, không ném", () => {
    expect(xoaChuongTrinh(99999)).toBe(false);
  });
});

describe("ẨN thì giữ trọn dữ liệu", () => {
  it("biến khỏi danh sách mặc định, nhưng hiện lại khi xin xem cả mục đã ẩn", () => {
    const giu = ctThu("Giữ lại");
    const an = ctThu("Đem ẩn");

    expect(anChuongTrinh(an.id)).toBe(true);

    const macDinh = danhSachChuongTrinh(TOAN_BO).map((c) => c.ma);
    expect(macDinh).toEqual([giu.ma]);

    const caAn = danhSachChuongTrinh(TOAN_BO, true).map((c) => c.ma).sort();
    expect(caAn).toEqual([giu.ma, an.ma].sort());
  });

  it("vẫn mở được bằng mã — sổ đối soát phải tra được sau khi dọn giao diện", () => {
    const ct = ctThu();
    anChuongTrinh(ct.id);
    expect(timTheoMaCongKhai(ct.ma)?.trangThai).toBe("da_an");
  });

  it("🔴 ẩn cũng là NGỪNG CHẠY — mã QR đã dán không được chơi tiếp", () => {
    // Ẩn khỏi giao diện mà vẫn nhận lượt chơi là tệ nhất: nhân viên tưởng đã
    // dọn xong, phụ huynh vẫn quét được và vẫn trúng quà không ai theo dõi.
    const ct = ctThu();
    anChuongTrinh(ct.id);
    expect(timTheoMaCongKhai(ct.ma)?.trangThai).not.toBe("dang_chay");
  });
});

describe("🔴 KHÁCH TIỀM NĂNG KHÔNG BAO GIỜ MẤT THEO CHƯƠNG TRÌNH", () => {
  it("xoá hẳn chương trình: lead còn nguyên, chỉ mất đường trỏ về chương trình", () => {
    const ct = ctThu();
    const nc = nhanDien("Dương Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(coSo, nc.id, ct.id);

    const truoc = danhSachLead(TOAN_BO);
    expect(truoc).toHaveLength(1);
    expect(truoc[0].nguoiChoiId).toBe(nc.id);

    expect(xoaChuongTrinh(ct.id)).toBe(true);

    const sau = danhSachLead(TOAN_BO);
    expect(sau).toHaveLength(1);
    expect(sau[0].nguoiChoiId).toBe(nc.id);
    expect(sau[0].hoTen).toBe("Dương Thị Hoa");
  });

  it("hồ sơ phụ huynh cũng còn — họ là người, không phải phụ kiện của chương trình", () => {
    const ct = ctThu();
    nhanDien("Trần Văn Bình", "0987654321", true);
    xoaChuongTrinh(ct.id);
    expect(layMot("select 1 from nguoi_choi where so_dien_thoai = ?", "0987654321")).toBeTruthy();
  });
});
