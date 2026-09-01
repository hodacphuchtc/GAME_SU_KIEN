/**
 * Hằng số TỔ CHỨC — cơ sở, nhân viên, khách tiềm năng, kho quà.
 *
 * Tách khỏi `game.ts` có chủ ý: `game.ts` là luật CHƠI của Trúng Số, còn file
 * này là chuyện của cả hệ thống và dùng chung cho mọi game sau này.
 */

/** Tiền tố mã cơ sở: CS1, CS2, … Đổi tiền tố thì mã cũ vẫn giữ nguyên. */
export const TIEN_TO_CO_SO = "CS";

/** Tên gán cho nhóm chương trình cũ không có tên trung tâm lúc nâng cấp lược đồ. */
export const TEN_CO_SO_MAC_DINH = "Chưa phân loại";

/**
 * Ba mức, vì nhu cầu thật sự có ba:
 * - `bat`    đang hoạt động;
 * - `tat`    tạm ngừng — không hiện ở ô chọn khi tạo chương trình, nhưng vẫn
 *            nằm trong bảng cho ai cần nhìn;
 * - `da_an`  dọn khỏi mắt hẳn (GĐ 23.2) — quầy đã đóng cửa từ lâu. Dữ liệu vẫn
 *            còn nguyên, lấy lại bằng ô "Hiện cả mục đã ẩn".
 */
export const TRANG_THAI_CO_SO = ["bat", "tat", "da_an"] as const;
export type TrangThaiCoSo = (typeof TRANG_THAI_CO_SO)[number];

export const TRANG_THAI_NHAN_VIEN = ["dang_lam", "da_nghi"] as const;
export type TrangThaiNhanVien = (typeof TRANG_THAI_NHAN_VIEN)[number];

export const VAI_TRO = ["quan_tri", "quan_ly_co_so", "sale"] as const;
export type VaiTro = (typeof VAI_TRO)[number];

/**
 * Sáu trạng thái theo dõi khách tiềm năng — đủ dùng, không hơn.
 *
 * `khong_nghe_may` CỐ Ý không phải trạng thái đóng: gọi lại lần hai là chuyện
 * bình thường, đóng sổ ở đây là vứt đi những người chỉ đang bận.
 */
export const TRANG_THAI_LEAD = [
  "moi",
  "da_lien_he",
  "hen_hoc_thu",
  "khong_nghe_may",
  "chot",
  "bo",
] as const;
export type TrangThaiLead = (typeof TRANG_THAI_LEAD)[number];

/** Đã đóng sổ — không đưa vào đợt chia luân phiên nữa. */
export const TRANG_THAI_LEAD_DONG: readonly TrangThaiLead[] = ["chot", "bo"];
export const TRANG_THAI_LEAD_MAC_DINH: TrangThaiLead = "moi";

/** Hai chế độ chơi. `tai_quay` cần màn hình LCD; `online` thì điện thoại tự hiện số. */
export const CHE_DO_CHOI = ["tai_quay", "online"] as const;
export type CheDoChoi = (typeof CHE_DO_CHOI)[number];

/** Cơ sở của chương trình: gán sẵn, hay để phụ huynh tự chọn lúc chơi. */
export const NGUON_CO_SO = ["gan_san", "phu_huynh_chon"] as const;
export type NguonCoSo = (typeof NGUON_CO_SO)[number];

/** Số lần bấm mỗi ván — khoảng cho phép nhân viên khai. */
export const SO_LAN_CHOI = { toiThieu: 1, toiDa: 5, macDinh: 1 } as const;

/**
 * Các game chạy trên CÙNG MỘT app (ADR-005), phân biệt bằng cột
 * `chuong_trinh.tro_choi`.
 *
 * 🔴 Cơ sở · nhân viên · khách tiềm năng là danh mục DÙNG CHUNG, chỉ tồn tại
 * một nơi. Hai app riêng là hai bản sao danh bạ khách, và chúng chỉ lệch vào
 * đúng ngày ai đó sửa một bên.
 *
 * - `trung_so` — có số trúng định trước, có kho quà, ván nhiều lần bấm.
 * - `chon_so`  — không trúng/thua, không kho quà; chạy một DẢI SỐ xoay vòng,
 *   mỗi người bấm một lần và nhận số của mình. Quà đánh số nằm NGOÀI hệ thống.
 */
export const TRO_CHOI = ["trung_so", "chon_so"] as const;
export type TroChoi = (typeof TRO_CHOI)[number];
export const TRO_CHOI_MAC_DINH: TroChoi = "trung_so";

/**
 * Còn dưới tỉ lệ này của số lượng ban đầu thì dải cảnh báo chuyển VÀNG.
 * 0,2 = còn 20%. Chọn 20% vì nó cho quản lý khoảng một ngày để xoay quà.
 */
export const NGUONG_CANH_BAO_KHO = 0.2;

/**
 * HẠN LƯU TRỮ khách tiềm năng, tính bằng THÁNG (Nghị định 13/2023 về bảo vệ dữ
 * liệu cá nhân: chỉ giữ trong thời gian cần thiết cho mục đích đã báo).
 *
 * 24 tháng = hai mùa tuyển sinh. Quá đó thì một số điện thoại xin từ trò chơi ở
 * quầy không còn lý do gì để nằm trong máy nữa.
 */
export const HAN_LUU_LEAD_THANG = 24;
