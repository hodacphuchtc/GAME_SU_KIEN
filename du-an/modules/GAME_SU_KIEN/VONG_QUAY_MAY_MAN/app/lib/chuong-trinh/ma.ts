/**
 * Sinh MÃ CHƯƠNG TRÌNH — chuỗi ngắn để nhân viên đọc to cho nhau nghe.
 *
 * 🔴 Bảng chữ cái cố ý BỎ những ký tự dễ đọc nhầm: O/0, I/1/L, S/5, B/8, Z/2.
 * Mã in trên tờ giấy dán quầy rồi có người đọc qua điện thoại — nhầm một ký tự
 * là mở nhầm chương trình của cơ sở khác.
 */
export const BANG_CHU = "ACDEFGHJKMNPQRTUVWXY3479";
export const DAI_MA = 5;

/** Sinh một mã ngẫu nhiên. `daCo` để nơi gọi loại mã đã tồn tại. */
export function sinhMa(ngauNhien: () => number = Math.random): string {
  let ma = "";
  for (let i = 0; i < DAI_MA; i++) {
    ma += BANG_CHU[Math.floor(ngauNhien() * BANG_CHU.length)];
  }
  return ma;
}

/** Mã hợp lệ không — dùng để chặn sớm đường dẫn rác trước khi hỏi cơ sở dữ liệu. */
export function maHopLe(ma: string): boolean {
  if (ma.length !== DAI_MA) return false;
  return [...ma].every((c) => BANG_CHU.includes(c));
}
