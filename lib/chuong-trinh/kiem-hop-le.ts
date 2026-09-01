import { DAI_TOI_DA, DAI_TOI_THIEU, SO_LUONG_TOI_THIEU } from "@/config/chon-so";
import { DIFFICULTIES, WHEEL_SIZE, type DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import { SO_LAN_CHOI } from "@/config/to-chuc";

/**
 * Bộ kiểm THIẾT LẬP chương trình — dùng chung cho cả TẠO và SỬA.
 *
 * 🔴 Vì sao tách ra: từ GĐ 24 có hai đường vào cùng một bộ dữ liệu. Để mỗi
 * đường tự viết luật của mình thì hai luật chỉ lệch nhau vào đúng ngày ai đó
 * sửa một bên — và bên lỏng hơn sẽ là bên người ta dùng để lách.
 *
 * Hàm THUẦN: không đọc CSDL, không đụng phiên. Ràng buộc cần tra kho (cơ sở có
 * tồn tại không, có đang bật không) nằm ở server action, vì chúng khác nhau
 * giữa tạo và sửa: **sửa KHÔNG đổi cơ sở** — đổi cơ sở là một chương trình khác.
 */

export interface ThietLapChuongTrinh {
  soTrung: number;
  mucDo: DifficultyId;
  tenGiaiThuong: string;
  tranGiaiMoiNgay: number;
  soLanChoi: number;
}

/** Trả câu lỗi tiếng Việt, hoặc `null` nếu hợp lệ. */
export function kiemThietLap(d: ThietLapChuongTrinh): string | null {
  if (d.tenGiaiThuong.trim() === "") return T.createErrPrize;

  if (!Number.isFinite(d.soTrung) || d.soTrung < 0 || d.soTrung >= WHEEL_SIZE) {
    return T.createErrTarget;
  }

  if (!(d.mucDo in DIFFICULTIES)) return T.createErrLevel;

  if (!Number.isFinite(d.tranGiaiMoiNgay) || d.tranGiaiMoiNgay < 0) {
    return T.createErrCap;
  }

  if (
    !Number.isFinite(d.soLanChoi) ||
    d.soLanChoi < SO_LAN_CHOI.toiThieu ||
    d.soLanChoi > SO_LAN_CHOI.toiDa
  ) {
    return T.createErrTries(SO_LAN_CHOI.toiThieu, SO_LAN_CHOI.toiDa);
  }

  return null;
}

/**
 * Thiết lập của một chương trình CHỌN SỐ.
 *
 * Không có `soTrung`, không có `tranGiaiMoiNgay`, không có `soLanChoi` — game
 * này không có số trúng, không có quà trong máy, và mỗi ván đúng một lần bấm.
 * `tenGiaiThuong` được dùng lại làm **tên đợt phát quà**, thứ in trên tờ QR dán
 * ở quầy.
 */
export interface ThietLapChonSo {
  daiTu: number;
  daiDen: number;
  loaiTruDaRa: boolean;
  tenGiaiThuong: string;
}

/**
 * Bộ kiểm dải số — dùng chung cho cả TẠO và SỬA, cùng lý do với `kiemThietLap`:
 * để mỗi đường tự viết luật của mình thì bên lỏng hơn sẽ là bên người ta dùng
 * để lách.
 */
export function kiemThietLapChonSo(d: ThietLapChonSo): string | null {
  if (d.tenGiaiThuong.trim() === "") return T.createErrPrize;

  if (!Number.isInteger(d.daiTu) || !Number.isInteger(d.daiDen)) {
    return T.chonSoErrDaiNguyen;
  }

  // 🔴 Trần là WHEEL_SIZE − 1. Bảng LED chỉ có 4 chữ số và `formatNumber` lấy dư
  // theo WHEEL_SIZE, nên số 10042 hiện ra thành 0042 — trùng số 42 của người
  // khác, và KHÔNG có một dòng lỗi nào ở đâu cả.
  if (d.daiTu < DAI_TOI_THIEU || d.daiDen > DAI_TOI_DA) {
    return T.chonSoErrDaiBien(DAI_TOI_THIEU, DAI_TOI_DA);
  }

  if (d.daiTu > d.daiDen) return T.chonSoErrDaiNguoc;

  // Dải một số thì nút DỪNG là đồ trang trí: bấm lúc nào cũng ra đúng số đó.
  if (d.daiDen - d.daiTu + 1 < SO_LUONG_TOI_THIEU) {
    return T.chonSoErrDaiNgan(SO_LUONG_TOI_THIEU);
  }

  return null;
}
