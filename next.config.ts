import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Web tĩnh thuần: không server, không API route — deploy đâu cũng chạy,
  // và chạy được cả khi trung tâm mất mạng sau lần tải đầu.
  output: "export",
  images: { unoptimized: true },
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
