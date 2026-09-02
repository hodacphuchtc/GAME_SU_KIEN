import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { taoCoSo } from "@/lib/co-so/kho";
import { csdl } from "@/lib/db/ket-noi";
import { danhSachLead, demLead, ganLead, datTrangThaiLead, sinhLead } from "@/lib/lead/kho";
import { nhanDien } from "@/lib/nguoi-choi/nhan-dien";
import { chay } from "@/lib/db/truy-van";
import { coSoThu } from "./ho-tro/co-so-thu";
import { nhanDienNguoiChoi } from "@/app/actions/choi";
import { themNhanVien } from "@/lib/nhan-vien/kho";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * KHÁCH TIỀM NĂNG (GĐ 16.1).
 *
 * Hai luật đắt nhất ở đây:
 * 1. Lead sinh NGAY khi phụ huynh bấm TIẾP TỤC — trước cả khi biết có được chơi
 *    hay không. Người bị chặn bởi luật 1 ván/ngày ĐÃ đưa số rồi.
 * 2. Khách quay lại KHÔNG được reset trạng thái và người phụ trách.
 */

const MOI_NGUOI = { coSoId: null, nhanVienId: null };
const HET = { chiDongY: false };

let don: () => void;
let cs1: number;
let cs2: number;
let ctA: { id: number; ma: string };
let ctB: { id: number; ma: string };

beforeEach(() => {
  don = dungCsdlTam();
  cs1 = taoCoSo({ ten: "Cơ sở Hải Châu" }).id;
  cs2 = taoCoSo({ ten: "Cơ sở Thanh Khê" }).id;
  const mau = { soTrung: 211, mucDo: "vua" as const, tenGiaiThuong: "Quà", tranGiaiMoiNgay: 0 };
  ctA = taoChuongTrinh({ ...mau, tenTrungTam: "Hải Châu", coSoId: cs1 });
  ctB = taoChuongTrinh({ ...mau, tenTrungTam: "Thanh Khê", coSoId: cs2 });
});
afterEach(() => don());

describe("sinh lead tại bước nhận diện", () => {
  it("nhận diện lần đầu sinh lead trạng thái moi", async () => {
    await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);
    const ds = danhSachLead(MOI_NGUOI, HET);
    expect(ds).toHaveLength(1);
    expect(ds[0].trangThai).toBe("moi");
    expect(ds[0].hoTen).toBe("Nguyễn Thị Hoa");
    expect(ds[0].coSoId).toBe(cs1);
  });

  it("🔴 lead sinh NGAY cả khi người đó KHÔNG được chơi — họ đã đưa số rồi", async () => {
    // Không mở lượt nào cả, chỉ nhận diện.
    await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);
    expect(demLead(MOI_NGUOI)).toBe(1);
    // Không có ván nào — chứng minh lead không phụ thuộc việc chơi thành công.
    expect(csdl().prepare("select count(*) as so from van_choi").get()!.so).toBe(0);
  });

  it("🔴 cùng SĐT ở 2 cơ sở sinh 2 lead", async () => {
    await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);
    await nhanDienNguoiChoi(ctB.ma, "Nguyễn Thị Hoa", "0912345678", true);
    const ds = danhSachLead(MOI_NGUOI, HET);
    expect(ds).toHaveLength(2);
    expect(ds.map((l) => l.coSoId).sort()).toEqual([cs1, cs2].sort());
    // Nhưng chỉ MỘT hồ sơ phụ huynh.
    expect(csdl().prepare("select count(*) as so from nguoi_choi").get()!.so).toBe(1);
  });

  it("🔴 chơi lại hôm sau vẫn 1 lead, trang_thai và nhan_vien_id KHÔNG bị reset", async () => {
    await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);
    const lead = danhSachLead(MOI_NGUOI, HET)[0];

    const sale = themNhanVien({ hoTen: "Sale A", coSoId: cs1, vaiTro: "sale" });
    ganLead(lead.id, sale, MOI_NGUOI);
    datTrangThaiLead(lead.id, "chot", MOI_NGUOI);

    // Hôm sau chị Hoa ghé chơi lần nữa.
    await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);

    const ds = danhSachLead(MOI_NGUOI, HET);
    expect(ds).toHaveLength(1);
    expect(ds[0].trangThai).toBe("chot");
    expect(ds[0].nhanVienId).toBe(sale);
  });

  it("khách quay lại thì mốc sửa gần nhất được đẩy lên", async () => {
    await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);
    const truoc = danhSachLead(MOI_NGUOI, HET)[0].suaLuc;
    csdl().prepare("update khach_tiem_nang set sua_luc = ?").run(truoc - 100000);

    await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);
    expect(danhSachLead(MOI_NGUOI, HET)[0].suaLuc).toBeGreaterThan(truoc - 100000);
  });

  it("người chơi ẩn danh không sinh lead", () => {
    // Không gọi nhanDienNguoiChoi ⇒ không có gì để sinh.
    expect(demLead(MOI_NGUOI)).toBe(0);
  });

  /**
   * ĐỔI HÀNH VI ở GĐ 17.2, có chủ ý.
   *
   * Trước đó: chương trình không có cơ sở thì vẫn cho chơi, chỉ là không tạo
   * khách tiềm năng. Nghe tử tế với người đang đứng trước mặt, nhưng nó vứt
   * lặng lẽ MỌI khách của cả buổi và không ai biết. Nay chặn hẳn, kèm câu bảo
   * họ gọi nhân viên — lỗi cấu hình lộ ra trong một phút.
   */
  it("🔴 chương trình chưa gắn cơ sở thì CHẶN, và nói rõ phải làm gì", async () => {
    csdl().prepare("update chuong_trinh set co_so_id = null where id = ?").run(ctA.id);
    const kq = await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "0912345678", true);
    expect(kq.ok).toBe(false);
    expect(kq.loi).toContain("báo giúp nhân viên");
    expect(demLead(MOI_NGUOI)).toBe(0);
  });

  it("số điện thoại sai thì không sinh lead", async () => {
    const kq = await nhanDienNguoiChoi(ctA.ma, "Nguyễn Thị Hoa", "12", true);
    expect(kq.ok).toBe(false);
    expect(demLead(MOI_NGUOI)).toBe(0);
  });
});

