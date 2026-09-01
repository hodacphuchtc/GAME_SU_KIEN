import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { danhSachLead, ganLead, sinhLead } from "@/lib/lead/kho";
import { lichSu } from "@/lib/luot/kho-luot";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { themNhanVien } from "@/lib/nhan-vien/kho";
import { danhSachQua, themQua } from "@/lib/qua/kho-qua";
import { bangKhoQua } from "@/lib/xuat/bang-kho-qua";
import { bangLead } from "@/lib/xuat/bang-lead";
import { bangLichSu } from "@/lib/xuat/bang-lich-su";
import { bangSoDaChon } from "@/lib/xuat/bang-so-da-chon";
import { T } from "@/config/locale";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";
import { ghiVanDaChot } from "./ho-tro/van-thu";

/**
 * BA BẢNG XUẤT (GĐ 19.2).
 *
 * 🔴 Điều được canh gắt nhất: SỐ ĐIỆN THOẠI phải ra kiểu `chu`, không phải `so`.
 * Excel đọc số sẽ ăn mất số 0 đầu, `0912345678` thành `912345678`, và đội sale
 * nhận file về không gọi được cho ai — đúng lỗi mà CSV đang gây ra.
 */

const MOI_NGUOI = { coSoId: null, nhanVienId: null };

let don: () => void;
let cs: number;
let ctId: number;

beforeEach(() => {
  don = dungCsdlTam();
  cs = coSoThu("Cơ sở Hải Châu");
  ctId = taoChuongTrinh({
    tenTrungTam: "Cơ sở Hải Châu",
    coSoId: cs,
    soTrung: 211,
    mucDo: "vua",
    tenGiaiThuong: "Balo STEM",
    tranGiaiMoiNgay: 0,
  }).id;
});
afterEach(() => don());

describe("bảng khách tiềm năng", () => {
  function themKhach(sdt: string, dongY = true) {
    const nc = nhanDien(`Phụ huynh ${sdt}`, sdt, dongY).nguoiChoi!;
    sinhLead(cs, nc.id, ctId);
    return nc.id;
  }

  it("đúng số cột và thứ tự", () => {
    themKhach("0912345678");
    const t = bangLead("Khách", danhSachLead(MOI_NGUOI));
    expect(t.tieuDe[0]).toBe("Họ và tên");
    expect(t.tieuDe[1]).toBe("Số điện thoại");
    expect(t.dong[0]).toHaveLength(t.tieuDe.length);
  });

  it("🔴 SĐT ra kiểu chu chứ không phải so", () => {
    themKhach("0912345678");
    const o = bangLead("Khách", danhSachLead(MOI_NGUOI)).dong[0][1];
    expect(o.kieu).toBe("chu");
    expect(o.gt).toBe("0912345678");
  });

  it("ô rỗng ra kiểu trong", () => {
    themKhach("0912345678");
    const dong = bangLead("Khách", danhSachLead(MOI_NGUOI)).dong[0];
    // Chưa giao cho ai và chưa ghi chú gì.
    expect(dong[3].kieu).toBe("trong");
    expect(dong[7].kieu).toBe("trong");
  });

  it("🔴 cột “Đồng ý nhận tư vấn” luôn có mặt — người cầm file phải biết được gọi cho ai", () => {
    themKhach("0912345678");
    const t = bangLead("Khách", danhSachLead(MOI_NGUOI));
    const vt = t.tieuDe.indexOf("Đồng ý tư vấn");
    expect(vt).toBeGreaterThanOrEqual(0);
    expect(t.dong[0][vt].gt).toBe("Có");
  });

  it("🔴 bộ lọc truyền vào ảnh hưởng đúng số dòng xuất", () => {
    themKhach("0900000001", true);
    themKhach("0900000002", false);
    const sale = themNhanVien({ hoTen: "Sale A", coSoId: cs, vaiTro: "sale" });
    ganLead(danhSachLead(MOI_NGUOI, { chiDongY: false })[0].id, sale, MOI_NGUOI);

    expect(bangLead("K", danhSachLead(MOI_NGUOI)).dong).toHaveLength(1);
    expect(bangLead("K", danhSachLead(MOI_NGUOI, { chiDongY: false })).dong).toHaveLength(2);
    expect(
      bangLead("K", danhSachLead(MOI_NGUOI, { chiDongY: false, chuaGiao: true })).dong,
    ).toHaveLength(1);
  });

  it("0 dòng vẫn ra trang tính hợp lệ", () => {
    const t = bangLead("Khách", []);
    expect(t.dong).toHaveLength(0);
    expect(t.tieuDe.length).toBeGreaterThan(0);
  });
});

