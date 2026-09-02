"use server";

import { revalidatePath } from "next/cache";

import { danhDauDaTrao } from "@/lib/luot/kho";

/**
 * Tích "đã trao thưởng" cho một lượt.
 *
 * `revalidatePath` để dấu tích còn nguyên sau khi tải lại trang — không có nó
 * thì Next trả bản đã dựng sẵn và người ở quầy tưởng máy nuốt mất thao tác.
 */
export async function datTraoThuong(
  chuongTrinhMa: string,
  luotId: number,
  daTrao: boolean,
): Promise<void> {
  danhDauDaTrao(luotId, daTrao);
  revalidatePath(`/quan-tri/chuong-trinh/${chuongTrinhMa}`);
}
