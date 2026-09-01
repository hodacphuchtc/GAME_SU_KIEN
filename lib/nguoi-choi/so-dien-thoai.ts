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

/**
 * Che số để hiện trên màn quản trị: `0912345678` → `09****678`.
 *
 * 🔴 Giữ 2 số đầu + 3 số cuối, KHÔNG phải 4 + 3 như bản v1. Đầu số di động
 * Việt Nam dài 3 chữ số (090, 091, 097…), nên giữ 4 là để lộ trọn đầu số cộng
 * thêm một chữ số — gần như chỉ ra ngay nhà mạng và thu hẹp mạnh không gian
 * đoán. Giữ 2 thì người liếc qua vai chỉ biết "đây là số di động".
 *
 * ⚠️ Nói thẳng phạm vi của nó: đây là lớp chống NGƯỜI LIẾC QUA VAI ở quầy, KHÔNG
 * phải chống kẻ tấn công. Số đầy đủ vẫn nằm trong HTML để nút "Hiện đầy đủ"
 * chạy được ngay không phải gọi lại máy chủ. Ai mở được trang thì đọc được số.
 */
export function cheSdt(sdt: string): string {
  if (sdt.length < 6) return sdt;
  const giua = Math.max(0, sdt.length - 5);
  return `${sdt.slice(0, 2)}${"*".repeat(giua)}${sdt.slice(-3)}`;
}
