import "server-only";

import { T } from "@/config/locale";
import type { DongLichSu } from "@/lib/luot/kho-luot";
import { chu, gio, type TrangTinh } from "@/lib/xuat/xlsx";

/**
 * Lịch sử game CHỌN SỐ → trang tính.
 *
 * 🔴 Cố ý KHÔNG dùng chung `bangLichSu`: bảng kia có cột "Kết quả" và "Lệch",
 * và với Chọn Số nó sẽ ghi **"Trượt" trên MỌI dòng** rồi gửi file đó cho đội
 * sale — một trò không có giải mà báo cáo nói ai cũng trượt.
 *
 * 🔴 Số may mắn đi qua `chu()` chứ KHÔNG phải `so()`. Excel đọc số sẽ ăn mất số
 * 0 đầu và `0042` thành `42` — mà con số phụ huynh cầm trên tay là `0042`.
 * Cùng lý do với cột số điện thoại bên `bang-lich-su.ts`.
 */
export function bangSoDaChon(ten: string, dong: readonly DongLichSu[]): TrangTinh {
  return {
    ten,
    tieuDe: [
      T.colTime,
      T.colPlayer,
      T.leadPhone,
      T.chonSoCotSo,
      T.colCode,
      T.colAwarded,
      T.colEnrolled,
      T.leadConsent,
    ],
    dong: dong.map((d) => [
      gio(d.ketThucLuc),
      chu(d.hoTen),
      chu(d.soDienThoai),
      chu(d.soDaDung === null ? null : String(d.soDaDung).padStart(4, "0")),
      chu(d.maXacThuc),
      chu(d.daTraoThuong ? "x" : ""),
      chu(d.daGhiDanh ? "x" : ""),
      chu(d.dongYTuVan ? T.leadConsentYes : T.leadConsentNo),
    ]),
  };
}
