import { TIEN_TO_CO_SO, type TrangThaiCoSo } from "@/config/to-chuc";

/**
 * Kiểu dữ liệu và cách GỌI TÊN một cơ sở — phần THUẦN, không đụng cơ sở dữ liệu.
 *
 * Vì sao tách khỏi `kho.ts`: `kho.ts` mang `server-only` (đúng chỗ của nó, vì nó
 * chạy SQL). Nhưng nhãn cơ sở còn phải vẽ trong component `"use client"` — form
 * tạo chương trình, danh sách phụ huynh chọn cơ sở. Nhập một hàm từ module
 * `server-only` vào client là lỗi lúc dựng. Nên nhãn ở đây, SQL ở kia, và cả hai
 * phía cùng gọi MỘT hàm — không ai chép lại cách ghép chuỗi lần thứ hai.
 */

export interface CoSo {
  id: number;
  ma: string;
  ten: string;
  diaChi: string | null;
  dienThoai: string | null;
  trangThai: TrangThaiCoSo;
  taoLuc: number;
}

/**
 * Nhãn hiển thị: `CS2 — 114 Hoàng Diệu, Đà Nẵng`.
 *
 * Rơi về TÊN khi chưa có địa chỉ. Cơ sở mới thêm thường chưa kịp có địa chỉ, mà
 * một dòng `CS4 — ` cụt đuôi thì người chọn không biết mình đang chọn cái gì.
 */
export function nhanCoSo(cs: Pick<CoSo, "ma" | "ten" | "diaChi">): string {
  const duoi = cs.diaChi?.trim() || cs.ten;
  return `${cs.ma} — ${duoi}`;
}

/**
 * Khoá so trùng tên cơ sở.
 *
 * NFC trước: trên macOS chuỗi gõ từ bàn phím và chuỗi chép từ Finder có thể là
 * hai dãy mã khác nhau của CÙNG một chữ ("ơ" liền một mã, hay "o" + dấu móc).
 * Không chuẩn hoá thì hai cơ sở trông y hệt nhau vẫn lọt qua.
 * Rồi bỏ khoảng trắng thừa và hạ chữ thường — hai thứ người ta gõ lệch nhiều nhất.
 */
export function khoaTenCoSo(ten: string): string {
  return ten.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
}

/**
 * Số thứ tự trong mã `CS7` → 7. Trả 0 khi mã không theo khuôn.
 *
 * 🔴 Đây là lý do phải tách hàm: mã tiếp theo KHÔNG được suy từ số dòng đang có
 * (xoá một cơ sở là mã trùng ngay), cũng không được lấy `max(ma)` dạng chuỗi —
 * so chuỗi thì "CS9" > "CS10", và cơ sở thứ mười một lại nhận mã CS10 lần hai.
 */
export function soTrongMa(ma: string): number {
  if (!ma.startsWith(TIEN_TO_CO_SO)) return 0;
  const so = Number.parseInt(ma.slice(TIEN_TO_CO_SO.length), 10);
  return Number.isFinite(so) && so > 0 ? so : 0;
}

/** Mã kế tiếp: số LỚN NHẤT đang có + 1. */
export function maKeTiep(maDangCo: readonly string[]): string {
  const lonNhat = maDangCo.reduce((max, ma) => Math.max(max, soTrongMa(ma)), 0);
  return `${TIEN_TO_CO_SO}${lonNhat + 1}`;
}
