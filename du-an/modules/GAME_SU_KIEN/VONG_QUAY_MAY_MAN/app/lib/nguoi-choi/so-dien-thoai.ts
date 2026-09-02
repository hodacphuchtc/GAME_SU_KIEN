/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/lib/nguoi-choi/so-dien-thoai.ts` @ 3d96358.
 * Giữ NGUYÊN — quy tắc số điện thoại Việt Nam không khác nhau giữa hai app.
 */

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
 * Che số để hiện trên màn quản trị: `0912345678` → `09*****678`.
 *
 * 🔴 Giữ 2 số đầu + 3 số cuối, KHÔNG phải 4 + 3. Đầu số di động Việt Nam dài 3
 * chữ số (090, 091, 097…), nên giữ 4 là để lộ trọn đầu số cộng thêm một chữ số
 * — gần như chỉ ra ngay nhà mạng và thu hẹp mạnh không gian đoán.
 *
 * ⚠️ Nói thẳng phạm vi: đây là lớp chống NGƯỜI LIẾC QUA VAI ở quầy, KHÔNG phải
 * chống kẻ tấn công. Ai mở được trang quản trị thì đọc được số đầy đủ.
 */
export function cheSdt(sdt: string): string {
  if (sdt.length < 6) return sdt;
  const giua = Math.max(0, sdt.length - 5);
  return `${sdt.slice(0, 2)}${"*".repeat(giua)}${sdt.slice(-3)}`;
}

/** Tên rút gọn cho bảng công khai: "Nguyễn Thị Hoa" → "Nguyễn H." */
export function tenRutGon(hoTen: string): string {
  const tu = hoTen.trim().split(/\s+/);
  if (tu.length === 1) return tu[0];
  return `${tu[0]} ${tu[tu.length - 1][0]}.`;
}
