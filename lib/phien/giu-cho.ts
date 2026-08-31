import "server-only";

import { ROOM_HOLD_SECONDS } from "@/config/game";
import { chay, layMot } from "@/lib/db/truy-van";

/**
 * Giữ chỗ: mỗi chương trình MỘT màn hình và MỘT người chơi tại một thời điểm.
 *
 * Trọng tài là chính SQLite. Câu `UPDATE ... WHERE (chỗ trống hoặc đã hết hạn)`
 * chạy trọn vẹn hoặc không chạy — không có khe hở cho hai máy cùng chen vào.
 * Số dòng bị đổi bằng 0 nghĩa là thua cuộc, không cần khoá, không cần hàng đợi.
 *
 * Chỗ có HẠN: điện thoại tắt màn hình rồi bỏ đi thì chỗ phải tự nhả, nếu không
 * cả buổi chiều không ai chơi được nữa mà chẳng ai hiểu vì sao.
 */

export type LoaiCho = "man_hinh" | "nguoi_choi";

const COT: Record<LoaiCho, { token: string; han: string }> = {
  man_hinh: { token: "token_man_hinh", han: "han_man_hinh" },
  nguoi_choi: { token: "token_nguoi_choi", han: "han_nguoi_choi" },
};

export interface KetQuaGiuCho {
  duoc: boolean;
  /** Còn bao nhiêu mili-giây nữa chỗ hiện tại mới hết hạn (khi bị từ chối). */
  conBanBao?: number;
}

export function giuCho(ma: string, loai: LoaiCho, token: string): KetQuaGiuCho {
  const { token: cotToken, han: cotHan } = COT[loai];
  const bayGio = Date.now();
  const hetHan = bayGio + ROOM_HOLD_SECONDS * 1000;

  const doi = chay(
    `update chuong_trinh
        set ${cotToken} = ?, ${cotHan} = ?, sua_luc = ?
      where ma = ?
        and trang_thai = 'dang_chay'
        and (${cotToken} is null or ${cotToken} = ? or ${cotHan} < ?)`,
    token,
    hetHan,
    bayGio,
    ma,
    token,
    bayGio,
  );

  if (doi > 0) return { duoc: true };

  const dong = layMot<{ han: number | null }>(
    `select ${cotHan} as han from chuong_trinh where ma = ?`,
    ma,
  );
  return { duoc: false, conBanBao: Math.max(0, (dong?.han ?? bayGio) - bayGio) };
}

/** Gia hạn chỗ đang giữ — gọi khi máy còn sống và đang chơi. */
export function giaHanCho(ma: string, loai: LoaiCho, token: string): boolean {
  const { token: cotToken, han: cotHan } = COT[loai];
  return (
    chay(
      `update chuong_trinh set ${cotHan} = ? where ma = ? and ${cotToken} = ?`,
      Date.now() + ROOM_HOLD_SECONDS * 1000,
      ma,
      token,
    ) > 0
  );
}

export function nhaCho(ma: string, loai: LoaiCho, token: string): boolean {
  const { token: cotToken, han: cotHan } = COT[loai];
  return (
    chay(
      `update chuong_trinh set ${cotToken} = null, ${cotHan} = null where ma = ? and ${cotToken} = ?`,
      ma,
      token,
    ) > 0
  );
}

export function dangGiuCho(ma: string, loai: LoaiCho, token: string): boolean {
  const { token: cotToken, han: cotHan } = COT[loai];
  return (
    layMot<{ co: number }>(
      `select 1 as co from chuong_trinh where ma = ? and ${cotToken} = ? and ${cotHan} >= ?`,
      ma,
      token,
      Date.now(),
    ) !== undefined
  );
}

/**
 * Nhả chỗ mà KHÔNG cần token — chỉ máy chủ gọi sau khi ván đã chốt xong.
 * Không mở hàm này ra cho máy khách: ai cũng gọi được thì ai cũng đá được
 * người đang chơi ra giữa chừng.
 */
export function nhaChoBatKe(ma: string, loai: LoaiCho): boolean {
  const { token: cotToken, han: cotHan } = COT[loai];
  return (
    chay(
      `update chuong_trinh set ${cotToken} = null, ${cotHan} = null where ma = ?`,
      ma,
    ) > 0
  );
}
