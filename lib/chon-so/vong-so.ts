import {
  GIAY_MOI_VONG,
  GIAY_TANG_TOC,
  GIAY_TOI_DA_MOT_LUOT,
  TOC_DO_TOI_DA,
  TOC_DO_TOI_THIEU,
} from "@/config/chon-so";
import type { RoundSettings } from "@/config/game";
import { countAt } from "@/lib/bo-dem";

/**
 * LÕI GAME CHỌN SỐ — thuần, không DOM, không CSDL, không `server-only`.
 *
 * File này chạy được ở CẢ hai phía: máy chủ chấm điểm, và hai màn hình tự vẽ
 * dãy số. Đó là điều kiện để chúng hiện cùng một con số.
 *
 * 🔴 `lib/bo-dem.ts` KHÔNG được sửa một dòng. `countAt` của nó cố ý *không* lấy
 * dư — một bộ đếm liên tục — nên việc quay vòng trên dải nào là chuyện của file
 * này. Hai mươi bài kiểm của `bo-dem` đang canh trò chơi đang chạy thật.
 */

/** Hai đầu đều BAO GỒM: `{tu:1, den:100}` là 100 số. */
export interface DaiSo {
  tu: number;
  den: number;
}

export function coDai(dai: DaiSo): number {
  return dai.den - dai.tu + 1;
}

/**
 * VÒNG CHẠY — danh sách số sẽ lần lượt hiện trên bảng LED, tăng dần.
 *
 * 🔴 Loại trừ đổi chính VÒNG CHẠY, không ánh xạ kết quả sang số trống gần nhất.
 * Người đứng xem thấy LED nhảy `0041 → 0043` vì 42 đã có người lấy, và đó là sự
 * thật của buổi chiều hôm đó. Cách kia — vẫn hiện 42 rồi trả 43 — là thay thầm:
 * phụ huynh cầm số 42 trong đầu đi ra quầy rồi nhận quà số 43. Cùng một lỗi với
 * vết sẹo "thấy 0211, bấm, máy trả 0219 — nhìn y như ăn gian".
 *
 * Vòng rỗng ⇒ dải đã phát hết. Nơi gọi phải tự canh trước khi mở lượt.
 */
export function vongChay(dai: DaiSo, daRa: ReadonlySet<number>): number[] {
  const v: number[] = [];
  for (let n = dai.tu; n <= dai.den; n += 1) if (!daRa.has(n)) v.push(n);
  return v;
}

/**
 * Nhịp quay tính theo ĐỘ DÀI DẢI, không dùng bốn mức khó của Trúng Số.
 *
 * 🔴 Vì sao: mức "vừa" chạy 800 số/giây. Với dải điển hình 100 số, đó là 8 vòng
 * MỖI GIÂY — bảng LED thành một vệt mờ, và người chơi biết mình đang bốc mù chứ
 * không phải đang chọn. Ở đây tốc độ co giãn theo dải để một vòng luôn mất
 * chừng `GIAY_MOI_VONG`, kẹp hai đầu cho dải rất lớn và rất nhỏ.
 */
export function nhipCua(dai: DaiSo): RoundSettings {
  const maxSpeed = Math.min(
    TOC_DO_TOI_DA,
    Math.max(TOC_DO_TOI_THIEU, coDai(dai) / GIAY_MOI_VONG),
  );
  return {
    startSpeed: Math.max(TOC_DO_TOI_THIEU / 2, maxSpeed / 4),
    maxSpeed,
    rampSeconds: GIAY_TANG_TOC,
    // Khoá nút đúng bằng thời gian tăng tốc: ai bấm được cũng đều gặp dãy số ở
    // tốc độ tối đa, không ai chộp được lúc nó còn bò.
    lockSeconds: GIAY_TANG_TOC,
    roundLimitSeconds: GIAY_TOI_DA_MOT_LUOT,
    countdownSeconds: 0,
  };
}

/**
 * Con số đang hiện trên bảng LED tại giây thứ `t` kể từ lúc dãy bắt đầu chạy.
 *
 * Một dòng, và nó thừa hưởng miễn phí mọi tính chất của `countAt`: hàm THUẦN
 * của thời gian, đơn điệu tăng, kết quả không phụ thuộc nhịp vẽ của máy. Đó là
 * thứ khiến LCD và điện thoại khớp nhau mà không phải truyền từng khung hình.
 *
 * `vong` phải KHÔNG RỖNG.
 */
export function soTaiGiay(nhip: RoundSettings, vong: readonly number[], t: number): number {
  return vong[Math.floor(countAt(nhip, t)) % vong.length];
}
