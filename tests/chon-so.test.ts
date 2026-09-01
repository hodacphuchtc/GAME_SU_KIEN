import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { T } from "@/config/locale";
import { taoChuongTrinh, timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { chay, layMot } from "@/lib/db/truy-van";
import { batDauLuot, dungLuot } from "@/lib/luot/luot-service";
import { coLuotDangMo, soDaRa } from "@/lib/luot/kho-luot";
import { luatCua } from "@/lib/tro-choi/luat";
import { soConLai } from "@/lib/tro-choi/luat-chon-so";
import { timVan } from "@/lib/van/kho-van";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * GAME CHỌN SỐ — luật chơi phía máy chủ.
 *
 * 🔴 Bài kiểm quan trọng nhất của cả file là "không bao giờ ghi trung = 1".
 * `dungLuot` từng gọi `resolveRound` vô điều kiện; một chương trình Chọn Số
 * mang `so_trung = 0` sẽ ghi trúng mỗi khi số ra đúng 0, rồi bốc quà trên kho
 * rỗng và đẩy vào cột "Đã trúng" của báo cáo — không một dòng lỗi nào.
 */

let don: () => void;

function chonSoThu(opt: { tu: number; den: number; loaiTru: boolean }): string {
  return taoChuongTrinh({
    tenTrungTam: "Trung tâm Hoa Mai",
    coSoId: coSoThu("Trung tâm Hoa Mai"),
    soTrung: 0,
    mucDo: "vua",
    tenGiaiThuong: "Quà Tết 2026",
    tranGiaiMoiNgay: 0,
    troChoi: "chon_so",
    daiTu: opt.tu,
    daiDen: opt.den,
    loaiTruDaRa: opt.loaiTru,
  }).ma;
}

/** Lùi mốc bắt đầu để giả lập "dãy số đã chạy được ngần này giây". */
function moLuotDaChay(ma: string, giay: number) {
  const luot = batDauLuot(ma, null);
  if (!luot) return null;
  chay(
    "update luot_choi set bat_dau_luc = ? where id = ?",
    Date.now() - Math.ceil(giay * 1000),
    luot.luotId,
  );
  return luot;
}

/** Chơi trọn một ván và trả về con số nhận được. */
function choiMotVan(ma: string, giay = 5): number | null {
  const luot = moLuotDaChay(ma, giay);
  if (!luot) return null;
  const kq = dungLuot(luot.luotId, giay * 1000, "dien_thoai");
  return kq?.value ?? null;
}

beforeEach(() => {
  don = dungCsdlTam();
});

afterEach(() => don());

describe("chấm một lượt chọn số", () => {
  it("🔴 KHÔNG BAO GIỜ ghi trung = 1, kể cả khi số ra bằng đúng so_trung", () => {
    // Dải 0→9 chứa đúng con số 0 mà mọi chương trình Chọn Số mang ở `so_trung`.
    const ma = chonSoThu({ tu: 0, den: 9, loaiTru: false });
    for (let i = 0; i < 12; i += 1) {
      const luot = moLuotDaChay(ma, 3 + i * 0.37)!;
      const kq = dungLuot(luot.luotId, (3 + i * 0.37) * 1000, "dien_thoai")!;
      expect(kq.win).toBe(false);
      expect(timVan(luot.vanId)!.trung).toBe(false);
    }
  });

  it("🔴 KHÔNG đụng một dòng nào của kho quà", () => {
    const ma = chonSoThu({ tu: 1, den: 100, loaiTru: false });
    choiMotVan(ma);
    const ct = timTheoMaCongKhai(ma)!;
    // layMot trả undefined khi không có dòng — dùng falsy cho cả hai khả năng.
    expect(layMot("select 1 from qua_tang where chuong_trinh_id = ?", ct.id)).toBeFalsy();
  });

  it("một lần bấm là ván chốt ngay — không có 'lần tốt nhất'", () => {
    const ma = chonSoThu({ tu: 1, den: 100, loaiTru: false });
    const luot = moLuotDaChay(ma, 5)!;
    dungLuot(luot.luotId, 5000, "dien_thoai");
    const van = timVan(luot.vanId)!;
    expect(van.soLanDaDung).toBe(1);
    expect(van.ketThucLuc).not.toBeNull();
    expect(van.maXacThuc).not.toBeNull();
  });

  it("số nhận được luôn nằm trong dải đã khai", () => {
    const ma = chonSoThu({ tu: 30, den: 40, loaiTru: false });
    for (let i = 0; i < 8; i += 1) {
      const so = choiMotVan(ma, 3 + i * 0.53)!;
      expect(so).toBeGreaterThanOrEqual(30);
      expect(so).toBeLessThanOrEqual(40);
    }
  });

  it("🔴 HẾT GIỜ thì không cấp số — mọi người để hết giờ sẽ ra cùng một số", () => {
    const ma = chonSoThu({ tu: 1, den: 100, loaiTru: false });
    const luot = moLuotDaChay(ma, 25)!;
    expect(dungLuot(luot.luotId, 25000, "het_gio")).toBeNull();
    // Ván vẫn mở, lượt vẫn chưa chốt: người chơi được mời bấm lại.
    expect(timVan(luot.vanId)!.ketThucLuc).toBeNull();
  });
});

describe("loại trừ số đã ra", () => {
  it("TẮT loại trừ ⇒ trùng số là hợp lệ, không ai bị chặn", () => {
    const ma = chonSoThu({ tu: 1, den: 2, loaiTru: false });
    // Dải hai số, chơi bốn ván: chắc chắn có số lặp, và không ván nào bị từ chối.
    const so = [0, 1, 2, 3].map((i) => choiMotVan(ma, 3 + i * 0.11));
    expect(so.every((s) => s !== null)).toBe(true);
  });

  it("🔴 BẬT loại trừ ⇒ số đã ra không bao giờ quay lại", () => {
    const ma = chonSoThu({ tu: 1, den: 3, loaiTru: true });
    const so = [0, 1, 2].map((i) => choiMotVan(ma, 3 + i * 0.41));
    expect(so.every((s) => s !== null)).toBe(true);
    expect(new Set(so).size).toBe(3); // ba ván, ba số KHÁC nhau
    expect([...so].sort()).toEqual([1, 2, 3]);
  });

  it("🔴 hết sạch số ⇒ ván tiếp theo bị chặn, kèm câu lỗi nói rõ", () => {
    const ma = chonSoThu({ tu: 1, den: 3, loaiTru: true });
    [0, 1, 2].forEach((i) => choiMotVan(ma, 3 + i * 0.41));
    const ct = timTheoMaCongKhai(ma)!;
    expect(luatCua("chon_so").truocKhiMo(ct).loi).toBe(T.chonSoHetSo);
    expect(batDauLuot(ma, null)).toBeNull();
  });

  it("số CUỐI CÙNG vẫn phát được — chỉ dừng khi còn 0", () => {
    const ma = chonSoThu({ tu: 1, den: 3, loaiTru: true });
    expect(choiMotVan(ma, 3)).not.toBeNull();
    expect(choiMotVan(ma, 3.4)).not.toBeNull();
    const cuoi = choiMotVan(ma, 3.8); // số thứ ba, cũng là số cuối
    expect(cuoi).not.toBeNull();
  });

  it("🔴 số đã ra NGOÀI dải mới không tính vào — sau khi thu hẹp dải", () => {
    const ma = chonSoThu({ tu: 1, den: 100, loaiTru: true });
    const ct = timTheoMaCongKhai(ma)!;
    // Giả lập vài ván đã phát số lớn, rồi thu dải xuống 1→50.
    chay(
      `insert into luot_choi (chuong_trinh_id, ngay, bat_dau_luc, ket_thuc_luc, so_da_dung)
       values (?, '2026-09-01', 1, 2, 77), (?, '2026-09-01', 1, 2, 88), (?, '2026-09-01', 1, 2, 9)`,
      ct.id,
      ct.id,
      ct.id,
    );
    expect(soDaRa(ct.id, 1, 100).size).toBe(3);
    expect(soDaRa(ct.id, 1, 50)).toEqual(new Set([9]));
  });

  it("còn lại N số: đếm đúng, và trả null khi không bật loại trừ", () => {
    const maBat = chonSoThu({ tu: 1, den: 10, loaiTru: true });
    expect(soConLai(timTheoMaCongKhai(maBat)!)).toBe(10);
    choiMotVan(maBat, 3);
    expect(soConLai(timTheoMaCongKhai(maBat)!)).toBe(9);

    const maTat = chonSoThu({ tu: 1, den: 10, loaiTru: false });
    expect(soConLai(timTheoMaCongKhai(maTat)!)).toBeNull();
  });
});

describe("mỗi lúc một lượt", () => {
  it("🔴 đang có người giữa lượt thì không mở được lượt thứ hai", () => {
    const ma = chonSoThu({ tu: 1, den: 100, loaiTru: true });
    const dau = batDauLuot(ma, null);
    expect(dau).not.toBeNull();

    const ct = timTheoMaCongKhai(ma)!;
    expect(luatCua("chon_so").truocKhiMo(ct).loi).toBe(T.chonSoDangCoNguoiChoi);
    expect(batDauLuot(ma, null)).toBeNull();
  });

  it("lượt bỏ dở từ lâu không khoá chương trình mãi mãi", () => {
    const ma = chonSoThu({ tu: 1, den: 100, loaiTru: true });
    const dau = batDauLuot(ma, null)!;
    // Người chơi đóng trình duyệt giữa chừng: lượt nằm lại với ket_thuc_luc null.
    chay(
      "update luot_choi set bat_dau_luc = ? where id = ?",
      Date.now() - 10 * 60 * 1000,
      dau.luotId,
    );
    const ct = timTheoMaCongKhai(ma)!;
    expect(coLuotDangMo(ct.id, Date.now() - 20 * 1000)).toBe(false);
    expect(batDauLuot(ma, null)).not.toBeNull();
  });
});
