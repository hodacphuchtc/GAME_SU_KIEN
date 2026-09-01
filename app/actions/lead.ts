"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { T } from "@/config/locale";
import { TRANG_THAI_LEAD, type TrangThaiLead } from "@/config/to-chuc";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { chiaLuanPhien, datTrangThaiLead, ganLead, ghiChuLead } from "@/lib/lead/kho";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";

/**
 * Thao tác trên khách tiềm năng.
 *
 * 🔴 MỌI hàm ở đây tự đọc phiên rồi truyền `phamViCua(nguoi)` xuống kho. Nhận
 * phạm vi từ tham số là để máy khách tự khai mình được thấy những gì — tức là
 * không có phân quyền nào cả.
 */

export interface KetQuaLead {
  loi?: string;
  xong?: string;
}

export async function ganLeadAction(leadId: number, nhanVienId: number | null): Promise<void> {
  const nguoi = await batBuocDangNhap();
  const pv = phamViCua(nguoi);
  if (!ganLead(leadId, nhanVienId, pv)) return;

  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.ganLead,
    doiTuong: `khach:${leadId}→nv:${nhanVienId ?? "bo-giao"}`,
    soDong: 1,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });
  revalidatePath("/quan-tri/khach");
}

export async function datTrangThaiLeadAction(
  leadId: number,
  trangThai: TrangThaiLead,
): Promise<void> {
  const nguoi = await batBuocDangNhap();
  if (!TRANG_THAI_LEAD.includes(trangThai)) return;
  datTrangThaiLead(leadId, trangThai, phamViCua(nguoi));
  revalidatePath("/quan-tri/khach");
}

export async function ghiChuLeadAction(leadId: number, ghiChu: string): Promise<void> {
  const nguoi = await batBuocDangNhap();
  ghiChuLead(leadId, ghiChu, phamViCua(nguoi));
  revalidatePath("/quan-tri/khach");
}

/**
 * Chia luân phiên — của MỘT cơ sở.
 *
 * Ba ca không chia được đều phải nói ra bằng câu tiếng Việt. Im lặng thì người
 * bấm không biết là "đã chia rồi" hay "nút hỏng", và họ sẽ bấm thêm năm lần.
 */
export async function chiaLuanPhienAction(coSoId: number | null): Promise<KetQuaLead> {
  const nguoi = await batBuocDangNhap();
  const pv = phamViCua(nguoi);

  // Sale không được chia cho cả cơ sở; đây là việc của quản lý.
  if (nguoi.vaiTro === "sale") return { loi: T.nvErrQuyen };
  if (coSoId === null) return { loi: T.leadChiaChuaChonCoSo };
  if (pv.coSoId !== null && pv.coSoId !== coSoId) return { loi: T.nvErrQuyen };

  const kq = chiaLuanPhien(coSoId);
  if (kq.lyDo === "chua-co-sale") return { loi: T.leadChiaChuaCoSale };
  if (kq.lyDo === "khong-con-lead") return { loi: T.leadChiaHetLead };

  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.ganLead,
    doiTuong: `chia-luan-phien:co-so:${coSoId}`,
    soDong: kq.daChia,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });
  revalidatePath("/quan-tri/khach");
  return { xong: T.leadChiaXong(kq.daChia) };
}
