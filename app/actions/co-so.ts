"use server";

import { revalidatePath } from "next/cache";

import { T } from "@/config/locale";
import type { TrangThaiCoSo } from "@/config/to-chuc";
import {
  datTrangThaiCoSo,
  suaCoSo,
  taoCoSo,
  timCoSo,
  trungTen,
} from "@/lib/co-so/kho";

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
