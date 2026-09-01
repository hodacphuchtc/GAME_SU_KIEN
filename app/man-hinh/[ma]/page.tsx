import { notFound } from "next/navigation";

import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { ManHinh } from "@/components/man-hinh";
import { canhBaoKho } from "@/lib/qua/kho-qua";

export const dynamic = "force-dynamic";

export default async function TrangManHinh({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMa(ma.toUpperCase());
  if (!ct) notFound();

  return (
    <ManHinh
      ma={ct.ma}
      soTrung={ct.soTrung}
      tenTrungTam={ct.tenTrungTam}
      tenGiaiThuong={ct.tenGiaiThuong}
      thamSo={ct.thamSo}
      mucKho={canhBaoKho(ct.id).muc}
    />
  );
}
