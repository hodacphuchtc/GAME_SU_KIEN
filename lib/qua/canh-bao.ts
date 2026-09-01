import { NGUONG_CANH_BAO_KHO } from "@/config/to-chuc";
import { chonQua, conLai, type LoaiQua } from "@/lib/qua/chon-qua";

/**
 * MỨC CẢNH BÁO KHO — hàm THUẦN, để cả ba kênh cảnh báo (dải quản trị, chấm trên
 * màn LCD, dòng nhật ký) đọc từ ĐÚNG MỘT nguồn.
 *
 * Ba kênh mà mỗi kênh tự tính lấy thì sớm muộn chúng nói ba điều khác nhau về
 * cùng một cái kho, và người đọc không biết tin cái nào.
 */

export type MucCanhBao = "xanh" | "vang" | "do";

export interface CanhBaoKho {
  muc: MucCanhBao;
  /** Loại đang được bốc — thứ nhân viên sắp phải đưa cho khách. */
  loaiDangTrao: LoaiQua | null;
  conLai: number | null;
  tong: number | null;
}

/**
 * - **xanh**: loại đang trao còn nhiều.
 * - **vàng**: loại đang trao còn ≤ ngưỡng (`config/to-chuc.ts`, mặc định 20%).
 * - **đỏ**: đã tụt xuống loại ĐÁY (không giới hạn), hoặc kho cạn sạch.
 *
 * 🔴 Đỏ KHÔNG có nghĩa là hỏng. Tụt đáy là kịch bản đã thiết kế (Đ13): người
 * chơi vẫn trúng thật, vẫn nhận quà thật. Đỏ nghĩa là "tiền quà đang chảy theo
 * đường rẻ nhất" — quản lý cần biết để nhập hàng, chứ không phải để tắt máy.
 */
export function mucCanhBaoKho(kho: readonly LoaiQua[]): CanhBaoKho {
  const dangTrao = chonQua(kho);

  // Kho rỗng hoàn toàn: chưa khai gì cả, chương trình vẫn dùng tên giải cũ.
  // Đó là trạng thái BÌNH THƯỜNG của chương trình từ v1, không phải báo động.
  if (kho.length === 0) return { muc: "xanh", loaiDangTrao: null, conLai: null, tong: null };

  if (!dangTrao) return { muc: "do", loaiDangTrao: null, conLai: 0, tong: null };
  if (dangTrao.soLuong === null) {
    return { muc: "do", loaiDangTrao: dangTrao, conLai: null, tong: null };
  }

  const con = conLai(dangTrao) ?? 0;
  // 🔴 `max(1, …)` chứ không phải tỉ lệ trần trụi. Với kho nhỏ, 20% là một số
  // nhỏ hơn 1 nên KHÔNG BAO GIỜ chạm tới được: loại còn đúng 1 cái sẽ nhảy thẳng
  // từ xanh sang đỏ mà chưa từng cảnh báo lần nào. Còn 1 cái thì đúng là sắp
  // hết, bất kể ban đầu có bao nhiêu.
  const nguong = Math.max(1, dangTrao.soLuong * NGUONG_CANH_BAO_KHO);
  const vang = con <= nguong;
  return {
    muc: vang ? "vang" : "xanh",
    loaiDangTrao: dangTrao,
    conLai: con,
    tong: dangTrao.soLuong,
  };
}
