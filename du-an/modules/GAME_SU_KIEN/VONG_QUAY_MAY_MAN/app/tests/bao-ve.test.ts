import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { bamMatKhau, kiemMatKhau } from "@/lib/bao-ve/mat-khau";
import {
  daCoKhoaPhien,
  daCoMatKhauQuanTri,
  docPhien,
  HAN_PHIEN_GIAY,
  kyPhien,
  thuocTinhCookie,
} from "@/lib/bao-ve/phien-quan-tri";

/**
 * Bài kiểm lớp chắn cửa quản trị (hạng mục 3.1).
 *
 * 🔴 Vì sao bài này quan trọng hơn vẻ ngoài của nó: mã QR dán tại quầy in thẳng
 * địa chỉ máy chủ vào tay từng phụ huynh. Xoá đuôi URL gõ `/quan-tri` là vào —
 * ta vừa tự tay đưa địa chỉ cho họ. Lớp chắn hỏng thì không ai biết, vì hỏng
 * kiểu này KHÔNG có thông báo lỗi nào cả.
 */

const KHOA_THAT = "khoa-thu-nghiem-du-32-ky-tu-cho-hmac-sha256";

const envGoc = { ...process.env };

beforeEach(() => {
  process.env.VONG_QUAY_KHOA_PHIEN = KHOA_THAT;
  delete process.env.VONG_QUAY_HTTPS;
});

afterEach(() => {
  process.env = { ...envGoc };
});

describe("phiên quản trị — chữ ký cookie", () => {
  it("ký rồi đọc lại ra đúng nội dung", async () => {
    const han = Date.now() + 60_000;
    const cookie = await kyPhien({ han });
    expect(cookie).not.toBeNull();
    expect(await docPhien(cookie!)).toEqual({ han });
  });

  it("từ chối cookie bị SỬA chữ ký", async () => {
    const cookie = await kyPhien({ han: Date.now() + 60_000 });
    const hong = cookie!.slice(0, -3) + "AAA";
    expect(await docPhien(hong)).toBeNull();
  });

  it("từ chối cookie bị SỬA thân (đổi hạn cho dài ra)", async () => {
    const cookie = await kyPhien({ han: Date.now() + 60_000 });
    const chuKy = cookie!.slice(cookie!.lastIndexOf(".") + 1);
    // Kẻ gian tự viết thân mới với hạn xa tít, giữ nguyên chữ ký cũ.
    const thanGian = Buffer.from(JSON.stringify({ han: Date.now() + 9e12 }))
      .toString("base64url");
    expect(await docPhien(`${thanGian}.${chuKy}`)).toBeNull();
  });

  it("từ chối cookie HẾT HẠN dù chữ ký vẫn đúng", async () => {
    const cookie = await kyPhien({ han: Date.now() - 1 });
    expect(cookie).not.toBeNull();
    expect(await docPhien(cookie!)).toBeNull();
  });

  it("từ chối cookie rác và cookie rỗng", async () => {
    expect(await docPhien(undefined)).toBeNull();
    expect(await docPhien("")).toBeNull();
    expect(await docPhien("khong-co-dau-cham")).toBeNull();
    expect(await docPhien(".chi-co-cham")).toBeNull();
  });
});

describe("thiếu khoá phiên thì TỪ CHỐI mọi phiên", () => {
  it("không có biến môi trường: không ký được, không đọc được", async () => {
    const cookie = await kyPhien({ han: Date.now() + 60_000 });
    delete process.env.VONG_QUAY_KHOA_PHIEN;

    expect(daCoKhoaPhien()).toBe(false);
    expect(await kyPhien({ han: Date.now() + 60_000 })).toBeNull();
    // 🔴 Cookie ký từ TRƯỚC lúc gỡ khoá cũng phải chết theo — đó chính là cách
    // thu hồi toàn bộ phiên: đổi khoá ký.
    expect(await docPhien(cookie!)).toBeNull();
  });

  it("khoá NGẮN hơn 32 ký tự bị coi như không có", async () => {
    process.env.VONG_QUAY_KHOA_PHIEN = "qua-ngan";
    expect(daCoKhoaPhien()).toBe(false);
    expect(await kyPhien({ han: Date.now() + 60_000 })).toBeNull();
  });

  it("cookie ký bằng khoá KHÁC không mở được cửa", async () => {
    const cookie = await kyPhien({ han: Date.now() + 60_000 });
    process.env.VONG_QUAY_KHOA_PHIEN = "mot-khoa-hoan-toan-khac-cung-du-32-ky-tu";
    expect(await docPhien(cookie!)).toBeNull();
  });
});

describe("thuộc tính cookie", () => {
  it("KHÔNG bật secure khi chạy HTTP ở LAN", () => {
    // Đây là ca thật của máy đặt tại quầy: http://192.168.x.x cho cả LCD lẫn
    // điện thoại. Bật `secure` ở đây thì trình duyệt lặng lẽ vứt cookie và
    // người vận hành đăng nhập mãi không vào, không một dòng lỗi nào.
    expect(thuocTinhCookie().secure).toBe(false);
  });

  it("vẫn KHÔNG bật secure ở production khi chưa khai là chạy HTTPS", () => {
    expect(thuocTinhCookie().secure).toBe(false);
  });

  it("httpOnly + sameSite lax + hạn đúng một ca làm", () => {
    const t = thuocTinhCookie();
    expect(t.httpOnly).toBe(true);
    expect(t.sameSite).toBe("lax");
    expect(t.path).toBe("/");
    expect(t.maxAge).toBe(HAN_PHIEN_GIAY);
    expect(HAN_PHIEN_GIAY).toBe(12 * 60 * 60);
  });
});

describe("mật khẩu quản trị", () => {
  it("băm rồi kiểm lại đúng mật khẩu", () => {
    const daLuu = bamMatKhau("mat-khau-that-1234");
    expect(daLuu.startsWith("scrypt$")).toBe(true);
    expect(kiemMatKhau("mat-khau-that-1234", daLuu)).toBe(true);
  });

  it("từ chối mật khẩu sai, kể cả sai một ký tự", () => {
    const daLuu = bamMatKhau("mat-khau-that-1234");
    expect(kiemMatKhau("mat-khau-that-1235", daLuu)).toBe(false);
    expect(kiemMatKhau("", daLuu)).toBe(false);
  });

  it("hai lần băm cùng một mật khẩu cho hai chuỗi KHÁC nhau (có muối)", () => {
    expect(bamMatKhau("abc12345")).not.toBe(bamMatKhau("abc12345"));
  });

  it("chuỗi lưu hỏng thì trả false chứ không NÉM lỗi", () => {
    // Một biến môi trường gõ sai không được phép làm sập cả màn đăng nhập.
    for (const hong of ["", "khong-phai-scrypt", "scrypt$a$b$c$d$e", "scrypt$16384$8$1$zz"]) {
      expect(() => kiemMatKhau("abc", hong)).not.toThrow();
      expect(kiemMatKhau("abc", hong)).toBe(false);
    }
  });

  it("daCoMatKhauQuanTri chỉ nhận chuỗi ĐÚNG ĐỊNH DẠNG scrypt", () => {
    delete process.env.VONG_QUAY_MAT_KHAU_BAM;
    expect(daCoMatKhauQuanTri()).toBe(false);

    process.env.VONG_QUAY_MAT_KHAU_BAM = "mat-khau-de-tho";
    expect(daCoMatKhauQuanTri()).toBe(false);

    process.env.VONG_QUAY_MAT_KHAU_BAM = bamMatKhau("abc12345");
    expect(daCoMatKhauQuanTri()).toBe(true);
  });
});
