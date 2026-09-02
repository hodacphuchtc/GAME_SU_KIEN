/**
 * Bộ nhận diện SATA ROBO — NGUỒN GIÁ TRỊ DUY NHẤT. Cấm hardcode màu ở nơi khác.
 *
 * Đây là bản CHÉP GIÁ TRỊ từ bộ nhận diện thương hiệu, không phải import code:
 * GAME SỰ KIỆN là ứng dụng đứng riêng, không dính gì tới hệ quản trị SataRobo.
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
  timNhat: "#F3E8FF", // nền nhạt của khối tím

  // Trạng thái — KHÔNG phải màu nhận diện, nhưng vẫn khai ở đây vì một màu
  // sống ngoài file này là một màu không ai canh được.
  luc: "#16A34A", // đạt, còn hàng
  do: "#DC2626", // hỏng, cạn kho

  // Bảng đèn LED: panel tối lồng trong trang trắng, chữ số màu cam thương hiệu.
  led: "#F97316",
  ledMo: "#2A1508", // đoạn TẮT — phải đủ tối, sáng quá thì 0000 đọc ra 8888
  ledNen: "#140B04", // nền panel
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

/**
 * Bảng màu SẴN cho ô quà trên vòng quay (ADR-011), theo đúng thứ tự gợi ý.
 *
 * Người tạo chương trình chọn TỪ BẢNG NÀY chứ không gõ mã màu tự do: mã tự do
 * là cửa để một ô sáng chói lấn át phần còn lại, và cũng là chỗ CSS tuỳ biến lọt
 * vào. Sáu màu đều đã có biến CSS trong `globals.css` nên không đẻ thêm màu mới.
 *
 * 🔴 Bảng này KHÔNG tự bảo đảm chữ đọc được: trắng trên `vang` và trên `mint`
 * chỉ đạt 1,5:1. Màu chữ phải suy từ ĐỘ CHÓI của nền — xem `lib/vong-quay/mau-chu.ts`.
 */
export const MAU_O_SAN = [
  mauThuongHieu.tim,
  mauThuongHieu.neon,
  mauThuongHieu.cam,
  mauThuongHieu.vang,
  mauThuongHieu.mint,
  mauThuongHieu.chi,
] as const;

/** Màu ô khi chưa ai chọn gì. Cũng là mặc định của cột `o_qua.mau`. */
export const MAU_O_MAC_DINH = mauThuongHieu.tim;

/**
 * Màu dùng cho NÉT VẼ của mặt vòng (viền cung, trục giữa, kim).
 * Gom một chỗ để `components/vong-quay.tsx` không phải viết mã màu.
 */
export const MAU_NET_VONG = {
  vien: mauThuongHieu.trang,
  vienTruc: mauThuongHieu.ke,
  kim: mauThuongHieu.cam,
} as const;
