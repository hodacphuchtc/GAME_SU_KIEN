#!/usr/bin/env node
/**
 * Máy chủ TRUNG CHUYỂN cho tính năng chiếu song song lên màn hình LCD.
 *
 * Vì sao tồn tại: hai thiết bị (điện thoại phụ huynh và LCD tại trung tâm) muốn
 * nhìn thấy cùng một ván thì phải có một chỗ nói chuyện với nhau. Đây là chỗ đó
 * — và chỉ có thế. Nó KHÔNG lưu gì xuống đĩa, KHÔNG có cơ sở dữ liệu, tất cả
 * nằm trong bộ nhớ và mất sạch khi tắt. Đúng tinh thần "không lưu gì" của sản
 * phẩm; nó chỉ là cái loa, không phải cái sổ.
 *
 * Viết bằng `node:http` thuần — KHÔNG thêm thư viện nào. Dùng SSE để đẩy tin
 * xuống LCD và POST để điện thoại gửi tin lên. Chạy được ngay bằng:
 *
 *     node server/relay.mjs
 *
 * Chỉ nên chạy trong mạng nội bộ của trung tâm (xem README).
 */

import { createServer } from "node:http";

const PORT = Number(process.env.PORT_RELAY ?? 3001);
const HOLD_MS = 120_000; // khớp ROOM_HOLD_SECONDS ở config/game.ts
const ROOM_TTL_MS = 30 * 60_000;
const PING_MS = 20_000;

/** @type {Map<string, {clients: Set<import("node:http").ServerResponse>, holder: {id: string, until: number} | null, touchedAt: number}>} */
const rooms = new Map();

function getRoom(code) {
  let room = rooms.get(code);
  if (!room) {
    room = { clients: new Set(), holder: null, touchedAt: Date.now() };
    rooms.set(code, room);
  }
  room.touchedAt = Date.now();
  return room;
}

function broadcast(code, payload) {
  const room = rooms.get(code);
  if (!room) return;
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of room.clients) {
    try {
      client.write(line);
    } catch {
      room.clients.delete(client);
    }
  }
}

function holderActive(room) {
  return room.holder !== null && room.holder.until > Date.now();
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 8192) reject(new Error("gói tin quá lớn"));
    });
    req.on("end", () => {
      try {
        resolve(raw === "" ? {} : JSON.parse(raw));
      } catch {
        reject(new Error("không phải JSON hợp lệ"));
      }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const code = (url.searchParams.get("phong") ?? "").toUpperCase().slice(0, 8);

  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/suc-khoe") {
    json(res, 200, { ok: true, soPhong: rooms.size, thoiGianMay: Date.now() });
    return;
  }

  if (url.pathname !== "/su-kien" || code === "") {
    json(res, 404, { ok: false, loi: "không có đường dẫn này" });
    return;
  }

  // ---- LCD lắng nghe ----
  if (req.method === "GET") {
    const room = getRoom(code);
    cors(res);
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    res.write(`retry: 2000\n\n`);
    res.write(
      `data: ${JSON.stringify({ type: "trang-thai", ban: holderActive(room) })}\n\n`,
    );
    room.clients.add(res);

    const ping = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        clearInterval(ping);
      }
    }, PING_MS);

    req.on("close", () => {
      clearInterval(ping);
      room.clients.delete(res);
    });
    return;
  }

  // ---- Điện thoại gửi tin ----
  if (req.method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (error) {
      json(res, 400, { ok: false, loi: String(error.message ?? error) });
      return;
    }

    const room = getRoom(code);
    const id = String(body.id ?? "").slice(0, 40);
    const type = String(body.type ?? "");

    if (type === "xin-choi") {
      // Một người một lượt: một màn hình thì không chiếu nổi nhiều ván cùng lúc.
      if (holderActive(room) && room.holder.id !== id) {
        json(res, 200, { ok: true, duocChoi: false });
        return;
      }
      room.holder = { id, until: Date.now() + HOLD_MS };
      broadcast(code, { type: "vao-phong" });
      json(res, 200, { ok: true, duocChoi: true });
      return;
    }

    // Chỉ người đang giữ lượt mới được đẩy diễn biến lên màn hình.
    if (!holderActive(room) || room.holder.id !== id) {
      json(res, 200, { ok: true, boQua: true });
      return;
    }
    room.holder.until = Date.now() + HOLD_MS;

    if (type === "roi-di") {
      room.holder = null;
      broadcast(code, { type: "roi-di" });
      json(res, 200, { ok: true });
      return;
    }

    broadcast(code, body);
    if (type === "ket-qua") {
      // Nhả lượt ngay khi có kết quả để người sau quét được liền.
      room.holder = null;
    }
    json(res, 200, { ok: true });
    return;
  }

  json(res, 405, { ok: false, loi: "phương thức không hỗ trợ" });
});

// Dọn phòng nguội để bộ nhớ không phình theo thời gian chạy.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.clients.size === 0 && now - room.touchedAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}, 60_000).unref();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`› Máy chủ trung chuyển màn hình LCD: http://0.0.0.0:${PORT}`);
  console.log(`  (chỉ trung chuyển tin nhắn trong bộ nhớ, không lưu gì xuống đĩa)`);
});
