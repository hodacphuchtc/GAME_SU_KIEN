/**
 * BỐC QUÀ — hàm THUẦN, không đụng cơ sở dữ liệu.
 *
 * Tách thuần có chủ đích: đây là chỗ quyết định ai nhận cái gì, tức là chỗ tiêu
 * tiền. Một hàm thuần thì kiểm được bằng bảng tra, chạy được hàng nghìn ca
 * trong một phần nghìn giây, và không cần dựng CSDL để trả lời câu "hết Balo
 * thì chuyện gì xảy ra".
 */

export interface LoaiQua {
  id: number;
  ten: string;
  thuTu: number;
  /** `null` = KHÔNG GIỚI HẠN — đây là loại ĐÁY KHO. */
  soLuong: number | null;
  /** 0 = không có trần theo ngày. */
  tranMoiNgay: number;
  /** Đã trao bao nhiêu cái từ trước tới giờ (đếm từ `van_choi`, không lưu sẵn). */
  daTrao: number;
  /** Đã trao bao nhiêu cái riêng HÔM NAY. */
  daTraoHomNay: number;
}

/** Loại này còn phát được nữa không. */
export function conPhatDuoc(q: LoaiQua): boolean {
  // Loại đáy kho: không giới hạn số lượng nên luôn còn. Trần theo ngày CỐ Ý
  // không áp cho nó — nó tồn tại để đảm bảo người trúng luôn nhận được thứ gì
  // đó (Đ13), mà một cái trần thì phá đúng lời hứa ấy.
  if (q.soLuong === null) return true;
  if (q.daTrao >= q.soLuong) return false;
  if (q.tranMoiNgay > 0 && q.daTraoHomNay >= q.tranMoiNgay) return false;
  return true;
}

/**
 * Bốc theo THỨ TỰ ƯU TIÊN: hết loại 1 mới sang loại 2, đáy kho là loại cuối.
 *
 * Trả `null` khi kho không còn gì phát được — nghĩa là chương trình đã hết quà
 * thật. Nơi gọi phải xử lý được ca này (màn "chỉ vui"), đừng giả định luôn có.
 *
 * 🔴 Sắp theo `thuTu` rồi mới tới `id`: hai loại cùng thứ tự mà bốc lung tung
 * thì cùng một cấu hình cho ra kết quả khác nhau giữa hai lần chạy, và không ai
 * dựng lại được chuyện đã xảy ra khi có tranh chấp.
 */
export function chonQua(danhSach: readonly LoaiQua[]): LoaiQua | null {
  return (
    [...danhSach]
      .sort((a, b) => a.thuTu - b.thuTu || a.id - b.id)
      .find(conPhatDuoc) ?? null
  );
}

/** Kho có loại ĐÁY (không giới hạn) không — thiếu nó thì hết kho là hết quà thật. */
export function coLoaiDay(danhSach: readonly LoaiQua[]): boolean {
  return danhSach.some((q) => q.soLuong === null);
}

/**
 * Còn lại bao nhiêu cái của loại này. `null` = không giới hạn.
 * Không bao giờ trả số âm: trao tay quá số đã khai là chuyện có thật ngoài đời,
 * và một cái kho báo "còn −3" thì người đọc mất tin vào cả bảng.
 */
export function conLai(q: LoaiQua): number | null {
  return q.soLuong === null ? null : Math.max(0, q.soLuong - q.daTrao);
}
