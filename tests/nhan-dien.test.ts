import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { kiemGioiHan } from "@/lib/luot/gioi-han";
import { batDauLuot, dungLuot } from "@/lib/luot/luot-service";
import { danhDauQuanTamHocThu, nhanDien, tenRutGon } from "@/lib/nguoi-choi/nhan-dien";
import { cheSdt, chuanHoaSdt } from "@/lib/nguoi-choi/so-dien-thoai";
import { coSoThu } from "./ho-tro/co-so-thu";
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
    // ĐỔI Ở GĐ 15.3 (có chủ đích): che 2 số đầu thay vì 4. Đầu số di động
    // dài 3 chữ số nên giữ 4 là để lộ trọn nhà mạng — xem chú thích trong
    // `so-dien-thoai.ts`.
    expect(cheSdt("0912345678")).toBe("09*****678");
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

  it("CHẶN VÁN thứ hai cùng số điện thoại trong ngày", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      coSoId: coSoThu("Cơ sở 1"),
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
    expect(lan2.lyDo).toContain("một ván mỗi ngày");
  });

  it("qua NGÀY MỚI thì chơi lại được", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      coSoId: coSoThu("Cơ sở 1"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
    });
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    taoVaChoiXong(ct.ma, n.id);
    // Dời ngày của VÁN: từ GĐ 12.1 giới hạn đếm `van_choi`, dời mỗi `luot_choi`
    // thì ván hôm nay vẫn còn đó và người chơi vẫn bị chặn.
    chay("update van_choi set ngay = '2020-01-01' where chuong_trinh_id = ?", ct.id);
    chay("update luot_choi set ngay = '2020-01-01' where chuong_trinh_id = ?", ct.id);
    expect(kiemGioiHan(ct.id, n.id, 0).choPhep).toBe(true);
  });

  it("mỗi chương trình đếm riêng — chơi ở cơ sở này không chặn cơ sở kia", () => {
    const a = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      coSoId: coSoThu("Cơ sở 1"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
    });
    const b = taoChuongTrinh({
      tenTrungTam: "Cơ sở 2",
      coSoId: coSoThu("Cơ sở 2"),
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
      coSoId: coSoThu("Cơ sở 1"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 1,
    });
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    const luot = batDauLuot(ct.ma, n.id)!;
    // Ép VÁN này thành TRÚNG để chạm trần — trần giải đếm `van_choi.trung`,
    // vì ba lần bấm trúng hai lần vẫn chỉ tốn MỘT phần quà.
    chay("update luot_choi set ket_thuc_luc = ?, trung = 1 where id = ?", Date.now(), luot.luotId);
    chay("update van_choi set ket_thuc_luc = ?, trung = 1 where id = ?", Date.now(), luot.vanId);

    const nguoiSau = nhanDien("Lan", "0987654321", true).nguoiChoi!;
    const van = kiemGioiHan(ct.id, nguoiSau.id, ct.tranGiaiMoiNgay);
    expect(van.choPhep).toBe(true);
    expect(van.chiVui).toBe(true);
  });

  it("trần bằng 0 nghĩa là không giới hạn", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở 1",
      coSoId: coSoThu("Cơ sở 1"),
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

describe("🔴 R4 — số 11 chữ số kiểu cũ và số 10 chữ số kiểu mới là CÙNG một người", () => {
  /**
   * Nguồn "khách ảo" thật duy nhất còn lại sau khi ba game dùng chung một hồ sơ.
   * Đo trên dữ liệu quầy 02/09/2026: 14 khách, 14 số phân biệt, 0 trùng do game —
   * nhưng `chuanHoaSdt` khi đó nhận cả hai dạng nên cửa vẫn để ngỏ.
   */
  it("hai dạng của cùng một thuê bao quy về CÙNG một khoá", () => {
    expect(chuanHoaSdt("01629123456")).toBe(chuanHoaSdt("0329123456"));
    expect(chuanHoaSdt("01209123456")).toBe(chuanHoaSdt("0709123456"));
    expect(chuanHoaSdt("+84162 912 3456")).toBe(chuanHoaSdt("0329123456"));
  });

  it("🔴 chơi hai lần bằng hai dạng chỉ tạo MỘT hồ sơ", () => {
    const a = nhanDien("Nguyễn Thị Hoa", "01629123456", true).nguoiChoi!;
    const b = nhanDien("Nguyễn Thị Hoa", "0329123456", false).nguoiChoi!;
    expect(b.id).toBe(a.id);
    expect(
      layMot<{ so: number }>("select count(*) as so from nguoi_choi")!.so,
    ).toBe(1);
  });

  it("đầu số 11 số KHÔNG trong bảng vẫn là người KHÁC — không gộp bừa", () => {
    const a = nhanDien("Người A", "01779123456", false).nguoiChoi!;
    const b = nhanDien("Người B", "0779123456", false).nguoiChoi!;
    expect(b.id).not.toBe(a.id);
  });
});

describe("🔴 SỔ THAY ĐỔI HỒ SƠ — tên cũ không được biến mất không dấu vết", () => {
  const soDong = () =>
    layMot<{ n: number }>("select count(*) as n from nguoi_choi_thay_doi")!.n;

  it("đổi tên sinh ĐÚNG MỘT dòng sổ, ghi đúng cũ → mới", () => {
    nhanDien("Hoa", "0912345678", true);
    nhanDien("Nguyễn Thị Hoa", "0912345678", false);
    expect(soDong()).toBe(1);
    const d = layMot<{ truong: string; gia_tri_cu: string; gia_tri_moi: string }>(
      "select truong, gia_tri_cu, gia_tri_moi from nguoi_choi_thay_doi",
    )!;
    expect(d).toEqual({ truong: "ho_ten", gia_tri_cu: "Hoa", gia_tri_moi: "Nguyễn Thị Hoa" });
  });

  it("🔴 đổi CÁCH VIẾT HOA hoặc số khoảng trắng KHÔNG phải một lần đổi tên", () => {
    nhanDien("Nguyễn Thị Hoa", "0912345678", false);
    nhanDien("nguyễn thị hoa", "0912345678", false);
    nhanDien("Nguyễn   Thị  Hoa", "0912345678", false);
    nhanDien("  Nguyễn Thị Hoa  ", "0912345678", false);
    expect(soDong()).toBe(0);
  });

  it("🔴 hai dạng NFC/NFD của cùng một tên KHÔNG sinh dòng nào", () => {
    // Trên macOS, chuỗi gõ bàn phím và chuỗi chép từ nơi khác có thể là hai dãy mã
    // khác nhau của CÙNG một chữ. Không chuẩn hoá thì sổ đẻ rác mỗi lần chơi lại.
    const nfc = "Nguyễn Thị Hoa".normalize("NFC");
    const nfd = "Nguyễn Thị Hoa".normalize("NFD");
    expect(nfc).not.toBe(nfd); // hai dãy mã thật sự khác nhau
    nhanDien(nfc, "0912345678", false);
    nhanDien(nfd, "0912345678", false);
    expect(soDong()).toBe(0);
  });

  it("khách MỚI hoàn toàn thì không ghi sổ — chưa có gì để mà đổi", () => {
    nhanDien("Nguyễn Thị Hoa", "0912345678", false);
    expect(soDong()).toBe(0);
  });

  it("sổ ghi NGUỒN: khách đổi tên khi chơi game nào", () => {
    const ct = taoChuongTrinh({
      tenTrungTam: "Cơ sở thử",
      coSoId: coSoThu(),
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: "Quà",
      tranGiaiMoiNgay: 0,
      troChoi: "vong_quay",
    });
    nhanDien("Hoa", "0912345678", false);
    nhanDien("Nguyễn Thị Hoa", "0912345678", false, ct.id);
    expect(
      layMot<{ chuong_trinh_id: number }>(
        "select chuong_trinh_id from nguoi_choi_thay_doi",
      )!.chuong_trinh_id,
    ).toBe(ct.id);
  });

  it("đổi tên NHIỀU LẦN thì sổ giữ đủ từng lần, mới nhất sau cùng", () => {
    nhanDien("Hoa", "0912345678", false);
    nhanDien("Thị Hoa", "0912345678", false);
    nhanDien("Nguyễn Thị Hoa", "0912345678", false);
    const ds = layNhieu<{ gia_tri_moi: string }>(
      "select gia_tri_moi from nguoi_choi_thay_doi order by id",
    );
    expect(ds.map((d) => d.gia_tri_moi)).toEqual(["Thị Hoa", "Nguyễn Thị Hoa"]);
  });
});
