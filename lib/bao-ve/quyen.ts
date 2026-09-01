import type { VaiTro } from "@/config/to-chuc";

/**
 * PHẠM VI NHÌN THẤY của một người đăng nhập — hàm thuần, không đụng CSDL.
 *
 * 🔴 Luật xương sống của GĐ 15.2: **lọc theo quyền ở TẦNG KHO (SQL), không ở
 * tầng giao diện.** Ẩn một cái nút mà câu truy vấn vẫn trả đủ dòng thì dữ liệu
 * đã nằm trong HTML gửi ra khỏi máy chủ rồi — người xem chỉ cần bấm "xem mã
 * nguồn trang" là thấy toàn bộ danh bạ khách hàng.
 *
 * File này là nơi DUY NHẤT dịch "vai trò" thành "được thấy những dòng nào", để
 * mỗi kho chỉ việc nhận về một mệnh đề WHERE và không tự chế luật riêng.
 */

export interface NguoiDung {
  id: number;
  vaiTro: VaiTro;
  /** Cơ sở phụ trách. `null` = toàn hệ thống. */
  coSoId: number | null;
}

export interface PhamVi {
  /** `null` = mọi cơ sở. */
  coSoId: number | null;
  /** `null` = mọi nhân viên; số = chỉ khách được giao cho đúng người này. */
  nhanVienId: number | null;
}

/**
 * - `quan_tri`: thấy tất cả.
 * - `quan_ly_co_so`: chỉ cơ sở của mình, nhưng thấy khách của MỌI sale ở đó.
 * - `sale`: chỉ khách được giao cho CHÍNH MÌNH.
 *
 * Quản lý cơ sở mà không có cơ sở (dữ liệu khai thiếu) thì coi như **không thấy
 * gì** — chọn hướng an toàn, không rơi về "thấy tất cả".
 */
export function phamViCua(nguoi: NguoiDung): PhamVi {
  switch (nguoi.vaiTro) {
    case "quan_tri":
      return { coSoId: null, nhanVienId: null };
    case "quan_ly_co_so":
      return { coSoId: nguoi.coSoId ?? -1, nhanVienId: null };
    case "sale":
      return { coSoId: nguoi.coSoId ?? -1, nhanVienId: nguoi.id };
    default:
      // Vai trò lạ (dữ liệu cũ, gõ nhầm) ⇒ không thấy gì. Mặc định phải là
      // ĐÓNG: một vai trò không ai định nghĩa mà được thấy tất cả là cách tệ
      // nhất để một lỗi chính tả biến thành rò rỉ dữ liệu.
      return { coSoId: -1, nhanVienId: -1 };
  }
}

/** Chỉ `quan_tri` được xem nhật ký truy cập. */
export function xemDuocNhatKy(nguoi: NguoiDung): boolean {
  return nguoi.vaiTro === "quan_tri";
}

/** Chỉ `quan_tri` được quản lý tài khoản nhân viên. */
export function quanLyDuocNhanVien(nguoi: NguoiDung): boolean {
  return nguoi.vaiTro === "quan_tri";
}

/** Chỉ `quan_tri` được sửa danh mục cơ sở — nó là danh mục dùng chung toàn hệ thống. */
export function suaDuocCoSo(nguoi: NguoiDung): boolean {
  return nguoi.vaiTro === "quan_tri";
}
