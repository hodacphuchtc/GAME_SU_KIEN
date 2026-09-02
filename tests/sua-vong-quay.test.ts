import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MAU_O_SAN } from "@/config/thuong-hieu";
import { taoChuongTrinh, timTheoMaVongQuay } from "@/lib/chuong-trinh/kho";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { chay, layMot } from "@/lib/db/truy-van";
import { danhSachO, phienBanO, suaO, themO, xoaO } from "@/lib/vong-quay/kho-o";
import { lichSuLuot } from "@/lib/vong-quay/kho-luot-quay";
import { chiaCung } from "@/lib/vong-quay/chia-o";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * SỬA CHƯƠNG TRÌNH VÒNG QUAY ĐANG CHẠY — lỗi thứ 5 trong buổi test 02/09/2026.
 *
 * 🔴 Bài kiểm ở tầng KHO + hàm thuần, không gọi server action: action đọc phiên
 * qua cookie, thứ không dựng được trong vitest. Phép kiểm quyền của nó đã có bài
 * riêng ở `tests/phan-quyen.test.ts`.
 */

let don: () => void;
const TOAN_HE_THONG = phamViCua({ id: 1, vaiTro: "quan_tri", coSoId: null });

beforeEach(() => {
  don = dungCsdlTam();
});
afterEach(() => don());

function chuongTrinh() {
  return taoChuongTrinh({
    tenTrungTam: "Cơ sở thử",
    coSoId: coSoThu(),
    soTrung: 0,
    mucDo: "vua",
    tenGiaiThuong: "Đợt cũ",
    tranGiaiMoiNgay: 0,
    troChoi: "vong_quay",
  });
}

describe("🔴 mọi thay đổi danh sách ô đều TĂNG phiên bản", () => {
  it("thêm · sửa · xoá đều tăng — không tăng là 'Dựng lại ván' vẽ vòng chưa từng tồn tại", () => {
    const ct = chuongTrinh();
    const p0 = phienBanO(ct.id);
    const id = themO(ct.id, { ten: "Balo", thuTu: 1, soLuong: 5, mau: MAU_O_SAN[0] });
    const p1 = phienBanO(ct.id);
    expect(p1).toBeGreaterThan(p0);
    suaO(ct.id, id, { ten: "Balo mini", thuTu: 1, soLuong: 5, mau: MAU_O_SAN[0] });
    const p2 = phienBanO(ct.id);
    expect(p2).toBeGreaterThan(p1);

    xoaO(ct.id, id);
    expect(phienBanO(ct.id)).toBeGreaterThan(p2);
  });
});

describe("🔴 ô ĐÃ TRAO là chứng cứ đối soát — không xoá được", () => {
  function coLuotTrungO(chuongTrinhId: number, oId: number) {
    chay(
      `insert into luot_quay (chuong_trinh_id, o_qua_id, ngay, hat_giong, goc_dung,
         phien_ban_o, o_ten, ma_xac_thuc, bat_dau_luc)
       values (?, ?, '2026-09-02', 'hg', 12.5, 1, 'Balo', 'AB12', ?)`,
      chuongTrinhId, oId, Date.now(),
    );
  }

  it("xoaO trả false và KHÔNG xoá dòng nào", () => {
    const ct = chuongTrinh();
    const id = themO(ct.id, { ten: "Balo", thuTu: 1, soLuong: 5, mau: MAU_O_SAN[0] });
    coLuotTrungO(ct.id, id);
    expect(xoaO(ct.id, id)).toBe(false);
    expect(danhSachO(ct.id)).toHaveLength(1);
  });

  it("🔴 ĐƯỜNG ĐI TIẾP: đặt số lượng = số đã trao thì ô biến khỏi MẶT VÒNG mà lịch sử còn", () => {
    const ct = chuongTrinh();
    const id = themO(ct.id, { ten: "Balo", thuTu: 1, soLuong: 5, mau: MAU_O_SAN[0] });
    themO(ct.id, { ten: "Lời chúc", thuTu: 2, soLuong: null, mau: MAU_O_SAN[1] });
    coLuotTrungO(ct.id, id);

    // Trước khi đặt: ô Balo vẫn nằm trên mặt vòng.
    expect(chiaCung(danhSachO(ct.id), 0.5).some((c) => c.ten === "Balo")).toBe(true);

    suaO(ct.id, id, { ten: "Balo", thuTu: 1, soLuong: 1, mau: MAU_O_SAN[0] });

    // Sau khi đặt số lượng = 1 (đúng số đã trao): biến khỏi mặt vòng…
    expect(chiaCung(danhSachO(ct.id), 0.5).some((c) => c.ten === "Balo")).toBe(false);
    // …nhưng dòng lịch sử vẫn còn nguyên, với ảnh chụp tên ô.
    expect(layMot<{ n: number }>("select count(*) as n from luot_quay")!.n).toBe(1);
    expect(layMot<{ o_ten: string }>("select o_ten from luot_quay")!.o_ten).toBe("Balo");
  });
});

describe("🔴 sửa tên ô KHÔNG viết lại quá khứ", () => {
  it("lượt đã ghi giữ tên CŨ; danh mục hiện tên MỚI", () => {
    const ct = chuongTrinh();
    const id = themO(ct.id, { ten: "Balo", thuTu: 1, soLuong: 5, mau: MAU_O_SAN[0] });
    chay(
      `insert into luot_quay (chuong_trinh_id, o_qua_id, ngay, hat_giong, goc_dung,
         phien_ban_o, o_ten, o_mau, ma_xac_thuc, bat_dau_luc)
       values (?, ?, '2026-09-02', 'hg', 12.5, 1, 'Balo', ?, 'AB12', ?)`,
      ct.id, id, MAU_O_SAN[0], Date.now(),
    );

    suaO(ct.id, id, { ten: "Balo mini", thuTu: 1, soLuong: 5, mau: MAU_O_SAN[0] });

    expect(danhSachO(ct.id)[0].ten).toBe("Balo mini");
    expect(lichSuLuot(ct.id)[0].oTen).toBe("Balo");
  });
});

describe("ba thứ KHÔNG cho sửa", () => {
  it("mã chương trình giữ nguyên sau khi sửa tên đợt", () => {
    const ct = chuongTrinh();
    chay("update chuong_trinh set ten_giai_thuong = ? where id = ?", "Đợt mới", ct.id);
    expect(timTheoMaVongQuay(ct.ma, TOAN_HE_THONG)!.ma).toBe(ct.ma);
    expect(timTheoMaVongQuay(ct.ma, TOAN_HE_THONG)!.tenGiaiThuong).toBe("Đợt mới");
  });
});
