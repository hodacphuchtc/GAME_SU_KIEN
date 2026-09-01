import { notFound } from "next/navigation";

import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { coSoDangBat } from "@/lib/co-so/kho";
import { nhanCoSo } from "@/lib/co-so/nhan";
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
      cheDo={ct.cheDo}
      coSoChon={
        // Chỉ gửi danh sách khi THẬT SỰ cần hỏi. Gửi thừa là để lộ danh sách cơ
        // sở ra trang công khai mà chẳng dùng vào việc gì.
        ct.nguonCoSo === "phu_huynh_chon"
          ? coSoDangBat().map((cs) => ({ id: cs.id, nhan: nhanCoSo(cs) }))
          : null
      }
    />
  );
}
