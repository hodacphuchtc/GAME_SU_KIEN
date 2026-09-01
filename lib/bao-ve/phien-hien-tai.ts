import "server-only";

import { cookies } from "next/headers";

import { docPhien, TEN_COOKIE } from "@/lib/bao-ve/phien-quan-tri";
import type { NguoiDung } from "@/lib/bao-ve/quyen";
import type { VaiTro } from "@/config/to-chuc";

/**
 * Người đang đăng nhập, đọc từ cookie đã ký.
 *
 * 🔴 Mọi trang và mọi server action trong `/quan-tri` PHẢI gọi hàm này rồi
 * truyền phạm vi xuống tầng kho. `proxy.ts` chỉ trả lời được câu "có phải người
 * của nhà không"; nó không biết người đó được xem những dòng nào.
 */
export async function nguoiDangDangNhap(): Promise<NguoiDung | null> {
  const kho = await cookies();
  const phien = await docPhien(kho.get(TEN_COOKIE)?.value);
  if (!phien) return null;
  return { id: phien.id, vaiTro: phien.vaiTro as VaiTro, coSoId: phien.coSoId };
}

/**
 * Như trên nhưng NÉM khi không có phiên.
 *
 * Dùng trong server action: ở đó không có gì để vẽ ra màn hình, và trả về im
 * lặng thì lời gọi coi như "đã làm xong" trong khi chưa làm gì cả.
 */
export async function batBuocDangNhap(): Promise<NguoiDung> {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) throw new Error("Chưa đăng nhập");
  return nguoi;
}
