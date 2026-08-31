/**
 * LÕI BỘ ĐẾM — thuần tuý, không đụng DOM, không đụng React. Test được 100%.
 *
 * Mô hình: tốc độ tăng theo hàm mũ trong `rampSeconds` giây đầu rồi giữ ở đỉnh.
 *
 *   v(t) = v0 · r^(t/T)  với t ≤ T,  r = vmax/v0        (số/giây)
 *   v(t) = vmax          với t > T
 *   n(t) = v0·T/ln(r) · (r^(t/T) − 1)                   (tổng số đã đếm)
 *   hiển thị = floor(n(t)) mod 10000
 *
 * 🔴 Quy tắc bất di bất dịch: kết quả một lượt LUÔN tính bằng `valueAt(settings, t)`
 * với `t` lấy từ mốc thời gian của CHÍNH sự kiện chạm (`event.timeStamp`), KHÔNG lấy
 * con số đang vẽ trên màn hình. Nhờ vậy máy yếu, máy lag, máy 120Hz đều cho cùng kết
 * quả — điều kiện để trò chơi trung thực.
 */

import {
  REACTION_JITTER_SECONDS,
  WHEEL_SIZE,
  type RoundSettings,
} from "@/config/game";

/** Coi tốc độ đầu và tốc độ đỉnh là bằng nhau khi lệch dưới mức này. */
const FLAT_EPSILON = 1e-9;

function isFlat(settings: RoundSettings): boolean {
  return (
    settings.rampSeconds <= 0 ||
    Math.abs(settings.maxSpeed - settings.startSpeed) < FLAT_EPSILON
  );
}

/** Tốc độ (số/giây) tại giây thứ `t` kể từ lúc số bắt đầu chạy. */
export function speedAt(settings: RoundSettings, t: number): number {
  const time = Math.max(0, t);
  if (isFlat(settings)) return settings.maxSpeed;
  const { startSpeed, maxSpeed, rampSeconds } = settings;
  if (time >= rampSeconds) return maxSpeed;
  const ratio = maxSpeed / startSpeed;
  return startSpeed * Math.pow(ratio, time / rampSeconds);
}

/** Tổng số đã đếm được sau `t` giây (KHÔNG lấy dư — có thể vượt 9999). */
export function countAt(settings: RoundSettings, t: number): number {
  const time = Math.max(0, t);
  if (isFlat(settings)) return settings.maxSpeed * time;

  const { startSpeed, maxSpeed, rampSeconds } = settings;
  const ratio = maxSpeed / startSpeed;
  const lnRatio = Math.log(ratio);
  const rampTotal = ((startSpeed * rampSeconds) / lnRatio) * (ratio - 1);

  if (time <= rampSeconds) {
    return (
      ((startSpeed * rampSeconds) / lnRatio) *
      (Math.pow(ratio, time / rampSeconds) - 1)
    );
  }
  return rampTotal + maxSpeed * (time - rampSeconds);
}

/** Hàm ngược của `countAt`: cần bao nhiêu giây để đếm được `count` số. */
export function timeAtCount(settings: RoundSettings, count: number): number {
  const total = Math.max(0, count);
  if (isFlat(settings)) return total / settings.maxSpeed;

  const { startSpeed, maxSpeed, rampSeconds } = settings;
  const ratio = maxSpeed / startSpeed;
  const lnRatio = Math.log(ratio);
  const rampTotal = ((startSpeed * rampSeconds) / lnRatio) * (ratio - 1);

  if (total <= rampTotal) {
    return (
      (rampSeconds * Math.log(1 + (total * lnRatio) / (startSpeed * rampSeconds))) /
      lnRatio
    );
  }
  return rampSeconds + (total - rampTotal) / maxSpeed;
}

/** Con số 0..9999 đang hiện trên bảng LED tại giây thứ `t`. */
export function valueAt(settings: RoundSettings, t: number): number {
  return Math.floor(countAt(settings, t)) % WHEEL_SIZE;
}

/**
 * Khoảng lệch giữa hai số trên vòng tròn 0000–9999 — lấy chiều ngắn hơn.
 * Dừng ở 9998 mà số cài là 0002 thì lệch 4, không phải 9996.
 */
export function circularDistance(a: number, b: number): number {
  const diff = Math.abs(Math.round(a) - Math.round(b)) % WHEEL_SIZE;
  return Math.min(diff, WHEEL_SIZE - diff);
}

