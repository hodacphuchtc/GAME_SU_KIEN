/**
 * CHIA LUÂN PHIÊN khách cho sale — hàm THUẦN, không đụng cơ sở dữ liệu.
 *
 * 🔴 KHÔNG dùng modulo thuần (`lead[i] → sale[i % n]`).
 *
 * Vì sao: quản lý bấm nút này mỗi tuần một lần, mỗi lần chia vài khách. Với 3
 * khách / 2 sale thì modulo cho sale #1 **luôn luôn** 2 người và sale #2 **luôn
 * luôn** 1 người — tuần nào cũng vậy. Sau mười tuần hai người chênh nhau mười
 * khách, và không ai hiểu vì sao "chia đều" lại ra như thế.
 *
 * Cách đúng: sắp sale theo TẢI ĐANG GIỮ tăng dần rồi rải lần lượt, cập nhật tải
 * sau mỗi lần gán. Ai đang rỗng thì nhận trước, và hệ thống tự cân bằng lại
 * ngay cả khi tuần trước chia lệch.
 */

export interface SaleDangLam {
  id: number;
  /** Số khách đang giữ (chưa đóng sổ). */
  soDangGiu: number;
}

export interface CapGan {
  leadId: number;
  nhanVienId: number;
}

/**
 * `leadIds` phải được đưa vào theo thứ tự CŨ NHẤT TRƯỚC — khách để lại số lâu
 * nhất là khách nguội nhanh nhất, nên họ được gọi trước.
 *
 * Trả mảng rỗng khi không có sale nào hoặc không còn khách nào; nơi gọi phân
 * biệt hai ca đó để nói đúng câu, chứ hàm này không ném.
 */
export function chiaVong(sale: readonly SaleDangLam[], leadIds: readonly number[]): CapGan[] {
  if (sale.length === 0 || leadIds.length === 0) return [];

  // Bản sao để không đụng vào mảng của nơi gọi; `id` làm khoá phụ để hai sale
  // cùng tải luôn được xếp theo một thứ tự xác định (chia hai lần phải ra
  // cùng một kết quả, nếu không thì không ai dựng lại được chuyện đã xảy ra).
  const tai = sale.map((s) => ({ id: s.id, soDangGiu: s.soDangGiu }));
  const ra: CapGan[] = [];

  for (const leadId of leadIds) {
    tai.sort((a, b) => a.soDangGiu - b.soDangGiu || a.id - b.id);
    const nhan = tai[0];
    ra.push({ leadId, nhanVienId: nhan.id });
    nhan.soDangGiu += 1;
  }
  return ra;
}
