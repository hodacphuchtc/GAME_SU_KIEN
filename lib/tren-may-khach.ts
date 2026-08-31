"use client";

import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

/**
 * Đọc một giá trị CHỈ có ở phía trình duyệt (địa chỉ trang, mã phòng…) mà không
 * làm lệch giữa bản dựng sẵn và bản chạy trên máy người dùng, và không phải gọi
 * setState trong effect.
 */
export function useClientString(get: () => string): string {
  return useSyncExternalStore(subscribeNothing, get, () => "");
}
