import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { taoCoSo } from "@/lib/co-so/kho";
import { csdl } from "@/lib/db/ket-noi";
import { chiaVong, type SaleDangLam } from "@/lib/lead/chia-luan-phien";
import {
  chiaLuanPhien,
  danhSachLead,
  ganLead,
  leadChuaGiao,
  saleDangLam,
  sinhLead,
  datTrangThaiLead,
} from "@/lib/lead/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { datTrangThaiNhanVien, themNhanVien } from "@/lib/nhan-vien/kho";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * CHIA LUÂN PHIÊN (GĐ 16.2).
 *
 * 🔴 Điều được canh gắt nhất: KHÔNG chia bằng modulo. Modulo thì với 3 khách /
 * 2 sale, sale #1 tuần nào cũng nhận 2 và sale #2 tuần nào cũng nhận 1 — sau
 * mười tuần chênh mười khách mà bảng vẫn ghi "chia đều".
 */

const MOI_NGUOI = { coSoId: null, nhanVienId: null };

describe("chiaVong — hàm thuần", () => {
  const rong = (ids: number[]): SaleDangLam[] => ids.map((id) => ({ id, soDangGiu: 0 }));

  it("5 lead 2 sale chia 3+2", () => {
    const cap = chiaVong(rong([10, 20]), [1, 2, 3, 4, 5]);
    const dem = new Map<number, number>();
    for (const c of cap) dem.set(c.nhanVienId, (dem.get(c.nhanVienId) ?? 0) + 1);
    expect([...dem.values()].sort()).toEqual([2, 3]);
    expect(cap).toHaveLength(5);
  });

  it("🔴 sale đang giữ 4 và sale giữ 0 thì người rỗng nhận trước", () => {
    const cap = chiaVong([{ id: 10, soDangGiu: 4 }, { id: 20, soDangGiu: 0 }], [1, 2, 3, 4]);
    // Bốn khách đầu phải về hết tay người đang rỗng cho tới khi hai bên bằng nhau.
    expect(cap.map((c) => c.nhanVienId)).toEqual([20, 20, 20, 20]);
  });

  it("🔴 chia hai tuần liên tiếp KHÔNG dồn hết về một người (bệnh của modulo)", () => {
    // Tuần 1: 3 khách / 2 sale.
    const tuan1 = chiaVong(rong([10, 20]), [1, 2, 3]);
    const giu = new Map<number, number>([[10, 0], [20, 0]]);
    for (const c of tuan1) giu.set(c.nhanVienId, (giu.get(c.nhanVienId) ?? 0) + 1);

    // Tuần 2: lại 3 khách, nhưng lần này tải đã lệch 2–1.
    const tuan2 = chiaVong(
      [...giu].map(([id, soDangGiu]) => ({ id, soDangGiu })),
      [4, 5, 6],
    );
    for (const c of tuan2) giu.set(c.nhanVienId, (giu.get(c.nhanVienId) ?? 0) + 1);

    // Sau hai tuần, 6 khách chia 3–3. Modulo sẽ cho 4–2.
    expect([...giu.values()].sort()).toEqual([3, 3]);
  });

  it("0 sale trả mảng rỗng, không ném", () => {
    expect(chiaVong([], [1, 2, 3])).toEqual([]);
  });

  it("0 lead trả mảng rỗng, không ném", () => {
    expect(chiaVong(rong([10]), [])).toEqual([]);
  });

  it("chia hai lần với cùng đầu vào cho cùng kết quả", () => {
    const a = chiaVong(rong([10, 20, 30]), [1, 2, 3, 4]);
    const b = chiaVong(rong([10, 20, 30]), [1, 2, 3, 4]);
    expect(a).toEqual(b);
  });

  it("KHÔNG sửa mảng sale mà nơi gọi đưa vào", () => {
    const sale = rong([10, 20]);
    chiaVong(sale, [1, 2, 3]);
    expect(sale.map((s) => s.soDangGiu)).toEqual([0, 0]);
  });
});

