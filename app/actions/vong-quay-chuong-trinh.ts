"use server";

import { revalidatePath } from "next/cache";

import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { csdl } from "@/lib/db/ket-noi";
import { taoChuongTrinh, timTheoMaVongQuay } from "@/lib/chuong-trinh/kho";
import { themO } from "@/lib/vong-quay/kho-o";
import { danhDauDaTrao } from "@/lib/vong-quay/kho-luot-quay";
import { kiemVongQuay, type VongQuayKhai } from "@/lib/vong-quay/kiem-tra";

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
      tiLeODay: khai.tiLeODay,
    });
    for (const o of khai.dsO) {
      themO(ct.id, {
        ten: o.ten.trim(),
        thuTu: o.thuTu,
        soLuong: o.soLuong,
        tranMoiNgay: o.tranMoiNgay,
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
