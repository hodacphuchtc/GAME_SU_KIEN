import "server-only";

import { T } from "@/config/locale";
import type { DongLichSu } from "@/lib/luot/kho-luot";
import { chu, gio, so, type TrangTinh } from "@/lib/xuat/xlsx";

/**
 * Lịch sử ván chơi → trang tính.
 *
 * 🔴 Cột "Đồng ý nhận tư vấn" LUÔN có mặt. File này rời khỏi hệ thống và nằm
 * trong máy của đội sale; nếu nó không mang theo căn cứ hợp pháp để gọi điện
 * thì người cầm file không có cách nào biết được phép gọi cho ai.
 *
 * 🔴 Số điện thoại đi qua `chu()` chứ KHÔNG phải `so()`. Excel đọc số sẽ ăn mất
 * số 0 đầu và `0912345678` thành `912345678` — đúng lỗi mà CSV đang gây ra.
 */
export function bangLichSu(ten: string, dong: readonly DongLichSu[]): TrangTinh {
  return {
    ten,
    tieuDe: [
      T.colTime,
      T.colPlayer,
      T.leadPhone,
      T.colStopped,
      T.colResult,
      "Lệch",
      T.colDevice,
      T.colCode,
      T.colAwarded,
      T.colEnrolled,
      T.leadConsent,
      "Số lần bấm",
    ],
    dong: dong.map((d) => [
      gio(d.ketThucLuc),
      chu(d.hoTen),
      chu(d.soDienThoai),
      chu(d.soDaDung === null ? null : String(d.soDaDung).padStart(4, "0")),
      chu(d.trung ? T.resultWin : d.hetGio ? T.deviceTimeout : T.resultLose),
      so(d.khoangLech),
      chu(
        d.thietBiBam === "man_hinh"
          ? T.deviceScreen
          : d.thietBiBam === "dien_thoai"
            ? T.devicePhone
            : d.thietBiBam === "het_gio"
              ? T.deviceTimeout
              : null,
      ),
      chu(d.maXacThuc),
      chu(d.daTraoThuong ? "x" : ""),
      chu(d.daGhiDanh ? "x" : ""),
      chu(d.dongYTuVan ? T.leadConsentYes : T.leadConsentNo),
      so(d.soLanDaDung),
    ]),
  };
}
