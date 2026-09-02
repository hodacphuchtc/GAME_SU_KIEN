/**
 * PHIÊN ĐĂNG NHẬP QUẢN TRỊ — cookie tự ký, không lưu bảng phiên.
 *
 * 🔴 Ký bằng **Web Crypto (`crypto.subtle`)**, KHÔNG phải `node:crypto`. Lý do:
 * `proxy.ts` của Next chạy được ở runtime Edge, nơi không có `node:crypto`.
 * Web Crypto có ở cả hai runtime, nên một hàm dùng được cả hai chỗ.
 *
 * Vì sao không lưu bảng phiên: một tệp SQLite trên một máy, chương trình khởi
 * động lại vài lần mỗi tuần. Cookie tự ký thì không có gì để đồng bộ, không có
 * bảng nào phình ra, và thu hồi thì đổi khoá ký là xong.
 */

export interface NoiDungPhien {
  /** id nhân viên. */
  id: number;
  ten: string;
  vaiTro: string;
  /** Cơ sở phụ trách. `null` = toàn hệ thống. */
  coSoId: number | null;
  /** Hết hạn — mốc mili-giây. */
  han: number;
}

export const TEN_COOKIE = "gsk_phien";

/** Đúng MỘT ca làm. Dài hơn thì máy bỏ quên ở quầy thành cửa mở suốt đêm. */
export const HAN_PHIEN_GIAY = 12 * 60 * 60;

/**
 * Khoá ký. Thiếu biến môi trường thì trả `null` để nơi gọi TỪ CHỐI mọi phiên —
 * KHÔNG rơi về một khoá mặc định. Một khoá mặc định nằm trong mã nguồn công
 * khai thì ai cũng ký được cookie quản trị cho chính mình.
 */
function khoaBiMat(): string | null {
  const k = process.env.GAME_SU_KIEN_KHOA_PHIEN;
  return k && k.length >= 32 ? k : null;
}

function b64url(bytes: Uint8Array): string {
  let chuoi = "";
  for (const b of bytes) chuoi += String.fromCharCode(b);
  return btoa(chuoi).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Trả `Uint8Array<ArrayBuffer>` chứ không phải `Uint8Array<ArrayBufferLike>`:
 * `crypto.subtle` chỉ nhận bộ đệm KHÔNG chia sẻ, và `Uint8Array.from` cho ra
 * kiểu rộng hơn nên TypeScript từ chối. Cấp phát tường minh là xong.
 */
function tuB64url(chuoi: string): Uint8Array<ArrayBuffer> {
  const dem = chuoi.replace(/-/g, "+").replace(/_/g, "/");
  const thoi = atob(dem + "=".repeat((4 - (dem.length % 4)) % 4));
  const ra = new Uint8Array(new ArrayBuffer(thoi.length));
  for (let i = 0; i < thoi.length; i += 1) ra[i] = thoi.charCodeAt(i);
  return ra;
}

async function khoaHmac(bimat: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(bimat),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** `<thân base64url>.<chữ ký base64url>` */
export async function kyPhien(noiDung: NoiDungPhien): Promise<string | null> {
  const bimat = khoaBiMat();
  if (!bimat) return null;
  const than = b64url(new TextEncoder().encode(JSON.stringify(noiDung)));
  const chuKy = await crypto.subtle.sign(
    "HMAC",
    await khoaHmac(bimat),
    new TextEncoder().encode(than),
  );
  return `${than}.${b64url(new Uint8Array(chuKy))}`;
}

/**
 * Đọc và KIỂM cookie. Trả `null` nếu chữ ký sai, hết hạn, hoặc chưa cấu hình
 * khoá — nơi gọi chỉ cần biết "có được vào hay không", không cần biết vì sao.
 */
export async function docPhien(cookie: string | undefined): Promise<NoiDungPhien | null> {
  const bimat = khoaBiMat();
  if (!bimat || !cookie) return null;

  const cham = cookie.lastIndexOf(".");
  if (cham <= 0) return null;
  const than = cookie.slice(0, cham);
  const chuKy = cookie.slice(cham + 1);

  try {
    const hopLe = await crypto.subtle.verify(
      "HMAC",
      await khoaHmac(bimat),
      tuB64url(chuKy),
      new TextEncoder().encode(than),
    );
    if (!hopLe) return null;

    const noiDung = JSON.parse(new TextDecoder().decode(tuB64url(than))) as NoiDungPhien;
    if (typeof noiDung.han !== "number" || noiDung.han <= Date.now()) return null;
    return noiDung;
  } catch {
    return null;
  }
}

/** Đã cấu hình khoá ký chưa — dùng để báo cho người vận hành, không lộ khoá. */
export function daCoKhoaPhien(): boolean {
  return khoaBiMat() !== null;
}

/**
 * Thuộc tính cookie phiên — tách thành hàm THUẦN để bài kiểm soi được.
 *
 * 🔴 `secure` chỉ bật khi THẬT SỰ chạy HTTPS. Máy ở quầy phục vụ cả LCD lẫn điện
 * thoại qua `http://192.168.x.x`; bật `secure` ở đó thì trình duyệt **lặng lẽ vứt
 * cookie** — người vận hành gõ đúng mật khẩu, trang nháy một cái rồi quay về đúng
 * màn đăng nhập, mãi mãi, và không một dòng lỗi nào giải thích.
 *
 * Luật này trước đây nằm rải trong `app/actions/dang-nhap.ts` nên không có gì canh.
 * Hái về từ app Vòng Quay khi gộp (ADR-011).
 */
export function thuocTinhCookie(): {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: HAN_PHIEN_GIAY,
    secure: process.env.NODE_ENV === "production" && process.env.GAME_SU_KIEN_HTTPS === "1",
  };
}
