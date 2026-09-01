import { headers } from "next/headers";

import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { toanBoLichSu } from "@/lib/luot/kho-luot";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
import { bangLichSu } from "@/lib/xuat/bang-lich-su";
import { traLoiXlsx } from "@/lib/xuat/tra-loi";

/**
 * Xuất lịch sử ván chơi của một chương trình.
 *
 * `proxy.ts` đã chắn `/api/xuat/*` bằng chữ ký cookie; ở đây đọc lại phiên để
 * biết AI đang tải, cho dòng nhật ký có tên người.
 */
export async function GET(_yc: Request, ctx: { params: Promise<{ ma: string }> }) {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return new Response("Chưa đăng nhập", { status: 401 });

  const { ma } = await ctx.params;
  const ct = timTheoMa(ma.toUpperCase());
  if (!ct) return new Response("Không tìm thấy chương trình", { status: 404 });

  const dong = toanBoLichSu(ct.id);
  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xuatFile,
    doiTuong: `lich-su:${ct.ma}`,
    soDong: dong.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return traLoiXlsx(bangLichSu(`Lịch sử ${ct.ma}`, dong), `lich-su-${ct.ma}.xlsx`);
}
