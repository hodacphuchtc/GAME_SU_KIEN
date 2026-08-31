/**
 * Bộ nhận diện SATA ROBO — NGUỒN GIÁ TRỊ DUY NHẤT. Cấm hardcode màu ở nơi khác.
 *
 * Đây là bản CHÉP GIÁ TRỊ từ bộ nhận diện thương hiệu, không phải import code:
 * ĐẾM SỐ là ứng dụng đứng riêng, không dính gì tới hệ quản trị SataRobo.
 * Bộ nhận diện đổi thì sửa file này, không sửa rải rác trong component.
 */
export const mauThuongHieu = {
  tim: "#6B21A8", // ROBO — màu chính: tiêu đề, nút chính, thanh bên
  cam: "#F97316", // SATA — màu nhấn: CTA, số trúng thưởng, chữ số LED
  trang: "#FFFFFF", // nền chủ đạo

  mint: "#5EEAD4", // chi tiết công nghệ
  vang: "#FACC15", // thành tích, trúng thưởng
  neon: "#A855F7", // đường mạch phát sáng

  muc: "#1E1B2E", // chữ chính
  chi: "#6B6880", // chữ phụ
  suong: "#F5F3FA", // bề mặt phụ
  ke: "#E7E3F0", // đường kẻ nhạt
} as const;

/**
 * Tỉ lệ màu ràng buộc bố cục: trắng 60% · tím 30% · cam 10%.
 * Trắng tạo độ sạch và dễ đọc, tím dựng nhận diện công nghệ, cam tạo hành động.
 * Đừng để cam tràn ra ngoài phần CTA — nó mất tác dụng ngay.
 */
export const tiLeMau = { trang: 0.6, tim: 0.3, cam: 0.1 } as const;

export const chuThuongHieu = {
  /** Font toàn hệ thống — hỗ trợ tiếng Việt đầy đủ dấu. */
  chinh: "Be Vietnam Pro",
  /** Font cho DỮ LIỆU: mã xác thực, số liệu kỹ thuật. */
  soLieu: "ui-monospace, SFMono-Regular, Menlo, monospace",
  coChuToiThieuDienThoai: 14,
} as const;
