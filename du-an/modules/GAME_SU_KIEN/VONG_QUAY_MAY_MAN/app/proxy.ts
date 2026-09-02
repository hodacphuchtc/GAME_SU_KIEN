/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/proxy.ts` @ 3d96358.
 * ĐÃ SỬA: matcher thêm `/man-hinh` không cần chắn (màn LCD phải mở công khai).
 */
import { NextResponse, type NextRequest } from "next/server";

import { docPhien, TEN_COOKIE } from "@/lib/bao-ve/phien-quan-tri";

/**
 * CHẮN CỬA trang quản trị.
 *
 * 🔴 Tên tệp là `proxy.ts`, KHÔNG phải `middleware.ts`: Next 16 đã đổi tên quy
 * ước này (xem `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/`).
 * Đặt sai tên thì tệp không bao giờ chạy, trang quản trị mở toang, và KHÔNG có
 * lỗi nào cả — đúng cái sẹo đã trả giá ở app Trúng Số.
 *
 * 🔴 Ở đây CHỈ kiểm chữ ký cookie. Việc so mật khẩu nằm trong server action chạy
 * ở Node runtime, vì `scrypt` là `node:crypto` — không có ở runtime Edge.
 *
 * Vì sao phải chắn: mã QR dán tại quầy in thẳng địa chỉ máy chủ vào tay từng
 * phụ huynh. Xoá đuôi URL, gõ `/quan-tri` là vào — không cần dò IP, ta vừa đưa
 * cho họ.
 */
export async function proxy(request: NextRequest) {
  const duongDan = request.nextUrl.pathname;

  // Màn đăng nhập phải mở, nếu không thì không ai vào được để mà đăng nhập.
  if (duongDan.startsWith("/quan-tri/vao")) return NextResponse.next();

  const phien = await docPhien(request.cookies.get(TEN_COOKIE)?.value);
  if (phien) return NextResponse.next();

  // API xuất dữ liệu: trả 401 chứ KHÔNG chuyển hướng. Một công cụ tải file mà
  // nhận về trang HTML đăng nhập sẽ lưu nguyên trang đó thành tệp .xlsx hỏng.
  if (duongDan.startsWith("/api/xuat")) {
    return new NextResponse("Chưa đăng nhập", { status: 401 });
  }

  const den = new URL("/quan-tri/vao", request.url);
  den.searchParams.set("tiep", duongDan + request.nextUrl.search);
  return NextResponse.redirect(den);
}

/**
 * 🔴 CHỈ chắn `/quan-tri` và `/api/xuat`. Màn LCD `/man-hinh/:ma` và trang chơi
 * `/choi/:ma` phải mở công khai — phụ huynh quét QR không có tài khoản nào cả.
 */
export const config = {
  matcher: ["/quan-tri/:path*", "/api/xuat/:path*"],
};
