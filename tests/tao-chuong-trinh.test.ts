import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { datTrangThaiCoSo, taoCoSo } from "@/lib/co-so/kho";
import { danhSachChuongTrinh } from "@/lib/chuong-trinh/kho";

/** Bài này kiểm van vào của việc TẠO, không kiểm quyền — xem `quyen-chuong-trinh.test.ts`. */
const TOAN_BO = { coSoId: null, nhanVienId: null };
import { csdl } from "@/lib/db/ket-noi";
import { taoChuongTrinhForm } from "@/app/actions/chuong-trinh";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * Van vào của việc tạo chương trình.
 *
 * Kiểm ở tầng SERVER ACTION chứ không chỉ tầng kho: form gửi được bằng công cụ
 * khác, và một chương trình gắn nhầm cơ sở thì mọi báo cáo lead sau đó đều lệch
 * mà không ai nhìn ra.
 */

let don: () => void;

function form(sua: Record<string, string> = {}): FormData {
  const f = new FormData();
  const mac: Record<string, string> = {
    tenGiaiThuong: "Balo STEM",
    soTrung: "211",
    mucDo: "vua",
    tranGiaiMoiNgay: "5",
    cheDo: "tai_quay",
    nguonCoSo: "gan_san",
    soLanChoi: "1",
  };
  for (const [k, v] of Object.entries({ ...mac, ...sua })) f.set(k, v);
  return f;
}

/** `redirect()` báo thành công bằng cách NÉM — bắt lại để đọc được kết quả thật. */
async function gui(f: FormData): Promise<{ loi?: string }> {
  try {
    return (await taoChuongTrinhForm({}, f)) ?? {};
  } catch (loi) {
    const digest = (loi as { digest?: string }).digest ?? "";
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) return {};
    throw loi;
  }
}

beforeEach(() => {
  don = dungCsdlTam();
  csdl();
});

afterEach(() => don());

describe("cơ sở của chương trình", () => {
  it("từ chối cơ sở không tồn tại", async () => {
    const kq = await gui(form({ coSoId: "9999" }));
    expect(kq.loi).toBeTruthy();
    expect(danhSachChuongTrinh(TOAN_BO)).toHaveLength(0);
  });

  it("từ chối khi không khai cơ sở nào", async () => {
    const kq = await gui(form({ coSoId: "" }));
    expect(kq.loi).toBeTruthy();
    expect(danhSachChuongTrinh(TOAN_BO)).toHaveLength(0);
  });

  it("từ chối cơ sở đang tắt", async () => {
    const cs = taoCoSo({ ten: "Cơ sở Hải Châu" });
    datTrangThaiCoSo(cs.id, "tat");
    const kq = await gui(form({ coSoId: String(cs.id) }));
    expect(kq.loi).toBeTruthy();
    expect(danhSachChuongTrinh(TOAN_BO)).toHaveLength(0);
  });

  it("ten_trung_tam được chép đúng từ co_so.ten", async () => {
    const cs = taoCoSo({ ten: "Trung tâm Sata Robo Hải Châu", diaChi: "114 Hoàng Diệu" });
    // Form KHÔNG gửi tên trung tâm nữa — nó phải được chép từ bảng cơ sở.
    expect(await gui(form({ coSoId: String(cs.id) }))).toEqual({});

    const ct = danhSachChuongTrinh(TOAN_BO)[0];
    expect(ct.tenTrungTam).toBe("Trung tâm Sata Robo Hải Châu");
    expect(ct.coSoId).toBe(cs.id);
  });

  it("đổi tên cơ sở KHÔNG làm đổi tên đã in trên chương trình cũ", async () => {
    const cs = taoCoSo({ ten: "Cơ sở cũ" });
    await gui(form({ coSoId: String(cs.id) }));
    csdl().prepare("update co_so set ten = ? where id = ?").run("Cơ sở đã đổi tên", cs.id);

    // Bản chụp giữ nguyên: biên lai in năm ngoái không được sai vì đổi tên năm nay.
    expect(danhSachChuongTrinh(TOAN_BO)[0].tenTrungTam).toBe("Cơ sở cũ");
  });
});

describe("chế độ chơi và số lần bấm", () => {
  it("so_lan_choi ngoài khoảng 1..5 bị từ chối", async () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    for (const sai of ["0", "6", "-1", "abc", ""]) {
      const kq = await gui(form({ coSoId: String(cs.id), soLanChoi: sai }));
      expect(kq.loi, `phải từ chối "${sai}"`).toBeTruthy();
    }
    expect(danhSachChuongTrinh(TOAN_BO)).toHaveLength(0);

    expect(await gui(form({ coSoId: String(cs.id), soLanChoi: "5" }))).toEqual({});
    expect(danhSachChuongTrinh(TOAN_BO)[0].soLanChoi).toBe(5);
  });

  it("từ chối chế độ chơi lạ", async () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    expect((await gui(form({ coSoId: String(cs.id), cheDo: "qua_buu_dien" }))).loi).toBeTruthy();
  });

  it("chơi tại quầy thì nguồn cơ sở luôn là gán sẵn, kể cả khi form nói khác", async () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    await gui(form({ coSoId: String(cs.id), cheDo: "tai_quay", nguonCoSo: "phu_huynh_chon" }));
    // Tại quầy không có màn nào để phụ huynh chọn cơ sở — nhận giá trị kia là
    // ghi vào CSDL một điều không bao giờ xảy ra.
    expect(danhSachChuongTrinh(TOAN_BO)[0].nguonCoSo).toBe("gan_san");
  });

  it("chơi online thì giữ đúng nguồn cơ sở đã chọn", async () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    await gui(form({ coSoId: String(cs.id), cheDo: "online", nguonCoSo: "phu_huynh_chon" }));
    const ct = danhSachChuongTrinh(TOAN_BO)[0];
    expect(ct.cheDo).toBe("online");
    expect(ct.nguonCoSo).toBe("phu_huynh_chon");
  });
});
