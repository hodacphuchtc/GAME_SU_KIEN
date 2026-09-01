import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DIFFICULTIES } from "@/config/game";
import { timeAtCount } from "@/lib/bo-dem";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { taoCoSo, datTrangThaiCoSo } from "@/lib/co-so/kho";
import { chay, layMot } from "@/lib/db/truy-van";
import { danhSachLead } from "@/lib/lead/kho";
import { batDauLuot, dungLuot } from "@/lib/luot/luot-service";
import { moLuot, nhanDienNguoiChoi, xinCho } from "@/app/actions/choi";
import { timVan } from "@/lib/van/kho-van";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * HAI CHẾ ĐỘ CHƠI (GĐ 17).
 *
 * 🔴 Khác biệt đắt nhất: chế độ ONLINE bỏ giữ chỗ. Giữ chỗ sinh ra vì "một màn
 * hình LCD chỉ chiếu được một ván". Chơi online thì mỗi người một màn hình của
 * chính họ — để nguyên hàng đợi nghĩa là quảng cáo kéo về 50 người thì 49 người
 * thấy câu "đang có người chơi" rồi bỏ đi.
 */

const THAM_SO = DIFFICULTIES.vua.settings;
const MOI_NGUOI = { coSoId: null, nhanVienId: null };

let don: () => void;
let cs: number;

function taoCt(cheDo: "tai_quay" | "online", nguonCoSo: "gan_san" | "phu_huynh_chon" = "gan_san") {
  return taoChuongTrinh({
    tenTrungTam: "Trung tâm thử",
    coSoId: cs,
    soTrung: 211,
    mucDo: "vua",
    tenGiaiThuong: "Quà",
    tranGiaiMoiNgay: 0,
    cheDo,
    nguonCoSo,
  });
}

beforeEach(() => {
  don = dungCsdlTam();
  cs = taoCoSo({ ten: "Cơ sở Hải Châu", diaChi: "114 Hoàng Diệu, Đà Nẵng" }).id;
});
afterEach(() => don());

describe("giữ chỗ", () => {
  it("🔴 online không đòi giữ chỗ", async () => {
    const ct = taoCt("online");
    const a = await xinCho(ct.ma, "nguoi_choi", "token-a");
    expect(a.duoc).toBe(true);
    // Không có token nào bị ghi vào CSDL — nghĩa là chẳng ai đang "giữ" gì.
    expect(
      layMot<{ token_nguoi_choi: string | null }>(
        "select token_nguoi_choi from chuong_trinh where id = ?",
        ct.id,
      )!.token_nguoi_choi,
    ).toBeNull();
  });

  it("🔴 hai người online cùng lúc đều mở được ván", async () => {
    const ct = taoCt("online");
    expect((await xinCho(ct.ma, "nguoi_choi", "token-a")).duoc).toBe(true);
    expect((await xinCho(ct.ma, "nguoi_choi", "token-b")).duoc).toBe(true);
    expect((await xinCho(ct.ma, "nguoi_choi", "token-c")).duoc).toBe(true);

    const a = await nhanDienNguoiChoi(ct.ma, "Người Một", "0900000001", true);
    const b = await nhanDienNguoiChoi(ct.ma, "Người Hai", "0900000002", true);
    const vanA = await moLuot(ct.ma, a.nguoiChoiId!, null, a.coSoId ?? null);
    const vanB = await moLuot(ct.ma, b.nguoiChoiId!, null, b.coSoId ?? null);
    expect(vanA.ok).toBe(true);
    expect(vanB.ok).toBe(true);
    expect(vanA.vanId).not.toBe(vanB.vanId);
  });

  it("tai_quay vẫn chỉ một ghế", async () => {
    const ct = taoCt("tai_quay");
    expect((await xinCho(ct.ma, "nguoi_choi", "token-a")).duoc).toBe(true);
    const hai = await xinCho(ct.ma, "nguoi_choi", "token-b");
    expect(hai.duoc).toBe(false);
    expect(hai.lyDo).toBe("dang-ban");
  });

  it("chương trình đã tắt thì online cũng KHÔNG cho vào", async () => {
    const ct = taoCt("online");
    chay("update chuong_trinh set trang_thai = 'ket_thuc' where id = ?", ct.id);
    const kq = await xinCho(ct.ma, "nguoi_choi", "token-a");
    expect(kq.duoc).toBe(false);
    expect(kq.lyDo).toBe("da-ket-thuc");
  });
});

