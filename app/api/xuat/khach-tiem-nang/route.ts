import { headers } from "next/headers";

import type { TrangThaiLead } from "@/config/to-chuc";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { danhSachLead } from "@/lib/lead/kho";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
import { bangLead } from "@/lib/xuat/bang-lead";
import { traLoiXlsx } from "@/lib/xuat/tra-loi";

/**
 * Xuất khách tiềm năng — **đúng bộ lọc đang hiện trên màn**.
 *
 * 🔴 Nhận bộ lọc qua query string chứ không xuất tất cả: người bấm nút vừa lọc
 * CS2 + trạng thái Mới thì họ muốn đúng danh sách đó. Đưa cả nghìn dòng vừa bắt
 * họ lọc lại trong Excel, vừa mang dữ liệu cơ sở khác ra khỏi hệ thống mà không
 * ai định làm vậy.
 *
 * Phạm vi quyền vẫn áp TRƯỚC bộ lọc — sale không xuất được khách cơ sở khác dù
 * có tự sửa query string.
 */
export async function GET(yc: Request) {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return new Response("Chưa đăng nhập", { status: 401 });

  const q = new URL(yc.url).searchParams;
  const so = (k: string) => {
    const n = Number.parseInt(q.get(k) ?? "", 10);
    return Number.isFinite(n) ? n : null;
  };
  const ngay = (k: string) => {
    const gt = q.get(k);
    return gt && /^\d{4}-\d{2}-\d{2}$/.test(gt) ? gt : null;
  };

  const dong = danhSachLead(phamViCua(nguoi), {
    coSoId: so("coSo"),
    trangThai: (q.get("trangThai") as TrangThaiLead | null) ?? null,
    nhanVienId: so("sale"),
    chuaGiao: q.get("chuaGiao") === "1",
    tuNgay: ngay("tuNgay"),
    denNgay: ngay("denNgay"),
    chiDongY: q.get("chiDongY") !== "0",
  });

  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xuatFile,
    doiTuong: `khach-tiem-nang?${q.toString()}`,
    soDong: dong.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return traLoiXlsx(bangLead("Khách tiềm năng", dong), "khach-tiem-nang.xlsx");
}
