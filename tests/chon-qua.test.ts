import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DIFFICULTIES } from "@/config/game";
import { timeAtCount } from "@/lib/bo-dem";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { chay, layMot } from "@/lib/db/truy-van";
import { batDauLuot, dungLuot } from "@/lib/luot/luot-service";
import { chonQua, coLoaiDay, conLai, type LoaiQua } from "@/lib/qua/chon-qua";
import { danhSachQua, themQua, xoaQua } from "@/lib/qua/kho-qua";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * KHO QUÀ (GĐ 13.1) — chỗ TIÊU TIỀN của cả hệ thống.
 *
 * Hai tầng được canh riêng: hàm THUẦN `chonQua` (bảng tra, không cần CSDL) và
 * đường ghi thật qua `ghiLanBam` (giao dịch, tranh chấp phần quà cuối cùng).
 */

const THAM_SO = DIFFICULTIES.vua.settings;

function q(p: Partial<LoaiQua> & { id: number }): LoaiQua {
  return {
    ten: `Quà ${p.id}`,
    thuTu: p.id,
    soLuong: 1,
    tranMoiNgay: 0,
    daTrao: 0,
    daTraoHomNay: 0,
    ...p,
  };
}

describe("chonQua — hàm thuần", () => {
  it("bốc đúng thứ tự thu_tu", () => {
    const kho = [q({ id: 3, thuTu: 2 }), q({ id: 1, thuTu: 0 }), q({ id: 2, thuTu: 1 })];
    expect(chonQua(kho)!.id).toBe(1);
  });

  it("hết loại 1 thì sang loại 2", () => {
    const kho = [
      q({ id: 1, thuTu: 0, soLuong: 2, daTrao: 2 }),
      q({ id: 2, thuTu: 1, soLuong: 5, daTrao: 0 }),
    ];
    expect(chonQua(kho)!.id).toBe(2);
  });

  it("🔴 hết mọi loại có hạn thì tụt xuống loại so_luong IS NULL", () => {
    const kho = [
      q({ id: 1, thuTu: 0, soLuong: 2, daTrao: 2 }),
      q({ id: 2, thuTu: 1, soLuong: 3, daTrao: 3 }),
      q({ id: 3, thuTu: 9, soLuong: null, ten: "Buổi học thử" }),
    ];
    const chon = chonQua(kho)!;
    expect(chon.id).toBe(3);
    expect(chon.ten).toBe("Buổi học thử");
  });

  it("kho không có loại đáy thì trả không có quà", () => {
    const kho = [q({ id: 1, soLuong: 1, daTrao: 1 }), q({ id: 2, soLuong: 1, daTrao: 1 })];
    expect(chonQua(kho)).toBeNull();
    expect(coLoaiDay(kho)).toBe(false);
  });

  it("kho rỗng thì trả không có quà, không ném", () => {
    expect(chonQua([])).toBeNull();
    expect(coLoaiDay([])).toBe(false);
  });

  it("trần theo ngày chặn loại đó nhưng KHÔNG chặn cả kho", () => {
    const kho = [
      q({ id: 1, thuTu: 0, soLuong: 100, tranMoiNgay: 2, daTraoHomNay: 2 }),
      q({ id: 2, thuTu: 1, soLuong: 100 }),
    ];
    expect(chonQua(kho)!.id).toBe(2);
  });

  it("trần theo ngày reset sang hôm sau", () => {
    const homNay = q({ id: 1, thuTu: 0, soLuong: 100, tranMoiNgay: 2, daTrao: 2, daTraoHomNay: 2 });
    expect(chonQua([homNay])).toBeNull();
    // Hôm sau: tổng đã trao vẫn là 2, nhưng riêng trong ngày thì về 0.
    const homSau = { ...homNay, daTraoHomNay: 0 };
    expect(chonQua([homSau])!.id).toBe(1);
  });

  it("loại ĐÁY không bị trần ngày chặn — nó là lời hứa 'trúng thì có quà'", () => {
    const day = q({ id: 1, soLuong: null, tranMoiNgay: 1, daTraoHomNay: 99 });
    expect(chonQua([day])!.id).toBe(1);
  });

  it("cùng thu_tu thì bốc theo id — cùng cấu hình phải cho cùng kết quả", () => {
    const kho = [q({ id: 7, thuTu: 0 }), q({ id: 2, thuTu: 0 })];
    expect(chonQua(kho)!.id).toBe(2);
    expect(chonQua([...kho].reverse())!.id).toBe(2);
  });

  it("tồn còn lại không bao giờ âm dù đã trao quá tay", () => {
    expect(conLai(q({ id: 1, soLuong: 2, daTrao: 5 }))).toBe(0);
    expect(conLai(q({ id: 1, soLuong: null }))).toBeNull();
  });
});

