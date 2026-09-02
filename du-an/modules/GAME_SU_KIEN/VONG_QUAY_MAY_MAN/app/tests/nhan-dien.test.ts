import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import { conLuotHomNay, nhanDien, soLuotTrongNgay } from "@/lib/nguoi-choi/nhan-dien";
import { cheSdt, chuanHoaSdt, tenRutGon } from "@/lib/nguoi-choi/so-dien-thoai";
import { ngayVN } from "@/lib/thoi-gian";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

/** Dựng một chương trình trống, trả id. */
function taoChuongTrinh(ma = "VQ1"): number {
  const gio = Date.now();
  const kq = csdl()
    .prepare("INSERT INTO chuong_trinh (ma, ten_co_so, tao_luc, sua_luc) VALUES (?, ?, ?, ?)")
    .run(ma, "Cơ sở thử", gio, gio);
  return Number(kq.lastInsertRowid);
}

/** Ghi một lượt quay của người này trong ngày chỉ định. */
function ghiLuot(ctId: number, nguoiId: number, ngay = ngayVN()): void {
  csdl()
    .prepare(
      `INSERT INTO luot_quay (chuong_trinh_id, nguoi_choi_id, ngay, hat_giong,
                              goc_dung, phien_ban_o, bat_dau_luc)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(ctId, nguoiId, ngay, "hat-thu", 12.5, 1, Date.now());
}

describe("chuẩn hoá số điện thoại", () => {
  it("0912345678 và +84912345678 là MỘT người", () => {
    expect(chuanHoaSdt("0912345678")).toBe("0912345678");
    expect(chuanHoaSdt("+84912345678")).toBe("0912345678");
    expect(chuanHoaSdt("+84 912 345 678")).toBe("0912345678");
    expect(chuanHoaSdt("84912345678")).toBe("0912345678");
    expect(chuanHoaSdt("0912.345.678")).toBe("0912345678");
    expect(chuanHoaSdt("912345678")).toBe("0912345678");
  });

  it("từ chối số không hợp lệ", () => {
    for (const xau of ["", "abc", "12345", "091234567890123", "0"]) {
      expect(chuanHoaSdt(xau)).toBeNull();
    }
  });

  it("che số giữ 2 đầu + 3 cuối", () => {
    expect(cheSdt("0912345678")).toBe("09*****678");
    // 🔴 KHÔNG lộ trọn đầu số: "091" phải bị che một phần.
    expect(cheSdt("0912345678")).not.toContain("091");
  });

  it("tên rút gọn không lộ họ tên đầy đủ", () => {
    expect(tenRutGon("Nguyễn Thị Hoa")).toBe("Nguyễn H.");
    expect(tenRutGon("Hoa")).toBe("Hoa");
  });
});

describe("nhận diện người chơi", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("số mới thì tạo hồ sơ mới", () => {
    const kq = nhanDien("Nguyễn Thị Hoa", "0912345678", false);
    expect(kq.loi).toBeUndefined();
    expect(kq.nguoiChoi?.soDienThoai).toBe("0912345678");
    expect(kq.nguoiChoi?.hoTen).toBe("Nguyễn Thị Hoa");
  });

  it("cùng một số ở hai định dạng KHÔNG đẻ hai hồ sơ", () => {
    const a = nhanDien("Nguyễn Thị Hoa", "0912345678", false);
    const b = nhanDien("Nguyễn Thị Hoa", "+84912345678", false);
    expect(b.nguoiChoi?.id).toBe(a.nguoiChoi?.id);

    const dem = csdl().prepare("SELECT COUNT(*) AS n FROM nguoi_choi").get() as { n: number };
    expect(dem.n).toBe(1);
  });

  it("gặp lại thì cập nhật tên mới, và cờ đồng ý chỉ BẬT thêm chứ không tự tắt", () => {
    const a = nhanDien("Tên Cũ", "0912345678", true);
    expect(a.nguoiChoi?.dongYTuVan).toBe(true);

    const b = nhanDien("Tên Mới", "0912345678", false);
    expect(b.nguoiChoi?.hoTen).toBe("Tên Mới");
    // Đã đồng ý một lần thì lần sau bỏ tích không được tự ý rút lại hộ họ.
    expect(b.nguoiChoi?.dongYTuVan).toBe(true);
  });

  it("từ chối họ tên rỗng và số điện thoại sai", () => {
    expect(nhanDien("", "0912345678", false).loi).toBeTruthy();
    expect(nhanDien("A", "0912345678", false).loi).toBeTruthy();
    expect(nhanDien("Nguyễn Thị Hoa", "abc", false).loi).toBeTruthy();
  });

  it("gom khoảng trắng thừa trong họ tên", () => {
    const kq = nhanDien("  Nguyễn   Thị    Hoa  ", "0912345678", false);
    expect(kq.nguoiChoi?.hoTen).toBe("Nguyễn Thị Hoa");
  });
});

describe("một lượt mỗi người mỗi ngày", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("chưa quay thì còn lượt; quay rồi thì hết", () => {
    const ct = taoChuongTrinh();
    const nguoi = nhanDien("Nguyễn Thị Hoa", "0912345678", false).nguoiChoi!;

    expect(conLuotHomNay(ct, nguoi.id)).toBe(true);
    ghiLuot(ct, nguoi.id);
    expect(conLuotHomNay(ct, nguoi.id)).toBe(false);
    expect(soLuotTrongNgay(ct, nguoi.id)).toBe(1);
  });

  it("sang NGÀY MỚI thì mở lại", () => {
    const ct = taoChuongTrinh();
    const nguoi = nhanDien("Nguyễn Thị Hoa", "0912345678", false).nguoiChoi!;
    ghiLuot(ct, nguoi.id, "2026-09-01");

    expect(conLuotHomNay(ct, nguoi.id, "2026-09-01")).toBe(false);
    expect(conLuotHomNay(ct, nguoi.id, "2026-09-02")).toBe(true);
  });

  it("hết lượt ở cơ sở này KHÔNG chặn cơ sở khác", () => {
    // Một phụ huynh đưa con tới hai cơ sở thì có quyền chơi ở cả hai. Đếm gộp
    // toàn hệ thống là phạt oan đúng người đi lại nhiều nhất.
    const ctA = taoChuongTrinh("VQA");
    const ctB = taoChuongTrinh("VQB");
    const nguoi = nhanDien("Nguyễn Thị Hoa", "0912345678", false).nguoiChoi!;

    ghiLuot(ctA, nguoi.id);
    expect(conLuotHomNay(ctA, nguoi.id)).toBe(false);
    expect(conLuotHomNay(ctB, nguoi.id)).toBe(true);
  });

  it("người KHÁC không bị lượt của người này chặn", () => {
    const ct = taoChuongTrinh();
    const a = nhanDien("Người A", "0912345678", false).nguoiChoi!;
    const b = nhanDien("Người B", "0987654321", false).nguoiChoi!;

    ghiLuot(ct, a.id);
    expect(conLuotHomNay(ct, a.id)).toBe(false);
    expect(conLuotHomNay(ct, b.id)).toBe(true);
  });

  it("người chưa từng quay: đếm trả 0, KHÔNG phải undefined", () => {
    // 🔴 Cạm bẫy đã trả giá: `.get()` trả `undefined` khi không có dòng. Hàm
    // đếm phải quy về 0, nếu không mọi phép so sánh sau đó đều sai lặng lẽ.
    const ct = taoChuongTrinh();
    expect(soLuotTrongNgay(ct, 999)).toBe(0);
    expect(conLuotHomNay(ct, 999)).toBe(true);
  });
});