describe("bộ lọc", () => {
  beforeEach(async () => {
    await nhanDienNguoiChoi(ctA.ma, "Đồng Ý Một", "0900000001", true);
    await nhanDienNguoiChoi(ctA.ma, "Không Đồng Ý", "0900000002", false);
    await nhanDienNguoiChoi(ctB.ma, "Đồng Ý Hai", "0900000003", true);
  });

  it("🔴 mặc định CHỈ hiện người đồng ý nhận tư vấn", () => {
    const ds = danhSachLead(MOI_NGUOI);
    expect(ds).toHaveLength(2);
    expect(ds.every((l) => l.dongYTuVan)).toBe(true);
  });

  it("bỏ tick “chỉ người đồng ý” thì thấy thêm người không tick", () => {
    expect(danhSachLead(MOI_NGUOI, HET)).toHaveLength(3);
  });

  it("lọc theo cơ sở", () => {
    expect(danhSachLead(MOI_NGUOI, { ...HET, coSoId: cs2 })).toHaveLength(1);
    expect(danhSachLead(MOI_NGUOI, { ...HET, coSoId: cs1 })).toHaveLength(2);
  });

  it("lọc theo chương trình", () => {
    expect(danhSachLead(MOI_NGUOI, { ...HET, chuongTrinhId: ctB.id })).toHaveLength(1);
  });

  it("lọc theo trạng thái", () => {
    const lead = danhSachLead(MOI_NGUOI, HET)[0];
    datTrangThaiLead(lead.id, "hen_hoc_thu", MOI_NGUOI);
    expect(danhSachLead(MOI_NGUOI, { ...HET, trangThai: "hen_hoc_thu" })).toHaveLength(1);
    expect(danhSachLead(MOI_NGUOI, { ...HET, trangThai: "moi" })).toHaveLength(2);
  });

  it("lọc theo sale, và lọc “chưa giao”", () => {
    const sale = themNhanVien({ hoTen: "Sale A", coSoId: cs1, vaiTro: "sale" });
    const lead = danhSachLead(MOI_NGUOI, HET)[0];
    ganLead(lead.id, sale, MOI_NGUOI);

    expect(danhSachLead(MOI_NGUOI, { ...HET, nhanVienId: sale })).toHaveLength(1);
    expect(danhSachLead(MOI_NGUOI, { ...HET, chuaGiao: true })).toHaveLength(2);
  });

  it("lọc theo khoảng ngày — ngày CUỐI được tính TRỌN, không hụt một ngày", () => {
    const homNay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
      .format(new Date());
    expect(danhSachLead(MOI_NGUOI, { ...HET, tuNgay: homNay, denNgay: homNay })).toHaveLength(3);
    expect(danhSachLead(MOI_NGUOI, { ...HET, tuNgay: "2020-01-01", denNgay: "2020-01-02" }))
      .toHaveLength(0);
  });

  it("ghép nhiều bộ lọc cùng lúc", () => {
    expect(
      danhSachLead(MOI_NGUOI, { ...HET, coSoId: cs1, trangThai: "moi", chuaGiao: true }),
    ).toHaveLength(2);
  });

  it("hỏi “chưa giao” thì bỏ qua bộ lọc sale — hai câu hỏi mâu thuẫn nhau", () => {
    const sale = themNhanVien({ hoTen: "Sale A", coSoId: cs1, vaiTro: "sale" });
    ganLead(danhSachLead(MOI_NGUOI, HET)[0].id, sale, MOI_NGUOI);
    expect(danhSachLead(MOI_NGUOI, { ...HET, chuaGiao: true, nhanVienId: sale })).toHaveLength(2);
  });
});

