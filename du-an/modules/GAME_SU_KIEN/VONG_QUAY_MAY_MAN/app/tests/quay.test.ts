import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GIAY_QUAY } from "@/config/vong-quay";
import { csdl } from "@/lib/db/ket-noi";
import { ketThucLuot, quayMot } from "@/app/actions/quay";
import { chamKetQua, hatGiongMoi } from "@/lib/vong-quay/cham";
import { chiaCung, type OQua } from "@/lib/vong-quay/chia-o";
import { maXacThuc } from "@/lib/ma-xac-thuc";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

/** Một chương trình có 1 ô quà thật + 1 ô đáy — hình dạng tối thiểu hợp lệ. */
function dungChuongTrinh(tenCoSo = "Cơ sở thử") {
  return taoChuongTrinh({
    tenCoSo,
    tiLeODay: 0.5,
    tranGiaiMoiNgay: 0,
    dsO: [
      { ten: "Bút chì", soLuong: 10, tranMoiNgay: 0, mau: "#F97316", thuTu: 1 },
      { ten: "Lời chúc", soLuong: null, tranMoiNgay: 0, mau: "#6B21A8", thuTu: 2 },
    ],
  });
}

function taoNguoi(sdt = "0912345678") {
  return nhanDien("Nguyễn Thị Hoa", sdt, false).nguoiChoi!;
}

