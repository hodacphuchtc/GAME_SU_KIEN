import Image from "next/image";

import { T } from "@/config/locale";
import {
  KHOANG_THO_LOGO,
  LOGO,
  TI_LE_LOGO,
  TU_THE_LINH_VAT,
  type TuTheLinhVat,
} from "@/config/tai-san";

/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/components/nhan-dien-sata.tsx` @ 3d96358.
 * ĐÃ SỬA: bỏ `TuTheLinhVat` thừa của game kia, tỉ lệ logo đọc từ `TI_LE_LOGO`.
 */

/**
 * LỚP NHẬN DIỆN SATA ROBO — luật thương hiệu sống ở ĐÚNG MỘT chỗ.
 *
 * Ba màn hình (LCD, điện thoại, quản trị) đều vẽ logo và linh vật. Để mỗi màn
 * tự đặt kích thước và khoảng cách thì ba nơi trôi ra ba kiểu, và không ai biết
 * cái nào đúng.
 *
 * 🔴 **CẤM TUYỆT ĐỐI với hai ảnh này:**
 *   · không `filter`, `mix-blend-mode`, `opacity < 1`, grayscale, tint;
 *   · không xoay, không đổi tỉ lệ khung, không tự dựng lại bằng AI.
 *
 * Màu bên trong logo là hai mã màu **khoá cứng** của thương hiệu, và cố ý KHÔNG
 * có mặt trong `mauThuongHieu` hay `@theme` — để người sau không vô tình dùng
 * chúng cho một cái nút. `tests/thuong-hieu.test.ts` canh luật này.
 */

/**
 * Logo Sata Robo.
 *
 * `sizes` là BẮT BUỘC: thiếu nó thì điện thoại tải bản 644px cho một cái logo
 * cao 28px. Dùng `preload` chứ không `priority` — Next 16 đã bỏ `priority`.
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
      alt={T.nhanDienLogoAlt}
      height={chieuCao}
      width={Math.round(chieuCao * TI_LE_LOGO)}
      sizes={sizes}
      preload={preload}
      // Khoảng thở tính từ chính chiều cao logo, không gõ số cứng.
      style={{ margin: `${Math.round(chieuCao * KHOANG_THO_LOGO)}px 0` }}
      className={`h-auto w-auto ${className}`}
    />
  );
}

/**
 * Linh vật Sata Robo.
 *
 * 🔴 Dùng bản ĐÃ TÁCH NỀN. Bản master không có kênh alpha (nền `#FCFCFC`), và
 * suy đoán "gần trắng nên đặt trên nền trắng là không thấy" đã được chứng minh
 * là SAI: ảnh chụp màn LCD cho thấy một cái hộp xám rõ mồn một.
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
      alt={T.nhanDienLinhVatAlt}
      height={canh}
      width={canh}
      sizes={sizes}
      className={`h-auto w-auto select-none ${className}`}
    />
  );
}

/** Câu định vị, đứng cạnh logo. */
export function CauDinhVi({ className = "" }: { className?: string }) {
  return <p className={`text-chi ${className}`}>{T.cauDinhVi}</p>;
}
