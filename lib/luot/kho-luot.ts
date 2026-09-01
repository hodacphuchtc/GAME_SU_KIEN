import "server-only";

import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { ngayVietNam, thangVietNam } from "@/lib/db/thoi-gian";

/** Đọc lịch sử quay số — nguồn tra soát khi có tranh chấp giải thưởng. */

export interface DongLichSu {
  id: number;
  ketThucLuc: number | null;
  hoTen: string | null;
  soDienThoai: string | null;
  soDaDung: number | null;
  trung: boolean;
  khoangLech: number | null;
  hetGio: boolean;
  thietBiBam: string | null;
  maXacThuc: string | null;
  daTraoThuong: boolean;
  quanTamHocThu: boolean;
  daGhiDanh: boolean;
}

interface DongTho {
  id: number;
  ket_thuc_luc: number | null;
  ho_ten: string | null;
  so_dien_thoai: string | null;
  so_da_dung: number | null;
  trung: number;
  khoang_lech: number | null;
  het_gio: number;
  thiet_bi_bam: string | null;
  ma_xac_thuc: string | null;
  da_trao_thuong: number;
  quan_tam_hoc_thu: number | null;
  da_ghi_danh: number;
}

const CAU_LICH_SU = `
  select l.id, l.ket_thuc_luc, l.so_da_dung, l.trung, l.khoang_lech, l.het_gio,
         l.thiet_bi_bam, l.ma_xac_thuc, l.da_trao_thuong, l.da_ghi_danh,
         n.ho_ten, n.so_dien_thoai, n.quan_tam_hoc_thu
    from luot_choi l
    left join nguoi_choi n on n.id = l.nguoi_choi_id
   where l.chuong_trinh_id = ?
     and l.ket_thuc_luc is not null
   order by l.id desc`;

function doi(d: DongTho): DongLichSu {
  return {
    id: d.id,
    ketThucLuc: d.ket_thuc_luc,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    soDaDung: d.so_da_dung,
    trung: d.trung === 1,
    khoangLech: d.khoang_lech,
    hetGio: d.het_gio === 1,
    thietBiBam: d.thiet_bi_bam,
    maXacThuc: d.ma_xac_thuc,
    daTraoThuong: d.da_trao_thuong === 1,
    quanTamHocThu: d.quan_tam_hoc_thu === 1,
    daGhiDanh: d.da_ghi_danh === 1,
  };
}

export function lichSu(chuongTrinhId: number, gioiHan = 200): DongLichSu[] {
  return layNhieu<DongTho>(`${CAU_LICH_SU} limit ?`, chuongTrinhId, gioiHan).map(doi);
}

export function toanBoLichSu(chuongTrinhId: number): DongLichSu[] {
  return layNhieu<DongTho>(CAU_LICH_SU, chuongTrinhId).map(doi);
}

/** Đếm số giải đã trúng HÔM NAY — để so với trần giải mỗi ngày. */
export function soGiaiHomNay(chuongTrinhId: number): number {
  const d = layMot<{ so: number }>(
    "select count(*) as so from luot_choi where chuong_trinh_id = ? and ngay = ? and trung = 1",
    chuongTrinhId,
    ngayVietNam(),
  );
  return d?.so ?? 0;
}

/**
 * THƯỚC ĐO lead → ghi danh.
 *
 * Vì sao đếm theo NGƯỜI chứ không theo LƯỢT: một phụ huynh chơi năm ngày vẫn là
 * MỘT khách. Đếm theo lượt cho ra con số đẹp hơn mà vô nghĩa — và tệ hơn, nó
 * khiến người đọc tưởng đang tăng trưởng trong khi chỉ có một người chơi nhiều.
 *
 * Lượt ẩn danh (nhân viên bấm thẳng trên màn hình lớn) không có gì để liên hệ,
 * nên không được vào mẫu số — nếu không tỉ lệ chuyển đổi bị pha loãng vô cớ.
 */
export interface ThongKeGhiDanh {
  /** Số phụ huynh KHÁC NHAU đã để lại số trong tháng. */
  soKhach: number;
  /** Bao nhiêu người trong số đó đã được đánh dấu ghi danh. */
  soGhiDanh: number;
}

export function thongKeGhiDanh(thang = thangVietNam()): ThongKeGhiDanh {
  const d = layMot<{ so_khach: number; so_ghi_danh: number }>(
    `select count(distinct nguoi_choi_id) as so_khach,
            count(distinct case when da_ghi_danh = 1 then nguoi_choi_id end) as so_ghi_danh
       from luot_choi
      where nguoi_choi_id is not null
        and substr(ngay, 1, 7) = ?`,
    thang,
  );
  return { soKhach: d?.so_khach ?? 0, soGhiDanh: d?.so_ghi_danh ?? 0 };
}

/**
 * Nhân viên tự tay đánh dấu một lượt đã thành học viên. Trả `false` nếu không có
 * lượt nào khớp — nơi gọi tự quyết báo gì, đừng ném lỗi lên mặt người dùng.
 *
 * Bật hai lần liên tiếp KHÔNG được dời `ghi_danh_luc`: mốc đó là "lúc ghi nhận",
 * bấm nhầm hai lần không phải là ghi danh lần thứ hai.
 */
export function datGhiDanh(luotId: number, daGhiDanh: boolean): boolean {
  return (
    chay(
      `update luot_choi
          set da_ghi_danh = ?,
              ghi_danh_luc = case when ? = 1 then coalesce(ghi_danh_luc, ?) else null end
        where id = ? and da_ghi_danh is not ?`,
      daGhiDanh ? 1 : 0,
      daGhiDanh ? 1 : 0,
      Date.now(),
      luotId,
      daGhiDanh ? 1 : 0,
    ) > 0
  );
}
