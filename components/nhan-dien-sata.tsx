import Image from "next/image";

import { T } from "@/config/locale";
import { KHOANG_THO_LOGO, LOGO, TU_THE_LINH_VAT, type TuTheLinhVat } from "@/config/tai-san";

/**
 * LỚP NHẬN DIỆN SATA ROBO — luật thương hiệu sống ở ĐÚNG MỘT chỗ.
 *
 * Ba màn hình (LCD, điện thoại, quản trị) đều vẽ logo và linh vật. Để mỗi màn tự đặt kích
 * thước và khoảng cách thì ba nơi trôi ra ba kiểu, và không ai biết cái nào đúng.
 *
 * 🔴 **CẤM TUYỆT ĐỐI với hai ảnh này** (brand doc § 10):
 *   · không `filter`, `mix-blend-mode`, `opacity < 1`, grayscale, tint;
 *   · không để `.vien-mach` / `.led-sang` chạy xuyên qua;
 *   · không xoay, không đổi tỉ lệ khung, không tự dựng lại bằng AI.
 * Màu bên trong logo là `#FF6F00` và `#800080`, **khoá cứng** — và cố ý KHÔNG có mặt trong
 * `mauThuongHieu` hay `@theme`, để người sau không vô tình dùng chúng cho một cái nút.
 */

/**
 * Logo Sata Robo.
 *
 * `sizes` là BẮT BUỘC: thiếu nó thì điện thoại tải bản 644px cho một cái logo cao 28px.
 * Dùng `preload` chứ không `priority` — Next 16 đã bỏ `priority` (xem
 * `node_modules/next/dist/docs/.../image.md`).
 */
export function LogoSata({
  chieuCao,
  sizes,
  preload = false,
  className = "",
}: {
  chieuCao: number;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={LOGO}
      alt={T.brandLogoAlt}
      height={chieuCao}
      width={Math.round((chieuCao * 644) / 380)}
      sizes={sizes}
      preload={preload}
      // Khoảng thở theo brand doc § 9 — tính từ chính chiều cao logo, không gõ số cứng.
      style={{ margin: `${Math.round(chieuCao * KHOANG_THO_LOGO)}px 0` }}
      className={`h-auto w-auto ${className}`}
    />
  );
}

/**
 * Linh vật Sata Robo.
 *
 * 🔴 **Chỉ đặt trên nền TRẮNG.** Ảnh master không có kênh alpha (nền `#FCFCFC`); trên nền
 * `bg-suong` hay nền tím nó hiện ra một cái hộp vuông.
 *
 * 🔴 Tư thế `an_mung` **không được dùng ở màn THUA** — robot giơ cúp vàng cạnh dòng "KHÔNG
 * TRÚNG THƯỞNG" đọc lên như đang trêu người vừa hụt. Luật này được nhắc lại ở đây thay vì
 * chỉ nằm trong tài liệu, vì đây là chỗ người ta sẽ đọc khi định thêm linh vật vào một màn mới.
 */
export function LinhVatSata({
  canh,
  sizes,
  tuThe = "an_mung",
  className = "",
}: {
  canh: number;
  sizes: string;
  tuThe?: TuTheLinhVat;
  className?: string;
}) {
  return (
    <Image
      src={TU_THE_LINH_VAT[tuThe]}
      alt={T.brandMascotAlt}
      height={canh}
      width={canh}
      sizes={sizes}
      className={`h-auto w-auto select-none ${className}`}
    />
  );
}

/**
 * Câu định vị.
 *
 * Đứng cạnh logo, KHÔNG đứng cạnh Brand Essence — hai câu trong cùng một khung nhìn thì
 * chúng cạnh tranh với chính bảng số và không câu nào đọng lại (ADR-002).
 */
export function CauDinhVi({ className = "" }: { className?: string }) {
  return <p className={`text-chi ${className}`}>{T.brandTagline}</p>;
}
