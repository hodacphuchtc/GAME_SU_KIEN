import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { chay, layNhieu } from "@/lib/db/truy-van";
import { kiemGioiHan } from "@/lib/luot/gioi-han";
import { batDauLuot, dungLuot } from "@/lib/luot/luot-service";
import { danhDauQuanTamHocThu, nhanDien, tenRutGon } from "@/lib/nguoi-choi/nhan-dien";
import { cheSdt, chuanHoaSdt } from "@/lib/nguoi-choi/so-dien-thoai";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

let don: () => void;

beforeEach(() => {
  don = dungCsdlTam();
});
afterEach(() => don());

describe("chuẩn hoá số điện thoại", () => {
  it("+84 và 0 cho ra cùng một số", () => {
    expect(chuanHoaSdt("+84912345678")).toBe("0912345678");
    expect(chuanHoaSdt("84912345678")).toBe("0912345678");
    expect(chuanHoaSdt("0912345678")).toBe("0912345678");
    expect(chuanHoaSdt("912345678")).toBe("0912345678");
  });

  it("bỏ khoảng trắng, dấu chấm, dấu gạch — phụ huynh gõ kiểu nào cũng nhận", () => {
    expect(chuanHoaSdt("0912.345.678")).toBe("0912345678");
    expect(chuanHoaSdt(" 0912 345 678 ")).toBe("0912345678");
    expect(chuanHoaSdt("0912-345-678")).toBe("0912345678");
  });

  it("từ chối số không hợp lệ", () => {
    expect(chuanHoaSdt("123")).toBeNull();
    expect(chuanHoaSdt("abc")).toBeNull();
    expect(chuanHoaSdt("")).toBeNull();
    expect(chuanHoaSdt("091234567890123")).toBeNull();
  });

  it("che giữa số khi hiện công khai", () => {
    expect(cheSdt("0912345678")).toBe("0912***678");
  });
});

describe("nhận diện phụ huynh", () => {
  it("KHÔNG tạo hồ sơ trùng — cùng số điện thoại là cùng một người", () => {
    const a = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    const b = nhanDien("Nguyễn Thị Hoa", "+84 912 345 678", false).nguoiChoi!;
    expect(b.id).toBe(a.id);
    expect(layNhieu("select id from nguoi_choi")).toHaveLength(1);
  });

  it("cập nhật tên mới nhưng KHÔNG tự tắt cờ đã đồng ý", () => {
    nhanDien("Hoa", "0912345678", true);
    const sau = nhanDien("Nguyễn Thị Hoa", "0912345678", false).nguoiChoi!;
    expect(sau.hoTen).toBe("Nguyễn Thị Hoa");
    expect(sau.dongYTuVan).toBe(true);
  });

  it("không tick đồng ý thì cờ vẫn tắt", () => {
    expect(nhanDien("Hoa", "0912345678", false).nguoiChoi!.dongYTuVan).toBe(false);
  });

  it("từ chối tên quá ngắn và số sai", () => {
    expect(nhanDien("H", "0912345678", true).loi).toBeTruthy();
    expect(nhanDien("Nguyễn Thị Hoa", "123", true).loi).toBeTruthy();
  });

  it("đánh dấu quan tâm học thử không đẻ hồ sơ mới", () => {
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    expect(danhDauQuanTamHocThu(n.id)).toBe(true);
    expect(layNhieu("select id from nguoi_choi")).toHaveLength(1);
  });

  it("tên rút gọn để hiện trên bảng công khai", () => {
    expect(tenRutGon("Nguyễn Thị Hoa")).toBe("Nguyễn H.");
    expect(tenRutGon("Hoa")).toBe("Hoa");
  });
});

describe("giới hạn lượt và trần giải", () => {
  function taoVaChoiXong(maCt: string, nguoiChoiId: number) {
    const luot = batDauLuot(maCt, nguoiChoiId)!;
    dungLuot(luot.luotId, 100, "dien_thoai");
    return luot;
  }

  it("CHẶN lượt thứ hai cùng số điện thoại trong ngày", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
    });
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;

    expect(kiemGioiHan(ct.id, n.id, 0).choPhep).toBe(true);
    taoVaChoiXong(ct.ma, n.id);
    const lan2 = kiemGioiHan(ct.id, n.id, 0);
    expect(lan2.choPhep).toBe(false);
    expect(lan2.lyDo).toContain("một lượt mỗi ngày");
  });

  it("qua NGÀY MỚI thì chơi lại được", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
    });
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    taoVaChoiXong(ct.ma, n.id);
    chay("update luot_choi set ngay = '2020-01-01' where chuong_trinh_id = ?", ct.id);
    expect(kiemGioiHan(ct.id, n.id, 0).choPhep).toBe(true);
  });

  it("mỗi chương trình đếm riêng — chơi ở cơ sở này không chặn cơ sở kia", () => {
    const a = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
    });
    const b = taoChuongTrinh({
      tenTrungTam: "Cơ sở 2",
      soTrung: 700,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
    });
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    taoVaChoiXong(a.ma, n.id);
    expect(kiemGioiHan(a.id, n.id, 0).choPhep).toBe(false);
    expect(kiemGioiHan(b.id, n.id, 0).choPhep).toBe(true);
  });

  it("CHẠM TRẦN GIẢI thì chuyển sang chế độ chỉ vui — vẫn chơi, vẫn ghi lịch sử", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 1,
    });
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    const luot = batDauLuot(ct.ma, n.id)!;
    // Ép lượt này thành TRÚNG để chạm trần.
    chay("update luot_choi set ket_thuc_luc = ?, trung = 1 where id = ?", Date.now(), luot.luotId);

    const nguoiSau = nhanDien("Lan", "0987654321", true).nguoiChoi!;
    const van = kiemGioiHan(ct.id, nguoiSau.id, ct.tranGiaiMoiNgay);
    expect(van.choPhep).toBe(true);
    expect(van.chiVui).toBe(true);
  });

  it("trần bằng 0 nghĩa là không giới hạn", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
    });
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    const luot = batDauLuot(ct.ma, n.id)!;
    chay("update luot_choi set ket_thuc_luc = ?, trung = 1 where id = ?", Date.now(), luot.luotId);
    expect(kiemGioiHan(ct.id, null, 0).chiVui).toBe(false);
  });
});
