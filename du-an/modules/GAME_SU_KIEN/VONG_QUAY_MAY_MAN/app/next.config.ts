import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * 🔴 BẮT BUỘC để thử trên ĐIỆN THOẠI THẬT qua `npm run dev:dienthoai`.
   *
   * Mặc định Next.js chặn mọi truy cập tài nguyên dev từ địa chỉ khác
   * `localhost`. Hậu quả rất dễ hiểu nhầm: điện thoại vẫn mở được trang và vẫn
   * thấy giao diện, nhưng JS không tải nên KHÔNG BẤM ĐƯỢC GÌ — trông y như app
   * bị treo chứ không hề báo một dòng lỗi nào. `curl` trả 200 vẫn qua như thường.
   *
   * Chỉ có tác dụng ở chế độ dev; bản `npm run build` không đụng tới.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],

  /*
   * KHÔNG bật `trailingSlash`: nó khiến route API bị chuyển hướng 308, thêm một
   * lượt đi–về vào phép đo độ lệch đồng hồ giữa LCD và điện thoại — tức là làm
   * hỏng chính thứ nó đang đo. Bài học đã trả giá ở app Trúng Số.
   */

  /*
   * KHÔNG dùng `output: "export"`: bản này tự chứa cả máy chủ (SQLite + SSE +
   * server action). Đổi lại vẫn chỉ cần `npm start`.
   */
};

export default nextConfig;