describe("bốc quà trên đường chơi thật", () => {
  let don: () => void;

  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  function taoCt() {
    return taoChuongTrinh({
      tenTrungTam: "Trung tâm Hoa Mai",
      coSoId: coSoThu("Trung tâm Hoa Mai"),
      soTrung: 211,
      mucDo: "vua",
      tenGiaiThuong: "Giải khai lúc tạo",
      tranGiaiMoiNgay: 0,
      soLanChoi: 1,
    });
  }

  /** Một ván TRÚNG trọn vẹn, trả về kết quả đã chốt. */
  function choiTrung(maCt: string, nguoiChoiId: number | null = null) {
    const giay = timeAtCount(THAM_SO, 10_211);
    const luot = batDauLuot(maCt, nguoiChoiId)!;
    chay(
      "update luot_choi set bat_dau_luc = ? where id = ?",
      Date.now() - Math.ceil(giay * 1000),
      luot.luotId,
    );
    return dungLuot(luot.luotId, giay * 1000, "dien_thoai")!;
  }

  it("hai lần trúng đầu ra Balo, lần thứ ba tự tụt xuống loại đáy", () => {
    const ct = taoCt();
    themQua(ct.id, { ten: "Balo STEM", thuTu: 0, soLuong: 2, tranMoiNgay: 0, giaTri: null });
    themQua(ct.id, { ten: "Buổi học thử", thuTu: 1, soLuong: null, tranMoiNgay: 0, giaTri: null });

    const a = choiTrung(ct.ma);
    const b = choiTrung(ct.ma);
    const c = choiTrung(ct.ma);

    expect([a.van.tenQuaTang, b.van.tenQuaTang]).toEqual(["Balo STEM", "Balo STEM"]);
    expect(c.van.tenQuaTang).toBe("Buổi học thử");
    // 🔴 Cả ba đều TRÚNG như nhau — người ở đáy kho không được biết mình ở đáy.
    expect([a.win, b.win, c.win]).toEqual([true, true, true]);

    const kho = danhSachQua(ct.id);
    expect(kho[0].daTrao).toBe(2);
    expect(conLai(kho[0])).toBe(0);
    expect(conLai(kho[1])).toBeNull();
  });

  it("kho chưa khai thì vẫn chơi được, chỉ là không có quà để bốc", () => {
    const ct = taoCt();
    const a = choiTrung(ct.ma);
    expect(a.win).toBe(true);
    expect(a.van.quaTangId).toBeNull();
    expect(a.van.tenQuaTang).toBeNull();
  });

  it("🔴 hai ván trúng đồng thời không cùng lấy phần quà cuối cùng", () => {
    const ct = taoCt();
    themQua(ct.id, { ten: "Balo STEM", thuTu: 0, soLuong: 1, tranMoiNgay: 0, giaTri: null });

    const a = choiTrung(ct.ma);
    const b = choiTrung(ct.ma);

    expect(a.van.tenQuaTang).toBe("Balo STEM");
    // Chỉ có MỘT cái Balo. Người thứ hai vẫn trúng, nhưng kho không còn gì.
    expect(b.van.quaTangId).toBeNull();

    const soVanNhanBalo = layMot<{ so: number }>(
      "select count(*) as so from van_choi where qua_tang_id is not null",
    )!.so;
    expect(soVanNhanBalo).toBe(1);
  });

  it("trần mỗi ngày của một loại đẩy sang loại sau, không chặn cả kho", () => {
    const ct = taoCt();
    themQua(ct.id, { ten: "Balo STEM", thuTu: 0, soLuong: 10, tranMoiNgay: 1, giaTri: null });
    themQua(ct.id, { ten: "Bút chì", thuTu: 1, soLuong: 10, tranMoiNgay: 0, giaTri: null });

    expect(choiTrung(ct.ma).van.tenQuaTang).toBe("Balo STEM");
    expect(choiTrung(ct.ma).van.tenQuaTang).toBe("Bút chì");
  });

  it("KHÔNG cho xoá loại quà đã trao cho ai đó — biên lai cũ phải tra được", () => {
    const ct = taoCt();
    const idBalo = themQua(ct.id, {
      ten: "Balo STEM",
      thuTu: 0,
      soLuong: 5,
      tranMoiNgay: 0,
      giaTri: null,
    });
    const idBut = themQua(ct.id, {
      ten: "Bút chì",
      thuTu: 1,
      soLuong: 5,
      tranMoiNgay: 0,
      giaTri: null,
    });
    choiTrung(ct.ma);

    expect(xoaQua(idBalo)).toEqual({ xong: false, lyDo: "da-trao" });
    expect(xoaQua(idBut)).toEqual({ xong: true });
    expect(danhSachQua(ct.id).map((k) => k.ten)).toEqual(["Balo STEM"]);
  });
});
