import { notFound } from "next/navigation";

import { timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { coSoDangBat } from "@/lib/co-so/kho";
import { nhanCoSo } from "@/lib/co-so/nhan";
import { ManDienThoai } from "@/components/man-dien-thoai";
import { ManDienThoaiChonSo } from "@/components/man-dien-thoai-chon-so";
import { ManDienThoaiVongQuay } from "@/components/man-dien-thoai-vong-quay";
import { T } from "@/config/locale";
import { chiaCung } from "@/lib/vong-quay/chia-o";
import { danhSachO } from "@/lib/vong-quay/kho-o";

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

  if (ct.troChoi === "vong_quay") {
    const dsO = danhSachO(ct.id);
    const bao = (cau: string) => (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-8">
        <p className="rounded-2xl border border-ke bg-white p-6 text-center text-base text-muc">
          {cau}
        </p>
      </main>
    );
    if (dsO.length === 0) return bao(T.quayChuaCoO);
    // Vòng vẽ sẵn TRƯỚC khi bấm để phụ huynh nhìn thấy mình đang chơi cái gì.
    // Đây chỉ là mặt vòng để XEM; kết quả do máy chủ quyết lúc bấm QUAY.
    const cungBanDau = chiaCung(dsO, ct.tiLeODay);
    if (cungBanDau.length === 0) return bao(T.quayHetQua);
    return (
      <ManDienThoaiVongQuay ma={ct.ma} cungBanDau={cungBanDau} coSoChon={coSoChon} />
    );
  }

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
