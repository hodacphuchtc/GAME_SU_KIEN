import { describe, expect, it } from "vitest";

import { RELAY_PORT, ROOM_ALPHABET, ROOM_CODE_LENGTH } from "@/config/game";
import { normalizeRoomCode, randomRoomCode, relayBase } from "@/lib/ket-noi";

describe("mã phòng", () => {
  it("đủ 4 ký tự và chỉ dùng chữ dễ đọc", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = randomRoomCode();
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
      for (const char of code) expect(ROOM_ALPHABET).toContain(char);
    }
  });

  it("không chứa ký tự dễ đọc nhầm — nhân viên phải đọc to được cho khách", () => {
    for (const confusing of ["B", "8", "I", "1", "O", "0", "S", "5", "Z", "2", "6"]) {
      expect(ROOM_ALPHABET).not.toContain(confusing);
    }
  });

  it("sinh theo nguồn ngẫu nhiên cho trước thì đoán được — để test khác dựa vào", () => {
    expect(randomRoomCode(() => 0)).toBe(ROOM_ALPHABET[0].repeat(4));
  });

  it("chuẩn hoá mã người dùng gõ tay: hoa hết, bỏ ký tự lạ, cắt đúng 4", () => {
    expect(normalizeRoomCode("ac37")).toBe("AC37");
    expect(normalizeRoomCode(" a c - 3 7 ")).toBe("AC37");
    expect(normalizeRoomCode("AC37XYZW")).toBe("AC37");
    expect(normalizeRoomCode("!!!")).toBe("");
    expect(normalizeRoomCode("")).toBe("");
  });
});

describe("địa chỉ máy chủ trung chuyển", () => {
  it("lấy đúng máy đang phục vụ trang, nhưng ở cổng riêng", () => {
    expect(relayBase({ protocol: "http:", hostname: "192.168.88.104" })).toBe(
      `http://192.168.88.104:${RELAY_PORT}`,
    );
  });

  it("trang chạy https thì trung chuyển cũng phải https, nếu không trình duyệt chặn", () => {
    expect(relayBase({ protocol: "https:", hostname: "demso.vn" })).toBe(
      `https://demso.vn:${RELAY_PORT}`,
    );
  });
});
