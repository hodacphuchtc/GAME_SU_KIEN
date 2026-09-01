import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HAN_LUU_LEAD_THANG } from "@/config/to-chuc";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { taoCoSo } from "@/lib/co-so/kho";
import { csdl } from "@/lib/db/ket-noi";
import { layMot } from "@/lib/db/truy-van";
import { danhSachLead, sinhLead } from "@/lib/lead/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { cheSdt } from "@/lib/nguoi-choi/so-dien-thoai";
import {
  demLeadQuaHan,
  docNhatKy,
  ghiNhatKy,
  HANH_DONG,
  xoaTheoSdt,
} from "@/lib/nhat-ky/kho";
import { themNhanVien } from "@/lib/nhan-vien/kho";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * NHẬT KÝ TRUY CẬP + QUYỀN RIÊNG TƯ (GĐ 15.3).
 *
 * Hai thứ khác nhau nhưng cùng một gốc: từ đây hệ thống giữ danh bạ khách hàng
 * thật, nên phải trả lời được "ai đã chạm vào" và "xoá đi khi người ta yêu cầu".
 */

let don: () => void;

beforeEach(() => {
  don = dungCsdlTam();
  csdl();
});
afterEach(() => don());

describe("ghi và đọc nhật ký", () => {
  it("ghi đúng hành động và số dòng khi xuất", () => {
    const nv = themNhanVien({ hoTen: "Sếp", coSoId: null, vaiTro: "quan_tri" });
    ghiNhatKy({
      nhanVienId: nv,
      hanhDong: HANH_DONG.xuatFile,
      doiTuong: "khach-tiem-nang.xlsx",
      soDong: 137,
      diaChiIp: "192.168.1.50",
    });

    const dong = docNhatKy();
    expect(dong).toHaveLength(1);
    expect(dong[0].hanhDong).toBe("xuat_file");
    expect(dong[0].soDong).toBe(137);
    expect(dong[0].diaChiIp).toBe("192.168.1.50");
    expect(dong[0].tenNhanVien).toBe("Sếp");
  });

  it("dòng của hệ thống (không có người) vẫn đọc được, không ném", () => {
    ghiNhatKy({ nhanVienId: null, hanhDong: HANH_DONG.canhBaoKho, doiTuong: "chuong_trinh:1:do" });
    expect(docNhatKy()[0].tenNhanVien).toBeNull();
  });

  it("đọc theo thứ tự MỚI NHẤT TRƯỚC — người đọc nhật ký luôn hỏi 'vừa xảy ra chuyện gì'", () => {
    const nv = themNhanVien({ hoTen: "Sếp", coSoId: null, vaiTro: "quan_tri" });
    ghiNhatKy({ nhanVienId: nv, hanhDong: HANH_DONG.dangNhap, doiTuong: "cu" });
    ghiNhatKy({ nhanVienId: nv, hanhDong: HANH_DONG.xemLead, doiTuong: "moi" });
    expect(docNhatKy().map((d) => d.doiTuong)).toEqual(["moi", "cu"]);
  });
});

describe("che số điện thoại", () => {
  it("cheSdt giữ 2 số đầu và 3 số cuối", () => {
    expect(cheSdt("0912345678")).toBe("09*****678");
    expect(cheSdt("0987654321")).toBe("09*****321");
  });

  it("🔴 KHÔNG để lộ trọn đầu số nhà mạng (3 chữ số)", () => {
    // Nếu ai đó lỡ đổi lại thành giữ 4 số đầu thì dòng này gãy.
    expect(cheSdt("0912345678").startsWith("091")).toBe(false);
  });

  it("số quá ngắn thì trả nguyên, không cắt bừa thành chuỗi vô nghĩa", () => {
    expect(cheSdt("091")).toBe("091");
  });
});

describe("xoá theo số điện thoại", () => {
  function dungKhach(sdt: string) {
    const cs = taoCoSo({ ten: `Cơ sở của ${sdt}` }).id;
    const nc = nhanDien("Phụ huynh A", sdt, true).nguoiChoi!;
    sinhLead(cs, nc.id, null);
    return { cs, nguoiChoiId: nc.id };
  }

  it("xoá theo SĐT xoá sạch ở cả nguoi_choi lẫn khach_tiem_nang", () => {
    dungKhach("0912345678");
    dungKhach("0987654321");

    const kq = xoaTheoSdt("0912345678");
    expect(kq).toEqual({ nguoiChoi: 1, khachTiemNang: 1 });

    expect(
      layMot<{ so: number }>(
        "select count(*) as so from nguoi_choi where so_dien_thoai = ?",
        "0912345678",
      )!.so,
    ).toBe(0);
    expect(danhSachLead({ coSoId: null, nhanVienId: null })).toHaveLength(1);
    // Người kia KHÔNG bị đụng tới.
    expect(danhSachLead({ coSoId: null, nhanVienId: null })[0].soDienThoai).toBe("0987654321");
  });

  it("🔴 lịch sử ván chơi được GIỮ nhưng thành ẩn danh — đó là sổ đối soát giải thưởng", () => {
    const { cs, nguoiChoiId } = dungKhach("0912345678");
    const ct = taoChuongTrinh({
      tenTrungTam: "Trung tâm thử",
      coSoId: cs,
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Balo STEM",
      tranGiaiMoiNgay: 0,
    });
    const luc = Date.now();
    csdl()
      .prepare(
        `insert into van_choi (chuong_trinh_id, nguoi_choi_id, co_so_id, ngay, so_lan_cho_phep,
           so_lan_da_dung, trung, ma_xac_thuc, bat_dau_luc, ket_thuc_luc, tao_luc, sua_luc)
         values (?, ?, ?, '2026-09-01', 1, 1, 1, 'K7M2', ?, ?, ?, ?)`,
      )
      .run(ct.id, nguoiChoiId, cs, luc, luc, luc, luc);

    xoaTheoSdt("0912345678");

    const van = layMot<{ so: number; nguoi_choi_id: number | null; ma_xac_thuc: string }>(
      "select count(*) as so, nguoi_choi_id, ma_xac_thuc from van_choi",
    )!;
    expect(van.so).toBe(1);
    expect(van.nguoi_choi_id).toBeNull();
    expect(van.ma_xac_thuc).toBe("K7M2");
  });

  it("số không tồn tại thì trả 0/0, không ném", () => {
    expect(xoaTheoSdt("0900000000")).toEqual({ nguoiChoi: 0, khachTiemNang: 0 });
  });
});

describe("hạn lưu trữ", () => {
  it("đếm đúng số khách quá hạn, và KHÔNG tự xoá", () => {
    const cs = taoCoSo({ ten: "Cơ sở A" }).id;
    const nc = nhanDien("Phụ huynh cũ", "0912345678", true).nguoiChoi!;
    sinhLead(cs, nc.id, null);
    expect(demLeadQuaHan(HAN_LUU_LEAD_THANG)).toBe(0);

    // Đẩy ngày tạo lùi lại quá hạn.
    const qua = Date.now() - (HAN_LUU_LEAD_THANG + 1) * 30 * 24 * 3600 * 1000;
    csdl().prepare("update khach_tiem_nang set tao_luc = ?").run(qua);

    expect(demLeadQuaHan(HAN_LUU_LEAD_THANG)).toBe(1);
    // Vẫn còn nguyên: xoá dữ liệu người dùng phải do NGƯỜI bấm, không phải do
    // một tác vụ nền âm thầm dọn lúc 3 giờ sáng.
    expect(danhSachLead({ coSoId: null, nhanVienId: null })).toHaveLength(1);
  });
});
