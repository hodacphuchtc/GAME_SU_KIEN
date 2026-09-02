import { T } from "@/config/locale";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { danhSachO } from "@/lib/o-qua/kho";
import { chiaCung } from "@/lib/vong-quay/chia-o";
import { ManHinh } from "@/components/man-hinh";

// Màn LCD mở suốt buổi: phải đọc trạng thái mới mỗi lần tải, không dùng bản dựng cũ.
export const dynamic = "force-dynamic";

/**
 * MÀN HÌNH LCD trước sảnh. Trang CÔNG KHAI — `proxy.ts` cố ý không chắn
 * `/man-hinh`: cái máy chiếu ở sảnh không có ai ngồi đăng nhập cho nó.
 */
export default async function TrangManHinh({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMa(ma);

  const bao = (cau: string) => (
    <main className="flex min-h-dvh items-center justify-center bg-suong p-10">
      <p className="text-center text-3xl font-black text-chi">{cau}</p>
    </main>
  );

  if (!ct) return bao(T.lcdKhongThay);
  if (ct.trangThai !== "dang_chay") return bao(T.lcdDaKetThuc);

  const cungBanDau = chiaCung(danhSachO(ct.id), ct.tiLeODay);
  if (cungBanDau.length === 0) return bao(T.quayHetQua);

  return <ManHinh ma={ct.ma} cungBanDau={cungBanDau} tenCoSo={ct.tenCoSo} />;
}
