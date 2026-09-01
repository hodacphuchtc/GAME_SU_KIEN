"use server";

import { revalidatePath } from "next/cache";

import { datGhiDanh } from "@/lib/luot/kho-luot";

/**
 * Nhân viên tự tay đánh dấu một lượt đã thành học viên.
 *
 * Đây là mắt xích đóng vòng lặp: không có nó thì cả hệ thống chỉ đếm được số
 * người CHƠI, không bao giờ trả lời được có ai thành học viên hay không.
 */
export async function datGhiDanhLuot(
  luotId: number,
  daGhiDanh: boolean,
  ma: string,
): Promise<void> {
  datGhiDanh(luotId, daGhiDanh);
  // Cập nhật cả trang chi tiết lẫn danh sách — con số ROI nằm ở trang danh sách.
  revalidatePath(`/quan-tri/${ma}`);
  revalidatePath("/quan-tri");
}
