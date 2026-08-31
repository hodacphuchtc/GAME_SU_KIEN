/** Rung máy — chỉ chạy nếu trình duyệt cho phép, im lặng bỏ qua nếu không. */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  const canVibrate = typeof navigator.vibrate === "function";
  if (!canVibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Một số trình duyệt chặn rung khi chưa có tương tác — không sao, bỏ qua.
  }
}

export const VIBRATE_PRESS = 18;
export const VIBRATE_WIN = [0, 90, 60, 90, 60, 220];
export const VIBRATE_LOSE = [0, 45, 70, 45];
