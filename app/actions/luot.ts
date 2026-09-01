"use server";

import { revalidatePath } from "next/cache";

import { datCoLuot, type CoLuot } from "@/lib/luot/kho-luot";

/**
 * Hai cờ nhân viên tích ở quầy: "đã trao quà" (đối soát giải thưởng) và
 * "đã ghi danh" (đóng vòng lặp lead → học viên).
 *
 * `da_trao_thuong` có trong lược đồ từ v1 nhưng KHÔNG nơi nào ghi vào — cột chết
 * suốt mấy tháng, và cột "Đã trao thưởng" trong file xuất vĩnh viễn rỗng.
 */
export async function datCoLuotAction(
  luotId: number,
  coLuot: CoLuot,
  bat: boolean,
  ma: string,
): Promise<void> {
  datCoLuot(luotId, coLuot, bat);
  // Cập nhật cả trang chi tiết lẫn danh sách — con số ROI nằm ở trang danh sách.
  revalidatePath(`/quan-tri/${ma}`);
  revalidatePath("/quan-tri");
}
