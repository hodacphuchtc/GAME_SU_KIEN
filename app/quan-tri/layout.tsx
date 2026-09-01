import { cookies } from "next/headers";

import { docPhien, TEN_COOKIE } from "@/lib/bao-ve/phien-quan-tri";
import { KhungQuanTri } from "@/components/khung-quan-tri";

/**
 * Khung quản trị đọc phiên để hiện ĐÚNG tên người đang đăng nhập.
 *
 * Trước GĐ 15 chỗ này là chuỗi cứng "Nhân viên trực quầy" — vô hại khi chỉ có
 * một người dùng, nhưng từ khi có phân quyền thì một cái tên sai ở góc màn hình
 * khiến người ta tưởng mình đang ở tài khoản khác và làm nhầm việc.
 */
export default async function QuanTriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kho = await cookies();
  const phien = await docPhien(kho.get(TEN_COOKIE)?.value);

  return (
    <KhungQuanTri
      nguoiDung={
        phien
          ? { ten: phien.ten, vaiTro: phien.vaiTro, laQuanTri: phien.vaiTro === "quan_tri" }
          : null
      }
    >
      {children}
    </KhungQuanTri>
  );
}
