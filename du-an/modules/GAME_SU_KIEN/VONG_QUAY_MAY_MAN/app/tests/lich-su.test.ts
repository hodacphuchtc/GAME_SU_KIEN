import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ketThucLuot, quayMot } from "@/app/actions/quay";
import { danhSach, taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { danhDauDaTrao, demLuot, lichSuLuot, timLuot } from "@/lib/luot/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { dungCsdlTam } from "@/tests/ho-tro/csdl-tam";

/**
 * Lịch sử lượt quay là SỔ ĐỐI SOÁT khi phụ huynh khiếu nại quà, không phải bảng
 * thống kê cho vui. Nó phải đếm đúng, giữ đúng dấu tích, và KHÔNG in ra dữ liệu
 * định danh đầy đủ trên màn hình đặt ở quầy.
 */
function dungChuongTrinh(tenCoSo = "Cơ sở thử") {
  return taoChuongTrinh({
    tenCoSo,
    tiLeODay: 0.5,
    tranGiaiMoiNgay: 0,
    dsO: [
      { ten: "Balo STEM", soLuong: 10, tranMoiNgay: 0, mau: "#F97316", thuTu: 1 },
      { ten: "Lời chúc", soLuong: null, tranMoiNgay: 0, mau: "#6B21A8", thuTu: 2 },
    ],
  });
}

/** Chơi trọn N lượt bằng N người khác nhau. */
async function choiNLuot(ma: string, n: number) {
  const id: number[] = [];
  for (let i = 0; i < n; i++) {
    const nguoi = nhanDien(`Nguyễn Thị Hoa${i}`, `09123456${String(i).padStart(2, "0")}`, false)
      .nguoiChoi!;
    const kq = await quayMot(ma, nguoi.id);
    if (!kq.luot) throw new Error(`lượt ${i} không mở được: ${kq.loi}`);
    await ketThucLuot(kq.luot.id);
    id.push(kq.luot.id);
  }
  return id;
}

describe("lịch sử lượt quay", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("đếm ĐÚNG số dòng, mới nhất lên trước", async () => {
    const ct = dungChuongTrinh();
    const id = await choiNLuot(ct.ma, 3);

    expect(demLuot(ct.id)).toBe(3);
    const ls = lichSuLuot(ct.id);
    expect(ls).toHaveLength(3);
    expect(ls.map((d) => d.id)).toEqual([...id].reverse());
  });

  it("🔴 KHÔNG lộ họ tên đầy đủ và KHÔNG lộ số điện thoại đầy đủ", async () => {
    const ct = dungChuongTrinh();
    const nguoi = nhanDien("Nguyễn Thị Hoa", "0912345678", false).nguoiChoi!;
    const kq = await quayMot(ct.ma, nguoi.id);
    await ketThucLuot(kq.luot!.id);

    const d = lichSuLuot(ct.id)[0];
    // Màn quản trị đặt ở quầy: người đi ngang liếc qua vai là đọc được cả danh
    // bạ khách nếu ta in đầy đủ.
    expect(d.tenRutGon).toBe("Nguyễn H.");
    expect(d.tenRutGon).not.toContain("Thị");
    expect(d.sdtChe).toBe("09*****678");
    expect(d.sdtChe).not.toBe("0912345678");
  });

  it("mỗi dòng có ô trúng + mã xác thực", async () => {
    const ct = dungChuongTrinh();
    await choiNLuot(ct.ma, 1);

    const d = lichSuLuot(ct.id)[0];
    expect(d.oTen).toBeTruthy();
    expect(d.oMau).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(d.maXacThuc).toMatch(/^[A-Z0-9]{4}$/);
  });

  it("🔴 tích 'đã trao' rồi ĐỌC LẠI vẫn còn nguyên", async () => {
    const ct = dungChuongTrinh();
    const [luotId] = await choiNLuot(ct.ma, 1);

    expect(lichSuLuot(ct.id)[0].daTraoThuong).toBe(false);
    expect(danhDauDaTrao(luotId, true)).toBe(true);

    const sau = lichSuLuot(ct.id)[0];
    expect(sau.daTraoThuong).toBe(true);
    expect(sau.traoLuc).toBeTypeOf("number");
  });

  it("BỎ tích được — người ở quầy tích nhầm dòng là chuyện sẽ xảy ra", async () => {
    const ct = dungChuongTrinh();
    const [luotId] = await choiNLuot(ct.ma, 1);

    danhDauDaTrao(luotId, true);
    danhDauDaTrao(luotId, false);
    const d = lichSuLuot(ct.id)[0];
    expect(d.daTraoThuong).toBe(false);
    expect(d.traoLuc).toBeNull();
  });

  it("tích một lượt KHÔNG có thật thì trả false, không ném", () => {
    expect(danhDauDaTrao(99999, true)).toBe(false);
  });

  it("lịch sử của chương trình này KHÔNG lẫn lượt của chương trình khác", async () => {
    const a = dungChuongTrinh("Cơ sở A");
    const b = dungChuongTrinh("Cơ sở B");
    await choiNLuot(a.ma, 2);
    await choiNLuot(b.ma, 1);

    expect(demLuot(a.id)).toBe(2);
    expect(demLuot(b.id)).toBe(1);
  });

  it("chương trình chưa ai chơi: trả mảng rỗng và đếm 0", () => {
    const ct = dungChuongTrinh();
    expect(lichSuLuot(ct.id)).toEqual([]);
    expect(demLuot(ct.id)).toBe(0);
  });

  it("timLuot giữ đủ ba thứ để DỰNG LẠI ván", async () => {
    const ct = dungChuongTrinh();
    const [luotId] = await choiNLuot(ct.ma, 1);

    const l = timLuot(luotId)!;
    expect(l.hatGiong).toMatch(/^[0-9a-f]{32}$/);
    expect(typeof l.gocDung).toBe("number");
    expect(l.phienBanO).toBeGreaterThan(0);
    expect(l.chuongTrinhId).toBe(ct.id);
  });

  it("timLuot với id không có thật trả null, KHÔNG phải undefined", () => {
    // `.get()` trả `undefined`; hàm phải quy về `null` để nơi gọi so được.
    expect(timLuot(99999)).toBeNull();
  });
});

describe("dải cảnh báo kho ở danh sách", () => {
  let don: () => void;
  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  it("kho đầy thì xanh; hết sạch quà thật thì đỏ", async () => {
    const ct = taoChuongTrinh({
      tenCoSo: "Cơ sở thử",
      tiLeODay: 0.5,
      tranGiaiMoiNgay: 0,
      dsO: [
        { ten: "Balo", soLuong: 1, tranMoiNgay: 0, mau: "#F97316", thuTu: 1 },
        { ten: "Lời chúc", soLuong: null, tranMoiNgay: 0, mau: "#6B21A8", thuTu: 2 },
      ],
    });
    // Còn đúng 1 cái ⇒ đã là "sắp hết" (ngưỡng max(1, 20%)).
    expect(danhSach()[0].canhBao).toBe("vang");

    // Quay tới khi ô thật hết hàng.
    for (let i = 0; i < 30 && danhSach()[0].canhBao !== "do"; i++) {
      const nguoi = nhanDien(`Người ${i}`, `09123456${String(i).padStart(2, "0")}`, false)
        .nguoiChoi!;
      const kq = await quayMot(ct.ma, nguoi.id);
      if (kq.luot) await ketThucLuot(kq.luot.id);
    }
    expect(danhSach()[0].canhBao).toBe("do");
  });
});
