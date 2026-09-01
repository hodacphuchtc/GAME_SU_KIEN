import { notFound } from "next/navigation";

import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { suaDuocCoSo } from "@/lib/bao-ve/quyen";
import { danhSachCoSo, demRangBuocCoSo } from "@/lib/co-so/kho";
import { BangCoSo } from "@/components/bang-co-so";

/** Cơ sở đọc thẳng từ CSDL mỗi lần vào — danh mục nhỏ, không đáng đặt cache. */
export const dynamic = "force-dynamic";

export default async function TrangCoSo({
  searchParams,
}: {
  searchParams: Promise<{ an?: string }>;
}) {
  // Cơ sở là danh mục dùng chung TOÀN hệ thống — chỉ quản trị được sửa.
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi || !suaDuocCoSo(nguoi)) notFound();

  const { an } = await searchParams;
  const hienCaDaAn = an === "1";
  const danhSach = danhSachCoSo(hienCaDaAn);

  // Đếm ở máy chủ rồi truyền xuống: component máy khách không đụng thẳng SQL.
  // Danh mục cơ sở nhỏ (vài chục dòng), một vòng lặp ở đây rẻ hơn nhiều so với
  // việc nhét bốn phép đếm con vào câu truy vấn danh sách.
  const rangBuoc = Object.fromEntries(danhSach.map((cs) => [cs.id, demRangBuocCoSo(cs.id)]));

  return <BangCoSo danhSach={danhSach} rangBuoc={rangBuoc} hienCaDaAn={hienCaDaAn} />;
}
