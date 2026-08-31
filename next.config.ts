import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * KHÔNG dùng `output: "export"` nữa.
   *
   * Bản này TỰ CHỨA cả máy chủ: cơ sở dữ liệu SQLite, đồng bộ thời gian thực
   * bằng SSE, và các server action ghi dữ liệu — web tĩnh không làm được những
   * việc đó. Đổi lại vẫn chỉ cần `npm start`, không phụ thuộc dịch vụ nào.
   */
  trailingSlash: true,

  /*
   * 🔴 Bắt buộc để thử trên ĐIỆN THOẠI THẬT khi chạy `npm run dev:dienthoai`.
   *
   * Mặc định Next.js chặn mọi truy cập tài nguyên dev từ địa chỉ khác
   * `localhost`. Hậu quả rất dễ hiểu nhầm: điện thoại vẫn mở được trang và vẫn
   * thấy giao diện, nhưng JS không tải nên KHÔNG BẤM ĐƯỢC GÌ — trông y như app
   * bị treo chứ không hề báo lỗi.
   *
   * Chỉ có tác dụng ở chế độ dev; bản `npm run build` không đụng tới.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
};

export default nextConfig;
