"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { T } from "@/config/locale";
import { kiemMatKhau } from "@/lib/bao-ve/mat-khau";
import {
  daCoKhoaPhien,
  daCoMatKhauQuanTri,
  HAN_PHIEN_GIAY,
  kyPhien,
  TEN_COOKIE,
  thuocTinhCookie,
} from "@/lib/bao-ve/phien-quan-tri";

/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/app/actions/dang-nhap.ts` @ 3d96358.
 * ĐÃ SỬA: bỏ tên đăng nhập và bảng nhân viên — bản này có ĐÚNG MỘT mật khẩu,
 * đọc chuỗi băm từ `VONG_QUAY_MAT_KHAU_BAM`. Bỏ luôn nhật ký truy cập (v1
 * không có bảng đó, xem mục "KHÔNG LÀM Ở PHIÊN BẢN NÀY").
 */

/**
 * Đăng nhập — chạy ở Node runtime vì `scrypt` là `node:crypto`.
 *
 * 🔴 Mọi ca thất bại vì sai mật khẩu trả về ĐÚNG MỘT câu. Còn ca "chưa cấu
 * hình" thì nói thẳng phải làm gì: người vận hành bị khoá ngoài chính hệ thống
 * của mình mà màn hình chỉ nói "sai mật khẩu" là không có đường nào đoán ra.
 */

export interface KetQuaDangNhap {
  loi?: string;
}

/** Chỉ nhận đường dẫn NỘI BỘ. Nhận cả `//ke-gian.com` là mở cửa chuyển hướng mở. */
function duongDanAnToan(tiep: string): string {
  return tiep.startsWith("/") && !tiep.startsWith("//") ? tiep : "/quan-tri";
}

export async function dangNhapForm(
  _truoc: KetQuaDangNhap,
  form: FormData,
): Promise<KetQuaDangNhap> {
  if (!daCoKhoaPhien()) return { loi: T.vaoThieuKhoa };
  if (!daCoMatKhauQuanTri()) return { loi: T.vaoThieuMatKhau };

  const matKhau = String(form.get("matKhau") ?? "");
  const tiep = duongDanAnToan(String(form.get("tiep") ?? "/quan-tri"));

  const daLuu = process.env.VONG_QUAY_MAT_KHAU_BAM ?? "";
  if (!kiemMatKhau(matKhau, daLuu)) return { loi: T.vaoSai };

  const cookie = await kyPhien({ han: Date.now() + HAN_PHIEN_GIAY * 1000 });
  if (!cookie) return { loi: T.vaoThieuKhoa };

  const kho = await cookies();
  kho.set(TEN_COOKIE, cookie, thuocTinhCookie());
  redirect(tiep);
}

export async function dangXuat(): Promise<void> {
  const kho = await cookies();
  kho.delete(TEN_COOKIE);
  redirect("/quan-tri/vao");
}
