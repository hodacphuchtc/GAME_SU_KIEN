import "server-only";

import { layMot } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";
import { soGiaiHomNay } from "./kho-luot";

/**
 * Hai cái van giữ cho chương trình không vỡ ngân sách.
 *
 * 1. **Một lượt mỗi số điện thoại mỗi ngày.** Không có van này thì ai kiên trì
 *    bấm sẽ trúng, và sự khan hiếm — thứ làm trò chơi hấp dẫn — biến mất.
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

  const daChoi = layMot<{ so: number }>(
    `select count(*) as so
       from luot_choi
      where chuong_trinh_id = ? and nguoi_choi_id = ? and ngay = ?
        and ket_thuc_luc is not null`,
    chuongTrinhId,
    nguoiChoiId,
    ngayVietNam(),
  );

  if ((daChoi?.so ?? 0) >= 1) {
    return {
      choPhep: false,
      chiVui,
      lyDo: "Mỗi số điện thoại chơi một lượt mỗi ngày. Hẹn bạn ngày mai nhé!",
    };
  }
  return { choPhep: true, chiVui };
}
