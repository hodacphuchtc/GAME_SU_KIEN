"use server";

import { revalidatePath } from "next/cache";

import { T } from "@/config/locale";
import { VAI_TRO, type TrangThaiNhanVien, type VaiTro } from "@/config/to-chuc";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { quanLyDuocNhanVien } from "@/lib/bao-ve/quyen";
import { layMot } from "@/lib/db/truy-van";
import {
  datMatKhau,
  datTrangThaiNhanVien,
  suaNhanVien,
  themNhanVien,
  thuHoiDangNhap,
  timNhanVien,
} from "@/lib/nhan-vien/kho";

/**
 * Quản lý nhân viên — CHỈ `quan_tri`.
 *
 * 🔴 Kiểm quyền ở ĐÂY, không chỉ ở chỗ vẽ nút. Server action là endpoint HTTP
 * công khai có id ổn định: ẩn nút đi mà không kiểm ở đây thì ai cũng gọi được
 * để tự cấp cho mình vai trò quản trị.
 */

export interface KetQuaNhanVien {
  loi?: string;
  xong?: boolean;
}

export async function luuNhanVienForm(
  _truoc: KetQuaNhanVien,
  form: FormData,
): Promise<KetQuaNhanVien> {
  const nguoi = await batBuocDangNhap();
  if (!quanLyDuocNhanVien(nguoi)) return { loi: T.nvErrQuyen };

  const idText = String(form.get("id") ?? "").trim();
  const id = idText === "" ? null : Number.parseInt(idText, 10);
  const hoTen = String(form.get("hoTen") ?? "").trim().slice(0, 100);
  const coSoText = String(form.get("coSoId") ?? "").trim();
  const coSoId = coSoText === "" ? null : Number.parseInt(coSoText, 10);
  const vaiTro = String(form.get("vaiTro") ?? "sale") as VaiTro;
  const tenDangNhap = String(form.get("tenDangNhap") ?? "").trim().slice(0, 60) || null;
  const matKhau = String(form.get("matKhau") ?? "");

  if (hoTen === "") return { loi: T.nvErrName };
  if (!VAI_TRO.includes(vaiTro)) return { loi: T.nvErrQuyen };
  if (matKhau !== "" && matKhau.length < 8) return { loi: T.nvErrPass };
  if (matKhau !== "" && tenDangNhap === null) return { loi: T.nvErrNoUser };

  if (tenDangNhap !== null) {
    const trung = layMot<{ id: number }>(
      "select id from nhan_vien where ten_dang_nhap = ?",
      tenDangNhap,
    );
    if (trung && trung.id !== id) return { loi: T.nvErrUserTaken };
  }

  const dauVao = {
    hoTen,
    coSoId: Number.isFinite(coSoId) ? coSoId : null,
    vaiTro,
    soDienThoai: String(form.get("soDienThoai") ?? "").trim().slice(0, 30),
    email: String(form.get("email") ?? "").trim().slice(0, 120),
    tenDangNhap,
  };

  const nvId = id === null ? themNhanVien(dauVao) : (suaNhanVien(id, dauVao) ? id : null);
  if (nvId === null) return { loi: T.nvErrName };
  if (matKhau !== "") datMatKhau(nvId, matKhau);

  revalidatePath("/quan-tri/nhan-vien");
  return { xong: true };
}

export async function datTrangThaiNhanVienAction(
  id: number,
  trangThai: TrangThaiNhanVien,
): Promise<void> {
  const nguoi = await batBuocDangNhap();
  if (!quanLyDuocNhanVien(nguoi)) return;
  // Không cho tự cho mình nghỉ: người quản trị cuối cùng khoá chính mình ra
  // ngoài thì không còn ai mở cửa lại được.
  if (id === nguoi.id) return;
  datTrangThaiNhanVien(id, trangThai);
  revalidatePath("/quan-tri/nhan-vien");
}

export async function thuHoiDangNhapAction(id: number): Promise<void> {
  const nguoi = await batBuocDangNhap();
  if (!quanLyDuocNhanVien(nguoi)) return;
  if (id === nguoi.id) return;
  if (timNhanVien(id)) thuHoiDangNhap(id);
  revalidatePath("/quan-tri/nhan-vien");
}
