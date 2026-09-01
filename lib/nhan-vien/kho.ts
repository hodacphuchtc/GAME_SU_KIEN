import "server-only";

import { TRANG_THAI_NHAN_VIEN, VAI_TRO, type TrangThaiNhanVien, type VaiTro } from "@/config/to-chuc";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { bamMatKhau, kiemMatKhau } from "@/lib/bao-ve/mat-khau";

/**
 * NHÂN VIÊN — MỌI SQL của bảng `nhan_vien`.
 *
 * 🔴 MỘT bảng vừa là danh sách sale (để gán khách) vừa là tài khoản đăng nhập.
 * `mat_khau_bam` NULL = có tên trong danh sách nhưng chưa được cấp quyền vào hệ
 * thống. Hai bảng riêng sẽ đẻ ra hai danh sách sale lệch nhau — đúng thứ rule 3
 * của `module-boundaries` cấm.
 */

export interface NhanVien {
  id: number;
  coSoId: number | null;
  hoTen: string;
  soDienThoai: string | null;
  email: string | null;
  tenDangNhap: string | null;
  coDangNhap: boolean;
  vaiTro: VaiTro;
  trangThai: TrangThaiNhanVien;
}

interface DongNhanVien {
  id: number;
  co_so_id: number | null;
  ho_ten: string;
  so_dien_thoai: string | null;
  email: string | null;
  ten_dang_nhap: string | null;
  mat_khau_bam: string | null;
  vai_tro: string;
  trang_thai: string;
}

function doiDong(d: DongNhanVien): NhanVien {
  return {
    id: d.id,
    coSoId: d.co_so_id,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    email: d.email,
    tenDangNhap: d.ten_dang_nhap,
    coDangNhap: d.mat_khau_bam !== null,
    vaiTro: d.vai_tro as VaiTro,
    trangThai: d.trang_thai as TrangThaiNhanVien,
  };
}

export function danhSachNhanVien(coSoId?: number | null): NhanVien[] {
  const sql =
    coSoId === undefined
      ? "select * from nhan_vien order by trang_thai, ho_ten"
      : "select * from nhan_vien where co_so_id is ? order by trang_thai, ho_ten";
  return (coSoId === undefined
    ? layNhieu<DongNhanVien>(sql)
    : layNhieu<DongNhanVien>(sql, coSoId)
  ).map(doiDong);
}

export function timNhanVien(id: number): NhanVien | null {
  const d = layMot<DongNhanVien>("select * from nhan_vien where id = ?", id);
  return d ? doiDong(d) : null;
}

/** Có tài khoản nào đăng nhập được chưa — chưa thì trang quản trị phải nói rõ cách tạo. */
export function coTaiKhoanNao(): boolean {
  const d = layMot<{ so: number }>(
    "select count(*) as so from nhan_vien where mat_khau_bam is not null",
  );
  return (d?.so ?? 0) > 0;
}

export interface DauVaoNhanVien {
  hoTen: string;
  coSoId: number | null;
  vaiTro: VaiTro;
  soDienThoai?: string | null;
  email?: string | null;
  tenDangNhap?: string | null;
}

export function themNhanVien(dauVao: DauVaoNhanVien): number {
  const luc = Date.now();
  chay(
    `insert into nhan_vien (co_so_id, ho_ten, so_dien_thoai, email, ten_dang_nhap, vai_tro, trang_thai, tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, ?, 'dang_lam', ?, ?)`,
    dauVao.coSoId,
    dauVao.hoTen.trim(),
    dauVao.soDienThoai?.trim() || null,
    dauVao.email?.trim() || null,
    dauVao.tenDangNhap?.trim() || null,
    dauVao.vaiTro,
    luc,
    luc,
  );
  return layMot<{ id: number }>("select last_insert_rowid() as id")!.id;
}

export function suaNhanVien(id: number, dauVao: DauVaoNhanVien): boolean {
  if (!VAI_TRO.includes(dauVao.vaiTro)) return false;
  return (
    chay(
      `update nhan_vien
          set ho_ten = ?, co_so_id = ?, vai_tro = ?, so_dien_thoai = ?, email = ?,
              ten_dang_nhap = ?, sua_luc = ?
        where id = ?`,
      dauVao.hoTen.trim(),
      dauVao.coSoId,
      dauVao.vaiTro,
      dauVao.soDienThoai?.trim() || null,
      dauVao.email?.trim() || null,
      dauVao.tenDangNhap?.trim() || null,
      Date.now(),
      id,
    ) > 0
  );
}

/**
 * CHO NGHỈ, không xoá.
 *
 * 🔴 Xoá nhân viên là xoá luôn dấu vết ai đã phụ trách khách nào. Khoá ngoại của
 * `khach_tiem_nang.nhan_vien_id` là `ON DELETE SET NULL`, nghĩa là hàng trăm
 * khách bỗng dưng vô chủ và không ai dựng lại được lịch sử chăm sóc.
 */
export function datTrangThaiNhanVien(id: number, trangThai: TrangThaiNhanVien): boolean {
  if (!TRANG_THAI_NHAN_VIEN.includes(trangThai)) return false;
  return (
    chay(
      "update nhan_vien set trang_thai = ?, sua_luc = ? where id = ?",
      trangThai,
      Date.now(),
      id,
    ) > 0
  );
}

/** Cấp quyền đăng nhập (đặt/đổi mật khẩu). */
export function datMatKhau(id: number, matKhau: string): boolean {
  if (matKhau.length < 8) return false;
  return (
    chay(
      "update nhan_vien set mat_khau_bam = ?, sua_luc = ? where id = ?",
      bamMatKhau(matKhau),
      Date.now(),
      id,
    ) > 0
  );
}

/** Thu hồi quyền vào hệ thống nhưng GIỮ tên trong danh sách sale. */
export function thuHoiDangNhap(id: number): boolean {
  return chay("update nhan_vien set mat_khau_bam = null, sua_luc = ? where id = ?", Date.now(), id) > 0;
}

/**
 * Kiểm tên đăng nhập + mật khẩu.
 *
 * Trả `null` cho MỌI ca thất bại — sai tên, sai mật khẩu, đã nghỉ, chưa cấp
 * quyền — và nơi gọi chỉ được nói một câu duy nhất. Phân biệt "sai tên" với
 * "sai mật khẩu" là cho kẻ dò biết tên nào có thật.
 */
export function kiemDangNhap(tenDangNhap: string, matKhau: string): NhanVien | null {
  const d = layMot<DongNhanVien>(
    "select * from nhan_vien where ten_dang_nhap = ? and trang_thai = 'dang_lam'",
    tenDangNhap.trim(),
  );
  if (!d || d.mat_khau_bam === null) return null;
  return kiemMatKhau(matKhau, d.mat_khau_bam) ? doiDong(d) : null;
}
