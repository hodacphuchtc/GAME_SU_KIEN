import "server-only";

import { LUOT_MOI_NGUOI_MOI_NGAY } from "@/config/vong-quay";
import { layMot } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";

/**
 * AI CÒN ĐƯỢC QUAY — gom về một chỗ để mọi cửa (trang chơi, hành động máy chủ,
 * màn quản trị) hỏi cùng một câu và nhận cùng một câu trả lời. Mỗi nơi tự đếm
 * lấy thì sớm muộn chúng nói ba điều khác nhau về cùng một người.
 */

export function soLuotTrongNgay(
  chuongTrinhId: number,
  nguoiChoiId: number,
  ngay = ngayVietNam(),
): number {
  return (
    layMot<{ n: number }>(
      `select count(*) as n from luot_quay
        where chuong_trinh_id = ? and nguoi_choi_id = ? and ngay = ?`,
      chuongTrinhId,
      nguoiChoiId,
      ngay,
    )?.n ?? 0
  );
}

/**
 * Người này còn được quay hôm nay không.
 *
 * 🔴 Đếm theo TỪNG chương trình, không đếm toàn hệ thống: hai cơ sở khác nhau
 * là hai chương trình khác nhau, và một phụ huynh đưa con tới cả hai cơ sở thì
 * họ có quyền chơi ở cả hai. Đếm gộp là phạt oan đúng người đi lại nhiều nhất.
 */
export function conLuotHomNay(
  chuongTrinhId: number,
  nguoiChoiId: number,
  ngay = ngayVietNam(),
): boolean {
  return soLuotTrongNgay(chuongTrinhId, nguoiChoiId, ngay) < LUOT_MOI_NGUOI_MOI_NGAY;
}
