import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DIFFICULTIES } from "@/config/game";
import { timeAtCount } from "@/lib/bo-dem";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { kiemGioiHan } from "@/lib/luot/gioi-han";
import { lichSu, soGiaiHomNay } from "@/lib/luot/kho-luot";
import { batDauLuot, dungLuot } from "@/lib/luot/luot-service";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { timVan } from "@/lib/van/kho-van";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * VÁN NHIỀU LẦN BẤM (GĐ 12.1).
 *
 * Ranh giới được canh ở đây: `luot_choi` là nhật ký TỪNG LẦN BẤM, `van_choi` là
 * ĐƠN VỊ NHẬN GIẢI. Lẫn hai thứ đó thì trần giải, thước đo và bảng đối soát đều
 * đếm sai — và đều sai theo hướng đẹp mắt, loại sai khó phát hiện nhất.
 */

const THAM_SO = DIFFICULTIES.vua.settings;

let don: () => void;

function taoCt(soLanChoi: number, tranGiai = 0) {
  return taoChuongTrinh({
    tenTrungTam: "Trung tâm Hoa Mai",
    coSoId: coSoThu("Trung tâm Hoa Mai"),
    soTrung: 211,
    mucDo: "vua",
    tenGiaiThuong: "Balo STEM",
    tranGiaiMoiNgay: tranGiai,
    soLanChoi,
  });
}

/**
 * Bấm MỘT lần trong ván. `lechSo` = số muốn dừng lại lệch bao nhiêu so với 0211;
 * 0 nghĩa là trúng.
 *
 * Lùi mốc bắt đầu về quá khứ như bộ test lượt vẫn làm — không lùi thì luật
 * chống khai khống chặn ngay, và nó chặn ĐÚNG.
 */
function bam(maCt: string, nguoiChoiId: number | null, vanId: number | null, lechSo: number) {
  const giay = timeAtCount(THAM_SO, 10_211 + lechSo);
  const luot = batDauLuot(maCt, nguoiChoiId, vanId)!;
  chay(
    "update luot_choi set bat_dau_luc = ? where id = ?",
    Date.now() - Math.ceil(giay * 1000),
    luot.luotId,
  );
  const kq = dungLuot(luot.luotId, giay * 1000, "dien_thoai")!;
  return { luot, kq };
}

beforeEach(() => {
  don = dungCsdlTam();
});

afterEach(() => don());

