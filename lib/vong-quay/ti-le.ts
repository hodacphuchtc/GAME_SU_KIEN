import { SAI_SO_TI_LE } from "@/config/vong-quay";

/**
 * TỈ LỆ TRÚNG — quy đổi và chia đều (ADR-012). Hàm THUẦN, dùng chung cho form
 * tạo, form sửa và lớp kiểm tra, nên chỉ có MỘT định nghĩa "chia đều nghĩa là gì".
 *
 * 🔴 Lưu trong CSDL là PHÂN SỐ [0,1]; hiện trên màn hình là PHẦN TRĂM. Đừng trộn
 * hai đơn vị: một chỗ nhân 100 hai lần là một chương trình phát hết kho trong
 * mười phút.
 */

/** Số chữ số thập phân của tỉ lệ dạng phân số — tương đương 2 chữ số ở đơn vị %. */
const CHU_SO = 4;

const LAM_TRON = 10 ** CHU_SO;

/** Làm tròn về đúng lưới hiển thị, để con số trên màn hình cộng lại đúng 100 %. */
export function lamTronTiLe(tiLe: number): number {
  return Math.round(tiLe * LAM_TRON) / LAM_TRON;
}

/**
 * Chia đều 100 % cho `soO` ô, tổng LUÔN đúng 1.
 *
 * 🔴 Ô CUỐI nhận phần dư chứ không phải `1/n` làm tròn. Chia ba mà mỗi ô 33,33 %
 * thì tổng là 99,99 % và người vận hành bị chặn ngay ở form với một lỗi họ không
 * gây ra. Dồn dư vào ô cuối là cách duy nhất vừa hiển thị đẹp vừa cộng đúng.
 */
export function chiaDeuTiLe(soO: number): number[] {
  if (soO <= 0) return [];
  const moi = lamTronTiLe(1 / soO);
  const ds = Array.from({ length: soO }, () => moi);
  ds[soO - 1] = lamTronTiLe(1 - moi * (soO - 1));
  return ds;
}

/** Tổng tỉ lệ có bằng 100 % không (trong sai số cho phép). */
export function tongDung(dsTiLe: readonly number[]): boolean {
  const tong = dsTiLe.reduce((s, t) => s + t, 0);
  return Math.abs(tong - 1) <= SAI_SO_TI_LE;
}

/** Đổi phân số sang phần trăm để hiển thị. Cắt đuôi số lẻ do dấu phẩy động. */
export function raPhanTram(tiLe: number): number {
  return Math.round(tiLe * 100 * 100) / 100;
}

/** Đổi phần trăm người dùng gõ vào thành phân số lưu trong CSDL. */
export function tuPhanTram(phanTram: number): number {
  return lamTronTiLe(phanTram / 100);
}
