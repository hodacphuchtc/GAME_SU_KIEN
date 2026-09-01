/**
 * Hằng số nghiệp vụ của game CHỌN SỐ — nguồn DUY NHẤT, không hardcode nơi khác.
 *
 * Game này khác Trúng Số ở một điểm gốc: KHÔNG có số trúng, KHÔNG có kho quà.
 * Ai bấm cũng ra một số, và số đó ứng với phần quà đã đánh số thứ tự chuẩn bị
 * sẵn BÊN NGOÀI hệ thống. App chỉ làm một việc: phát số công bằng và ghi lại ai
 * đã nhận số nào.
 */

import { WHEEL_SIZE } from "@/config/game";

/** Dải gợi ý khi tạo mới: 100 phần quà đánh số 1…100. */
export const DAI_MAC_DINH = { tu: 1, den: 100 } as const;

/**
 * Biên cứng của dải.
 *
 * 🔴 Trần là `WHEEL_SIZE - 1` = 9999 vì bảng LED chỉ có BỐN chữ số:
 * `Led4Digits` làm `value.padStart(4,"0").slice(-4)` và `formatNumber` lấy dư
 * theo `WHEEL_SIZE`. Khai dải tới 10042 thì số đó hiện ra thành `0042` — trùng
 * với số 42 của người khác, và KHÔNG có một dòng lỗi nào ở đâu cả.
 */
export const DAI_TOI_THIEU = 0;
export const DAI_TOI_DA = WHEEL_SIZE - 1;

/** Dải một số thì nút DỪNG là đồ trang trí — bắt buộc ít nhất hai số. */
export const SO_LUONG_TOI_THIEU = 2;

/**
 * Nhịp quay: một vòng trọn dải mất chừng này giây.
 *
 * 🔴 Vì sao KHÔNG dùng bốn mức khó của Trúng Số: mức "vừa" chạy 800 số/giây, mà
 * dải điển hình ở đây chỉ 100 số — thành 8 vòng MỖI GIÂY, bảng LED là một vệt
 * mờ và người chơi biết mình đang bốc mù chứ không phải đang chọn. 1,5 giây là
 * khoảng còn ĐỌC được số đang chạy mà vẫn thấy nó quay.
 */
export const GIAY_MOI_VONG = 1.5;

/** Kẹp hai đầu: dải rất lớn không thành vệt mờ, dải rất nhỏ không ì ạch. */
export const TOC_DO_TOI_DA = 900;
export const TOC_DO_TOI_THIEU = 4;

/** Thời gian tăng tốc, cũng là thời gian khoá nút DỪNG. */
export const GIAY_TANG_TOC = 2;

/**
 * Quá bấy nhiêu giây chưa bấm thì HUỶ lượt và mời bấm lại.
 *
 * 🔴 Cố ý KHÔNG cấp số khi hết giờ. Phép kẹp `Math.min/max` trong `dungLuot`
 * quy mọi lần "để hết giờ" về đúng một mốc thời gian, nên mọi người đều nhận
 * CÙNG MỘT con số. Ở Trúng Số đó chỉ là một số trượt nên không ai thấy; ở đây
 * đó là mười phụ huynh cùng cầm số 0037 đi nhận một phần quà.
 */
export const GIAY_TOI_DA_MOT_LUOT = 20;

/**
 * Còn dưới tỉ lệ này của dải thì cảnh báo sắp hết số.
 *
 * 🔴 Ngưỡng phải tính `max(1, tỉ_lệ × tổng)`, không thuần tỉ lệ: 20% của 4 là
 * 0,8 mà số còn lại luôn là số nguyên ≥ 1, nên dải nhỏ sẽ nhảy thẳng xanh → đỏ
 * và dải vàng chưa từng bật. Đã trả giá ở kho quà Trúng Số.
 */
export const NGUONG_CANH_BAO_DAI = 0.2;
