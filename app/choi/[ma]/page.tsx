import { notFound } from "next/navigation";

import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { ManDienThoai } from "@/components/man-dien-thoai";

export const dynamic = "force-dynamic";

export default async function TrangChoi({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMa(ma.toUpperCase());
  if (!ct) notFound();

  return (
    <ManDienThoai
      ma={ct.ma}
      soTrung={ct.soTrung}
      tenTrungTam={ct.tenTrungTam}
      tenGiaiThuong={ct.tenGiaiThuong}
      thamSo={ct.thamSo}
    />
  );
}
