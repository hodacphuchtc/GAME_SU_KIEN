import { notFound } from "next/navigation";

import { timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { ManHinh } from "@/components/man-hinh";
import { ManHinhChonSo } from "@/components/man-hinh-chon-so";
import { ManHinhVongQuay } from "@/components/man-hinh-vong-quay";
import { canhBaoKho } from "@/lib/qua/kho-qua";
import { T } from "@/config/locale";
import { chiaCung } from "@/lib/vong-quay/chia-o";
import { danhSachO } from "@/lib/vong-quay/kho-o";
import { diaChiLan } from "@/lib/mang/dia-chi-lan";

export const dynamic = "force-dynamic";

export default async function TrangManHinh({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMaCongKhai(ma.toUpperCase());
  if (!ct) notFound();

  if (ct.troChoi === "vong_quay") {
    const cungBanDau = chiaCung(danhSachO(ct.id), ct.tiLeODay);
    if (cungBanDau.length === 0) {
      return (
        <main className="flex min-h-dvh items-center justify-center bg-suong p-10">
          <p className="text-center text-3xl font-black text-chi">{T.quayHetQua}</p>
        </main>
      );
    }
    return (
      <ManHinhVongQuay
        ma={ct.ma}
        cungBanDau={cungBanDau}
        tenCoSo={ct.tenTrungTam}
        /* Trình duyệt không biết IP LAN của máy chủ — con số này phải đi từ đây
           xuống, nếu không dải cảnh báo chỉ nói được "sai" mà không nói "đúng
           là gì". */
        ipLan={diaChiLan()}
      />
    );
  }

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
