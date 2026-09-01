import { cheSdt } from "@/lib/nguoi-choi/so-dien-thoai";

/**
 * Cách VẼ một dòng lịch sử ván chơi. Hàm thuần, không đụng React — nhờ vậy bài
 * test kiểm được đúng thứ người ta sẽ đọc trên màn hình.
 *
 * 🔴 Vì sao tách khỏi component: trước GĐ 21.2, trang chi tiết tự viết một hàm
 * `tenRutGon` cục bộ ngay trong `page.tsx`. Không ai test nó, và không ai nhớ nó
 * tồn tại — nên suốt nhiều tháng nhân viên nhìn "Dương t." mà không biết vì sao
 * mình không đọc được tên khách của chính mình.
 */

/** Ván ẩn danh (nhân viên bấm thẳng trên màn hình lớn) không có ai để mà tên. */
export function nhanNguoiChoi(hoTen: string | null): string {
  const ten = hoTen?.trim() ?? "";
  return ten === "" ? "—" : ten;
}

/**
 * Số điện thoại trong bảng quản trị: **che sẵn**, mở khi người dùng chủ động bấm.
 *
 * ⚠️ Nói thẳng phạm vi: đây là lớp chống NGƯỜI LIẾC QUA VAI ở quầy, không phải
 * chống kẻ tấn công — số đầy đủ vẫn nằm trong HTML để nút "Hiện đầy đủ" chạy
 * được ngay mà không phải gọi lại máy chủ. Thứ chặn thật là phân quyền ở tầng
 * SQL (GĐ 21.1).
 */
export function nhanSdt(soDienThoai: string | null, hienDu: boolean): string {
  if (soDienThoai === null || soDienThoai.trim() === "") return "—";
  return hienDu ? soDienThoai : cheSdt(soDienThoai);
}

/** Ba trạng thái, không phải hai: có · không · chưa từng để lại số. */
export function nhanDongY(hoTen: string | null, dongYTuVan: boolean): "co" | "khong" | "trong" {
  if (hoTen === null) return "trong";
  return dongYTuVan ? "co" : "khong";
}
