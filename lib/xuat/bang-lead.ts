import "server-only";

import { T } from "@/config/locale";
import type { Lead } from "@/lib/lead/kho";
import { chu, gio, type TrangTinh } from "@/lib/xuat/xlsx";

/**
 * Khách tiềm năng → trang tính.
 *
 * 🔴 Xuất ĐÚNG những dòng đang hiện trên màn (bộ lọc đã áp), không phải "toàn
 * bộ". Người bấm nút vừa lọc CS2 + trạng thái Mới thì họ muốn đúng danh sách đó
 * — đưa cả nghìn dòng là buộc họ lọc lại một lần nữa trong Excel, và tệ hơn là
 * mang dữ liệu của cơ sở khác ra khỏi hệ thống mà không ai định làm vậy.
 *
 * Số điện thoại đi qua `chu()` để giữ số 0 đầu.
 */
export function bangLead(ten: string, dong: readonly Lead[]): TrangTinh {
  return {
    ten,
    tieuDe: [
      T.leadName,
      T.leadPhone,
      T.leadBranch,
      T.leadGameDau,
      T.leadOwner,
      T.leadState,
      T.leadConsent,
      T.leadChuaXacThuc,
      T.leadGhiChu,
      T.leadCreated,
    ],
    dong: dong.map((l) => [
      chu(l.hoTen),
      chu(l.soDienThoai),
      chu(l.tenCoSo),
      chu(l.troChoiDau === null ? null : (T.tenTroChoi[l.troChoiDau] ?? l.troChoiDau)),
      chu(l.tenNhanVien),
      chu(T.trangThaiLead[l.trangThai] ?? l.trangThai),
      chu(l.dongYTuVan ? T.leadConsentYes : T.leadConsentNo),
      chu(l.chuaXacThuc ? "x" : ""),
      chu(l.ghiChu),
      gio(l.taoLuc),
    ]),
  };
}
