import { notFound } from "next/navigation";

import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { quanLyDuocNhanVien } from "@/lib/bao-ve/quyen";
import { danhSachCoSo } from "@/lib/co-so/kho";
import { danhSachNhanVien } from "@/lib/nhan-vien/kho";
import { BangNhanVien } from "@/components/bang-nhan-vien";

export const dynamic = "force-dynamic";

/**
 * Màn nhân viên — CHỈ `quan_tri`.
 *
 * Trả `notFound()` chứ không phải một câu "bạn không có quyền": với người không
 * đủ quyền thì sự tồn tại của trang này cũng là một thông tin.
 */
export default async function TrangNhanVien() {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi || !quanLyDuocNhanVien(nguoi)) notFound();

  return (
    <BangNhanVien
      danhSach={danhSachNhanVien()}
      coSo={danhSachCoSo()}
      toiLa={nguoi.id}
    />
  );
}
