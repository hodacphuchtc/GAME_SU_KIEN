import "server-only";

import { resolveRound } from "@/lib/bo-dem";
import type { ChuongTrinh } from "@/lib/chuong-trinh/kho";
import { verifyCode } from "@/lib/ma-xac-thuc";
import { ghiLanBam, type KetQuaGhiLanBam } from "@/lib/van/kho-van";
import type { KetQuaCham, KetQuaTruocKhiMo, LuatChoi } from "@/lib/tro-choi/luat";

/**
 * Luật của game TRÚNG SỐ — bọc y nguyên phần đã chạy thật tại quầy từ v1.
 *
 * 🔴 File này KHÔNG được chứa một quyết định mới nào. Nó chỉ gói ba lời gọi sẵn
 * có (`resolveRound` · `verifyCode` · `ghiLanBam`) vào đúng hình dạng mà
 * `LuatChoi` đòi. Mọi thay đổi hành vi ở đây là thay đổi hành vi của trò chơi
 * đang phục vụ phụ huynh thật — và `ghiLanBam` là nơi quyết định ai nhận quà.
 */
export const luatTrungSo: LuatChoi = {
  truocKhiMo(): KetQuaTruocKhiMo {
    // Trúng Số không có điều kiện nào chặn việc mở lượt: trần giải mỗi ngày đã
    // được `kiemGioiHan` lo ở tầng trên, và hết quà thì vẫn cho chơi cho vui.
    return {};
  },

  cham(ct: ChuongTrinh, giay: number, hetGio: boolean): KetQuaCham {
    const r = resolveRound(ct.thamSo, ct.soTrung, giay, hetGio);
    return {
      soDaDung: r.value,
      trung: r.win,
      khoangLech: r.distance,
      maXacThuc: verifyCode(ct.soTrung),
      hetGio,
    };
  },

  ghiVan(vanId: number, luotId: number, k: KetQuaCham): KetQuaGhiLanBam | null {
    return ghiLanBam(vanId, luotId, k.khoangLech, k.soDaDung, k.trung, k.maXacThuc);
  },
};
