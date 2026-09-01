import { notFound } from "next/navigation";

import { timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { ManHinh } from "@/components/man-hinh";
import { ManHinhChonSo } from "@/components/man-hinh-chon-so";
import { canhBaoKho } from "@/lib/qua/kho-qua";

export const dynamic = "force-dynamic";

export default async function TrangManHinh({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMaCongKhai(ma.toUpperCase());
  if (!ct) notFound();

  if (ct.troChoi === "chon_so") {
    return (
      <ManHinhChonSo
        ma={ct.ma}
        tenTrungTam={ct.tenTrungTam}
        tenDot={ct.tenGiaiThuong}
        daiTu={ct.daiTu}
        daiDen={ct.daiDen}
      />
    );
  }

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