describe("một ván gom nhiều lần bấm", () => {
  it("3 lần bấm sinh 3 luot_choi và 1 van_choi", () => {
    const ct = taoCt(3);
    const a = bam(ct.ma, null, null, 5);
    const b = bam(ct.ma, null, a.luot.vanId, 9);
    const c = bam(ct.ma, null, a.luot.vanId, 40);

    expect(layNhieu("select id from luot_choi")).toHaveLength(3);
    expect(layNhieu("select id from van_choi")).toHaveLength(1);
    expect(b.luot.vanId).toBe(a.luot.vanId);
    expect(c.luot.vanId).toBe(a.luot.vanId);
    expect(c.luot.lanThu).toBe(3);

    const van = timVan(a.luot.vanId)!;
    expect(van.soLanDaDung).toBe(3);
    expect(van.ketThucLuc).not.toBeNull();
  });

  it("kết quả ván là lượt lệch nhỏ nhất, không phải lượt cuối", () => {
    const ct = taoCt(3);
    const a = bam(ct.ma, null, null, 5); // lệch 5 — tốt nhất
    bam(ct.ma, null, a.luot.vanId, 300);
    const c = bam(ct.ma, null, a.luot.vanId, 900); // lượt CUỐI, lệch xa nhất

    const van = timVan(a.luot.vanId)!;
    expect(van.luotTotNhatId).toBe(a.luot.luotId);
    expect(van.luotTotNhatId).not.toBe(c.luot.luotId);
    expect(c.kq.van.lechTotNhat).toBe(5);

    // Bảng đối soát của nhân viên cũng phải hiện con số tốt nhất.
    expect(lichSu(ct.id)[0].khoangLech).toBe(5);
  });

  /**
   * 🔴 VẾT SẸO 01/09 — bắt được khi chạy thật trên trình duyệt, cả 189 test và
   * build đều xanh trước đó.
   *
   * Tin `ket-qua` mang `khoangLech` của LẦN VỪA BẤM (đúng — bảng LED phải
   * snap về đúng chỗ dãy số dừng lại). Nhưng màn tổng kết lại vẽ thẳng con số
   * đó, nên người bấm lệch 5 rồi lệch 900 bị kết luận là 900. Ván chấm bằng
   * lần TỐT NHẤT, nên tin phải mang thêm `soTotNhat` / `lechTotNhat`.
   */
  it("🔴 lần bấm tệ hơn KHÔNG được ghi đè con số tốt nhất đang giữ", () => {
    const ct = taoCt(3);
    const a = bam(ct.ma, null, null, 5);
    expect(a.kq.van.lechTotNhat).toBe(5);
    expect(a.kq.van.soTotNhat).toBe(216);

    const b = bam(ct.ma, null, a.luot.vanId, 900);
    // Lần này lệch xa hơn nhiều, nhưng "tốt nhất" phải đứng yên.
    expect(b.kq.distance).toBeGreaterThan(5);
    expect(b.kq.van.lechTotNhat).toBe(5);
    expect(b.kq.van.soTotNhat).toBe(216);

    const c = bam(ct.ma, null, a.luot.vanId, 2);
    // Lần cuối tốt hơn ⇒ mới được thay.
    expect(c.kq.van.lechTotNhat).toBe(2);
    expect(c.kq.van.soTotNhat).toBe(213);
    expect(c.kq.van.vanXong).toBe(true);
  });

  it("một dòng lịch sử cho cả ván, không phải ba dòng", () => {
    const ct = taoCt(3);
    const a = bam(ct.ma, null, null, 5);
    bam(ct.ma, null, a.luot.vanId, 9);
    bam(ct.ma, null, a.luot.vanId, 40);
    expect(lichSu(ct.id)).toHaveLength(1);
    expect(lichSu(ct.id)[0].soLanDaDung).toBe(3);
    expect(lichSu(ct.id)[0].soLanChoPhep).toBe(3);
  });

  it("🔴 trúng lần 1 thì so_lan_da_dung = 1 và không nhận thêm lần bấm", () => {
    const ct = taoCt(3);
    const a = bam(ct.ma, null, null, 0);
    expect(a.kq.win).toBe(true);
    expect(a.kq.van.vanXong).toBe(true);
    expect(a.kq.van.conLan).toBe(0);

    const van = timVan(a.luot.vanId)!;
    expect(van.soLanDaDung).toBe(1);
    expect(van.trung).toBe(true);
    expect(van.ketThucLuc).not.toBeNull();

    // Xin bấm tiếp vào ván đã chốt → phải rơi sang VÁN MỚI, không nối vào ván cũ.
    const b = batDauLuot(ct.ma, null, a.luot.vanId)!;
    expect(b.vanId).not.toBe(a.luot.vanId);
  });

  it("chưa hết lần bấm thì ván còn mở và báo đúng số lần còn lại", () => {
    const ct = taoCt(3);
    const a = bam(ct.ma, null, null, 12);
    expect(a.kq.van.vanXong).toBe(false);
    expect(a.kq.van.conLan).toBe(2);
    expect(a.kq.van.soLanDaDung).toBe(1);
    expect(timVan(a.luot.vanId)!.ketThucLuc).toBeNull();
  });
});

