import { doiDauSoCu } from "@/config/dau-so";

/**
 * Chuẩn hoá số điện thoại Việt Nam về một dạng duy nhất `0xxxxxxxxx`.
 *
 * Vì sao bắt buộc: phụ huynh gõ mỗi lần một kiểu — `+84 912 345 678`,
 * `0912.345.678`, `84912345678`. Không chuẩn hoá thì cùng một người đẻ ra ba hồ
 * sơ, và luật "một lượt mỗi ngày" thành vô nghĩa.
 *
 * 🔴 ĐÂY LÀ KHOÁ GỘP KHÁCH. Hai chuỗi ra cùng một kết quả nghĩa là cùng một người;
 * hai kết quả khác nhau là hai người. Nới hàm này là gộp nhầm hai người xa lạ, siết
 * quá là chặn khách hợp lệ ở quầy — cả hai đều hỏng, và hỏng theo kiểu không ai
 * nhìn thấy cho tới lúc đối soát.
 */

export function chuanHoaSdt(tho: string): string | null {
  const so = tho.replace(/[^\d+]/g, "");
  let rut = so;

  if (rut.startsWith("+84")) rut = `0${rut.slice(3)}`;
  else if (rut.startsWith("84") && rut.length >= 11) rut = `0${rut.slice(2)}`;
  else if (!rut.startsWith("0") && rut.length === 9) rut = `0${rut}`;

  // 🔴 Quy số 11 chữ số kiểu cũ về đầu số mới (đợt chuyển toàn quốc 2018). Bỏ bước
  // này thì `01629123456` và `0329123456` — CÙNG một thuê bao — thành HAI hồ sơ,
  // và `UNIQUE(so_dien_thoai)` không đỡ được vì hai chuỗi thật sự khác nhau.
  // Đầu số không nằm trong bảng thì giữ nguyên: đoán bừa còn tệ hơn không đoán.
  rut = doiDauSoCu(rut);

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
