"use client";

import { useSyncExternalStore } from "react";

/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/lib/tren-may-khach.ts` @ 3d96358.
 */

const khongDangKy = () => () => {};

/**
 * Đọc một giá trị CHỈ có ở phía trình duyệt (địa chỉ trang, mã phòng…) mà không
 * làm lệch giữa bản dựng sẵn và bản chạy trên máy người dùng, và không phải gọi
 * setState trong effect.
 */
export function useClientString(lay: () => string): string {
  return useSyncExternalStore(khongDangKy, lay, () => "");
}