describe("🔴 GAME NGUỒN — cột 'Game đầu tiên' và bộ lọc theo game", () => {
  function ctGame(coSoId: number, troChoi: "trung_so" | "chon_so" | "vong_quay") {
    return taoChuongTrinh({
      tenTrungTam: "Cơ sở thử",
      coSoId,
      soTrung: 7,
      mucDo: "vua",
      tenGiaiThuong: `Quà ${troChoi}`,
      tranGiaiMoiNgay: 0,
      troChoi,
    });
  }

  const MOI = { coSoId: null, nhanVienId: null };

  it("lead mang game của chương trình khách chơi lần đầu", () => {
    const cs = coSoThu();
    const ct = ctGame(cs, "vong_quay");
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs, nc.id, ct.id);
    expect(danhSachLead(MOI)[0].troChoiDau).toBe("vong_quay");
  });

  it("🔴 khách chơi thêm game KHÁC vẫn mang game ĐẦU TIÊN", () => {
    // `sinhLead` cố ý KHÔNG cập nhật `chuong_trinh_id_dau` khi khách quay lại.
    // Đây là lý do nhãn cột phải ghi "Game đầu tiên", không phải "Game".
    const cs = coSoThu();
    const ts = ctGame(cs, "trung_so");
    const vq = ctGame(cs, "vong_quay");
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs, nc.id, ts.id);
    sinhLead(cs, nc.id, vq.id);
    expect(danhSachLead(MOI)).toHaveLength(1);
    expect(danhSachLead(MOI)[0].troChoiDau).toBe("trung_so");
  });

  it("lọc theo game trả đúng tập", () => {
    const cs = coSoThu();
    const a = nhanDien("Khách A", "0912345678", true).nguoiChoi!;
    const b = nhanDien("Khách B", "0987654321", true).nguoiChoi!;
    sinhLead(cs, a.id, ctGame(cs, "trung_so").id);
    sinhLead(cs, b.id, ctGame(cs, "vong_quay").id);

    expect(danhSachLead(MOI, { troChoi: "vong_quay" })).toHaveLength(1);
    expect(danhSachLead(MOI, { troChoi: "vong_quay" })[0].nguoiChoiId).toBe(b.id);
    expect(danhSachLead(MOI, { troChoi: "trung_so" })).toHaveLength(1);
    expect(danhSachLead(MOI, { troChoi: "chon_so" })).toHaveLength(0);
    // Không lọc thì thấy cả hai.
    expect(danhSachLead(MOI)).toHaveLength(2);
  });

  it("🔴 chương trình bị XOÁ thì game nguồn rỗng, KHÔNG làm biến mất khách", () => {
    // `chuong_trinh_id_dau` là ON DELETE SET NULL, và đó là ĐIỀU KIỆN của tính năng
    // xoá chương trình. Dùng join thường thay vì LEFT join ở đây là làm biến mất
    // chính những khách cũ nhất — im lặng.
    const cs = coSoThu();
    const ct = ctGame(cs, "vong_quay");
    const nc = nhanDien("Nguyễn Thị Hoa", "0912345678", true).nguoiChoi!;
    sinhLead(cs, nc.id, ct.id);
    chay("delete from chuong_trinh where id = ?", ct.id);

    const ds = danhSachLead(MOI);
    expect(ds).toHaveLength(1);
    expect(ds[0].troChoiDau).toBeNull();
  });
});
