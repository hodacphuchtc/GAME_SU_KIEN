import { notFound } from "next/navigation";

import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { suaDuocCoSo } from "@/lib/bao-ve/quyen";
import { danhSachCoSo } from "@/lib/co-so/kho";
import { BangCoSo } from "@/components/bang-co-so";

/** Cơ sở đọc thẳng từ CSDL mỗi lần vào — danh mục nhỏ, không đáng đặt cache. */
export const dynamic = "force-dynamic";

export default async function TrangCoSo() {
  // Cơ sở là danh mục dùng chung TOÀN hệ thống — chỉ quản trị được sửa.
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi || !suaDuocCoSo(nguoi)) notFound();

  return <BangCoSo danhSach={danhSachCoSo()} />;
}
