import { headers } from "next/headers";

import { timTheoMaChonSo } from "@/lib/chuong-trinh/kho";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { toanBoLichSu } from "@/lib/luot/kho-luot";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
import { bangSoDaChon } from "@/lib/xuat/bang-so-da-chon";
import { traLoiXlsx } from "@/lib/xuat/tra-loi";

/**
 * Xuất sổ số đã phát của một chương trình CHỌN SỐ.
 *
 * `proxy.ts` đã chắn `/api/xuat/*` bằng chữ ký cookie; ở đây đọc lại phiên để
 * biết AI đang tải, cho dòng nhật ký có tên người.
 */
export async function GET(_yc: Request, ctx: { params: Promise<{ ma: string }> }) {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return new Response("Chưa đăng nhập", { status: 401 });

  const { ma } = await ctx.params;
  // Lọc theo phạm vi VÀ theo game: sale cơ sở khác không tải được, và mã của
  // Trúng Số không mở được qua cửa này.
  const ct = timTheoMaChonSo(ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) return new Response("Không tìm thấy chương trình", { status: 404 });

  const dong = toanBoLichSu(ct.id);
  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xuatFile,
    doiTuong: `chon-so:${ct.ma}`,
    soDong: dong.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return traLoiXlsx(bangSoDaChon(`Số đã phát ${ct.ma}`, dong), `chon-so-${ct.ma}.xlsx`);
}
