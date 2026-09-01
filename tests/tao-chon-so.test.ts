import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DAI_TOI_DA } from "@/config/chon-so";
import { phamViCua, type NguoiDung } from "@/lib/bao-ve/quyen";
import {
  danhSachChonSo,
  suaChonSo,
  taoChuongTrinh,
  timTheoMaChonSo,
} from "@/lib/chuong-trinh/kho";
import {
  kiemThietLapChonSo,
  type ThietLapChonSo,
} from "@/lib/chuong-trinh/kiem-hop-le";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * TẠO / SỬA CHƯƠNG TRÌNH CHỌN SỐ.
 *
 * 🔴 Bảng ca dưới đây chạy qua CẢ HAI đường — kiểm thuần và đường ghi thật.
 * Để mỗi đường tự viết luật của mình thì bên lỏng hơn sẽ là bên người ta dùng
 * để lách, và không ai biết bên nào đang lỏng.
 */

let don: () => void;

const HOP_LE: ThietLapChonSo = {
  daiTu: 1,
  daiDen: 100,
  loaiTruDaRa: false,
  tenGiaiThuong: "Quà Tết 2026",
};

const CA_XAU: ReadonlyArray<[ten: string, sua: Partial<ThietLapChonSo>]> = [
  ["dải đảo ngược", { daiTu: 100, daiDen: 1 }],
  ["🔴 vượt 4 chữ số — bảng LED sẽ cắt cụt trong im lặng", { daiTu: 1, daiDen: 99999 }],
  ["số âm", { daiTu: -1, daiDen: 10 }],
  ["dải một số — nút DỪNG thành đồ trang trí", { daiTu: 7, daiDen: 7 }],
  ["tên đợt rỗng", { tenGiaiThuong: "   " }],
  ["dải không phải số nguyên", { daiTu: 1.5, daiDen: 10 }],
];

beforeEach(() => {
  don = dungCsdlTam();
});

afterEach(() => don());

describe("kiểm thiết lập chọn số", () => {
  it.each(CA_XAU)("chặn: %s", (_ten, sua) => {
    const loi = kiemThietLapChonSo({ ...HOP_LE, ...sua });
    expect(loi).not.toBeNull();
    expect(loi!.length).toBeGreaterThan(10); // câu tiếng Việt nói rõ vì sao
  });

  it("dải hợp lệ thì cho qua, kể cả hai biên", () => {
    expect(kiemThietLapChonSo(HOP_LE)).toBeNull();
    expect(kiemThietLapChonSo({ ...HOP_LE, daiTu: 0, daiDen: DAI_TOI_DA })).toBeNull();
    expect(kiemThietLapChonSo({ ...HOP_LE, daiTu: 5, daiDen: 6 })).toBeNull();
  });
});

describe("đường SỬA dùng ĐÚNG bộ luật của đường TẠO", () => {
  function taoThu(): { id: number; ma: string } {
    const ct = taoChuongTrinh({
      tenTrungTam: "Trung tâm Hoa Mai",
      coSoId: coSoThu("Trung tâm Hoa Mai"),
      soTrung: 0,
      mucDo: "vua",
      tranGiaiMoiNgay: 0,
      troChoi: "chon_so",
      ...HOP_LE,
    });
    return { id: ct.id, ma: ct.ma };
  }

  it.each(CA_XAU)("sửa cũng chặn: %s", (_ten, sua) => {
    const { id } = taoThu();
    expect(() => suaChonSo(id, { ...HOP_LE, ...sua })).toThrow();
  });

  it("sửa hợp lệ thì ghi thật, và mã QR cũ vẫn dùng được", () => {
    const { id, ma } = taoThu();
    expect(suaChonSo(id, { ...HOP_LE, daiTu: 1, daiDen: 50, loaiTruDaRa: true })).toBe(true);

    const pv = phamViCua({ id: 1, vaiTro: "quan_tri", coSoId: null } as NguoiDung);
    const sau = timTheoMaChonSo(ma, pv)!;
    expect(sau.ma).toBe(ma); // mã không đổi — nó đã in ra giấy dán ở quầy
    expect(sau.daiTu).toBe(1);
    expect(sau.daiDen).toBe(50);
    expect(sau.loaiTruDaRa).toBe(true);
  });

  it("sửa KHÔNG đụng được chương trình của game kia", () => {
    const ts = taoChuongTrinh({
      tenTrungTam: "T",
      coSoId: coSoThu("T"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Voucher",
      tranGiaiMoiNgay: 0,
    });
    expect(suaChonSo(ts.id, HOP_LE)).toBe(false);
  });
});

describe("phân quyền theo cơ sở ở tầng SQL", () => {
  it("🔴 sale của cơ sở khác không đọc được chương trình chọn số", () => {
    const cs1 = coSoThu("Cơ sở Hải Châu");
    const cs2 = coSoThu("Cơ sở Thanh Khê");
    const ma = taoChuongTrinh({
      tenTrungTam: "Hải Châu",
      coSoId: cs1,
      soTrung: 0,
      mucDo: "vua",
      tranGiaiMoiNgay: 0,
      troChoi: "chon_so",
      ...HOP_LE,
    }).ma;

    const saleCs2 = phamViCua({ id: 9, vaiTro: "sale", coSoId: cs2 } as NguoiDung);
    expect(timTheoMaChonSo(ma, saleCs2)).toBeNull();
    expect(danhSachChonSo(saleCs2).map((c) => c.ma)).not.toContain(ma);

    const saleCs1 = phamViCua({ id: 8, vaiTro: "sale", coSoId: cs1 } as NguoiDung);
    expect(timTheoMaChonSo(ma, saleCs1)?.ma).toBe(ma);
  });
});
