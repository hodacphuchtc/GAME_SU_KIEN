import { T } from "@/config/locale";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { danhSachO } from "@/lib/o-qua/kho";
import { chiaCung } from "@/lib/vong-quay/chia-o";
import { ManChoi } from "@/components/man-choi";

// Đọc thẳng CSDL mỗi lượt tải: nhân viên tắt chương trình lúc 9h thì 9h01 phụ
// huynh quét QR phải thấy "đã kết thúc", không phải bản dựng cũ còn hạn.
export const dynamic = "force-dynamic";

/**
 * Trang phụ huynh quét mã QR vào. Trang này CÔNG KHAI — `proxy.ts` cố ý không
 * chắn `/choi`, vì người quét mã không có tài khoản nào cả.
 */
export default async function TrangChoi({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMa(ma);

  const khung = (noiDung: React.ReactNode) => (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-8">
      <h1 className="text-center text-2xl font-black text-tim">{T.choiTieuDe}</h1>
      <div className="mt-6">{noiDung}</div>
    </main>
  );

  const bao = (cau: string) => (
    <p className="rounded-2xl border border-ke bg-white p-6 text-center text-base text-muc">
      {cau}
    </p>
  );

  if (!ct) return khung(bao(T.choiKhongThayChuongTrinh));
  if (ct.trangThai !== "dang_chay") return khung(bao(T.choiDaKetThuc));
  const dsO = danhSachO(ct.id);
  if (dsO.length === 0) return khung(bao(T.choiChuaCoO));

  // Vòng vẽ sẵn TRƯỚC khi bấm để phụ huynh nhìn thấy mình đang chơi cái gì.
  // Đây chỉ là mặt vòng để xem; kết quả do máy chủ quyết lúc bấm QUAY.
  const cungBanDau = chiaCung(dsO, ct.tiLeODay);
  if (cungBanDau.length === 0) return khung(bao(T.quayHetQua));

  return khung(<ManChoi ma={ct.ma} cungBanDau={cungBanDau} />);
}
