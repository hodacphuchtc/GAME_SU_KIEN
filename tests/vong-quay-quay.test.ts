import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { T } from "@/config/locale";
import { MAU_O_SAN } from "@/config/thuong-hieu";
import { ketThucLuot, quayMot } from "@/app/actions/vong-quay";
import { chamKetQua } from "@/lib/vong-quay/cham";
import { chiaCung, type OQua } from "@/lib/vong-quay/chia-o";
import { themO } from "@/lib/vong-quay/kho-o";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { layMot } from "@/lib/db/truy-van";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * HÀNH ĐỘNG QUAY — nơi quyết định ai nhận gì, sau khi gộp vào app chung (ADR-011).
 */

let don: () => void;

function chuongTrinhVongQuay(coCell = true) {
  const ct = taoChuongTrinh({
    tenTrungTam: "Cơ sở thử",
    soTrung: 0,
    mucDo: "vua",
    tenGiaiThuong: "Quà",
    tranGiaiMoiNgay: 0,
    coSoId: coSoThu(),
    troChoi: "vong_quay",
  });
  if (coCell) {
    themO(ct.id, { ten: "Bút chì", thuTu: 1, soLuong: 10, tiLeTrung: 0.5, mau: MAU_O_SAN[2] });
    themO(ct.id, { ten: "Lời chúc", thuTu: 2, soLuong: null, tiLeTrung: 0.5, mau: MAU_O_SAN[0] });
  }
  return ct;
}

function chuongTrinhTrungSo() {
  return taoChuongTrinh({
    tenTrungTam: "Cơ sở thử",
    soTrung: 7,
    mucDo: "vua",
    tenGiaiThuong: "Quà",
    tranGiaiMoiNgay: 0,
    coSoId: coSoThu(),
    troChoi: "trung_so",
  });
}

function nguoiThu(sdt = "0912345678") {
  return nhanDien("Nguyễn Thị Hoa", sdt, false).nguoiChoi!;
}

beforeEach(() => {
  don = dungCsdlTam();
});

afterEach(() => {
  don();
});

describe("🔴 KHÔNG có ca hết giờ — hàm chấm fail-closed", () => {
  const cung = chiaCung([
    { id: 1, ten: "A", thuTu: 1, soLuong: 10, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, tiLeTrung: 0.25, mau: "#000000" },
    { id: 2, ten: "B", thuTu: 2, soLuong: null, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, tiLeTrung: 0.25, mau: "#111111" },
  ] as OQua[]);

  it("truyền hetGio = true thì NÉM lỗi, không chấm", () => {
    // Cạm bẫy `Math.min/max` của Chọn Số quy MỌI lần hết giờ về đúng một mốc.
    // Vô hại ở trò có trúng/thua; tai hoạ ở trò mà con số chính là phần quà.
    // Chốt này để nó không lẻn về qua một lần sao chép code vô ý.
    expect(() => chamKetQua({ hatGiong: "abc", cung, hetGio: true })).toThrow(/hết giờ/i);
  });

  it("cùng hạt giống → cùng góc, cùng ô (dựng lại được)", () => {
    const a = chamKetQua({ hatGiong: "hat-co-dinh", cung })!;
    const b = chamKetQua({ hatGiong: "hat-co-dinh", cung })!;
    expect(a.gocDung).toBe(b.gocDung);
    expect(a.o.oId).toBe(b.o.oId);
  });
});

