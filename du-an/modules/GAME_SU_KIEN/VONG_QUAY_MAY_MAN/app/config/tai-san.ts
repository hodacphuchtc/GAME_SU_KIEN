import linhVatAnMung from "@/public/thuong-hieu/linh-vat-sata-robo-nen-trong.png";
import logoSataRobo from "@/public/thuong-hieu/logo-sata-robo.png";

/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/config/tai-san.ts` @ 3d96358, và HAI TỆP ẢNH
 * chép từ `modules/GAME_SU_KIEN/app/public/thuong-hieu/` cùng commit. Chép tay có chủ đích
 * — Vòng Quay đứng riêng (ADR-010), cấm import xuyên app.
 */

/**
 * TÀI SẢN NHẬN DIỆN — bản master, kèm nguồn gốc.
 *
 * 🔴 File này `import` ảnh `.png` tĩnh, nên **KHÔNG được import từ bất kỳ file nào mà
 * `tests/**` chạm tới**. `vitest.config.mts` chạy `environment: "node"` và không có loader
 * ảnh — nó sẽ nghẹn ngay khi cố parse một tệp PNG. Đường đi an toàn:
 * `tai-san.ts` → `components/nhan-dien-sata.tsx` → chỉ các trang, không có bài test nào.
 *
 * 🔴 **Ảnh master giữ nguyên bản, không tự nén đè.** Next tự sinh bản WebP đúng kích thước
 * lúc dựng; nén tay ở đây là làm hỏng bản gốc mà chẳng được gì.
 */

/** Nguồn gốc — để người sau kiểm được ảnh có đúng bản chính thức không. */
export const NGUON_TAI_SAN = {
  logo: {
    tenGoc: "Logo_SataRobo.png",
    chepTu: "GAME_SU_KIEN/app/public/thuong-hieu/logo-sata-robo.png @ 3d96358",
    kichThuoc: "644×380",
    nenTrongSuot: true,
  },
  linhVat: {
    tenGoc: "Mascot Sata Robo.png",
    chepTu:
      "GAME_SU_KIEN/app/public/thuong-hieu/linh-vat-sata-robo-nen-trong.png @ 3d96358",
    kichThuoc: "1024×1024",
    /**
     * 🔴 Bản MASTER **không có kênh alpha** — nền là `#FCFCFC`. Suy đoán "gần trắng nên đặt
     * trên nền trắng là không thấy" **SAI**: ảnh chụp màn chờ LCD cho thấy một cái hộp xám
     * rõ mồn một. Vì vậy bản ta dùng ở đây là bản DẪN XUẤT đã tách nền.
     */
    nenTrongSuot: true,
  },
} as const;

/**
 * Tư thế linh vật → tệp ảnh.
 *
 * 🔴 **`an_mung` KHÔNG được dùng ở màn không trúng.** Vòng Quay v1 luôn có ô đáy nên ai
 * cũng nhận được thứ gì đó — nhưng luật này giữ lại ở đây cho phiên bản sau, vì đây đúng là
 * chỗ người ta sẽ đọc khi định thêm linh vật vào một màn mới.
 */
export const TU_THE_LINH_VAT = {
  an_mung: linhVatAnMung,
} as const;

export type TuTheLinhVat = keyof typeof TU_THE_LINH_VAT;

export const LOGO = logoSataRobo;

/**
 * Khoảng thở quanh logo: vùng trống tối thiểu tương đương chiều cao một phần tử chữ trong
 * logo. Đo trên bản master 644×380 thì chữ cao ~150px ⇒ ~23% chiều cao logo. Giữ con số ở
 * ĐÂY để ba màn hình không ai tự chế một giá trị riêng.
 */
export const KHOANG_THO_LOGO = 0.23;

/** Tỉ lệ khung của logo — dùng để tính bề ngang từ chiều cao, không gõ số cứng hai nơi. */
export const TI_LE_LOGO = 644 / 380;
