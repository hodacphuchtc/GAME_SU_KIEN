import "server-only";

import { DIFFICULTIES, type DifficultyId, type RoundSettings } from "@/config/game";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { randomRoomCode } from "@/lib/ket-noi";

/**
 * Kho đọc–ghi chương trình. MỌI câu lệnh SQL của bảng `chuong_trinh` nằm ở đây,
 * không rải rác trong component — đổi cột thì chỉ sửa một chỗ.
 */

export type TrangThaiChuongTrinh = "dang_chay" | "ket_thuc";

export interface ChuongTrinh {
  id: number;
  ma: string;
  tenTrungTam: string;
  soTrung: number;
  mucDo: DifficultyId | "custom";
  thamSo: RoundSettings;
  tenGiaiThuong: string;
  tranGiaiMoiNgay: number;
  trangThai: TrangThaiChuongTrinh;
  taoLuc: number;
}

export interface ChuongTrinhKemSoLieu extends ChuongTrinh {
  soLuot: number;
  soGiai: number;
}

interface DongChuongTrinh {
  id: number;
  ma: string;
  ten_trung_tam: string;
  so_trung: number;
  muc_do: string;
  tham_so: string | null;
  ten_giai_thuong: string;
  tran_giai_moi_ngay: number;
  trang_thai: string;
  tao_luc: number;
  so_luot?: number;
  so_giai?: number;
}

function doiDong(dong: DongChuongTrinh): ChuongTrinhKemSoLieu {
  const mucDo = dong.muc_do as DifficultyId | "custom";
  const thamSo: RoundSettings =
    dong.tham_so !== null
      ? (JSON.parse(dong.tham_so) as RoundSettings)
      : DIFFICULTIES[(mucDo === "custom" ? "vua" : mucDo) as DifficultyId].settings;

  return {
    id: dong.id,
    ma: dong.ma,
    tenTrungTam: dong.ten_trung_tam,
    soTrung: dong.so_trung,
    mucDo,
    thamSo,
    tenGiaiThuong: dong.ten_giai_thuong,
    tranGiaiMoiNgay: dong.tran_giai_moi_ngay,
    trangThai: dong.trang_thai as TrangThaiChuongTrinh,
    taoLuc: dong.tao_luc,
    soLuot: dong.so_luot ?? 0,
    soGiai: dong.so_giai ?? 0,
  };
}

/** Sinh mã chưa ai dùng. Bốn ký tự cho 390.625 khả năng — đủ xa để không đụng. */
function maChuaDung(): string {
  for (let i = 0; i < 50; i += 1) {
    const ma = randomRoomCode();
    if (!layMot("select 1 from chuong_trinh where ma = ?", ma)) return ma;
  }
  throw new Error("Không sinh được mã chương trình mới sau 50 lần thử");
}

export interface DauVaoTaoChuongTrinh {
  tenTrungTam: string;
  soTrung: number;
  mucDo: DifficultyId | "custom";
  thamSo?: RoundSettings;
  tenGiaiThuong: string;
  tranGiaiMoiNgay: number;
}

export function taoChuongTrinh(dauVao: DauVaoTaoChuongTrinh): ChuongTrinh {
  const luc = Date.now();
  const ma = maChuaDung();
  chay(
    `insert into chuong_trinh
       (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong,
        tran_giai_moi_ngay, trang_thai, tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, ?, ?, 'dang_chay', ?, ?)`,
    ma,
    dauVao.tenTrungTam,
    dauVao.soTrung,
    dauVao.mucDo,
    dauVao.thamSo ? JSON.stringify(dauVao.thamSo) : null,
    dauVao.tenGiaiThuong,
    dauVao.tranGiaiMoiNgay,
    luc,
    luc,
  );
  return doiDong(layMot<DongChuongTrinh>("select * from chuong_trinh where ma = ?", ma)!);
}

export function timTheoMa(ma: string): ChuongTrinh | null {
  const dong = layMot<DongChuongTrinh>("select * from chuong_trinh where ma = ?", ma);
  return dong ? doiDong(dong) : null;
}

/** Danh sách kèm số lượt và số giải — một câu truy vấn, không đếm vòng lặp. */
export function danhSachChuongTrinh(): ChuongTrinhKemSoLieu[] {
  const dong = layNhieu<DongChuongTrinh>(
    `select c.*,
              (select count(*) from luot_choi l where l.chuong_trinh_id = c.id) as so_luot,
              (select count(*) from luot_choi l where l.chuong_trinh_id = c.id and l.trung = 1) as so_giai
         from chuong_trinh c
        order by c.id desc`,
  );
  return dong.map(doiDong);
}

export function doiTrangThai(ma: string, trangThai: TrangThaiChuongTrinh): boolean {
  return (
    chay(
      "update chuong_trinh set trang_thai = ?, sua_luc = ? where ma = ?",
      trangThai,
      Date.now(),
      ma,
    ) > 0
  );
}
