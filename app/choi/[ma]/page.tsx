import { notFound } from "next/navigation";

import { timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { coSoDangBat } from "@/lib/co-so/kho";
import { nhanCoSo } from "@/lib/co-so/nhan";
import { ManDienThoai } from "@/components/man-dien-thoai";
import { ManDienThoaiChonSo } from "@/components/man-dien-thoai-chon-so";

export const dynamic = "force-dynamic";

export default async function TrangChoi({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMaCongKhai(ma.toUpperCase());
  if (!ct) notFound();

  // Điểm ĐIỀU PHỐI, không phải "rắc if": hai game có hai bộ component riêng vì
  // chúng gần như không có gì chung để mà chia sẻ — Chọn Số không có màn thắng
  // thua, không "lệch N số", không kho quà.
  const coSoChon =
    ct.nguonCoSo === "phu_huynh_chon"
      ? coSoDangBat().map((cs) => ({ id: cs.id, nhan: nhanCoSo(cs) }))
      : null;

  if (ct.troChoi === "chon_so") {
    return (
      <ManDienThoaiChonSo
        ma={ct.ma}
        tenTrungTam={ct.tenTrungTam}
        tenDot={ct.tenGiaiThuong}
        daiTu={ct.daiTu}
        daiDen={ct.daiDen}
        coSoChon={coSoChon}
      />
    );
  }

  return (
    <ManDienThoai
      ma={ct.ma}
      soTrung={ct.soTrung}
      tenTrungTam={ct.tenTrungTam}
      tenGiaiThuong={ct.tenGiaiThuong}
      thamSo={ct.thamSo}
      cheDo={ct.cheDo}
      // Chỉ gửi danh sách khi THẬT SỰ cần hỏi. Gửi thừa là để lộ danh sách cơ
      // sở ra trang công khai mà chẳng dùng vào việc gì.
      coSoChon={coSoChon}
    />
  );
}
