import { DIFFICULTIES, WHEEL_SIZE, type DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import { SO_LAN_CHOI } from "@/config/to-chuc";

/**
 * Bộ kiểm THIẾT LẬP chương trình — dùng chung cho cả TẠO và SỬA.
 *
 * 🔴 Vì sao tách ra: từ GĐ 24 có hai đường vào cùng một bộ dữ liệu. Để mỗi
 * đường tự viết luật của mình thì hai luật chỉ lệch nhau vào đúng ngày ai đó
 * sửa một bên — và bên lỏng hơn sẽ là bên người ta dùng để lách.
 *
 * Hàm THUẦN: không đọc CSDL, không đụng phiên. Ràng buộc cần tra kho (cơ sở có
 * tồn tại không, có đang bật không) nằm ở server action, vì chúng khác nhau
 * giữa tạo và sửa: **sửa KHÔNG đổi cơ sở** — đổi cơ sở là một chương trình khác.
 */

export interface ThietLapChuongTrinh {
  soTrung: number;
  mucDo: DifficultyId;
  tenGiaiThuong: string;
  tranGiaiMoiNgay: number;
  soLanChoi: number;
}

/** Trả câu lỗi tiếng Việt, hoặc `null` nếu hợp lệ. */
export function kiemThietLap(d: ThietLapChuongTrinh): string | null {
  if (d.tenGiaiThuong.trim() === "") return T.createErrPrize;

  if (!Number.isFinite(d.soTrung) || d.soTrung < 0 || d.soTrung >= WHEEL_SIZE) {
    return T.createErrTarget;
  }

  if (!(d.mucDo in DIFFICULTIES)) return T.createErrLevel;

  if (!Number.isFinite(d.tranGiaiMoiNgay) || d.tranGiaiMoiNgay < 0) {
    return T.createErrCap;
  }

  if (
    !Number.isFinite(d.soLanChoi) ||
    d.soLanChoi < SO_LAN_CHOI.toiThieu ||
    d.soLanChoi > SO_LAN_CHOI.toiDa
  ) {
    return T.createErrTries(SO_LAN_CHOI.toiThieu, SO_LAN_CHOI.toiDa);
  }

  return null;
}
