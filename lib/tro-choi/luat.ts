import "server-only";

import type { TroChoi } from "@/config/to-chuc";
import type { ChuongTrinh } from "@/lib/chuong-trinh/kho";
import type { KetQuaGhiLanBam } from "@/lib/van/kho-van";
import { luatTrungSo } from "@/lib/tro-choi/luat-trung-so";

/**
 * LUẬT CHƠI — chỗ DUY NHẤT hai game khác nhau ở phía máy chủ.
 *
 * 🔴 Vì sao rẽ nhánh bằng một bảng tra chứ không bằng `if` rải khắp
 * `luot-service.ts`: xương sống chống gian lận phải giống hệt nhau ở mọi game —
 * cùng một phép kẹp `DUNG_SAI_MS`, cùng một câu `UPDATE ... WHERE ket_thuc_luc
 * IS NULL` phân xử "ai bấm trước". Viết hai bản của đoạn đó là mở đường cho
 * chúng lệch nhau vào đúng ngày ai đó vá một bên.
 *
 * Ngược lại, GIAO DIỆN của hai game rẽ bằng hai bộ component riêng — chúng gần
 * như không có gì chung để mà chia sẻ. Hai tầng, hai kiểu rẽ, cố ý khác nhau.
 */

/** Kết quả chấm MỘT lần bấm. Hình dạng chung cho mọi game. */
export interface KetQuaCham {
  /** Con số chốt lại — thứ người chơi nhìn thấy trên bảng LED. */
  soDaDung: number;
  trung: boolean;
  khoangLech: number;
  maXacThuc: string;
  hetGio: boolean;
}

/** Thứ luật cần kiểm trước khi mở lượt, và thứ nó gửi kèm cho hai màn hình. */
export interface KetQuaTruocKhiMo {
  /**
   * Câu lỗi tiếng Việt ⇒ KHÔNG mở lượt. Ví dụ: dải số đã phát hết, hoặc đang có
   * người khác đang giữa lượt.
   */
  loi?: string;
  /**
   * Phần đuôi riêng của từng game, đính vào tin "bắt đầu" và giữ nguyên cho tới
   * lúc chấm. Với CHỌN SỐ đây là ảnh chụp của VÒNG CHẠY — chốt tại lúc mở để ba
   * nơi (máy chủ + hai màn hình) cùng tính ra một con số.
   */
  keo?: unknown;
}

export interface LuatChoi {
  truocKhiMo(ct: ChuongTrinh): KetQuaTruocKhiMo;
  /**
   * Chấm một lần bấm tại giây thứ `giay` kể từ lúc dãy số bắt đầu chạy.
   * Trả `null` ⇒ TỪ CHỐI lượt này, không ghi gì cả.
   *
   * 🔴 KHÔNG nhận `keo` từ `truocKhiMo`. Với CHỌN SỐ, luật "mỗi lúc một lượt"
   * đảm bảo tập số đã phát KHÔNG đổi giữa lúc mở và lúc chốt, nên đọc lại từ
   * kho cho cùng một kết quả — mà lại không phải nuôi một ảnh chụp sống lửng lơ
   * giữa hai lời gọi, thứ sẽ sai lặng lẽ vào ngày ai đó bỏ luật một-lượt.
   * `keo` chỉ để gửi cho HAI MÀN HÌNH qua SSE.
   */
  cham(ct: ChuongTrinh, giay: number, hetGio: boolean): KetQuaCham | null;
  /** Ghi kết quả vào VÁN — đơn vị nhận giải. */
  ghiVan(vanId: number, luotId: number, k: KetQuaCham): KetQuaGhiLanBam | null;
}

/**
 * Bảng tra. Game chưa khai luật thì NÉM, không rơi về luật của game khác.
 *
 * 🔴 Fail-closed là bắt buộc ở đây. Cho `chon_so` rơi về luật Trúng Số nghĩa là
 * nó chạy `resolveRound` với `so_trung = 0`, ghi `trung = 1` mỗi khi số ra đúng
 * 0, rồi bốc quà trên một kho rỗng — và không một dòng lỗi nào báo.
 */
const BANG: Partial<Record<TroChoi, LuatChoi>> = {
  trung_so: luatTrungSo,
};

export function luatCua(troChoi: TroChoi): LuatChoi {
  const luat = BANG[troChoi];
  if (!luat) throw new Error(`Chưa khai luật chơi cho trò "${troChoi}"`);
  return luat;
}
