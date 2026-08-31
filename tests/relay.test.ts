import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Test THẬT cho máy chủ trung chuyển: bật hẳn tiến trình, nối SSE, bắn POST và
 * xem tin có tới không. Phần khó nhất là luật MỘT NGƯỜI MỘT LƯỢT — nếu sai thì
 * hai phụ huynh cùng đẩy lên một màn hình và LCD nhảy loạn.
 */

const PORT = 34317;
const BASE = `http://127.0.0.1:${PORT}`;
let server: ChildProcess;

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/suc-khoe`);
      if (res.ok) return;
    } catch {
      // chưa lên, thử lại
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("máy chủ trung chuyển không lên");
}

/** Mở SSE và trả về hàm đọc sự kiện tiếp theo. */
async function openStream(room: string) {
  const res = await fetch(`${BASE}/su-kien?phong=${room}`, {
    headers: { accept: "text/event-stream" },
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const queue: Record<string, unknown>[] = [];

  async function pump(): Promise<void> {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (line) queue.push(JSON.parse(line.slice(6)) as Record<string, unknown>);
    }
  }

  return {
    async next(): Promise<Record<string, unknown> | undefined> {
      for (let i = 0; i < 50 && queue.length === 0; i += 1) await pump();
      return queue.shift();
    },
    close: () => void reader.cancel(),
  };
}

function post(room: string, body: unknown) {
  return fetch(`${BASE}/su-kien?phong=${room}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

beforeAll(async () => {
  server = spawn(process.execPath, ["server/relay.mjs"], {
    env: { ...process.env, PORT_RELAY: String(PORT) },
    stdio: "ignore",
  });
  await waitForServer();
}, 20_000);

afterAll(() => {
  server?.kill("SIGTERM");
});

describe("máy chủ trung chuyển", () => {
  it("người mới nối vào biết ngay phòng đang rảnh hay bận", async () => {
    const stream = await openStream("AAAA");
    expect(await stream.next()).toEqual({ type: "trang-thai", ban: false });
    stream.close();
  });

  it("điện thoại xin lượt thì màn hình được báo có người vào", async () => {
    const stream = await openStream("BBBB");
    await stream.next(); // bỏ qua tin trạng thái đầu tiên
    const reply = await post("BBBB", { type: "xin-choi", id: "may-1" });
    expect(reply).toEqual({ ok: true, duocChoi: true });
    expect(await stream.next()).toEqual({ type: "vao-phong" });
    stream.close();
  });

  it("MỘT NGƯỜI MỘT LƯỢT — máy thứ hai bị từ chối", async () => {
    await post("CCCC", { type: "xin-choi", id: "may-1" });
    expect(await post("CCCC", { type: "xin-choi", id: "may-2" })).toEqual({
      ok: true,
      duocChoi: false,
    });
  });

  it("máy KHÔNG giữ lượt thì không đẩy được gì lên màn hình", async () => {
    await post("DDDD", { type: "xin-choi", id: "may-1" });
    const reply = await post("DDDD", { type: "bat-dau", id: "ke-pha-dam" });
    expect(reply).toEqual({ ok: true, boQua: true });
  });

  it("diễn biến của máy đang giữ lượt thì tới được màn hình", async () => {
    const stream = await openStream("EEEE");
    await stream.next();
    await post("EEEE", { type: "xin-choi", id: "may-1" });
    await stream.next(); // vao-phong
    await post("EEEE", { type: "dem-nguoc", con: 3, id: "may-1" });
    expect(await stream.next()).toMatchObject({ type: "dem-nguoc", con: 3 });
    stream.close();
  });

  it("có kết quả là nhả lượt ngay, người sau quét được liền", async () => {
    await post("FFFF", { type: "xin-choi", id: "may-1" });
    await post("FFFF", {
      type: "ket-qua",
      id: "may-1",
      value: 211,
      target: 211,
      win: true,
      distance: 0,
      timedOut: false,
      prizeName: "Voucher",
      code: "ACDE",
    });
    expect(await post("FFFF", { type: "xin-choi", id: "may-2" })).toEqual({
      ok: true,
      duocChoi: true,
    });
  });

  it("gói tin rác không làm sập máy chủ", async () => {
    const res = await fetch(`${BASE}/su-kien?phong=GGGG`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{{{ không phải json",
    });
    expect(res.status).toBe(400);
    expect((await fetch(`${BASE}/suc-khoe`)).ok).toBe(true);
  });
});