describe("bảng lịch sử ván", () => {
  it("đúng số cột, giờ ra kiểu gio, số lệch ra kiểu so", () => {
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    ghiVanDaChot({ chuongTrinhId: ctId, nguoiChoiId: nc.id, ngay: "2026-09-01", khoangLech: 42 });

    const t = bangLichSu("Lịch sử", lichSu(ctId));
    expect(t.dong[0]).toHaveLength(t.tieuDe.length);
    expect(t.dong[0][0].kieu).toBe("gio");
    expect(t.dong[0][2]).toEqual({ kieu: "chu", gt: "0912345678" });
    expect(t.dong[0][5]).toEqual({ kieu: "so", gt: 42 });
  });

  it("🔴 số đã dừng giữ đủ 4 chữ số, kể cả khi bắt đầu bằng 0", () => {
    ghiVanDaChot({ chuongTrinhId: ctId, nguoiChoiId: null, ngay: "2026-09-01", soDaDung: 0 });
    // Người chơi dừng đúng ở 0000. Ra kiểu `so` thì Excel hiện "0" và biên lai
    // đối soát mất ba chữ số — nên phải là CHUỖI "0000".
    const o = bangLichSu("L", lichSu(ctId)).dong[0][3];
    expect(o).toEqual({ kieu: "chu", gt: "0000" });
  });

  it("ván ẩn danh ra ô trống ở cột họ tên, không ném", () => {
    ghiVanDaChot({ chuongTrinhId: ctId, nguoiChoiId: null, ngay: "2026-09-01" });
    expect(bangLichSu("L", lichSu(ctId)).dong[0][1].kieu).toBe("trong");
  });
});

describe("bảng kho quà", () => {
  it("tính đúng thành tiền đã trao, và loại không giới hạn ra CHỮ chứ không phải 0", () => {
    themQua(ctId, { ten: "Balo STEM", thuTu: 0, soLuong: 10, tranMoiNgay: 0, giaTri: 150000 });
    themQua(ctId, { ten: "Buổi học thử", thuTu: 1, soLuong: null, tranMoiNgay: 0, giaTri: null });

    const t = bangKhoQua("Kho", danhSachQua(ctId));
    expect(t.dong).toHaveLength(2);
    // Chưa trao cái nào ⇒ thành tiền 0.
    expect(t.dong[0][7]).toEqual({ kieu: "so", gt: 0 });
    // Loại đáy: số lượng và còn lại đều là CHỮ "Không giới hạn". Ghi 0 ở đây
    // đọc lên là "hết hàng" — đúng ngược nghĩa.
    expect(t.dong[1][2]).toEqual({ kieu: "chu", gt: "Không giới hạn" });
    expect(t.dong[1][4]).toEqual({ kieu: "chu", gt: "Không giới hạn" });
  });
});

/**
 * BẢNG XUẤT CỦA GAME CHỌN SỐ (C.9 · v3).
 *
 * 🔴 Vì sao có bảng riêng: `bangLichSu` có cột "Kết quả" và "Lệch". Chương trình
 * Chọn Số không có số trúng, nên bảng kia sẽ ghi "Trượt" trên MỌI dòng rồi gửi
 * file đó cho đội sale — một trò không có giải mà báo cáo nói ai cũng trượt.
 */
describe("bảng xuất Chọn Số", () => {
  function dungChonSoCoVan(soDaDung: number) {
    const ct = taoChuongTrinh({
      tenTrungTam: "Trung tâm Hoa Mai",
      coSoId: coSoThu("Trung tâm Hoa Mai"),
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: "Quà Tết 2026",
      tranGiaiMoiNgay: 0,
      troChoi: "chon_so",
      daiTu: 1,
      daiDen: 100,
      loaiTruDaRa: true,
    });
    nhanDien("Nguyễn Văn A", "0912345678", true);
    ghiVanDaChot({
      chuongTrinhId: ct.id,
      nguoiChoiId: 1,
      ngay: "2026-09-01",
      soDaDung,
    });
    return ct;
  }

  it("🔴 KHÔNG có cột Kết quả / Lệch — trò này không có ai trượt", () => {
    const ct = dungChonSoCoVan(42);
    const bang = bangSoDaChon("Số đã phát", lichSu(ct.id));
    expect(bang.tieuDe).not.toContain(T.colResult);
    expect(bang.tieuDe).not.toContain("Lệch");
    expect(JSON.stringify(bang.dong)).not.toContain(T.resultLose);
  });

  it("🔴 số may mắn ra kiểu CHỮ, giữ nguyên số 0 đầu", () => {
    const ct = dungChonSoCoVan(42);
    const bang = bangSoDaChon("Số đã phát", lichSu(ct.id));
    const cot = bang.tieuDe.indexOf(T.chonSoCotSo);
    expect(cot).toBeGreaterThanOrEqual(0);
    const o = bang.dong[0][cot];
    // Excel đọc số sẽ ăn mất số 0 đầu: 0042 thành 42, mà con số phụ huynh cầm
    // trên tay là 0042.
    expect(o).toEqual({ kieu: "chu", gt: "0042" });
  });

  it("số 0 vẫn ra 0000, không thành ô trống", () => {
    const ct = dungChonSoCoVan(0);
    const bang = bangSoDaChon("Số đã phát", lichSu(ct.id));
    const cot = bang.tieuDe.indexOf(T.chonSoCotSo);
    expect(bang.dong[0][cot]).toEqual({ kieu: "chu", gt: "0000" });
  });
});
