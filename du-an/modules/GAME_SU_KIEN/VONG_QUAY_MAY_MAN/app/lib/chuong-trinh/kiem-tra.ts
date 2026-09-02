import {
  SAN_CUNG_O_DAY,
  SO_O_TOI_DA,
  SO_O_TOI_THIEU,
  TRAN_TI_LE_O_DAY,
} from "@/config/vong-quay";

/**
 * KIỂM TRA khai báo chương trình — hàm THUẦN, không đụng cơ sở dữ liệu.
 *
 * Tách thuần có chủ đích: đây là cửa duy nhất chặn một chương trình hỏng lọt
 * vào hệ thống, nên nó phải kiểm được bằng bảng tra, chạy hàng trăm ca trong
 * một phần nghìn giây, và không cần dựng CSDL để trả lời câu "quên khai ô đáy
 * thì chuyện gì xảy ra".
 *
 * Trả về DANH SÁCH lỗi tiếng Việt, rỗng nghĩa là hợp lệ. Trả cả danh sách chứ
 * không dừng ở lỗi đầu tiên: bắt người ta sửa một lỗi rồi mới cho biết lỗi tiếp
 * theo là cách chắc chắn để họ bỏ cuộc giữa chừng.
 */

export interface OKhai {
  ten: string;
  /** `null` = ô đáy, không giới hạn. */
  soLuong: number | null;
  tranMoiNgay: number;
  mau: string;
  thuTu: number;
}

export interface ChuongTrinhKhai {
  tenCoSo: string;
  tiLeODay: number;
  tranGiaiMoiNgay: number;
  dsO: OKhai[];
}

/** Bỏ khoảng trắng thừa và không phân biệt hoa thường, để so tên cho công bằng. */
function chuanHoaTen(ten: string): string {
  return ten.trim().replace(/\s+/g, " ").toLowerCase();
}

export function kiemTraChuongTrinh(k: ChuongTrinhKhai): string[] {
  const loi: string[] = [];

  if (!k.tenCoSo.trim()) loi.push("Chưa nhập tên cơ sở.");

  if (k.tranGiaiMoiNgay < 0) loi.push("Trần giải mỗi ngày không được là số âm.");

  if (k.tiLeODay < SAN_CUNG_O_DAY || k.tiLeODay > TRAN_TI_LE_O_DAY) {
    loi.push(
      `Tỉ lệ ô an ủi phải nằm trong khoảng ${Math.round(SAN_CUNG_O_DAY * 100)}%–` +
        `${Math.round(TRAN_TI_LE_O_DAY * 100)}%. Thấp quá thì kho quà thật cạn sau một ` +
        "buổi; cao quá thì vòng quay chỉ còn là một cái nút bấm.",
    );
  }

  if (k.dsO.length < SO_O_TOI_THIEU) {
    loi.push(
      `Phải có ít nhất ${SO_O_TOI_THIEU} ô. Dưới hai ô thì kết quả đã biết trước ` +
        "khi bấm, nút QUAY chỉ còn là đồ trang trí.",
    );
  }

  if (k.dsO.length > SO_O_TOI_DA) {
    loi.push(
      `Nhiều nhất ${SO_O_TOI_DA} ô. Quá số đó thì chữ trên vòng quá nhỏ, người ` +
        "đứng cuối sảnh chỉ thấy một vành màu.",
    );
  }

  // 🔴 Cửa quan trọng nhất của cả hàm.
  if (!k.dsO.some((o) => o.soLuong === null)) {
    loi.push(
      "Phải có ít nhất MỘT ô để trống số lượng (ô an ủi, không giới hạn). Thiếu " +
        "nó thì hết quà là hết trò: vòng quay rỗng ngay giữa lúc có phụ huynh " +
        "đang đứng trước màn hình.",
    );
  }

  const daThay = new Set<string>();
  for (const [i, o] of k.dsO.entries()) {
    const stt = i + 1;
    if (!o.ten.trim()) {
      loi.push(`Ô số ${stt} chưa có tên.`);
    } else {
      const chuan = chuanHoaTen(o.ten);
      if (daThay.has(chuan)) {
        loi.push(
          `Ô số ${stt} trùng tên với một ô khác ("${o.ten.trim()}"). Hai ô cùng tên ` +
            "thì lịch sử quay không nói được người ta đã nhận cái nào.",
        );
      }
      daThay.add(chuan);
    }

    if (o.soLuong !== null && o.soLuong <= 0) {
      loi.push(
        `Ô số ${stt} khai số lượng ${o.soLuong}. Muốn không giới hạn thì để TRỐNG ô ` +
          "số lượng, đừng điền 0 — số 0 nghĩa là hết hàng ngay từ đầu.",
      );
    }

    if (o.tranMoiNgay < 0) loi.push(`Ô số ${stt} có trần mỗi ngày là số âm.`);

    if (o.soLuong !== null && o.tranMoiNgay > o.soLuong) {
      loi.push(
        `Ô số ${stt} có trần mỗi ngày (${o.tranMoiNgay}) lớn hơn tổng số lượng ` +
          `(${o.soLuong}) — cái trần đó không bao giờ chặn được gì.`,
      );
    }
  }

  return loi;
}
