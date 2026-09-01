import "server-only";

import { T } from "@/config/locale";
import { soVanDaChot, vanDangMo } from "@/lib/van/kho-van";
import { soGiaiHomNay } from "./kho-luot";

/**
 * Hai cái van giữ cho chương trình không vỡ ngân sách.
 *
 * 1. **Một VÁN mỗi số điện thoại mỗi ngày.** Không có van này thì ai kiên trì
 *    bấm sẽ trúng, và sự khan hiếm — thứ làm trò chơi hấp dẫn — biến mất.
 *
 *    🔴 Đếm theo VÁN, không theo LƯỢT. Từ GĐ 12 một ván có tới 5 lần bấm; đếm
 *    theo lượt thì chính lần bấm THỨ HAI của ván đang chơi bị luật này chặn, và
 *    người chơi mất lượt giữa chừng mà không ai hiểu vì sao.
 * 2. **Trần giải mỗi ngày.** Chạm trần thì chương trình chuyển sang CHẾ ĐỘ CHỈ
 *    VUI: vẫn chơi, vẫn ghi lịch sử, nhưng màn hình nói thẳng là hết quà. Thà
 *    nói trước còn hơn để phụ huynh trúng rồi mới bảo không còn gì để trao.
 */

export interface KetQuaKiemGioiHan {
  choPhep: boolean;
  lyDo?: string;
  /** Hết quà trong ngày — vẫn cho chơi nhưng không còn giải để trao. */
  chiVui: boolean;
}

export function kiemGioiHan(
  chuongTrinhId: number,
  nguoiChoiId: number | null,
  tranGiaiMoiNgay: number,
): KetQuaKiemGioiHan {
  const chiVui = tranGiaiMoiNgay > 0 && soGiaiHomNay(chuongTrinhId) >= tranGiaiMoiNgay;

  if (nguoiChoiId === null) return { choPhep: true, chiVui };

  // Ván đang dở thì cho đi tiếp — nó là ván ĐÃ được tính rồi, chưa phải ván thứ hai.
  if (vanDangMo(chuongTrinhId, nguoiChoiId)) return { choPhep: true, chiVui };

  if (soVanDaChot(chuongTrinhId, nguoiChoiId) >= 1) {
    return { choPhep: false, chiVui, lyDo: T.phoneOneVanADay };
  }
  return { choPhep: true, chiVui };
}
