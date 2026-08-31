import "server-only";

import type { SQLInputValue } from "node:sqlite";

import { csdl } from "./ket-noi";

/**
 * Ba hàm bọc quanh SQLite để nơi gọi không phải ép kiểu lằng nhằng ở từng chỗ.
 *
 * `node:sqlite` trả `Record<string, SQLOutputValue>`, ép thẳng sang kiểu dòng
 * của mình thì TypeScript chặn. Gom việc ép kiểu về đúng ba chỗ này, và mỗi nơi
 * gọi tự khai kiểu dòng mà nó mong đợi.
 */

export function layMot<T>(sql: string, ...tham: SQLInputValue[]): T | undefined {
  return csdl().prepare(sql).get(...tham) as unknown as T | undefined;
}

export function layNhieu<T>(sql: string, ...tham: SQLInputValue[]): T[] {
  return csdl().prepare(sql).all(...tham) as unknown as T[];
}

/** Trả về SỐ DÒNG bị đổi — dùng làm trọng tài "ai bấm trước" (0 = thua cuộc). */
export function chay(sql: string, ...tham: SQLInputValue[]): number {
  return Number(csdl().prepare(sql).run(...tham).changes);
}
