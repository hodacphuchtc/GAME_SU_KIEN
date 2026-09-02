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

/**
 * Ô ĐÁY (loại không giới hạn) chiếm bao nhiêu phần vòng, tính theo tỉ lệ.
 *
 * 🔴 Đây là VAN NGÂN SÁCH thật sự, không phải chuyện thẩm mỹ. Các ô quà thật
 * chia nhau phần còn lại theo đúng số lượng đã khai, nên tỉ lệ này quyết định
 * kho quà cầm cự được bao nhiêu lượt: để 0,5 thì trung bình một nửa số lượt
 * nhận quà an ủi, kho quà thật sống gấp đôi số lượng của nó.
 */
export const TI_LE_O_DAY_MAC_DINH = 0.5;

/**
 * Sàn cứng cho cung của ô đáy.
 *
 * Dưới 8% (28,8°) thì nhãn không còn chỗ để đọc, và ô đáy là ô người ta rơi vào
 * nhiều nhất nên nó phải là ô dễ đọc nhất. Cũng là lưới an toàn: khai tỉ lệ 0
 * thì kho quà thật cạn sau đúng một buổi.
 */
export const SAN_CUNG_O_DAY = 0.08;

/** Trần cho tỉ lệ ô đáy — 95% thì vòng quay chỉ còn là một cái nút bấm. */
export const TRAN_TI_LE_O_DAY = 0.95;

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
 * Đệm sau khi vòng dừng, trước khi coi một lượt là BỎ RƠI.
 *
 * Lượt được mở ra rồi điện thoại tắt màn hình giữa chừng thì dòng đó nằm lại
 * với `ket_thuc_luc` rỗng. Không có đệm này thì nó khoá chương trình vĩnh
 * viễn và cả quầy đứng hình. 5 giây đủ cho vòng chạy xong cộng độ trễ mạng.
 */
export const GIAY_DEM_LUOT = 5;
