"use server";

import { revalidatePath } from "next/cache";

import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { csdl } from "@/lib/db/ket-noi";
import { taoChuongTrinh, timTheoMaVongQuay } from "@/lib/chuong-trinh/kho";
import { danhSachO, suaO, themO, xoaO } from "@/lib/vong-quay/kho-o";
import { danhDauDaTrao } from "@/lib/vong-quay/kho-luot-quay";
import { kiemVongQuay, type OKhai, type VongQuayKhai } from "@/lib/vong-quay/kiem-tra";
import { T } from "@/config/locale";
import { chay } from "@/lib/db/truy-van";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";

export interface KetQuaTaoVongQuay {
  loi: string[];
  ma?: string;
}

/**
 * Tạo chương trình Vòng Quay kèm danh sách ô, trong MỘT giao dịch.
 *
 * 🔴 Kiểm tra chạy Ở ĐÂY, phía máy chủ, chứ không chỉ trong trình duyệt: kiểm
 * phía trình duyệt là tiện ích cho người dùng, không phải hàng rào — ai cũng
 * gửi thẳng yêu cầu vào máy chủ được.
 *
 * 🔴 MỘT giao dịch cho cả chương trình lẫn ô. Tách ra thì một lỗi giữa chừng để
 * lại một chương trình KHÔNG có ô nào: mã QR in ra dán ở quầy, phụ huynh quét
 * vào, và nhận đúng một dòng "chương trình chưa khai ô quà nào".
 */