export interface RoundResult {
  /** Con số người chơi đã dừng lại. */
  value: number;
  /** Số cài để trúng thưởng. */
  target: number;
  /** Trùng khít hay không. */
  win: boolean;
  /** Lệch bao nhiêu số (tính vòng tròn) — 0 khi trúng. */
  distance: number;
  /** Giây thứ mấy kể từ lúc số bắt đầu chạy. */
  atSeconds: number;
  /** Hết giờ tự dừng chứ không phải người chơi bấm. */
  timedOut: boolean;
}

/** Chốt kết quả một lượt tại giây thứ `t`. */
export function resolveRound(
  settings: RoundSettings,
  target: number,
  t: number,
  timedOut = false,
): RoundResult {
  const value = valueAt(settings, t);
  const normalizedTarget = ((Math.round(target) % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;
  return {
    value,
    target: normalizedTarget,
    win: value === normalizedTarget,
    distance: circularDistance(value, normalizedTarget),
    atSeconds: t,
    timedOut,
  };
}

/** Nút DỪNG đã mở chưa. */
export function canStop(settings: RoundSettings, t: number): boolean {
  return t >= settings.lockSeconds;
}

/** `0211` — luôn đủ 4 chữ số, có số 0 ở đầu. */
export function formatNumber(value: number): string {
  const normalized = ((Math.round(value) % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;
  return normalized.toString().padStart(4, "0");
}

export interface WinEstimate {
  /** Số lần con số cài lướt qua trong lúc nút DỪNG đang mở. */
  passes: number;
  /** Giây thứ mấy thì con số cài lướt qua (tối đa 8 mốc đầu). */
  passSeconds: number[];
  /** Xác suất bấm trúng ở MỘT lần lướt qua (0..1). */
  perPass: number;
  /** Xác suất trúng trong CẢ lượt (0..1). */
  perRound: number;
}

/**
 * Ước tính cơ hội trúng — để trang cài đặt nói thật với nhân viên.
 *
 * Cách tính: đếm xem con số cài lướt qua mấy lần trong khoảng nút DỪNG đang mở
 * (từ `lockSeconds` đến `roundLimitSeconds`), mỗi lần lướt qua người chơi có
 * `1 / (tốc_độ × độ_lệch_phản_xạ)` cơ hội bấm trúng.
 *
 * Phát hiện quan trọng: tốc độ tự triệt tiêu trong phép nhân, nên TỈ LỆ TRÚNG
 * gần như chỉ phụ thuộc `roundLimitSeconds − lockSeconds`. Tốc độ đổi CẢM GIÁC
 * chứ không đổi tỉ lệ. Đó là lý do 4 mức khó phải khác nhau ở cả hai tham số.
 */
export function estimateWinChance(
  settings: RoundSettings,
  target: number,
): WinEstimate {
  const normalizedTarget = ((Math.round(target) % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;
  const countAtUnlock = countAt(settings, settings.lockSeconds);
  const countAtEnd = countAt(settings, settings.roundLimitSeconds);

  const passSeconds: number[] = [];
  let passes = 0;
  let missProbability = 1;
  const firstLap = Math.ceil((countAtUnlock - normalizedTarget) / WHEEL_SIZE);

  for (let lap = Math.max(0, firstLap); ; lap += 1) {
    const count = normalizedTarget + lap * WHEEL_SIZE;
    if (count < countAtUnlock) continue;
    if (count > countAtEnd) break;
    const seconds = timeAtCount(settings, count);
    passes += 1;
    if (passSeconds.length < 8) passSeconds.push(seconds);
    const perPass = Math.min(
      1,
      1 / (speedAt(settings, seconds) * REACTION_JITTER_SECONDS),
    );
    missProbability *= 1 - perPass;
    if (lap > 1000) break; // chốt chặn an toàn
  }

  const perPass = Math.min(
    1,
    1 /
      (speedAt(settings, passSeconds[0] ?? settings.roundLimitSeconds) *
        REACTION_JITTER_SECONDS),
  );

  return {
    passes,
    passSeconds,
    perPass,
    perRound: 1 - missProbability,
  };
}

/** "1/33" — cách viết tỉ lệ cho nhân viên dễ đọc. */
export function formatOdds(probability: number): string {
  if (probability <= 0) return "gần như không thể";
  if (probability >= 1) return "gần như chắc chắn";
  return `1/${Math.round(1 / probability)}`;
}
