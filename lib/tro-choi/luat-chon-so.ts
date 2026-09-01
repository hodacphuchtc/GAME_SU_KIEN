import "server-only";

import { T } from "@/config/locale";
import { coDai, nhipCua, soTaiGiay, vongChay, type DaiSo } from "@/lib/chon-so/vong-so";
import type { ChuongTrinh } from "@/lib/chuong-trinh/kho";
import { coLuotDangMo, soDaRa } from "@/lib/luot/kho-luot";
import { verifyCode } from "@/lib/ma-xac-thuc";
import { ghiLanChonSo, type KetQuaGhiLanBam } from "@/lib/van/kho-van";
import type { KetQuaCham, KetQuaTruocKhiMo, LuatChoi } from "@/lib/tro-choi/luat";

/**
 * Luật của game CHỌN SỐ.
 *
 * Không có số trúng, không có thua, không có kho quà. Ai bấm cũng ra một số, và
 * số đó ứng với phần quà đã đánh số chuẩn bị sẵn bên ngoài.
 */

/** Ảnh chụp vòng chạy, gửi cho hai màn hình để chúng vẽ đúng dãy máy chủ chấm. */
export interface KeoChonSo {
  dai: DaiSo;
  daRa: number[];
}

export function daiCua(ct: ChuongTrinh): DaiSo {
  return { tu: ct.daiTu, den: ct.daiDen };
}

/**
 * Tập số phải loại khỏi vòng chạy.
 *
 * Loại trừ TẮT ⇒ tập rỗng ⇒ trùng số là hợp lệ, và đó là đúng: khi mỗi số ứng
 * với một LOẠI quà có nhiều món thì hai người cùng ra số 7 đều nhận được áo.
 */
export function daRaCua(ct: ChuongTrinh): Set<number> {
  if (!ct.loaiTruDaRa) return new Set();
  return soDaRa(ct.id, ct.daiTu, ct.daiDen);
}

/** Còn bao nhiêu số chưa phát. `null` khi không bật loại trừ — đếm là vô nghĩa. */
export function soConLai(ct: ChuongTrinh): number | null {
  if (!ct.loaiTruDaRa) return null;
  return coDai(daiCua(ct)) - daRaCua(ct).size;
}

export const luatChonSo: LuatChoi = {
  truocKhiMo(ct: ChuongTrinh): KetQuaTruocKhiMo {
    const dai = daiCua(ct);
    const daRa = daRaCua(ct);
    const vong = vongChay(dai, daRa);

    // Hết sạch số ⇒ CHẶN CỨNG. Cố ý không tái dùng cờ `chiVui` của Trúng Số
    // ("hết quà thì chơi cho vui"): ở đây không còn số thì không có gì để cho,
    // và cho người ta bấm rồi mới nói là tệ hơn nói trước.
    if (vong.length === 0) return { loi: T.chonSoHetSo };

    // 🔴 Mỗi lúc MỘT lượt. Hai người bấm cùng lúc sẽ cùng đọc một tập `daRa` và
    // có thể ra cùng một số — mà không một bài test đơn lẻ nào bắt được.
    const nhip = nhipCua(dai);
    if (coLuotDangMo(ct.id, Date.now() - nhip.roundLimitSeconds * 1000)) {
      return { loi: T.chonSoDangCoNguoiChoi };
    }

    const keo: KeoChonSo = { dai, daRa: [...daRa] };
    return { keo };
  },

  cham(ct: ChuongTrinh, giay: number, hetGio: boolean): KetQuaCham | null {
    // 🔴 Hết giờ ⇒ KHÔNG cấp số. Phép kẹp `Math.min/max` trong `dungLuot` quy
    // mọi lần "để hết giờ" về đúng một mốc thời gian, nên mọi người đều nhận
    // CÙNG MỘT con số. Ở Trúng Số đó chỉ là một số trượt nên không ai thấy; ở
    // đây đó là mười phụ huynh cùng cầm số 0037 đi nhận một phần quà.
    if (hetGio) return null;

    const dai = daiCua(ct);
    // Đọc lại tập số đã phát thay vì tin một ảnh chụp mang theo từ lúc mở:
    // luật "mỗi lúc một lượt" đảm bảo nó không đổi, và đọc lại thì không có
    // trạng thái nào sống lửng lơ giữa hai lời gọi để mà sai lặng lẽ.
    const vong = vongChay(dai, daRaCua(ct));
    if (vong.length === 0) return null;

    const so = soTaiGiay(nhipCua(dai), vong, giay);
    return {
      soDaDung: so,
      trung: false,
      khoangLech: 0,
      // Giữ mã xác thực cho MỌI kết quả: ở game này ai cũng cầm một con số đi
      // nhận quà, nên chụp màn hình của người khác là con đường gian lận hiển
      // nhiên nhất. Mã đổi theo phút, nhân viên soi trước khi đưa quà.
      //
      // Hạt là CHÍNH CON SỐ, không phải id chương trình: hai người cầm hai số
      // khác nhau thì mã cũng khác, nên không mượn mã của nhau được.
      maXacThuc: verifyCode(so),
      hetGio: false,
    };
  },

  ghiVan(vanId: number, luotId: number, k: KetQuaCham): KetQuaGhiLanBam | null {
    return ghiLanChonSo(vanId, luotId, k.maXacThuc);
  },
};
