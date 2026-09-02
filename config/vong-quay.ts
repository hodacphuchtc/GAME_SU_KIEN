/**
 * Hằng số nghiệp vụ của VÒNG QUAY MAY MẮN — nguồn DUY NHẤT, cấm hardcode nơi khác.
 *
 * Luật của file này: mỗi con số phải kèm câu trả lời cho "vì sao là số đó".
 * Một hằng số không có lý do là một con số sẽ bị ai đó chỉnh bừa vào ngày nó
 * gây khó chịu, và không ai biết vì sao nó từng là như thế.
 */

/** Dưới hai ô thì nút QUAY là đồ trang trí — kết quả đã biết trước khi bấm. */
export const SO_O_TOI_THIEU = 2;

/**
 * 🔴 Trần số ô — con số TẠM, chờ `N.4` đo trên đúng màn hình LCD sẽ dùng.
 *
 * 12 ô = mỗi cung 30°. Trên màn 55 inch, một nhãn nằm trong cung 30° còn đọc
 * được ở 3–5 mét. Quá 12 thì chữ phải xoay dọc theo cung và người đứng cuối
 * sảnh chỉ thấy một vành màu. Đo thật rồi thì sửa đúng chỗ này.
 */
export const SO_O_TOI_DA = 12;

/**
 * Một lần quay kéo dài bấy nhiêu giây.
 *
 * Ngắn hơn 3 giây thì không kịp hồi hộp và không quay clip được; dài hơn 6 giây
 * thì hàng chờ ở quầy ùn lại. Trúng Số cho tới 30 giây vì ở đó người chơi đang
 * CANH; vòng quay không có gì để canh nên kéo dài chỉ là bắt người ta đứng nhìn.
 */
export const GIAY_QUAY = 5;

/**
 * Phải quay trọn ít nhất bấy nhiêu vòng trước khi dừng.
 *
 * Kết quả đã được máy chủ quyết trước khi vòng bắt đầu chạy — nên nó BẮT BUỘC
 * phải trông như một cú quay thật. Dưới 3 vòng thì nhìn ra ngay là kim chỉ đang
 * nhích tới một chỗ định sẵn.
 */
export const VONG_TOI_THIEU = 4;

/**
 * Số mũ của đường giảm tốc `1 − (1−x)^n`.
 *
 * n = 2 dừng khựng như đụng tường; n ≥ 4 thì đoạn cuối bò lê, người xem tưởng
 * treo máy. n = 3 là đường cong duy nhất trong khoảng đó vừa chậm dần rõ rệt
 * vừa dừng dứt khoát.
 */
export const MU_GIAM_TOC = 3;

// 🔴 BA HẰNG ĐÃ XOÁ ngày 02/09/2026 (ADR-012): `TI_LE_O_DAY_MAC_DINH` ·
// `SAN_CUNG_O_DAY` · `TRAN_TI_LE_O_DAY`. Chúng mô tả "ô đáy chiếm bao nhiêu
// phần vòng" — một câu hỏi không còn tồn tại từ khi mọi cung chia ĐỀU. Cột
// `chuong_trinh.ti_le_o_day` vẫn nằm trong CSDL (xoá cột của một bảng đang chạy
// không đáng giá) nhưng KHÔNG còn được đọc, ghi, hay hiện ra ở bất kỳ màn nào.
//
// Đừng khai lại chúng: muốn một ô trúng nhiều hơn thì sửa `o_qua.ti_le_trung`.

/**
 * Sai số cho phép khi cộng tổng tỉ lệ trúng của các ô.
 *
 * Tổng phải là 100 %, nhưng tỉ lệ là số thực: chia đều cho 3 ô rồi cộng lại có
 * thể ra 99,99999999999999. So bằng `=== 1` ở đây là chặn oan một cấu hình
 * hoàn toàn hợp lệ. 1e-6 rộng gấp nhiều lần sai số của phép chia đôi/chia ba,
 * và vẫn hẹp hơn 0,01 % — nhỏ hơn mọi con số người vận hành gõ được.
 */
export const SAI_SO_TI_LE = 1e-6;

// 🔴 `NGUONG_CANH_BAO_KHO` CỐ Ý KHÔNG khai ở đây — nó nằm ở `config/to-chuc.ts`
// và dùng chung cho cả ba game. Ngưỡng "kho sắp hết" là một quyết định vận hành
// của trung tâm, không phải của riêng vòng quay; khai hai chỗ là dựng hai nguồn sự
// thật, và chúng chỉ lệch nhau vào đúng ngày ai đó sửa một bên (ADR-011).
//
// Sắc thái phải giữ khi dùng: ngưỡng tính `max(1, tỉ_lệ × tổng)`, KHÔNG thuần tỉ lệ.
// 20% của 4 là 0,8 mà tồn kho luôn là số nguyên ≥ 1, nên kho nhỏ nhảy thẳng từ xanh
// sang biến mất, dải vàng chưa từng bật lần nào.

/**
 * Mỗi người được quay bao nhiêu lượt trong MỘT ngày, ở MỘT chương trình.
 *
 * Bằng 1 vì kho quà có hạn và trò này không có gì để chơi lại — quay lần hai
 * không có lần nào "tốt hơn". Đếm theo TỪNG chương trình chứ không toàn hệ
 * thống: một phụ huynh đưa con tới hai cơ sở thì họ có quyền chơi ở cả hai.
 */
export const LUOT_MOI_NGUOI_MOI_NGAY = 1;

/**
 * Thẻ kết quả đứng trên màn LCD bao nhiêu giây rồi tự trả về màn chờ.
 *
 * 🔴 Không có con số này thì thẻ kết quả treo VÔ HẠN tới ván sau: người kế tiếp
 * bước tới quầy và nhìn thấy phần quà của người trước, còn nhân viên phải tải
 * lại trang bằng tay.
 *
 * 5 giây vì phần thưởng của Vòng Quay nằm ở CÚ QUAY, không ở việc soi thẻ: mã
 * xác thực đã nằm sẵn trên điện thoại người chơi, họ không cần đọc nó trên màn
 * lớn. Dài hơn thì hàng chờ ở quầy ùn lại.
 */
export const GIAY_XEM_KET_QUA = 5;

/**
 * Đệm sau khi vòng dừng, trước khi coi một lượt là BỎ RƠI.
 *
 * Lượt được mở ra rồi điện thoại tắt màn hình giữa chừng thì dòng đó nằm lại
 * với `ket_thuc_luc` rỗng. Không có đệm này thì nó khoá chương trình vĩnh
 * viễn và cả quầy đứng hình. 5 giây đủ cho vòng chạy xong cộng độ trễ mạng.
 */
export const GIAY_DEM_LUOT = 5;