describe("giới hạn và trần giải đếm theo VÁN", () => {
  it("🔴 lần bấm 2 và 3 KHÔNG bị giới hạn 1 ván/ngày chặn", () => {
    const ct = taoCt(3);
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;

    const a = bam(ct.ma, n.id, null, 12);
    expect(a.kq.van.vanXong).toBe(false);
    // Giữa ván: van vẫn phải mở, nếu không người chơi mất hai lần bấm còn lại.
    expect(kiemGioiHan(ct.id, n.id, 0).choPhep).toBe(true);

    const b = bam(ct.ma, n.id, a.luot.vanId, 20);
    expect(b.luot.vanId).toBe(a.luot.vanId);
    expect(kiemGioiHan(ct.id, n.id, 0).choPhep).toBe(true);

    const c = bam(ct.ma, n.id, a.luot.vanId, 30);
    expect(c.luot.vanId).toBe(a.luot.vanId);
    expect(c.kq.van.vanXong).toBe(true);
  });

  it("ván thứ hai cùng SĐT trong ngày bị từ chối", () => {
    const ct = taoCt(3);
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    const a = bam(ct.ma, n.id, null, 12);
    bam(ct.ma, n.id, a.luot.vanId, 20);
    bam(ct.ma, n.id, a.luot.vanId, 30);

    const kq = kiemGioiHan(ct.id, n.id, 0);
    expect(kq.choPhep).toBe(false);
    expect(kq.lyDo).toContain("một ván mỗi ngày");
  });

  it("trần giải đếm van_choi chứ không đếm luot_choi", () => {
    const ct = taoCt(3, 1);
    const a = bam(ct.ma, null, null, 12);
    bam(ct.ma, null, a.luot.vanId, 20);
    // Ép cả hai lượt trong ván thành TRÚNG ở tầng nhật ký — đếm lượt sẽ ra 2.
    chay("update luot_choi set trung = 1 where van_id = ?", a.luot.vanId);
    expect(
      layMot<{ so: number }>("select count(*) as so from luot_choi where trung = 1")!.so,
    ).toBeGreaterThan(1);

    // Ván vẫn chưa trúng ⇒ trần chưa bị tiêu tốn phần quà nào.
    expect(soGiaiHomNay(ct.id)).toBe(0);

    const b = taoCt(3, 1);
    const v = bam(b.ma, null, null, 0);
    expect(v.kq.win).toBe(true);
    expect(soGiaiHomNay(b.id)).toBe(1);
  });
});

describe("chống khai bừa vanId", () => {
  it("vanId của chương trình KHÁC bị bỏ qua, ván mới được mở", () => {
    const a = taoCt(3);
    const b = taoCt(3);
    const vanA = bam(a.ma, null, null, 12).luot.vanId;

    const luot = batDauLuot(b.ma, null, vanA)!;
    expect(luot.vanId).not.toBe(vanA);
    expect(timVan(luot.vanId)!.chuongTrinhId).toBe(b.id);
  });

  it("vanId của NGƯỜI KHÁC bị bỏ qua", () => {
    const ct = taoCt(3);
    const hoa = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    const lan = nhanDien("Lan", "0987654321", true).nguoiChoi!;
    const vanHoa = bam(ct.ma, hoa.id, null, 12).luot.vanId;

    const luot = batDauLuot(ct.ma, lan.id, vanHoa)!;
    expect(luot.vanId).not.toBe(vanHoa);
  });

  it("vanId không tồn tại thì mở ván mới, không ném", () => {
    const ct = taoCt(3);
    const luot = batDauLuot(ct.ma, null, 999999)!;
    expect(luot.vanId).toBeGreaterThan(0);
    expect(luot.lanThu).toBe(1);
  });

  it("tải lại trang giữa ván: mất vanId vẫn nhặt lại đúng ván đang mở", () => {
    const ct = taoCt(3);
    const n = nhanDien("Hoa", "0912345678", true).nguoiChoi!;
    const a = bam(ct.ma, n.id, null, 12);

    // Máy khách quên sạch vanId (đúng như sau khi tải lại trang).
    const luot = batDauLuot(ct.ma, n.id, null)!;
    expect(luot.vanId).toBe(a.luot.vanId);
    expect(luot.lanThu).toBe(2);
  });
});
