/**
 * Chuẩn hoá số điện thoại Việt Nam về một dạng duy nhất `0xxxxxxxxx`.
 *
 * Vì sao bắt buộc: phụ huynh gõ mỗi lần một kiểu — `+84 912 345 678`,
 * `0912.345.678`, `84912345678`. Không chuẩn hoá thì cùng một người đẻ ra ba hồ
 * sơ, và luật "một lượt mỗi ngày" thành vô nghĩa.
 */

export function chuanHoaSdt(tho: string): string | null {
  const so = tho.replace(/[^\d+]/g, "");
  let rut = so;

  if (rut.startsWith("+84")) rut = `0${rut.slice(3)}`;
  else if (rut.startsWith("84") && rut.length >= 11) rut = `0${rut.slice(2)}`;
  else if (!rut.startsWith("0") && rut.length === 9) rut = `0${rut}`;

  if (!/^0\d{9,10}$/.test(rut)) return null;
  return rut;
}

/** Che giữa số để hiện trên màn công khai: 0912345678 → 0912***678 */
export function cheSdt(sdt: string): string {
  if (sdt.length < 7) return sdt;
  return `${sdt.slice(0, 4)}***${sdt.slice(-3)}`;
}
