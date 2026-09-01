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

  // 🔄 GĐ 25 ĐẢO ca này: bỏ trống ô cơ sở nay là một LỰA CHỌN hợp lệ ("không
  // gán cơ sở, để phụ huynh tự chọn"), không còn là lỗi. Ca kiểm hành vi mới
  // nằm ở khối "không gán cơ sở" cuối file. Giữ lại ca dưới đây vì nó canh thứ
  // KHÁC hẳn: gõ một id KHÔNG TỒN TẠI vẫn phải bị từ chối.
  it("từ chối id cơ sở không tồn tại — khác hẳn với bỏ trống có chủ ý", async () => {
    const kq = await gui(form({ coSoId: "99999" }));
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

  // 🔄 GĐ 25 ĐẢO ca này. Luật cũ: "tại quầy thì luôn ép về gán sẵn, vì phụ
  // huynh đứng ngay trước mặt, không có màn nào để chọn". Luật đó sai với một
  // quầy dùng CHUNG một mã QR cho nhiều cơ sở — và màn chọn thì vẫn có, nó
  // hiện theo `nguonCoSo` chứ chưa bao giờ theo chế độ.
  it("chơi tại quầy vẫn chọn được “để phụ huynh tự chọn” — chế độ không quyết thay người dùng", async () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    await gui(form({ coSoId: String(cs.id), cheDo: "tai_quay", nguonCoSo: "phu_huynh_chon" }));
    expect(danhSachChuongTrinh(TOAN_BO)[0].nguonCoSo).toBe("phu_huynh_chon");
  });

  it("chơi online thì giữ đúng nguồn cơ sở đã chọn", async () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    await gui(form({ coSoId: String(cs.id), cheDo: "online", nguonCoSo: "phu_huynh_chon" }));
    const ct = danhSachChuongTrinh(TOAN_BO)[0];
    expect(ct.cheDo).toBe("online");
    expect(ct.nguonCoSo).toBe("phu_huynh_chon");
  });
});

describe("không gán cơ sở — phụ huynh tự chọn (GĐ 25)", () => {
  it("để trống ô cơ sở thì tạo được, và chương trình không thuộc cơ sở nào", async () => {
    expect(await gui(form({ coSoId: "" }))).toEqual({});
    const ct = danhSachChuongTrinh(TOAN_BO)[0];
    expect(ct.coSoId).toBeNull();
  });

  it("🔴 không gán cơ sở thì BUỘC nguồn là 'phụ huynh tự chọn'", async () => {
    // Không gán cơ sở mà lại bảo "gán sẵn" thì chẳng có cơ sở nào để mà gán —
    // và ván chơi sinh ra sẽ rơi ra ngoài mọi báo cáo theo cơ sở.
    await gui(form({ coSoId: "", nguonCoSo: "gan_san" }));
    expect(danhSachChuongTrinh(TOAN_BO)[0].nguonCoSo).toBe("phu_huynh_chon");
  });

  it("không gán cơ sở thì tên hiện là nhãn 'Chưa gán cơ sở', không rỗng", async () => {
    await gui(form({ coSoId: "" }));
    expect(danhSachChuongTrinh(TOAN_BO)[0].tenTrungTam.trim()).not.toBe("");
  });

  it("🔴 chế độ TẠI QUẦY cũng chọn được 'phụ huynh tự chọn' — không còn bị ép về gán sẵn", async () => {
    // Trước GĐ 25, action ép nguonCoSo về "gan_san" cho mọi chương trình tại
    // quầy. Nay quầy dùng chung một mã QR cho nhiều cơ sở cũng chạy được.
    const cs = taoCoSo({ ten: "Cơ sở Hải Châu" });
    await gui(form({ coSoId: String(cs.id), cheDo: "tai_quay", nguonCoSo: "phu_huynh_chon" }));
    expect(danhSachChuongTrinh(TOAN_BO)[0].nguonCoSo).toBe("phu_huynh_chon");
  });

  it("có gán cơ sở + gán sẵn: vẫn giữ nguyên hành vi cũ", async () => {
    const cs = taoCoSo({ ten: "Cơ sở Thanh Khê" });
    await gui(form({ coSoId: String(cs.id), nguonCoSo: "gan_san" }));
    const ct = danhSachChuongTrinh(TOAN_BO)[0];
    expect(ct.coSoId).toBe(cs.id);
    expect(ct.nguonCoSo).toBe("gan_san");
  });
});