describe("quayMot", () => {
  it("ghi đủ hạt giống · góc dừng · ảnh chụp mặt vòng · ảnh chụp tên ô · mã xác thực", async () => {
    const ct = chuongTrinhVongQuay();
    const nc = nguoiThu();
    const kq = await quayMot(ct.ma, nc.id, "Nguyễn Thị Hoa");

    expect(kq.loi).toBeUndefined();
    expect(kq.luot).toBeDefined();

    const dong = layMot<{
      hat_giong: string;
      goc_dung: number;
      cung_json: string | null;
      o_ten: string | null;
      o_mau: string | null;
      ma_xac_thuc: string | null;
      phien_ban_o: number;
    }>("select * from luot_quay where id = ?", kq.luot!.id)!;

    expect(dong.hat_giong).toBeTruthy();
    expect(dong.goc_dung).toBeGreaterThanOrEqual(0);
    // 🔴 Ảnh chụp mặt vòng: thiếu nó thì "Dựng lại ván" vẽ ra một vòng CHƯA
    // TỪNG TỒN TẠI — đúng thứ nó sinh ra để bác bỏ.
    expect(JSON.parse(dong.cung_json!)).toHaveLength(2);
    expect(dong.o_ten).toBe(kq.luot!.oTen);
    expect(dong.o_mau).toBe(kq.luot!.oMau);
    expect(dong.ma_xac_thuc).toBe(kq.luot!.maXacThuc);
    expect(dong.phien_ban_o).toBe(kq.luot!.phienBanO);
  });

  it("🔴 MÃ CỦA TRÚNG SỐ không mở được đường quay", async () => {
    const ts = chuongTrinhTrungSo();
    const nc = nguoiThu();
    const kq = await quayMot(ts.ma, nc.id);
    expect(kq.luot).toBeUndefined();
    expect(kq.loi).toBe(T.phoneEnded);
    // Và KHÔNG được ghi một dòng lượt quay nào vào chương trình Trúng Số.
    expect(layMot<{ n: number }>("select count(*) as n from luot_quay")!.n).toBe(0);
  });

  it("chương trình chưa khai ô nào thì báo rõ, không ném", async () => {
    const ct = chuongTrinhVongQuay(false);
    const kq = await quayMot(ct.ma, nguoiThu().id);
    expect(kq.loi).toBe(T.quayChuaCoO);
  });

  it("🔴 MỘT LÚC MỘT LƯỢT — người thứ hai bị chặn khi lượt trước chưa đóng", async () => {
    const ct = chuongTrinhVongQuay();
    const a = await quayMot(ct.ma, nguoiThu("0912345678").id);
    expect(a.luot).toBeDefined();

    const b = await quayMot(ct.ma, nguoiThu("0987654321").id);
    expect(b.luot).toBeUndefined();
    expect(b.loi).toBe(T.quayDangCoNguoi);

    // Đóng lượt rồi thì người sau vào được ngay, không phải chờ hết đệm.
    await ketThucLuot(a.luot!.id);
    const c = await quayMot(ct.ma, nguoiThu("0987654321").id);
    expect(c.luot).toBeDefined();
  });

  it("mỗi người một lượt mỗi ngày", async () => {
    const ct = chuongTrinhVongQuay();
    const nc = nguoiThu();
    const a = await quayMot(ct.ma, nc.id);
    await ketThucLuot(a.luot!.id);
    const b = await quayMot(ct.ma, nc.id);
    expect(b.loi).toBe(T.quayHetLuot);
  });

  it("chương trình đã kết thúc thì không quay được", async () => {
    const ct = chuongTrinhVongQuay();
    const { chay } = await import("@/lib/db/truy-van");
    chay("update chuong_trinh set trang_thai = 'ket_thuc' where id = ?", ct.id);
    expect((await quayMot(ct.ma, nguoiThu().id)).loi).toBe(T.phoneEnded);
  });

  it("ketThucLuot gọi hai lần vô hại", async () => {
    const ct = chuongTrinhVongQuay();
    const a = await quayMot(ct.ma, nguoiThu().id);
    await ketThucLuot(a.luot!.id);
    const lan1 = layMot<{ ket_thuc_luc: number }>(
      "select ket_thuc_luc from luot_quay where id = ?",
      a.luot!.id,
    )!.ket_thuc_luc;
    await ketThucLuot(a.luot!.id);
    expect(
      layMot<{ ket_thuc_luc: number }>(
        "select ket_thuc_luc from luot_quay where id = ?",
        a.luot!.id,
      )!.ket_thuc_luc,
    ).toBe(lan1);
  });
});
