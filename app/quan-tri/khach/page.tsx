import { headers } from "next/headers";
import { notFound } from "next/navigation";

import type { TrangThaiLead } from "@/config/to-chuc";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { danhSachCoSo } from "@/lib/co-so/kho";
import { danhSachLead } from "@/lib/lead/kho";
import { danhSachNhanVien } from "@/lib/nhan-vien/kho";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
import { BangLead } from "@/components/bang-lead";

export const dynamic = "force-dynamic";

/** Số hợp lệ hoặc `null` — tham số trên URL do người dùng gõ, không tin thẳng. */
function so(gt: string | undefined): number | null {
  if (!gt) return null;
  const n = Number.parseInt(gt, 10);
  return Number.isFinite(n) ? n : null;
}

/** `YYYY-MM-DD` hoặc `null`. Chuỗi lạ bị bỏ qua, không ném lên mặt người dùng. */
function ngay(gt: string | undefined): string | null {
  return gt && /^\d{4}-\d{2}-\d{2}$/.test(gt) ? gt : null;
}

export default async function TrangKhach({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) notFound();

  const q = await searchParams;
  const mot = (k: string) => (Array.isArray(q[k]) ? q[k][0] : q[k]);

  const coSoId = so(mot("coSo"));
  const trangThai = mot("trangThai") as TrangThaiLead | undefined;
  const nhanVienId = so(mot("sale"));
  const chuaGiao = mot("chuaGiao") === "1";
  // Tick "chỉ người đồng ý" BẬT SẴN: phải có `chiDongY=0` trên URL mới tắt.
  const chiDongY = mot("chiDongY") !== "0";
  const tuNgay = ngay(mot("tuNgay"));
  const denNgay = ngay(mot("denNgay"));

  const danhSach = danhSachLead(phamViCua(nguoi), {
    coSoId,
    trangThai: trangThai ?? null,
    nhanVienId,
    chuaGiao,
    tuNgay,
    denNgay,
    chiDongY,
  });

  // Ghi nhật ký MỖI LẦN xem danh sách, kèm số dòng đã hiện ra. Đây là câu trả
  // lời cho "danh bạ ra ngoài bằng đường nào" khi có chuyện.
  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xemLead,
    soDong: danhSach.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return (
    <BangLead
      danhSach={danhSach}
      coSo={danhSachCoSo()}
      sale={danhSachNhanVien()}
      duocChia={nguoi.vaiTro !== "sale"}
      loc={{
        coSoId: coSoId === null ? "" : String(coSoId),
        trangThai: trangThai ?? "",
        nhanVienId: nhanVienId === null ? "" : String(nhanVienId),
        chuaGiao,
        chiDongY,
        tuNgay: tuNgay ?? "",
        denNgay: denNgay ?? "",
      }}
    />
  );
}
