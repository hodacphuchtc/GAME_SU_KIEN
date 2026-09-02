import { cookies } from "next/headers";

import { T } from "@/config/locale";
import { docPhien, TEN_COOKIE } from "@/lib/bao-ve/phien-quan-tri";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { bangLichSu, toanBoLichSu } from "@/lib/xuat/bang-lich-su";
import { traLoiXlsx } from "@/lib/xuat/tra-loi";

/**
 * XUẤT LỊCH SỬ LƯỢT QUAY của một chương trình ra file .xlsx.
 *
 * 🔴 KIỂM PHIÊN LẠI Ở ĐÂY dù `proxy.ts` đã chắn `/api/xuat/*`. "Đã có lớp chặn
 * ở cửa" không có nghĩa là từng phòng đã khoá — đúng cái sẹo đã trả giá ở app
 * Trúng Số, nơi lớp chắn ngoài ru ngủ mọi người suốt nhiều tháng. Lớp chắn kia
 * là quy ước của Next (một lần đặt sai tên tệp là nó biến mất không báo); lớp
 * này nằm ngay cạnh dữ liệu, không phụ thuộc quy ước nào.
 *
 * 🔴 Trả 401 chứ KHÔNG chuyển hướng, y như `proxy.ts`: một công cụ tải file mà
 * nhận về trang HTML đăng nhập sẽ lưu nguyên trang đó thành tệp .xlsx hỏng.
 *
 * 🔴 Đây là nơi DUY NHẤT xuất họ tên và số điện thoại KHÔNG che. Xem chú thích
 * đầu `lib/xuat/bang-lich-su.ts` trước khi đụng vào.
 */
export const dynamic = "force-dynamic";

export async function GET(_yc: Request, ctx: { params: Promise<{ ma: string }> }) {
  const kho = await cookies();
  const phien = await docPhien(kho.get(TEN_COOKIE)?.value);
  if (!phien) return new Response(T.xuatChuaDangNhap, { status: 401 });

  const { ma } = await ctx.params;
  const ct = timTheoMa(ma.toUpperCase());
  if (!ct) return new Response(T.xuatKhongThayChuongTrinh, { status: 404 });

  const dong = toanBoLichSu(ct.id);
  return traLoiXlsx(bangLichSu(T.xuatTenTrang(ct.ma), dong), T.xuatTenTep(ct.ma));
}
