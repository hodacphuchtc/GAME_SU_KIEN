"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { T } from "@/config/locale";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { xemDuocNhatKy } from "@/lib/bao-ve/quyen";
import { chuanHoaSdt } from "@/lib/nguoi-choi/so-dien-thoai";
import { ghiNhatKy, HANH_DONG, xoaTheoSdt } from "@/lib/nhat-ky/kho";

/**
 * Quyền được xoá dữ liệu (NĐ 13/2023) — CHỈ quản trị.
 *
 * 🔴 Đây là hành động KHÔNG HOÀN TÁC. Chính vì thế nó phải để lại dấu vết trong
 * nhật ký: một dòng dữ liệu biến mất mà không ai biết ai xoá là chuyện tệ hơn cả
 * việc nó còn đó.
 */

export interface KetQuaXoaSdt {
  loi?: string;
  xong?: string;
}

export async function xoaTheoSdtForm(
  _truoc: KetQuaXoaSdt,
  form: FormData,
): Promise<KetQuaXoaSdt> {
  const nguoi = await batBuocDangNhap();
  if (!xemDuocNhatKy(nguoi)) return { loi: T.nvErrQuyen };

  const sdt = chuanHoaSdt(String(form.get("soDienThoai") ?? ""));
  if (!sdt) return { loi: T.riengTuXoaSaiSo };

  const kq = xoaTheoSdt(sdt);
  if (kq.nguoiChoi === 0 && kq.khachTiemNang === 0) return { loi: T.riengTuXoaKhongThay };

  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xoaTheoSdt,
    // Ghi số ĐÃ CHE: nhật ký cũng là dữ liệu, và không có lý do gì để nó lưu
    // lại đúng cái số vừa được yêu cầu xoá.
    doiTuong: `${sdt.slice(0, 2)}***${sdt.slice(-3)}`,
    soDong: kq.nguoiChoi + kq.khachTiemNang,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  revalidatePath("/quan-tri/nhat-ky");
  revalidatePath("/quan-tri/khach");
  return { xong: T.riengTuXoaXong(kq.nguoiChoi, kq.khachTiemNang) };
}
