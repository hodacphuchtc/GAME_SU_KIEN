import linhVatAnMung from "@/public/thuong-hieu/linh-vat-sata-robo-nen-trong.png";
import logoSataRobo from "@/public/thuong-hieu/logo-sata-robo.png";

/**
 * TÀI SẢN NHẬN DIỆN — bản master, kèm nguồn gốc.
 *
 * 🔴 File này `import` ảnh `.png` tĩnh, nên **KHÔNG được import từ bất kỳ file nào mà
 * `tests/**` chạm tới**. `vitest.config.mts` chạy `environment: "node"` và không có loader
 * ảnh — nó sẽ nghẹn ngay khi cố parse một tệp PNG. Đường đi an toàn hiện tại:
 * `tai-san.ts` → `components/nhan-dien-sata.tsx` → chỉ các trang, không có bài test nào.
 *
 * 🔴 **Ảnh master giữ nguyên bản, không tự nén đè** (brand doc § "Asset master thắng").
 * Next tự sinh bản WebP đúng kích thước lúc dựng; nén tay ở đây là làm hỏng bản gốc mà
 * chẳng được gì.
 */

/** Nguồn gốc — để người sau kiểm được ảnh có đúng bản chính thức không. */
export const NGUON_TAI_SAN = {
  logo: {
    driveId: "1tzfEI0NV4cGVI_jDRQKuTlc4rQcu6n9y",
    tenGoc: "Logo_SataRobo.png",
    keoVe: "2026-09-01",
    sha256: "a463f309873aa531989bd3655c6d8500b9927e43aebddd632cb867164b80cf17",
    kichThuoc: "644×380",
    nenTrongSuot: true,
  },
  linhVat: {
    driveId: "1Z0HpnHBnDAvomzrL3zN9lT4PcDjS5TeY",
    tenGoc: "Mascot Sata Robo.png",
    keoVe: "2026-09-01",
    sha256: "09f61fa65499e4caa11139674996312ab91a9a0b01ba86e2440cf6e6bef50e82",
    kichThuoc: "1024×1024",
    /**
     * 🔴 Bản MASTER **không có kênh alpha** — nền là `#FCFCFC`.
     *
     * Suy đoán ban đầu "gần trắng nên đặt trên nền trắng là không thấy" **SAI**: ảnh chụp
     * màn chờ LCD cho thấy một cái hộp xám rõ mồn một. Vì vậy có thêm bản dẫn xuất
     * `linh-vat-sata-robo-nen-trong.png` — và đó là bản ứng dụng dùng.
     */
    nenTrongSuot: false,
  },
} as const;

/**
 * Bản DẪN XUẤT: linh vật nền trong suốt.
 *
 * Cách làm: LOANG TỪ BỐN MÉP ảnh, xoá alpha của vùng nền nối liền ra ngoài (ngưỡng: ba
 * kênh ≥ 244 và chênh nhau ≤ 6). **Không** xoá theo màu trên toàn ảnh — con robot có
 * những mảng sáng gần trắng ở thân và ở cúp vàng, xoá theo màu sẽ đục thủng chính nó.
 *
 * 🔴 **Bản master giữ nguyên, không bị ghi đè** (brand doc § "Asset master thắng"). Đây là
 * khâu CHUẨN BỊ tài sản, không phải sửa nhận diện: không một điểm ảnh nào của con robot bị
 * đổi màu. Cần dựng lại thì chạy `scripts/tach-nen-linh-vat.mjs`.
 */
export const NGUON_LINH_VAT_NEN_TRONG = {
  dan_xuat_tu: "linh-vat-sata-robo.png",
  cach_lam: "loang từ bốn mép, ngưỡng RGB ≥ 244 và chênh ≤ 6",
  xoa: "75,1% số điểm ảnh",
  dung_lai_bang: "node scripts/tach-nen-linh-vat.mjs",
} as const;

/**
 * Tư thế linh vật → tệp ảnh.
 *
 * Thêm tư thế sau chỉ là thêm một dòng ở đây (xem `N.8` trong sổ lộ trình: đã xin chủ
 * thương hiệu xuất thêm tư thế "chào" và "chỉ tay").
 *
 * 🔴 **`an_mung` KHÔNG được dùng ở màn THUA.** Một con robot giơ cúp vàng đứng cạnh dòng
 * chữ "KHÔNG TRÚNG THƯỞNG" đọc lên như đang trêu người vừa hụt.
 */
export const TU_THE_LINH_VAT = {
  an_mung: linhVatAnMung,
} as const;

export type TuTheLinhVat = keyof typeof TU_THE_LINH_VAT;

export const LOGO = logoSataRobo;

/**
 * Khoảng thở quanh logo, theo brand doc § 9: vùng trống tối thiểu tương đương chiều cao
 * một phần tử chữ trong logo. Đo trên bản master 644×380 thì chữ cao ~150px ⇒ ~23% chiều
 * cao logo. Giữ con số ở ĐÂY để ba màn hình không ai tự chế một giá trị riêng.
 */
export const KHOANG_THO_LOGO = 0.23;
