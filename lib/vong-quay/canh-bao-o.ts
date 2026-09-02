import { NGUONG_CANH_BAO_KHO } from "@/config/to-chuc";
import { conLai, conPhatDuoc, type OQua } from "@/lib/vong-quay/chia-o";

/**
 * MỨC CẢNH BÁO KHO — hàm THUẦN, để mọi kênh cảnh báo (dải trang quản trị, chấm
 * góc màn LCD, dòng nhật ký) đọc từ ĐÚNG MỘT nguồn. Mỗi kênh tự tính lấy thì
 * sớm muộn chúng nói ba điều khác nhau về cùng một cái kho.
 *
 * 🔴 Ngữ nghĩa KHÁC bản của Trúng Số, và khác có lý do. Ở Trúng Số quà được bốc
 * theo THỨ TỰ ƯU TIÊN nên luôn có đúng một "loại đang trao" để mà cảnh báo. Ở
 * vòng quay, mọi ô còn hàng đều có thể trúng cùng lúc — nên câu hỏi đúng không
 * phải "loại đang trao còn bao nhiêu" mà là "có ô nào sắp hết không, và vòng đã
 * tụt xuống chỉ còn quà an ủi chưa".
 */

export type MucCanhBao = "xanh" | "vang" | "do";

export interface CanhBaoKho {
  muc: MucCanhBao;
  /** Các ô thật đang sắp hết — thứ quản lý cần nhập thêm. */
  sapHet: OQua[];
  /** Còn bao nhiêu ô quà THẬT trên vòng (không tính ô đáy). */
  soOThat: number;
}

/**
 * - **xanh**: mọi ô quà thật còn nhiều.
 * - **vàng**: có ít nhất một ô thật còn dưới ngưỡng.
 * - **đỏ**: không còn ô thật nào — vòng chỉ còn quà an ủi.
 *
 * 🔴 Đỏ KHÔNG có nghĩa là hỏng. Người chơi vẫn quay được, vẫn nhận quà thật.
 * Đỏ nghĩa là "hôm nay ai quay cũng chỉ được sticker" — quản lý cần biết để
 * nhập hàng, chứ không phải để tắt máy.
 */
export function mucCanhBaoKho(kho: readonly OQua[]): CanhBaoKho {
  const conHang = kho.filter(conPhatDuoc);
  const that = conHang.filter((o) => o.soLuong !== null);

  // Kho chưa khai gì cả — trạng thái bình thường của chương trình vừa tạo,
  // không phải báo động.
  if (kho.length === 0) return { muc: "xanh", sapHet: [], soOThat: 0 };

  if (that.length === 0) return { muc: "do", sapHet: [], soOThat: 0 };

  const sapHet = that.filter((o) => {
    // 🔴 `max(1, …)` chứ không phải tỉ lệ trần trụi. Với kho nhỏ, 20% là một số
    // nhỏ hơn 1 nên KHÔNG BAO GIỜ chạm tới được: loại còn đúng 1 cái nhảy thẳng
    // từ xanh sang biến mất mà chưa từng cảnh báo lần nào. Còn 1 cái thì đúng
    // là sắp hết, bất kể ban đầu có bao nhiêu. Đã trả giá ở kho quà Trúng Số.
    const nguong = Math.max(1, (o.soLuong ?? 0) * NGUONG_CANH_BAO_KHO);
    return (conLai(o) ?? 0) <= nguong;
  });

  return { muc: sapHet.length > 0 ? "vang" : "xanh", sapHet, soOThat: that.length };
}
