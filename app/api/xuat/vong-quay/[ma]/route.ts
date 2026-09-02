import { headers } from "next/headers";

import { timTheoMaVongQuay } from "@/lib/chuong-trinh/kho";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { toanBoLichSuQuay } from "@/lib/vong-quay/kho-luot-quay";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
import { bangVongQuay } from "@/lib/xuat/bang-vong-quay";
import { traLoiXlsx } from "@/lib/xuat/tra-loi";

/**
 * Xuất lịch sử lượt quay của một chương trình Vòng Quay.
 *
 * `proxy.ts` đã chắn `/api/xuat/*` bằng chữ ký cookie; ở đây đọc lại phiên để
 * biết AI đang tải, cho dòng nhật ký có tên người.
 */
export async function GET(_yc: Request, ctx: { params: Promise<{ ma: string }> }) {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return new Response("Chưa đăng nhập", { status: 401 });

  const { ma } = await ctx.params;
  // Lọc theo phạm vi VÀ theo game. Trả 404 chứ không 403 — không xác nhận sự
  // tồn tại của thứ họ không được thấy.
  const ct = timTheoMaVongQuay(ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) return new Response("Không tìm thấy chương trình", { status: 404 });

  const dong = toanBoLichSuQuay(ct.id);
  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xuatFile,
    doiTuong: `vong-quay:${ct.ma}`,
    soDong: dong.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return traLoiXlsx(bangVongQuay(`Vòng quay ${ct.ma}`, dong), `vong-quay-${ct.ma}.xlsx`);
}
