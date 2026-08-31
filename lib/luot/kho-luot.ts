import "server-only";

import { layMot, layNhieu } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";

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
}

const CAU_LICH_SU = `
  select l.id, l.ket_thuc_luc, l.so_da_dung, l.trung, l.khoang_lech, l.het_gio,
         l.thiet_bi_bam, l.ma_xac_thuc, l.da_trao_thuong,
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
