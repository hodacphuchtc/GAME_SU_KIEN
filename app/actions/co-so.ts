"use server";

import { revalidatePath } from "next/cache";

import { T } from "@/config/locale";
import type { TrangThaiCoSo } from "@/config/to-chuc";
import { headers } from "next/headers";

import {
  anCoSo,
  datTrangThaiCoSo,
  demRangBuocCoSo,
  suaCoSo,
  taoCoSo,
  timCoSo,
  trungTen,
  xoaCoSo,
} from "@/lib/co-so/kho";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { suaDuocCoSo } from "@/lib/bao-ve/quyen";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";

/**
 * Server action của màn quản lý cơ sở.
 *
 * Mọi kiểm tra nằm ở ĐÂY, không chỉ ở trình duyệt: form gửi được bằng công cụ
 * khác, và một cơ sở trùng tên thì cả năm sau không ai phân biệt nổi hai dòng
 * báo cáo của nó.
 */

export interface KetQuaCoSo {
  loi?: string;
  xong?: boolean;
}

function docChu(form: FormData, ten: string, toiDa: number): string {
  return String(form.get(ten) ?? "").trim().slice(0, toiDa);
}

export async function luuCoSoForm(
  _truoc: KetQuaCoSo,
  form: FormData,
): Promise<KetQuaCoSo> {
  const idText = String(form.get("id") ?? "").trim();
  const id = idText === "" ? null : Number.parseInt(idText, 10);
  const ten = docChu(form, "ten", 120);
  const diaChi = docChu(form, "diaChi", 200);
  const dienThoai = docChu(form, "dienThoai", 30);

  if (ten === "") return { loi: T.coSoErrNameEmpty };
  if (id !== null && (!Number.isFinite(id) || timCoSo(id) === null)) {
    return { loi: T.coSoErrNotFound };
  }
  if (trungTen(ten, id ?? undefined)) return { loi: T.coSoErrNameTaken };

  if (id === null) taoCoSo({ ten, diaChi, dienThoai });
  else suaCoSo(id, { ten, diaChi, dienThoai });

  revalidatePath("/quan-tri/co-so");
  // Trang tạo chương trình đọc danh sách cơ sở — không dọn thì ô chọn còn cũ.
  revalidatePath("/quan-tri/tao");
  return { xong: true };
}

/** Nhận TRẠNG THÁI ĐÍCH, không phải "lật" — nhấp đúp không được lật hai lần. */
export async function datTrangThaiCoSoAction(
  id: number,
  trangThai: TrangThaiCoSo,
): Promise<void> {
  datTrangThaiCoSo(id, trangThai);
  revalidatePath("/quan-tri/co-so");
  revalidatePath("/quan-tri/tao");
}

/**
 * Xoá cơ sở — hoặc ẩn nó, nếu xoá là mất theo danh bạ khách.
 *
 * 🔴 **Máy chủ tự quyết**, không nhận lệnh xoá-hay-ẩn từ máy khách. Ngưỡng ở đây
 * chặt hơn chương trình: chỉ xoá cứng khi cả bốn con số của `demRangBuocCoSo`
 * bằng 0, vì `khach_tiem_nang.co_so_id` và `nhan_vien.co_so_id` đều là
 * `ON DELETE CASCADE` — một câu delete là cuốn theo cả danh bạ, im lặng.
 */
export async function xoaHoacAnCoSo(id: number): Promise<{ loi?: string }> {
  const nguoi = await nguoiDangDangNhap();
  // Cơ sở là danh mục dùng chung toàn hệ thống — chỉ quản trị được dọn.
  if (!nguoi || !suaDuocCoSo(nguoi)) return { loi: T.nvErrQuyen };

  const cs = timCoSo(id);
  if (!cs) return { loi: T.coSoErrNotFound };

  const rb = demRangBuocCoSo(id);
  const trang = rb.soLead === 0 && rb.soNhanVien === 0 && rb.soChuongTrinh === 0 && rb.soVan === 0;
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");

  if (trang) xoaCoSo(id);
  else anCoSo(id);

  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: trang ? HANH_DONG.xoaCoSo : HANH_DONG.anCoSo,
    doiTuong: `${cs.ma} · ${cs.ten}`,
    soDong: rb.soLead,
    diaChiIp: ip,
  });

  revalidatePath("/quan-tri/co-so");
  revalidatePath("/quan-tri/tao");
  return {};
}
