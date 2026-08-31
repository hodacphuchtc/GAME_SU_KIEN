/**
 * Cấu hình ván chơi nằm TRONG chính đường dẫn — không server, không lưu trữ.
 * Mã QR dán ở quầy chính là nơi chứa cấu hình; đổi số trúng = in QR mới.
 *
 * Con số trúng thưởng vốn công khai (đúng như mốc 10:00 của quán trong video
 * nguồn), nên việc nó lộ ra trên URL không phải là vấn đề.
 */

import {
  DEFAULT_CENTER_NAME,
  DEFAULT_DIFFICULTY,
  DEFAULT_PRIZE_NAME,
  DEFAULT_TARGET,
  DIFFICULTIES,
  LIMITS,
  WHEEL_SIZE,
  type DifficultyId,
  type RoundSettings,
} from "@/config/game";

export type DifficultyChoice = DifficultyId | "custom";

export interface GameConfig {
  target: number;
  difficulty: DifficultyChoice;
  settings: RoundSettings;
  centerName: string;
  prizeName: string;
}

/** Tên tham số trên URL — giữ ngắn để mã QR thưa nét, dễ quét. */
export const PARAM = {
  target: "so",
  difficulty: "muc",
  center: "tt",
  prize: "qua",
  startSpeed: "v0",
  maxSpeed: "vmax",
  ramp: "ramp",
  lock: "khoa",
  limit: "gh",
  countdown: "dn",
} as const;

const MAX_NAME_LENGTH = 60;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function readNumber(
  params: URLSearchParams,
  key: string,
  fallback: number,
): number {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readName(params: URLSearchParams, key: string, fallback: string): string {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const trimmed = raw.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed === "" ? fallback : trimmed;
}

/** Ép mọi tham số về khoảng hợp lệ — URL do người gõ tay nên phải phòng thủ. */
export function clampSettings(settings: RoundSettings): RoundSettings {
  const maxSpeed = clamp(settings.maxSpeed, LIMITS.speed.min, LIMITS.speed.max);
  // Tốc độ xuất phát không được vượt tốc độ đỉnh, nếu không thì hoá ra chạy chậm dần.
  const startSpeed = clamp(settings.startSpeed, LIMITS.speed.min, maxSpeed);
  const rampSeconds = clamp(
    settings.rampSeconds,
    LIMITS.rampSeconds.min,
    LIMITS.rampSeconds.max,
  );
  const roundLimitSeconds = clamp(
    settings.roundLimitSeconds,
    LIMITS.roundLimitSeconds.min,
    LIMITS.roundLimitSeconds.max,
  );
  return {
    startSpeed,
    maxSpeed,
    rampSeconds,
    // Khoá nút không bao giờ được dài hơn cả lượt chơi, nếu không nút chẳng mở lần nào.
    lockSeconds: clamp(
      settings.lockSeconds,
      LIMITS.lockSeconds.min,
      Math.min(LIMITS.lockSeconds.max, roundLimitSeconds),
    ),
    roundLimitSeconds,
    countdownSeconds: clamp(
      settings.countdownSeconds,
      LIMITS.countdownSeconds.min,
      LIMITS.countdownSeconds.max,
    ),
  };
}

function isDifficultyId(value: string | null): value is DifficultyId {
  return value !== null && value in DIFFICULTIES;
}

/** Đọc cấu hình từ query string; thiếu hoặc sai thì rơi về mặc định an toàn. */
export function parseGameConfig(input: string | URLSearchParams): GameConfig {
  const params =
    typeof input === "string" ? new URLSearchParams(input) : input;

  const rawTarget = params.get(PARAM.target);
  const parsedTarget = rawTarget === null ? NaN : Number(rawTarget);
  const target = Number.isFinite(parsedTarget)
    ? ((Math.trunc(parsedTarget) % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE
    : DEFAULT_TARGET;

  const rawDifficulty = params.get(PARAM.difficulty);
  const hasCustomFields = [
    PARAM.startSpeed,
    PARAM.maxSpeed,
    PARAM.ramp,
    PARAM.lock,
    PARAM.limit,
    PARAM.countdown,
  ].some((key) => params.has(key));

  let difficulty: DifficultyChoice;
  let base: RoundSettings;
  if (isDifficultyId(rawDifficulty)) {
    difficulty = rawDifficulty;
    base = DIFFICULTIES[rawDifficulty].settings;
  } else if (rawDifficulty === "custom" || hasCustomFields) {
    difficulty = "custom";
    base = DIFFICULTIES[DEFAULT_DIFFICULTY].settings;
  } else {
    difficulty = DEFAULT_DIFFICULTY;
    base = DIFFICULTIES[DEFAULT_DIFFICULTY].settings;
  }

  const settings =
    difficulty === "custom"
      ? clampSettings({
          startSpeed: readNumber(params, PARAM.startSpeed, base.startSpeed),
          maxSpeed: readNumber(params, PARAM.maxSpeed, base.maxSpeed),
          rampSeconds: readNumber(params, PARAM.ramp, base.rampSeconds),
          lockSeconds: readNumber(params, PARAM.lock, base.lockSeconds),
          roundLimitSeconds: readNumber(params, PARAM.limit, base.roundLimitSeconds),
          countdownSeconds: readNumber(params, PARAM.countdown, base.countdownSeconds),
        })
      : base;

  return {
    target,
    difficulty,
    settings,
    centerName: readName(params, PARAM.center, DEFAULT_CENTER_NAME),
    prizeName: readName(params, PARAM.prize, DEFAULT_PRIZE_NAME),
  };
}

/** Dựng query string cho một cấu hình — chỉ ghi những gì khác mặc định. */
export function buildQuery(config: GameConfig): string {
  const params = new URLSearchParams();
  params.set(PARAM.target, config.target.toString().padStart(4, "0"));
  params.set(PARAM.difficulty, config.difficulty);
  if (config.centerName && config.centerName !== DEFAULT_CENTER_NAME) {
    params.set(PARAM.center, config.centerName);
  }
  if (config.prizeName && config.prizeName !== DEFAULT_PRIZE_NAME) {
    params.set(PARAM.prize, config.prizeName);
  }
  if (config.difficulty === "custom") {
    const s = clampSettings(config.settings);
    params.set(PARAM.startSpeed, String(s.startSpeed));
    params.set(PARAM.maxSpeed, String(s.maxSpeed));
    params.set(PARAM.ramp, String(s.rampSeconds));
    params.set(PARAM.lock, String(s.lockSeconds));
    params.set(PARAM.limit, String(s.roundLimitSeconds));
    params.set(PARAM.countdown, String(s.countdownSeconds));
  }
  return params.toString();
}

/** Đường dẫn đầy đủ để nhét vào mã QR. */
export function buildPlayUrl(origin: string, config: GameConfig): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/?${buildQuery(config)}`;
}
