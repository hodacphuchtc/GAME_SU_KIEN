import { headers } from "next/headers";

import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
import { danhSachQua } from "@/lib/qua/kho-qua";
import { bangKhoQua } from "@/lib/xuat/bang-kho-qua";
import { traLoiXlsx } from "@/lib/xuat/tra-loi";

/** Xuất tồn kho + đã trao của một chương trình, để đối soát ngân sách quà. */
export async function GET(_yc: Request, ctx: { params: Promise<{ ma: string }> }) {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return new Response("Chưa đăng nhập", { status: 401 });

  const { ma } = await ctx.params;
  const ct = timTheoMa(ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) return new Response("Không tìm thấy chương trình", { status: 404 });

  const kho = danhSachQua(ct.id);
  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xuatFile,
    doiTuong: `kho-qua:${ct.ma}`,
    soDong: kho.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return traLoiXlsx(bangKhoQua(`Kho quà ${ct.ma}`, kho), `kho-qua-${ct.ma}.xlsx`);
}
