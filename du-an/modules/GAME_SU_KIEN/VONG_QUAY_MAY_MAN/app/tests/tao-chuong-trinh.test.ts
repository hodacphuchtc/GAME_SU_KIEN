import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SO_O_TOI_DA } from "@/config/vong-quay";
import { danhSach, taoChuongTrinh, timTheoMa } from "@/lib/chuong-trinh/kho";
import { kiemTraChuongTrinh, type OKhai } from "@/lib/chuong-trinh/kiem-tra";
import { BANG_CHU, DAI_MA, maHopLe, sinhMa } from "@/lib/chuong-trinh/ma";
import { danhSachO } from "@/lib/o-qua/kho";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

function o(ten: string, soLuong: number | null, thuTu = 1, tranMoiNgay = 0): OKhai {
  return { ten, soLuong, tranMoiNgay, mau: "#6B21A8", thuTu };
}

const HOP_LE = {
  tenCoSo: "Sata Robo Cầu Giấy",
  tiLeODay: 0.5,
  tranGiaiMoiNgay: 0,
  dsO: [o("Balo", 10, 1), o("Bút", 30, 2), o("Sticker", null, 9)],
};

describe("kiemTraChuongTrinh — hàm thuần", () => {
  it("khai đúng thì không có lỗi nào", () => {
    expect(kiemTraChuongTrinh(HOP_LE)).toEqual([]);
  });

  it("🔴 THIẾU Ô ĐÁY thì bị chặn, kèm lời giải thích chứ không phải mã lỗi", () => {
    const loi = kiemTraChuongTrinh({ ...HOP_LE, dsO: [o("Balo", 10, 1), o("Bút", 30, 2)] });
    expect(loi).toHaveLength(1);
    expect(loi[0]).toContain("để trống số lượng");
    expect(loi[0]).toContain("hết quà là hết trò");
  });

  it("tên ô TRÙNG bị chặn — kể cả khác hoa thường và khoảng trắng", () => {
    const loi = kiemTraChuongTrinh({
      ...HOP_LE,
      dsO: [o("Balo", 10, 1), o("  balo  ", 30, 2), o("Sticker", null, 9)],
    });
    expect(loi.some((l) => l.includes("trùng tên"))).toBe(true);
  });

  it("số lượng 0 bị chặn, và nói rõ muốn không giới hạn thì để TRỐNG", () => {
    const loi = kiemTraChuongTrinh({
      ...HOP_LE,
      dsO: [o("Balo", 0, 1), o("Sticker", null, 9)],
    });
    expect(loi.some((l) => l.includes("để TRỐNG"))).toBe(true);
  });

  it("dưới hai ô bị chặn — nút QUAY khi đó là đồ trang trí", () => {
    const loi = kiemTraChuongTrinh({ ...HOP_LE, dsO: [o("Sticker", null, 9)] });
    expect(loi.some((l) => l.includes("đồ trang trí"))).toBe(true);
  });

  it("quá số ô tối đa bị chặn", () => {
    const nhieu = Array.from({ length: SO_O_TOI_DA + 1 }, (_, i) => o(`Quà ${i}`, 5, i + 1));
    nhieu.push(o("Sticker", null, 99));
    expect(kiemTraChuongTrinh({ ...HOP_LE, dsO: nhieu }).some((l) => l.includes("Nhiều nhất"))).toBe(
      true,
    );
  });

  it("tỉ lệ ô đáy ngoài khoảng bị chặn ở CẢ HAI đầu", () => {
    expect(kiemTraChuongTrinh({ ...HOP_LE, tiLeODay: 0 }).length).toBeGreaterThan(0);
    expect(kiemTraChuongTrinh({ ...HOP_LE, tiLeODay: 1 }).length).toBeGreaterThan(0);
  });

  it("trần mỗi ngày lớn hơn tổng số lượng bị chặn — cái trần đó vô nghĩa", () => {
    const loi = kiemTraChuongTrinh({
      ...HOP_LE,
      dsO: [o("Balo", 5, 1, 10), o("Sticker", null, 9)],
    });
    expect(loi.some((l) => l.includes("không bao giờ chặn được gì"))).toBe(true);
  });

  it("trả VỀ CẢ danh sách lỗi, không dừng ở lỗi đầu tiên", () => {
    const loi = kiemTraChuongTrinh({
      tenCoSo: "",
      tiLeODay: 0.5,
      tranGiaiMoiNgay: -1,
      dsO: [o("", 10, 1)],
    });
    expect(loi.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Mã chương trình", () => {
  it("bảng chữ cái BỎ hết ký tự dễ đọc nhầm", () => {
    for (const c of "OIL01258BZS") expect(BANG_CHU.includes(c), `còn ký tự ${c}`).toBe(false);
  });

  it("mã sinh ra luôn hợp lệ và đủ độ dài", () => {
    for (let i = 0; i < 500; i++) {
      const ma = sinhMa();
      expect(ma).toHaveLength(DAI_MA);
      expect(maHopLe(ma)).toBe(true);
    }
  });

  it("mã sai độ dài hoặc chứa ký tự lạ đều bị từ chối", () => {
    expect(maHopLe("ABC")).toBe(false);
    expect(maHopLe("AAAA0")).toBe(false);
  });
});

describe("Tạo chương trình trên cơ sở dữ liệu", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("tạo hợp lệ sinh đúng số ô, và phiên bản bắt đầu từ 1", () => {
    const ct = taoChuongTrinh(HOP_LE);
    expect(maHopLe(ct.ma)).toBe(true);
    expect(ct.phienBanO).toBe(1);
    const ds = danhSachO(ct.id);
    expect(ds).toHaveLength(3);
    expect(ds.map((x) => x.ten)).toEqual(["Balo", "Bút", "Sticker"]);
    expect(ds[2].soLuong).toBeNull();
  });

  it("cắt khoảng trắng thừa ở tên cơ sở và tên ô", () => {
    const ct = taoChuongTrinh({
      ...HOP_LE,
      tenCoSo: "  Cơ sở B  ",
      dsO: [o("  Balo  ", 10, 1), o("Sticker", null, 9)],
    });
    expect(ct.tenCoSo).toBe("Cơ sở B");
    expect(danhSachO(ct.id)[0].ten).toBe("Balo");
  });

  it("hai chương trình không bao giờ trùng mã", () => {
    const ma = new Set<string>();
    for (let i = 0; i < 30; i++) ma.add(taoChuongTrinh(HOP_LE).ma);
    expect(ma.size).toBe(30);
    expect(danhSach()).toHaveLength(30);
  });

  it("tìm theo mã trả đúng chương trình, mã rác trả null chứ không ném lỗi", () => {
    const ct = taoChuongTrinh(HOP_LE);
    expect(timTheoMa(ct.ma)?.id).toBe(ct.id);
    expect(timTheoMa("KHONG-TON-TAI")).toBeNull();
    expect(timTheoMa("AAAAA")).toBeNull();
  });

  it("danh sách đếm đúng số ô và số lượt", () => {
    taoChuongTrinh(HOP_LE);
    const ds = danhSach();
    expect(ds[0].soO).toBe(3);
    expect(ds[0].soLuot).toBe(0);
  });
});
