/**
 * Mã xác thực của màn TRÚNG — chống chụp màn hình đem khoe.
 *
 * Mã sinh từ (số trúng + mốc PHÚT hiện tại) nên tự đổi mỗi phút. Màn TRÚNG hiện
 * mã của phút hiện tại, trang cài đặt của nhân viên cũng hiện mã của phút hiện
 * tại — hai bên khớp nhau thì là màn hình đang chạy thật. Ảnh chụp từ hôm qua
 * mang mã cũ, không khớp.
 *
 * Đây là lớp chặn RẺ TIỀN, cố tình không phải lớp bảo mật: app không có server
 * và không lưu gì, nên không thể chống được người thật sự quyết tâm gian lận.
 * Nó chỉ chặn trò chuyền ảnh chụp cho nhau.
 */

const ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3479"; // bỏ các ký tự dễ đọc nhầm: B/8, I/1, O/0, S/5, Z/2, 6
const SALT = 0x9e3779b9;

function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return (value ^ SALT) >>> 0;
}

/** Mốc phút của một thời điểm — dùng chung cho cả hai phía để đối chiếu. */
export function minuteStamp(at: Date = new Date()): number {
  return Math.floor(at.getTime() / 60000);
}

/** Mã 4 ký tự của phút hiện tại cho một con số trúng. */
export function verifyCode(target: number, at: Date = new Date()): string {
  let value = hash(`${target}:${minuteStamp(at)}`);
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += ALPHABET[value % ALPHABET.length];
    value = Math.floor(value / ALPHABET.length) + hash(code);
  }
  return code;
}
