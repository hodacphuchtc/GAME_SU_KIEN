/**
 * Bộ nhận diện SATA ROBO — NGUỒN GIÁ TRỊ DUY NHẤT. Cấm hardcode màu ở nơi khác.
 *
 * Đây là bản CHÉP GIÁ TRỊ từ bộ nhận diện thương hiệu, KHÔNG phải import code:
 * Vòng Quay là ứng dụng đứng riêng, không dính gì tới app Trúng Số lẫn hệ quản
 * trị SataRobo. Bộ nhận diện đổi thì sửa file này, không sửa rải rác trong
 * component — và sửa xong phải đồng bộ luôn `app/globals.css` (xem chú thích ở đó).
 */
export const mauThuongHieu = {
  tim: "#6B21A8", // ROBO — màu chính: tiêu đề, nút chính, thanh bên
  cam: "#F97316", // SATA — màu nhấn: CTA, kim vòng quay, ô trúng
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
 * MÀU TRẠNG THÁI — cố ý TÁCH khỏi `mauThuongHieu`.
 *
 * Chúng không thuộc bộ nhận diện: đổi chúng không đụng gì tới thương hiệu, và
 * ngược lại, ai đó dùng chúng cho một cái nút thì đó là dùng sai. Nhưng chúng
 * VẪN phải được khai ở đây, vì `globals.css` có định nghĩa chúng và bài kiểm
 * `tests/thuong-hieu.test.ts` đòi hai file khớp nhau từng mã màu.
 *
 * Bài học đã trả giá ở app Trúng Số: một file tự xưng "NGUỒN GIÁ TRỊ DUY NHẤT"
 * mà không có gì canh thì chỉ là tờ giấy dán tường — hai bên lệch SÁU màu trước
 * khi có ai để ý.
 */
export const mauTrangThai = {
  luc: "#16A34A", // thành công, đã trao thưởng
  do: "#DC2626", // lỗi, hết hàng
  timNhat: "#F3E8FF", // nền nhạt của tím, dùng cho vùng nhấn nhẹ
} as const;

/**
 * Tên biến CSS tương ứng trong `app/globals.css`. Tailwind cần giá trị tĩnh
 * lúc dựng nên không import được TypeScript vào CSS — hai nơi phải khớp tay, và
 * bảng này là thứ để bài kiểm đối chiếu.
 */
export const tenBienCss: Record<string, string> = {
  tim: "--color-tim",
  cam: "--color-cam",
  mint: "--color-mint",
  vang: "--color-vang",
  neon: "--color-neon",
  muc: "--color-muc",
  chi: "--color-chi",
  suong: "--color-suong",
  ke: "--color-ke",
  luc: "--color-luc",
  do: "--color-do",
  timNhat: "--color-tim-nhat",
  // `trang` cố ý KHÔNG có biến riêng: Tailwind đã có `white`, thêm một cái tên
  // thứ hai cho cùng màu là mời người sau dùng lẫn lộn hai đằng.
};

/**
 * Tỉ lệ màu ràng buộc bố cục: trắng 60% · tím 30% · cam 10%.
 * Đừng để cam tràn ra ngoài phần CTA và kim vòng quay — nó mất tác dụng ngay.
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
 * 🔴 Màu BÊN TRONG ảnh logo / linh vật là `#FF6F00` và `#800080`, và KHÔNG BAO
 * GIỜ được sửa: cấm `filter`, `mix-blend-mode`, `opacity < 1`, grayscale, tint.
 *
 * CỐ Ý không đưa hai mã màu đó vào `mauThuongHieu` — để đó là mời người sau vô
 * tình dùng chúng cho một cái nút bấm.
 */

/**
 * Bảng màu SẴN cho ô quà trên vòng quay, theo đúng thứ tự gợi ý.
 *
 * Người tạo chương trình chọn từ bảng này chứ không gõ mã màu tự do: mã tự do
 * là cửa để một ô sáng chói lấn át phần còn lại, và cũng là chỗ CSS tuỳ biến
 * lọt vào (xem mục "KHÔNG LÀM Ở PHIÊN BẢN NÀY" trong sổ).
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
 * Màu dùng cho NÉT VẼ của mặt vòng (viền cung, trục giữa, chữ trên cung).
 * Gom lại một chỗ để `components/vong-quay.tsx` không phải viết mã màu.
 */
export const MAU_NET_VONG = {
  vien: mauThuongHieu.trang,
  chu: mauThuongHieu.trang,
  vienTruc: mauThuongHieu.ke,
  kim: mauThuongHieu.cam,
} as const;