describe("trọng tài giống nhau ở cả hai chế độ", () => {
  function choiTrung(maCt: string) {
    const giay = timeAtCount(THAM_SO, 10_211);
    const luot = batDauLuot(maCt, null)!;
    chay(
      "update luot_choi set bat_dau_luc = ? where id = ?",
      Date.now() - Math.ceil(giay * 1000),
      luot.luotId,
    );
    return dungLuot(luot.luotId, giay * 1000, "dien_thoai")!;
  }

  it("trọng tài dungLuot cho kết quả giống nhau ở cả hai chế độ", () => {
    const quay = choiTrung(taoCt("tai_quay").ma);
    const online = choiTrung(taoCt("online").ma);
    expect(quay.value).toBe(online.value);
    expect(quay.win).toBe(online.win);
    expect(quay.distance).toBe(online.distance);
  });
});

describe("nguồn cơ sở", () => {
  it("gan_san không đòi coSoId từ máy khách", async () => {
    const ct = taoCt("online", "gan_san");
    const kq = await nhanDienNguoiChoi(ct.ma, "Người Một", "0900000001", true, null);
    expect(kq.ok).toBe(true);
    expect(kq.coSoId).toBe(cs);
  });

  it("🔴 gan_san BỎ QUA cơ sở máy khách tự khai — không cho tự nhận cơ sở khác", async () => {
    const cs2 = taoCoSo({ ten: "Cơ sở khác" }).id;
    const ct = taoCt("online", "gan_san");
    const kq = await nhanDienNguoiChoi(ct.ma, "Người Một", "0900000001", true, cs2);
    expect(kq.coSoId).toBe(cs);
    expect(danhSachLead(MOI_NGUOI)[0].coSoId).toBe(cs);
  });

  it("phu_huynh_chon từ chối khi thiếu coSoId", async () => {
    const ct = taoCt("online", "phu_huynh_chon");
    const kq = await nhanDienNguoiChoi(ct.ma, "Người Một", "0900000001", true, null);
    expect(kq.ok).toBe(false);
    expect(kq.loi).toContain("chọn giúp cơ sở");
    expect(danhSachLead(MOI_NGUOI)).toHaveLength(0);
  });

  it("từ chối cơ sở đang tắt", async () => {
    const cs2 = taoCoSo({ ten: "Cơ sở đã tắt" }).id;
    datTrangThaiCoSo(cs2, "tat");
    const ct = taoCt("online", "phu_huynh_chon");
    const kq = await nhanDienNguoiChoi(ct.ma, "Người Một", "0900000001", true, cs2);
    expect(kq.ok).toBe(false);
    expect(danhSachLead(MOI_NGUOI)).toHaveLength(0);
  });

  it("từ chối cơ sở không tồn tại", async () => {
    const ct = taoCt("online", "phu_huynh_chon");
    expect((await nhanDienNguoiChoi(ct.ma, "Người Một", "0900000001", true, 99999)).ok).toBe(false);
  });

  it("van_choi.co_so_id lưu đúng cơ sở đã phân giải ở cả hai chế độ", async () => {
    const cs2 = taoCoSo({ ten: "Cơ sở Thanh Khê" }).id;

    const tuChon = taoCt("online", "phu_huynh_chon");
    const a = await nhanDienNguoiChoi(tuChon.ma, "Người Một", "0900000001", true, cs2);
    const vanA = await moLuot(tuChon.ma, a.nguoiChoiId!, null, a.coSoId ?? null);
    expect(timVan(vanA.vanId!)!.coSoId).toBe(cs2);

    const ganSan = taoCt("tai_quay", "gan_san");
    const b = await nhanDienNguoiChoi(ganSan.ma, "Người Hai", "0900000002", true);
    const vanB = await moLuot(ganSan.ma, b.nguoiChoiId!, null, b.coSoId ?? null);
    expect(timVan(vanB.vanId!)!.coSoId).toBe(cs);
  });

  it("🔴 lead từ chế độ ONLINE mang cờ số chưa xác thực", async () => {
    const online = taoCt("online");
    await nhanDienNguoiChoi(online.ma, "Người Online", "0900000001", true);
    expect(danhSachLead(MOI_NGUOI)[0].chuaXacThuc).toBe(true);
  });

  it("lead từ chế độ TẠI QUẦY thì KHÔNG mang cờ đó — nhân viên nhìn thấy người thật", async () => {
    const quay = taoCt("tai_quay");
    await nhanDienNguoiChoi(quay.ma, "Người Tại Quầy", "0900000002", true);
    expect(danhSachLead(MOI_NGUOI)[0].chuaXacThuc).toBe(false);
  });
});