describe("chia luân phiên trên dữ liệu thật", () => {
  let don: () => void;
  let cs: number;
  let saleA: number;
  let saleB: number;

  function themKhach(sdt: string, coSoId = cs) {
    const nc = nhanDien(`Phụ huynh ${sdt}`, sdt, true).nguoiChoi!;
    sinhLead(coSoId, nc.id, null);
    return danhSachLead(MOI_NGUOI, { chiDongY: false }).find((l) => l.nguoiChoiId === nc.id)!;
  }

  beforeEach(() => {
    don = dungCsdlTam();
    cs = taoCoSo({ ten: "Cơ sở A" }).id;
    saleA = themNhanVien({ hoTen: "Sale A", coSoId: cs, vaiTro: "sale" });
    saleB = themNhanVien({ hoTen: "Sale B", coSoId: cs, vaiTro: "sale" });
  });
  afterEach(() => don());

  it("chia đều khách chưa giao", () => {
    for (const s of ["0900000001", "0900000002", "0900000003", "0900000004"]) themKhach(s);
    expect(chiaLuanPhien(cs)).toEqual({ daChia: 4 });

    const ds = danhSachLead(MOI_NGUOI, { chiDongY: false });
    expect(ds.every((l) => l.nhanVienId !== null)).toBe(true);
    const dem = new Map<number, number>();
    for (const l of ds) dem.set(l.nhanVienId!, (dem.get(l.nhanVienId!) ?? 0) + 1);
    expect([...dem.values()].sort()).toEqual([2, 2]);
  });

  it("🔴 lead đã có sale không bị cướp", () => {
    const a = themKhach("0900000001");
    themKhach("0900000002");
    themKhach("0900000003");
    ganLead(a.id, saleB, MOI_NGUOI);

    chiaLuanPhien(cs);
    const sau = danhSachLead(MOI_NGUOI, { chiDongY: false }).find((l) => l.id === a.id)!;
    expect(sau.nhanVienId).toBe(saleB);
  });

  it("lead chot/bo không bị chia", () => {
    const a = themKhach("0900000001");
    themKhach("0900000002");
    datTrangThaiLead(a.id, "chot", MOI_NGUOI);

    expect(leadChuaGiao(cs)).toHaveLength(1);
    expect(chiaLuanPhien(cs)).toEqual({ daChia: 1 });
    expect(danhSachLead(MOI_NGUOI, { chiDongY: false }).find((l) => l.id === a.id)!.nhanVienId)
      .toBeNull();
  });

  it("chạy hai lần thì lần hai không đổi gì và nói rõ vì sao", () => {
    themKhach("0900000001");
    themKhach("0900000002");
    expect(chiaLuanPhien(cs)).toEqual({ daChia: 2 });
    expect(chiaLuanPhien(cs)).toEqual({ daChia: 0, lyDo: "khong-con-lead" });
  });

  it("cơ sở không còn sale nào đang làm → nói rõ, không im lặng", () => {
    themKhach("0900000001");
    datTrangThaiNhanVien(saleA, "da_nghi");
    datTrangThaiNhanVien(saleB, "da_nghi");
    expect(chiaLuanPhien(cs)).toEqual({ daChia: 0, lyDo: "chua-co-sale" });
  });

  it("tải đang giữ KHÔNG tính khách đã chốt — người bán giỏi không bị phạt", () => {
    const a = themKhach("0900000001");
    ganLead(a.id, saleA, MOI_NGUOI);
    datTrangThaiLead(a.id, "chot", MOI_NGUOI);

    expect(saleDangLam(cs).find((s) => s.id === saleA)!.soDangGiu).toBe(0);

    themKhach("0900000002");
    chiaLuanPhien(cs);
    // Hai sale cùng tải 0 ⇒ khách mới về tay người có id nhỏ hơn, tức saleA.
    expect(danhSachLead(MOI_NGUOI, { chiDongY: false })[0].nhanVienId).toBe(saleA);
  });

  it("sale của CƠ SỞ KHÁC không nhận khách của cơ sở này", () => {
    const cs2 = taoCoSo({ ten: "Cơ sở B" }).id;
    const saleC = themNhanVien({ hoTen: "Sale C", coSoId: cs2, vaiTro: "sale" });
    themKhach("0900000001");
    chiaLuanPhien(cs);
    expect(danhSachLead(MOI_NGUOI, { chiDongY: false })[0].nhanVienId).not.toBe(saleC);
  });

  it("giao dịch: một cơ sở rỗng thì không đụng gì tới cơ sở khác", () => {
    const cs2 = taoCoSo({ ten: "Cơ sở B" }).id;
    themKhach("0900000009", cs2);
    expect(chiaLuanPhien(cs)).toEqual({ daChia: 0, lyDo: "khong-con-lead" });
    expect(csdl().prepare("select count(*) as so from khach_tiem_nang where nhan_vien_id is not null").get()!.so)
      .toBe(0);
  });
});
