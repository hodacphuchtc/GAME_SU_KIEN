import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ketThucLuot, quayMot } from "@/app/actions/quay";
import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { timLuot } from "@/lib/luot/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { danhSachO, suaO, themO } from "@/lib/o-qua/kho";
import { bocGoc } from "@/lib/vong-quay/goc";
import { chamKetQua } from "@/lib/vong-quay/cham";
import { oTaiGoc } from "@/lib/vong-quay/chia-o";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

/**
 * DỰNG LẠI VÁN — câu trả lời cho "có chỉnh kết quả không".
 *
 * Trò do MÁY quyết kết quả thì sớm muộn cũng bị hỏi câu đó, và câu trả lời phải
 * là bấm một nút chứ không phải một lời hứa.
 */
function dungChuongTrinh() {
  return taoChuongTrinh({
    tenCoSo: "Cơ sở thử",
    tiLeODay: 0.5,
    tranGiaiMoiNgay: 0,
    dsO: [
      { ten: "Balo STEM", soLuong: 10, tranMoiNgay: 0, mau: "#F97316", thuTu: 1 },
      { ten: "Lời chúc", soLuong: null, tranMoiNgay: 0, mau: "#6B21A8", thuTu: 2 },
    ],
  });
}

async function choiMot(ma: string, sdt = "0912345678") {
  const nguoi = nhanDien("Nguyễn Thị Hoa", sdt, false).nguoiChoi!;
  const kq = await quayMot(ma, nguoi.id);
  if (!kq.luot) throw new Error(`không mở được lượt: ${kq.loi}`);
  await ketThucLuot(kq.luot.id);
  return kq.luot;
}

describe("dựng lại ván", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("mỗi lượt lưu đủ ảnh chụp mặt vòng", async () => {
    const ct = dungChuongTrinh();
    const luot = await choiMot(ct.ma);

    const l = timLuot(luot.id)!;
    expect(l.cung).not.toBeNull();
    expect(l.cung!.map((c) => c.ten)).toEqual(luot.cung.map((c) => c.ten));
  });

  it("🔴 dựng lại cho ra ĐÚNG góc đã lưu — 100 lượt", async () => {
    const ct = dungChuongTrinh();
    for (let i = 0; i < 100; i++) {
      const luot = await choiMot(ct.ma, `09123456${String(i).padStart(2, "0")}`);
      const l = timLuot(luot.id)!;
      // Góc là hàm TẤT ĐỊNH của hạt giống: dựng lại từ hạt phải ra đúng góc cũ.
      expect(bocGoc(l.hatGiong)).toBeCloseTo(l.gocDung, 9);
      // Và góc đó rơi vào đúng ô đã ghi trong sổ.
      expect(oTaiGoc(l.cung!, l.gocDung)!.oId).toBe(l.oQuaId);
    }
  });

  it("🔴 SỬA danh sách ô rồi dựng lại ván CŨ vẫn ra cơ cấu CŨ", async () => {
    const ct = dungChuongTrinh();
    const luot = await choiMot(ct.ma);
    const tenCu = timLuot(luot.id)!.cung!.map((c) => c.ten);

    // Đổi mặt vòng: sửa tên một ô và thêm hẳn một ô mới.
    const dsO = danhSachO(ct.id);
    suaO(ct.id, dsO[0].id, {
      ten: "TÊN MỚI HOÀN TOÀN",
      thuTu: 1,
      soLuong: 10,
      tranMoiNgay: 0,
      mau: "#000000",
    });
    themO(ct.id, {
      ten: "Ô mới thêm sau",
      thuTu: 3,
      soLuong: 3,
      tranMoiNgay: 0,
      mau: "#5EEAD4",
    });

    const sau = timLuot(luot.id)!;
    // Vòng cũ KHÔNG được đổi theo: không mang tên mới, không có ô thêm sau.
    expect(sau.cung!.map((c) => c.ten)).toEqual(tenCu);
    expect(sau.cung!.map((c) => c.ten)).not.toContain("TÊN MỚI HOÀN TOÀN");
    expect(sau.cung!.map((c) => c.ten)).not.toContain("Ô mới thêm sau");
    // Và kim vẫn dừng đúng ô cũ.
    expect(oTaiGoc(sau.cung!, sau.gocDung)!.oId).toBe(sau.oQuaId);
  });

  it("ô đã HẾT HÀNG vẫn hiện trong vòng dựng lại", async () => {
    const ct = taoChuongTrinh({
      tenCoSo: "Cơ sở thử",
      tiLeODay: 0.5,
      tranGiaiMoiNgay: 0,
      dsO: [
        { ten: "Balo cuối cùng", soLuong: 1, tranMoiNgay: 0, mau: "#F97316", thuTu: 1 },
        { ten: "Lời chúc", soLuong: null, tranMoiNgay: 0, mau: "#6B21A8", thuTu: 2 },
      ],
    });
    const dau = await choiMot(ct.ma, "0912345601");
    expect(dau.cung.map((c) => c.ten)).toContain("Balo cuối cùng");

    // Quay tới khi ô thật hết hàng, rồi kiểm vòng CŨ vẫn còn ô đó.
    for (let i = 2; i < 25; i++) {
      const nguoi = nhanDien(`Người ${i}`, `09123456${String(i).padStart(2, "0")}`, false)
        .nguoiChoi!;
      const kq = await quayMot(ct.ma, nguoi.id);
      if (kq.luot) await ketThucLuot(kq.luot.id);
    }
    const conTrenVongMoi = danhSachO(ct.id);
    const balo = conTrenVongMoi.find((o) => o.ten === "Balo cuối cùng")!;
    expect(balo.daTrao).toBeGreaterThanOrEqual(1);

    expect(timLuot(dau.id)!.cung!.map((c) => c.ten)).toContain("Balo cuối cùng");
  });

  it("cùng hạt giống + cùng ảnh chụp ⇒ chấm lại ra y hệt", async () => {
    const ct = dungChuongTrinh();
    const luot = await choiMot(ct.ma);
    const l = timLuot(luot.id)!;

    const lai = chamKetQua({ hatGiong: l.hatGiong, cung: l.cung! })!;
    expect(lai.gocDung).toBeCloseTo(l.gocDung, 9);
    expect(lai.o.oId).toBe(l.oQuaId);
  });

  it("ảnh chụp hỏng định dạng thì trả null chứ KHÔNG ném", async () => {
    const ct = dungChuongTrinh();
    const luot = await choiMot(ct.ma);

    const { csdl } = await import("@/lib/db/ket-noi");
    csdl().prepare("UPDATE luot_quay SET cung_json = ? WHERE id = ?").run("{hỏng", luot.id);

    // Một dòng lỗi trong sổ không được phép làm sập cả trang lịch sử.
    expect(() => timLuot(luot.id)).not.toThrow();
    expect(timLuot(luot.id)!.cung).toBeNull();
  });
});
