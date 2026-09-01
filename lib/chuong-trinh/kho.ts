import "server-only";

import { DIFFICULTIES, type DifficultyId, type RoundSettings } from "@/config/game";
import { SO_LAN_CHOI, type CheDoChoi, type NguonCoSo } from "@/config/to-chuc";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { sinhMa } from "@/lib/chuong-trinh/ma-chuong-trinh";

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
  /** Cơ sở tổ chức. NULL chỉ còn ở dữ liệu cũ chưa qua backfill. */
  coSoId: number | null;
  cheDo: CheDoChoi;
  nguonCoSo: NguonCoSo;
  soLanChoi: number;
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
  co_so_id: number | null;
  che_do: string;
  nguon_co_so: string;
  so_lan_choi: number;
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
    coSoId: dong.co_so_id,
    cheDo: dong.che_do as CheDoChoi,
    nguonCoSo: dong.nguon_co_so as NguonCoSo,
    soLanChoi: dong.so_lan_choi,
    soLuot: dong.so_luot ?? 0,
    soGiai: dong.so_giai ?? 0,
  };
}

/** Sinh mã chưa ai dùng. Bốn ký tự cho 390.625 khả năng — đủ xa để không đụng. */
function maChuaDung(): string {
  for (let i = 0; i < 50; i += 1) {
    const ma = sinhMa();
    if (!layMot("select 1 from chuong_trinh where ma = ?", ma)) return ma;
  }
  throw new Error("Không sinh được mã chương trình mới sau 50 lần thử");
}

export interface DauVaoTaoChuongTrinh {
  /**
   * BẢN CHỤP tên cơ sở lúc tạo, không phải nguồn sự thật.
   *
   * 🔴 Vì sao chép chứ không join: đường chơi đọc chương trình ở chỗ nhạy cảm độ
   * trễ, thêm một phép nối bảng ở đó là thêm việc cho mỗi lượt bấm. Và quan
   * trọng hơn: đổi tên cơ sở vào năm sau KHÔNG được phép làm sai tên trên biên
   * lai đã in năm ngoái.
   */
  tenTrungTam: string;
  soTrung: number;
  mucDo: DifficultyId | "custom";
  thamSo?: RoundSettings;
  tenGiaiThuong: string;
  tranGiaiMoiNgay: number;
  coSoId: number;
  cheDo?: CheDoChoi;
  nguonCoSo?: NguonCoSo;
  soLanChoi?: number;
}

export function taoChuongTrinh(dauVao: DauVaoTaoChuongTrinh): ChuongTrinh {
  const luc = Date.now();
  const ma = maChuaDung();
  chay(
    `insert into chuong_trinh
       (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong,
        tran_giai_moi_ngay, trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi,
        tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, ?, ?, 'dang_chay', ?, ?, ?, ?, ?, ?)`,
    ma,
    dauVao.tenTrungTam,
    dauVao.soTrung,
    dauVao.mucDo,
    dauVao.thamSo ? JSON.stringify(dauVao.thamSo) : null,
    dauVao.tenGiaiThuong,
    dauVao.tranGiaiMoiNgay,
    dauVao.coSoId,
    dauVao.cheDo ?? "tai_quay",
    dauVao.nguonCoSo ?? "gan_san",
    dauVao.soLanChoi ?? SO_LAN_CHOI.macDinh,
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

/**
 * Bật hoặc tắt chương trình, đồng thời DỌN SẠCH cả bốn ô giữ chỗ — ở CẢ HAI chiều.
 *
 * 🔴 Vì sao phải dọn: `ROOM_HOLD_SECONDS` là 120 giây. Nhân viên tắt chương trình
 * đúng lúc có người đang giữ chỗ, rồi 20 giây sau bật lại → suốt HAI PHÚT đầu,
 * người mới quét mã bị báo "màn hình đang có người chơi" bởi một chiếc điện
 * thoại đã rời đi từ lâu. Nhìn y như bật lại không ăn thua. Một câu UPDATE,
 * không thêm lượt đi–về nào — cứ dọn.
 */
export function doiTrangThai(ma: string, trangThai: TrangThaiChuongTrinh): boolean {
  return (
    chay(
      `update chuong_trinh
          set trang_thai = ?, sua_luc = ?,
              token_man_hinh = null, han_man_hinh = null,
              token_nguoi_choi = null, han_nguoi_choi = null
        where ma = ?`,
      trangThai,
      Date.now(),
      ma,
    ) > 0
  );
}
