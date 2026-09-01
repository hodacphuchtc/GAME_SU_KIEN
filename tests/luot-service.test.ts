import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DIFFICULTIES } from "@/config/game";
import { timeAtCount } from "@/lib/bo-dem";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { layMot } from "@/lib/db/truy-van";
import { batDauLuot, docKetQua, dungLuot } from "@/lib/luot/luot-service";
import { chay } from "@/lib/db/truy-van";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * Lùi mốc bắt đầu về quá khứ để giả lập "ván đã chạy được ngần này giây".
 * Không lùi thì luật chống khai khống chặn ngay — và nó chặn ĐÚNG.
 */
function moLuotDaChay(maCt: string, giayDaTroi: number) {
  const luot = batDauLuot(maCt, null)!;
  chay(
    "update luot_choi set bat_dau_luc = ? where id = ?",
    Date.now() - Math.ceil(giayDaTroi * 1000),
    luot.luotId,
  );
  return luot;
}

let don: () => void;
let ma: string;

const THAM_SO = DIFFICULTIES.vua.settings;

beforeEach(() => {
  don = dungCsdlTam();
  ma = taoChuongTrinh({
    tenTrungTam: "Trung tâm Hoa Mai",
    coSoId: coSoThu("Trung tâm Hoa Mai"),
    soTrung: 211,
    mucDo: "vua",
    tenGiaiThuong: "Voucher 200k",
    tranGiaiMoiNgay: 0,
  }).ma;
});

afterEach(() => don());

describe("chốt một lượt chơi", () => {
  it("bấm đúng lúc số cài lướt qua thì TRÚNG", () => {
    // Giây mà bảng số hiện đúng 0211 ở vòng thứ hai.
    const giay = timeAtCount(THAM_SO, 10_211);
    const luot = moLuotDaChay(ma, giay);
    const kq = dungLuot(luot.luotId, giay * 1000, "dien_thoai")!;
    expect(kq.value).toBe(211);
    expect(kq.win).toBe(true);
    expect(kq.maXacThuc).toHaveLength(4);
  });

  it("bấm lệch thì trượt và nói đúng số lệch", () => {
    const giay = timeAtCount(THAM_SO, 10_215);
    const luot = moLuotDaChay(ma, giay);
    const kq = dungLuot(luot.luotId, giay * 1000, "dien_thoai")!;
    expect(kq.win).toBe(false);
    expect(kq.distance).toBe(4);
  });

  it("CHỈ LƯỢT BẤM ĐẦU TIÊN ĐƯỢC GHI — máy thứ hai nhận null, im lặng bỏ qua", () => {
    const luot = moLuotDaChay(ma, timeAtCount(THAM_SO, 10_500));
    const dau = dungLuot(luot.luotId, timeAtCount(THAM_SO, 10_211) * 1000, "dien_thoai");
    const sau = dungLuot(luot.luotId, timeAtCount(THAM_SO, 10_500) * 1000, "man_hinh");
    expect(dau).not.toBeNull();
    expect(sau).toBeNull();
  });

  it("lượt bấm thứ hai KHÔNG ghi đè kết quả đã chốt", () => {
    const luot = moLuotDaChay(ma, timeAtCount(THAM_SO, 10_500));
    dungLuot(luot.luotId, timeAtCount(THAM_SO, 10_211) * 1000, "dien_thoai");
    dungLuot(luot.luotId, timeAtCount(THAM_SO, 10_500) * 1000, "man_hinh");
    const daChot = docKetQua(luot.luotId)!;
    expect(daChot.soDaDung).toBe(211);
    expect(daChot.trung).toBe(true);
  });

  it("từ chối số mili-giây LỚN HƠN giờ thực đã trôi — chống khai khống", () => {
    const luot = batDauLuot(ma, null)!;
    // Ván vừa bắt đầu mà khai đã trôi 60 giây.
    expect(dungLuot(luot.luotId, 60_000, "dien_thoai")).toBeNull();
  });

  it("từ chối số mili-giây âm hoặc không phải số", () => {
    const luot = batDauLuot(ma, null)!;
    expect(dungLuot(luot.luotId, -5, "dien_thoai")).toBeNull();
    expect(dungLuot(luot.luotId, Number.NaN, "dien_thoai")).toBeNull();
  });

  it("bấm trong lúc nút còn khoá thì bị kéo về đúng mốc mở khoá, không tính sớm hơn", () => {
    const luot = batDauLuot(ma, null)!;
    const kq = dungLuot(luot.luotId, 500, "man_hinh")!;
    // 500ms nằm trong thời gian khoá nút ⇒ kết quả phải tính tại mốc hết khoá.
    expect(kq.atSeconds).toBe(THAM_SO.lockSeconds);
  });

  it("ghi đủ vào lịch sử để còn tra soát", () => {
    const giay = timeAtCount(THAM_SO, 10_211);
    const luot = moLuotDaChay(ma, giay);
    dungLuot(luot.luotId, giay * 1000, "dien_thoai");
    const dong = layMot<{
      thiet_bi_bam: string;
      ngay: string;
      van_id: number;
      lan_thu: number;
      ket_thuc_luc: number;
    }>("select * from luot_choi where id = ?", luot.luotId)!;
    expect(dong.thiet_bi_bam).toBe("dien_thoai");
    expect(dong.ngay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dong.ket_thuc_luc).toBeGreaterThan(0);
    // Lượt phải nối được về ván — không có dây này thì lịch sử quản trị mất dòng.
    expect(dong.van_id).toBe(luot.vanId);
    expect(dong.lan_thu).toBe(1);
  });

  // 🔴 Từ GĐ 12.1 mã xác thực sống ở VÁN, không ở lượt: bấm ba lần trúng hai
  // lần vẫn chỉ MỘT phiếu nhận quà, nên chỉ được có MỘT mã.
  it("mã xác thực nằm trên VÁN chứ không trên lượt", () => {
    const giay = timeAtCount(THAM_SO, 10_211);
    const luot = moLuotDaChay(ma, giay);
    dungLuot(luot.luotId, giay * 1000, "dien_thoai");

    const van = layMot<{ ma_xac_thuc: string | null; trung: number; ket_thuc_luc: number | null }>(
      "select * from van_choi where id = ?",
      luot.vanId,
    )!;
    expect(van.trung).toBe(1);
    expect(van.ma_xac_thuc).toHaveLength(4);
    expect(van.ket_thuc_luc).toBeGreaterThan(0);
    expect(
      layMot<{ ma_xac_thuc: string | null }>(
        "select ma_xac_thuc from luot_choi where id = ?",
        luot.luotId,
      )!.ma_xac_thuc,
    ).toBeNull();
  });

  it("chương trình không tồn tại thì không mở được lượt", () => {
    expect(batDauLuot("KHONGCO", null)).toBeNull();
  });
});
