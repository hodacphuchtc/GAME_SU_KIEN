"use server";

import { revalidatePath } from "next/cache";

import { datCoVan, type CoVan } from "@/lib/luot/kho-luot";

/**
 * Hai cờ nhân viên tích ở quầy: "đã trao quà" (đối soát giải thưởng) và
 * "đã ghi danh" (đóng vòng lặp lead → học viên).
 *
 * `da_trao_thuong` có trong lược đồ từ v1 nhưng KHÔNG nơi nào ghi vào — cột chết
 * suốt mấy tháng, và cột "Đã trao thưởng" trong file xuất vĩnh viễn rỗng.
 *
 * Từ GĐ 12.1 cờ nằm trên VÁN chứ không trên lượt: ván ba lần bấm chỉ nhận MỘT
 * phần quà, nên cũng chỉ có MỘT ô để tích.
 */
export async function datCoVanAction(
  vanId: number,
  coVan: CoVan,
  bat: boolean,
  ma: string,
): Promise<void> {
  datCoVan(vanId, coVan, bat);
  // Cập nhật cả trang chi tiết lẫn danh sách — con số ROI nằm ở trang danh sách.
  revalidatePath(`/quan-tri/chuong-trinh/${ma}`);
  revalidatePath("/quan-tri");
}
