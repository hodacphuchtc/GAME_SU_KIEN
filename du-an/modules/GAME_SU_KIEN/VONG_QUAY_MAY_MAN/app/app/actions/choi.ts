"use server";

import { T } from "@/config/locale";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { conLuotHomNay, nhanDien, type NguoiChoi } from "@/lib/nguoi-choi/nhan-dien";

/**
 * Nhận diện phụ huynh trước khi quay (hạng mục 3.2).
 *
 * 🔴 Form họ tên + SĐT chạy TRƯỚC ván chơi, không phải sau. Lý do đã chốt ở app
 * Trúng Số: màn thua không tặng gì cả, nên nếu để form sau ván thì người không
 * trúng bỏ đi và ta mất luôn thông tin — trong khi đó chính là thứ chương trình
 * này tồn tại để thu.
 */

export interface KetQuaVaoChoi {
  nguoiChoi?: NguoiChoi;
  loi?: string;
}

export async function vaoChoiForm(
  _truoc: KetQuaVaoChoi,
  form: FormData,
): Promise<KetQuaVaoChoi> {
  const ma = String(form.get("ma") ?? "");
  const ct = timTheoMa(ma);
  if (!ct) return { loi: T.choiKhongThayChuongTrinh };
  if (ct.trangThai !== "dang_chay") return { loi: T.choiDaKetThuc };

  const kq = nhanDien(
    String(form.get("hoTen") ?? ""),
    String(form.get("soDienThoai") ?? ""),
    form.get("dongYTuVan") === "on",
  );
  if (kq.loi || !kq.nguoiChoi) return { loi: kq.loi };

  // 🔴 Kiểm giới hạn SAU khi đã nhận diện, không phải trước: phải biết đây là
  // AI thì mới đếm được lượt của họ. Và hồ sơ vẫn được ghi/cập nhật kể cả khi
  // hết lượt — người đã tới quầy thì thông tin của họ vẫn có giá trị.
  if (!conLuotHomNay(ct.id, kq.nguoiChoi.id)) return { loi: T.choiHetLuot };

  return { nguoiChoi: kq.nguoiChoi };
}