describe("hàm chấm — Đ2: KHÔNG có ca hết giờ", () => {
  const cung = chiaCung([
    { id: 1, ten: "A", thuTu: 1, soLuong: 10, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#000" },
    { id: 2, ten: "B", thuTu: 2, soLuong: null, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: "#111" },
  ] as OQua[]);

  it("truyền hetGio = true thì NÉM lỗi, không chấm", () => {
    // Fail-closed: cạm bẫy Math.min/max của Chọn Số quy mọi lần hết giờ về đúng
    // một mốc. Ở trò mà con số chính là phần quà thì đó là tai hoạ. Chốt này để
    // nó không lẻn về qua một lần sao chép code vô ý.
    expect(() => chamKetQua({ hatGiong: "abc", cung, hetGio: true })).toThrow(/hết giờ/i);
  });

  it("hetGio = false hoặc không truyền thì chấm bình thường", () => {
    expect(chamKetQua({ hatGiong: "abc", cung })).not.toBeNull();
    expect(chamKetQua({ hatGiong: "abc", cung, hetGio: false })).not.toBeNull();
  });

  it("giây bấm nhanh hay chậm KHÔNG đổi kết quả", () => {
    const a = chamKetQua({ hatGiong: "cung-mot-hat", cung, giay: 0 });
    const b = chamKetQua({ hatGiong: "cung-mot-hat", cung, giay: 999 });
    expect(a).toEqual(b);
  });

  it("cùng hạt giống → cùng góc, cùng ô (dựng lại được)", () => {
    const a = chamKetQua({ hatGiong: "hat-co-dinh", cung })!;
    const b = chamKetQua({ hatGiong: "hat-co-dinh", cung })!;
    expect(a.gocDung).toBe(b.gocDung);
    expect(a.o.oId).toBe(b.o.oId);
  });

  it("vòng rỗng thì trả null chứ không ném", () => {
    expect(chamKetQua({ hatGiong: "abc", cung: [] })).toBeNull();
  });

  it("hạt giống mới mỗi lần gọi, dài 32 ký tự hex", () => {
    const a = hatGiongMoi();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(hatGiongMoi());
  });
});

describe("mã xác thực — Đ5", () => {
  it("gieo bằng id ô + id lượt: hai kết quả khác nhau thì mã khác nhau", () => {
    expect(maXacThuc(1, 100)).not.toBe(maXacThuc(2, 100));
    expect(maXacThuc(1, 100)).not.toBe(maXacThuc(1, 101));
  });

  it("cùng (ô, lượt) luôn cho cùng mã — đối soát được cả tuần sau", () => {
    expect(maXacThuc(7, 42)).toBe(maXacThuc(7, 42));
  });

  it("mã dài 4 ký tự, không chứa ký tự dễ đọc nhầm", () => {
    for (let i = 1; i < 50; i++) {
      const ma = maXacThuc(i, i * 3);
      expect(ma).toHaveLength(4);
      expect(ma).not.toMatch(/[BIOSZ01268]/);
    }
  });
});

describe("server action QUAY", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("quay xong ghi ĐÚNG MỘT dòng, đủ hạt giống + góc + phiên bản ô", async () => {
    const ct = dungChuongTrinh();
    const nguoi = taoNguoi();

    const kq = await quayMot(ct.ma, nguoi.id);
    expect(kq.loi).toBeUndefined();
    expect(kq.luot).toBeDefined();
    expect(kq.luot!.thoiLuong).toBe(GIAY_QUAY);

    const dong = csdl()
      .prepare("SELECT * FROM luot_quay WHERE chuong_trinh_id = ?")
      .all(ct.id) as Record<string, unknown>[];
    expect(dong).toHaveLength(1);
    expect(dong[0].hat_giong).toMatch(/^[0-9a-f]{32}$/);
    expect(typeof dong[0].goc_dung).toBe("number");
    expect(dong[0].phien_ban_o).toBe(kq.luot!.phienBanO);
    expect(dong[0].ma_xac_thuc).toBe(kq.luot!.maXacThuc);
  });

  it("🔴 hai lượt SONG SONG chỉ ghi MỘT dòng (Đ6)", async () => {
    const ct = dungChuongTrinh();
    const a = taoNguoi("0912345678");
    const b = taoNguoi("0987654321");

    const [x, y] = await Promise.all([quayMot(ct.ma, a.id), quayMot(ct.ma, b.id)]);

    // Một người thắng cửa, người kia bị từ chối kèm lý do — KHÔNG phải cùng
    // thắng một ô cuối cùng còn hàng.
    const thanhCong = [x, y].filter((k) => k.luot);
    const biTuChoi = [x, y].filter((k) => k.loi);
    expect(thanhCong).toHaveLength(1);
    expect(biTuChoi).toHaveLength(1);
    expect(biTuChoi[0].loi).toBeTruthy();

    const dem = csdl()
      .prepare("SELECT COUNT(*) AS n FROM luot_quay WHERE chuong_trinh_id = ?")
      .get(ct.id) as { n: number };
    expect(dem.n).toBe(1);
  });

  it("đóng lượt xong thì người tiếp theo quay được ngay", async () => {
    const ct = dungChuongTrinh();
    const a = taoNguoi("0912345678");
    const b = taoNguoi("0987654321");

    const x = await quayMot(ct.ma, a.id);
    expect(x.luot).toBeDefined();

    // Chưa đóng: bị chặn.
    expect((await quayMot(ct.ma, b.id)).loi).toBeTruthy();

    await ketThucLuot(x.luot!.id);
    expect((await quayMot(ct.ma, b.id)).luot).toBeDefined();
  });

  it("cùng một người không quay được lượt thứ hai trong ngày", async () => {
    const ct = dungChuongTrinh();
    const nguoi = taoNguoi();

    const x = await quayMot(ct.ma, nguoi.id);
    await ketThucLuot(x.luot!.id);

    const y = await quayMot(ct.ma, nguoi.id);
    expect(y.luot).toBeUndefined();
    expect(y.loi).toBeTruthy();
  });

  it("chương trình đã kết thúc thì từ chối", async () => {
    const ct = dungChuongTrinh();
    const nguoi = taoNguoi();
    csdl().prepare("UPDATE chuong_trinh SET trang_thai = 'ket_thuc' WHERE id = ?").run(ct.id);

    expect((await quayMot(ct.ma, nguoi.id)).loi).toBeTruthy();
  });

  it("mã chương trình không có thật thì từ chối, không ném", async () => {
    const nguoi = taoNguoi();
    const kq = await quayMot("KHONG-CO-THAT", nguoi.id);
    expect(kq.loi).toBeTruthy();
    expect(kq.luot).toBeUndefined();
  });

  it("ô trúng nằm TRONG danh sách cung được phát ra", async () => {
    const ct = dungChuongTrinh();
    const nguoi = taoNguoi();
    const kq = await quayMot(ct.ma, nguoi.id);

    const ten = kq.luot!.cung.map((c) => c.ten);
    expect(ten).toContain(kq.luot!.oTen);
  });

  it("ket_thuc_luc rỗng lúc mở, có giá trị sau khi đóng — và đóng hai lần vô hại", async () => {
    const ct = dungChuongTrinh();
    const nguoi = taoNguoi();
    const kq = await quayMot(ct.ma, nguoi.id);

    const doc = () =>
      csdl().prepare("SELECT ket_thuc_luc FROM luot_quay WHERE id = ?").get(kq.luot!.id) as {
        ket_thuc_luc: number | null;
      };

    expect(doc().ket_thuc_luc).toBeNull();
    await ketThucLuot(kq.luot!.id);
    const lan1 = doc().ket_thuc_luc;
    expect(lan1).not.toBeNull();

    await ketThucLuot(kq.luot!.id);
    expect(doc().ket_thuc_luc).toBe(lan1);
  });
});
