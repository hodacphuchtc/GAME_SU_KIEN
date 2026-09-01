import "server-only";

import { dungXlsx, type TrangTinh } from "@/lib/xuat/xlsx";

/**
 * Đóng gói một trang tính thành câu trả lời HTTP tải file.
 *
 * 🔴 Tên file đi qua `encodeURIComponent` trong `filename*`: tên có dấu tiếng
 * Việt mà chỉ dùng `filename=` thì trình duyệt lưu thành chuỗi vỡ mã, và người
 * nhận không đọc nổi mình vừa tải cái gì.
 */
export function traLoiXlsx(trang: TrangTinh, tenTep: string): Response {
  const goi = dungXlsx(trang);
  return new Response(new Uint8Array(goi), {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="xuat.xlsx"; filename*=UTF-8''${encodeURIComponent(tenTep)}`,
      "content-length": String(goi.length),
      // File chứa dữ liệu cá nhân — không để proxy hay trình duyệt giữ bản sao.
      "cache-control": "no-store",
    },
  });
}
