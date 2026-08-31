import { ROOM_ALPHABET, ROOM_CODE_LENGTH } from "@/config/game";

/**
 * Mã chương trình 4 ký tự — nằm trong đường dẫn và trong mã QR.
 * Bảng chữ cái đã bỏ ký tự dễ đọc nhầm (B/8, I/1, O/0, S/5, Z/2, 6) để nhân
 * viên đọc to cho khách qua điện thoại mà không phải đánh vần.
 */
export function sinhMa(ngauNhien: () => number = Math.random): string {
  let ma = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    ma += ROOM_ALPHABET[Math.floor(ngauNhien() * ROOM_ALPHABET.length)];
  }
  return ma;
}

/** Chuẩn hoá mã người dùng gõ/dán vào: hoa hết, bỏ ký tự lạ, cắt đúng độ dài. */
export function chuanHoaMa(tho: string): string {
  return tho
    .toUpperCase()
    .split("")
    .filter((k) => ROOM_ALPHABET.includes(k))
    .join("")
    .slice(0, ROOM_CODE_LENGTH);
}