export async function themVongQuay(khai: VongQuayKhai): Promise<KetQuaTaoVongQuay> {
  await batBuocDangNhap();

  const loi = kiemVongQuay(khai);
  if (loi.length > 0) return { loi };

  const db = csdl();
  db.exec("BEGIN IMMEDIATE");
  try {
    const ct = taoChuongTrinh({
      tenTrungTam: khai.tenDot.trim(),
      soTrung: 0,
      mucDo: "vua",
      tenGiaiThuong: khai.tenDot.trim(),
      tranGiaiMoiNgay: 0,
      coSoId: khai.coSoId,
      troChoi: "vong_quay",
    });
    for (const o of khai.dsO) {
      themO(ct.id, {
        ten: o.ten.trim(),
        thuTu: o.thuTu,
        soLuong: o.soLuong,
        tranMoiNgay: o.tranMoiNgay,
        tiLeTrung: o.tiLeTrung,
        mau: o.mau,
      });
    }
    db.exec("COMMIT");
    revalidatePath("/quan-tri/vong-quay");
    return { loi: [], ma: ct.ma };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/**
 * Tích / bỏ tích "đã trao quà" trên một dòng lịch sử.
 *
 * 🔴 Kiểm PHẠM VI trước khi ghi. Lớp chặn ở `proxy.ts` chỉ hỏi "đã đăng nhập
 * chưa", không hỏi "được đụng dữ liệu của ai" — đúng thứ đã để một sale đọc trọn
 * danh sách khách của cơ sở khác suốt nhiều tháng.
 */
export async function danhDauTraoQua(
  ma: string,
  luotId: number,
  daTrao: boolean,
): Promise<{ ok: boolean }> {
  const nguoi = await batBuocDangNhap();
  const ct = timTheoMaVongQuay(ma, phamViCua(nguoi));
  if (!ct) return { ok: false };
  const ok = danhDauDaTrao(luotId, daTrao);
  revalidatePath(`/quan-tri/vong-quay/${ma}`);
  return { ok };
}

export interface KetQuaSuaVongQuay {
  loi?: string[];
  xong?: boolean;
}

/** Ô gửi lên khi sửa: có `id` là ô đang có, không có `id` là ô mới thêm. */
export interface OSua extends OKhai {
  id?: number;
}

export interface SuaVongQuayKhai {
  ma: string;
  tenDot: string;
  dsO: OSua[];
}

/**
 * SỬA MỘT CHƯƠNG TRÌNH VÒNG QUAY ĐANG CHẠY.
 *
 * 🔴 Chương trình và danh sách ô sửa trong MỘT giao dịch. Tách ra thì một lỗi giữa
 * chừng để lại chương trình có mặt vòng nửa vời — trong khi mã QR đã in ra dán ở
 * quầy và phụ huynh đang quét vào.
 *
 * 🔴 Ba thứ CỐ Ý không cho sửa, đúng luật đã ghi ở `lib/chuong-trinh/kho.ts`: `ma`
 * (mã QR đã in ra giấy), `coSoId`, `cheDo`. Đổi bất kỳ cái nào là một chương trình
 * KHÁC, không phải bản sửa — và lịch sử lượt quay cũ sẽ treo lơ lửng giữa hai thân
 * phận.
 *
 * 🔴 Lượt quay ĐÃ GHI không bị đụng tới. Chúng mang ảnh chụp tên ô (`o_ten`) và ảnh
 * chụp mặt vòng (`cung_json`) của đúng lúc quay — đó là sự thật của ngày hôm đó.
 */
export async function suaVongQuay(khai: SuaVongQuayKhai): Promise<KetQuaSuaVongQuay> {
  const nguoi = await batBuocDangNhap();
  // Đọc qua cửa CÓ phạm vi: sale cơ sở này không sửa được chương trình cơ sở kia
  // dù họ gõ đúng mã.
  const ct = timTheoMaVongQuay(khai.ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) return { loi: [T.suaVongQuayKhongThay] };

  const loi = kiemVongQuay({
    coSoId: ct.coSoId,
    tenDot: khai.tenDot,
    dsO: khai.dsO,
  });
  if (loi.length > 0) return { loi };

  const cu = danhSachO(ct.id);
  const giuLai = new Set(khai.dsO.map((o) => o.id).filter((id): id is number => id != null));

  // 🔴 Chặn TRƯỚC khi mở giao dịch: ô đã trao là chứng cứ đối soát khi phụ huynh
  // khiếu nại phần quà. Báo rõ lý do chứ không im lặng bỏ qua — người vận hành bấm
  // Lưu rồi thấy ô vẫn còn mà không hiểu vì sao là cách chắc chắn để họ mất tin.
  const daTraoMaBiXoa = cu.filter((o) => !giuLai.has(o.id) && o.daTrao > 0);
  if (daTraoMaBiXoa.length > 0) {
    return { loi: daTraoMaBiXoa.map((o) => T.suaVongQuayODaTrao(o.ten, o.daTrao)) };
  }

  const db = csdl();
  db.exec("BEGIN IMMEDIATE");
  try {
    chay(
      "update chuong_trinh set ten_giai_thuong = ?, ten_trung_tam = ?, sua_luc = ? where id = ?",
      khai.tenDot.trim(),
      khai.tenDot.trim(),
      Date.now(),
      ct.id,
    );

    // Xoá ô bị bỏ (đã chắc chắn chưa trao cái nào), sửa ô còn giữ, thêm ô mới.
    // Cả ba hàm đều TỰ GỌI `tangPhienBanO` — không tăng thì lượt cũ và lượt mới
    // mang cùng một số phiên bản trong khi mặt vòng đã khác, và nút "Dựng lại ván"
    // vẽ ra một vòng CHƯA TỪNG TỒN TẠI.
    for (const o of cu) {
      if (!giuLai.has(o.id)) xoaO(ct.id, o.id);
    }
    for (const o of khai.dsO) {
      const than = {
        ten: o.ten.trim(),
        thuTu: o.thuTu,
        soLuong: o.soLuong,
        tranMoiNgay: o.tranMoiNgay,
        tiLeTrung: o.tiLeTrung,
        mau: o.mau,
      };
      if (o.id == null) themO(ct.id, than);
      else suaO(ct.id, o.id, than);
    }

    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.suaChuongTrinh,
    doiTuong: `vong-quay:${ct.ma}`,
  });
  revalidatePath(`/quan-tri/vong-quay/${ct.ma}`);
  return { xong: true };
}
