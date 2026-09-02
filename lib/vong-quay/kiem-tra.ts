import { SO_O_TOI_DA, SO_O_TOI_THIEU } from "@/config/vong-quay";
import { raPhanTram, tongDung } from "@/lib/vong-quay/ti-le";

/**
 * KIỂM TRA khai báo chương trình Vòng Quay — hàm THUẦN, không đụng cơ sở dữ liệu.
 *
 * Tách thuần có chủ đích: đây là cửa duy nhất chặn một chương trình hỏng lọt vào
 * hệ thống, nên nó phải kiểm được bằng bảng tra, chạy hàng trăm ca trong một
 * phần nghìn giây, và không cần dựng CSDL để trả lời câu "quên khai ô đáy thì
 * chuyện gì xảy ra".
 *
 * Trả về DANH SÁCH lỗi tiếng Việt, rỗng nghĩa là hợp lệ. Trả cả danh sách chứ
 * không dừng ở lỗi đầu tiên: bắt người ta sửa một lỗi rồi mới cho biết lỗi tiếp
 * theo là cách chắc chắn để họ bỏ cuộc giữa chừng.
 *
 * 🔴 CỐ Ý KHÔNG có "trần giải mỗi ngày" ở cấp CHƯƠNG TRÌNH. Cột
 * `chuong_trinh.tran_giai_moi_ngay` tồn tại trong CSDL nhưng KHÔNG có một dòng
 * code nào áp dụng nó — một cột được lưu, được hiện lên màn quản trị, mà không
 * hề chạy thì TỆ HƠN là không có cột: nhân viên khai "trần 20 giải/ngày", tin là
 * nó chạy, và phát hết kho. Trần THẬT nằm ở từng ô (`o_qua.tran_moi_ngay`) và
 * được `conPhatDuoc()` áp dụng ở mỗi lượt.
 */

export interface OKhai {
  ten: string;
  /** `null` = ô đáy, không giới hạn. */
  soLuong: number | null;
  tranMoiNgay: number;
  /** Tỉ lệ trúng, phân số [0,1] (ADR-012). Tổng mọi ô phải đúng 1. */
  tiLeTrung: number;
  mau: string;
  thuTu: number;
}

export interface VongQuayKhai {
  /** Cơ sở tổ chức. Bắt buộc: `khach_tiem_nang.co_so_id` là NOT NULL, không có
   * cơ sở thì mọi số điện thoại phụ huynh để lại rơi vào hư vô. */
  coSoId: number | null;
  tenDot: string;
  dsO: OKhai[];
}

/** Bỏ khoảng trắng thừa và không phân biệt hoa thường, để so tên cho công bằng. */
function chuanHoaTen(ten: string): string {
  return ten.trim().replace(/\s+/g, " ").toLowerCase();
}

export function kiemVongQuay(k: VongQuayKhai): string[] {
  const loi: string[] = [];

  if (k.coSoId === null) {
    loi.push(
      "Chưa chọn cơ sở. Không có cơ sở thì mọi số điện thoại phụ huynh để lại " +
        "không gắn được vào đâu, và sale sẽ không bao giờ nhìn thấy chúng.",
    );
  }

  if (!k.tenDot.trim()) loi.push("Chưa nhập tên đợt phát quà.");

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

  // 🔴 HAI LUẬT CỦA TỈ LỆ TRÚNG (ADR-012). Đặt TRƯỚC vòng lặp từng ô vì chúng
  // nói về cả danh sách, không về một ô nào.
  const dsTiLe = k.dsO.map((o) => o.tiLeTrung);

  if (k.dsO.length > 0 && !tongDung(dsTiLe)) {
    const tong = dsTiLe.reduce((s, t) => s + t, 0);
    const thieu = raPhanTram(1 - tong);
    loi.push(
      `Tổng tỉ lệ trúng đang là ${raPhanTram(tong)}%, phải đúng 100%. ` +
        (thieu > 0 ? `Còn thiếu ${thieu}%.` : `Đang thừa ${-thieu}%.`),
    );
  }

  if (k.dsO.length > 0 && !k.dsO.some((o) => o.tiLeTrung > 0)) {
    loi.push(
      "Mọi ô đều để tỉ lệ 0%, nên vòng quay không bao giờ ra được kết quả. " +
        "Ít nhất một ô phải có tỉ lệ lớn hơn 0.",
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

    if (!(o.tiLeTrung >= 0) || o.tiLeTrung > 1) {
      loi.push(
        `Ô số ${stt} có tỉ lệ trúng ${raPhanTram(o.tiLeTrung)}% — phải nằm trong ` +
          "khoảng 0% đến 100%.",
      );
    }

    if (o.soLuong !== null && o.tranMoiNgay > o.soLuong) {
      loi.push(
        `Ô số ${stt} có trần mỗi ngày (${o.tranMoiNgay}) lớn hơn tổng số lượng ` +
          `(${o.soLuong}) — cái trần đó không bao giờ chặn được gì.`,
      );
    }
  }

  return loi;
}
