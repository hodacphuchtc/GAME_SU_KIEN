import "server-only";

import { T } from "@/config/locale";
import type { DongXuatQuay } from "@/lib/vong-quay/kho-luot-quay";
import { chu, gio, type TrangTinh } from "@/lib/xuat/xlsx";

/**
 * Lịch sử lượt quay → trang tính.
 *
 * 🔴 Cột "Đồng ý nhận tư vấn" LUÔN có mặt. File này rời khỏi hệ thống và nằm
 * trong máy của đội sale; nếu nó không mang theo căn cứ hợp pháp để gọi điện thì
 * người cầm file không có cách nào biết được phép gọi cho ai.
 *
 * 🔴 Số điện thoại đi qua `chu()` chứ KHÔNG phải `so()`. Excel đọc số sẽ ăn mất
 * số 0 đầu và `0912345678` thành `912345678`.
 *
 * 🔴 Cột phần quà lấy từ ẢNH CHỤP trong `luot_quay`, không join sang danh mục ô
 * hiện tại — nếu không thì đổi tên một ô là mọi dòng Excel cũ đổi theo, và đây
 * chính là file dùng để đối soát với phụ huynh.
 */
export function bangVongQuay(ten: string, dong: readonly DongXuatQuay[]): TrangTinh {
  return {
    ten,
    tieuDe: [
      T.colTime,
      T.colPlayer,
      T.leadPhone,
      T.vongQuayCotO,
      T.colCode,
      T.colAwarded,
      T.leadConsent,
    ],
    dong: dong.map((d) => [
      gio(d.luc),
      chu(d.hoTen),
      chu(d.soDienThoai),
      chu(d.oTen),
      chu(d.maXacThuc),
      chu(d.daTraoThuong ? "x" : ""),
      chu(d.dongYTuVan ? T.leadConsentYes : T.leadConsentNo),
    ]),
  };
}
