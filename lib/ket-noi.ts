/**
 * Lớp truyền tin giữa điện thoại phụ huynh và màn hình LCD.
 *
 * 🔴 Nguyên tắc: chiếu lên màn hình lớn là PHẦN THƯỞNG THÊM, không phải điều
 * kiện để chơi. Mọi hàm ở đây đều nuốt lỗi và trả về trạng thái "không nối
 * được" — mất mạng, tắt máy chủ trung chuyển, hay quét nhầm mã phòng thì điện
 * thoại vẫn phải chơi được trọn vẹn.
 *
 * Hiện dùng SSE + POST tới `server/relay.mjs` chạy trong mạng LAN của trung
 * tâm. Muốn chạy qua 4G thì thay đúng hai hàm `subscribeRoom` và `sendToRoom`
 * bằng một dịch vụ realtime trên mạng (Supabase Realtime chẳng hạn) — phần còn
 * lại của ứng dụng không phải sửa gì.
 */

import {
  RELAY_PORT,
  ROOM_ALPHABET,
  ROOM_CODE_LENGTH,
  type RoundSettings,
} from "@/config/game";

export type RoomEvent =
  | { type: "vao-phong" }
  | { type: "dem-nguoc"; con: number }
  | { type: "bat-dau"; target: number; settings: RoundSettings }
  | {
      type: "ket-qua";
      value: number;
      target: number;
      win: boolean;
      distance: number;
      timedOut: boolean;
      prizeName: string;
      code: string;
    }
  | { type: "roi-di" }
  | { type: "trang-thai"; ban: boolean };

/** Mã phòng 4 ký tự — đủ ngắn để nhân viên đọc to cho khách. */
export function randomRoomCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_ALPHABET[Math.floor(random() * ROOM_ALPHABET.length)];
  }
  return code;
}

/** Chuẩn hoá mã phòng người dùng gõ/dán vào: hoa hết, bỏ ký tự lạ. */
export function normalizeRoomCode(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .split("")
    .filter((char) => ROOM_ALPHABET.includes(char))
    .join("");
  return cleaned.slice(0, ROOM_CODE_LENGTH);
}

/**
 * Địa chỉ máy chủ trung chuyển. Mặc định: cùng máy đang phục vụ trang web,
 * nhưng ở cổng riêng — vì trang web là web TĨNH, không tự chạy máy chủ được.
 */
export function relayBase(location: {
  protocol: string;
  hostname: string;
}): string {
  const protocol = location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${location.hostname}:${RELAY_PORT}`;
}

/** Định danh ngẫu nhiên cho MỘT máy trong MỘT phiên — không phải danh tính người dùng. */
export function newClientId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * LCD lắng nghe diễn biến của phòng. Trả về hàm ngắt kết nối.
 * `onStatus` báo nối được hay không để màn hình còn hiện cảnh báo cho nhân viên.
 */
export function subscribeRoom(
  base: string,
  room: string,
  onEvent: (event: RoomEvent) => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  if (typeof EventSource === "undefined" || room === "") {
    onStatus?.(false);
    return () => {};
  }

  let source: EventSource | null = null;
  try {
    source = new EventSource(`${base}/su-kien?phong=${encodeURIComponent(room)}`);
  } catch {
    onStatus?.(false);
    return () => {};
  }

  source.onopen = () => onStatus?.(true);
  source.onerror = () => onStatus?.(false);
  source.onmessage = (message) => {
    try {
      onEvent(JSON.parse(message.data) as RoomEvent);
    } catch {
      // Gói tin hỏng thì bỏ qua, không được làm sập màn hình đang chiếu.
    }
  };

  return () => source?.close();
}

export interface SendResult {
  ok: boolean;
  /** Chỉ có nghĩa với tin `xin-choi`: màn hình lớn có nhận mình không. */
  duocChoi?: boolean;
}

/** Điện thoại đẩy một diễn biến lên phòng. Không bao giờ ném lỗi. */
export async function sendToRoom(
  base: string,
  room: string,
  id: string,
  event: RoomEvent | { type: "xin-choi" },
): Promise<SendResult> {
  if (room === "") return { ok: false };
  try {
    const response = await fetch(`${base}/su-kien?phong=${encodeURIComponent(room)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...event, id }),
      keepalive: true,
    });
    if (!response.ok) return { ok: false };
    const body = (await response.json()) as { ok?: boolean; duocChoi?: boolean };
    return { ok: body.ok === true, duocChoi: body.duocChoi };
  } catch {
    return { ok: false };
  }
}
