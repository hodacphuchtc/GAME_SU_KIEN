"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { T } from "@/config/locale";
import {
  daCoKhoaPhien,
  HAN_PHIEN_GIAY,
  kyPhien,
  TEN_COOKIE,
  thuocTinhCookie,
} from "@/lib/bao-ve/phien-quan-tri";
import { kiemDangNhap } from "@/lib/nhan-vien/kho";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";

/**
 * Đăng nhập — chạy ở Node runtime vì `scrypt` là `node:crypto`.
 *
 * 🔴 Mọi ca thất bại trả về ĐÚNG MỘT câu. Phân biệt "sai tên" với "sai mật
 * khẩu" là nói cho người dò biết tên nào có thật, và đó là nửa việc của họ.
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

  const ten = String(form.get("tenDangNhap") ?? "").trim().slice(0, 60);
  const matKhau = String(form.get("matKhau") ?? "");
  const tiep = duongDanAnToan(String(form.get("tiep") ?? "/quan-tri"));

  const nv = kiemDangNhap(ten, matKhau);
  if (!nv) return { loi: T.vaoSai };

  // Ghi SAU khi đã xác thực: ghi cả lần gõ sai thì nhật ký đầy rác do người gõ
  // nhầm, và lẫn vào đó một lần dò thật cũng không ai nhìn ra.
  ghiNhatKy({ nhanVienId: nv.id, hanhDong: HANH_DONG.dangNhap, doiTuong: nv.tenDangNhap });

  const cookie = await kyPhien({
    id: nv.id,
    ten: nv.hoTen,
    vaiTro: nv.vaiTro,
    coSoId: nv.coSoId,
    han: Date.now() + HAN_PHIEN_GIAY * 1000,
  });
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
