"use server";

import { revalidatePath } from "next/cache";

import { taoChuongTrinh } from "@/lib/chuong-trinh/kho";
import { kiemTraChuongTrinh, type ChuongTrinhKhai } from "@/lib/chuong-trinh/kiem-tra";

export interface KetQuaTao {
  loi: string[];
  ma?: string;
}

/**
 * Tạo chương trình.
 *
 * 🔴 Kiểm tra chạy Ở ĐÂY, phía máy chủ, chứ không chỉ trong trình duyệt: kiểm
 * tra phía trình duyệt là tiện ích cho người dùng, không phải hàng rào — ai
 * cũng gửi thẳng yêu cầu vào máy chủ được.
 */
export async function themChuongTrinh(khai: ChuongTrinhKhai): Promise<KetQuaTao> {
  const loi = kiemTraChuongTrinh(khai);
  if (loi.length > 0) return { loi };

  const ct = taoChuongTrinh(khai);
  revalidatePath("/quan-tri");
  return { loi: [], ma: ct.ma };
}
