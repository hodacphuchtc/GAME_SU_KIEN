import "server-only";

import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { ngayVietNam, thangVietNam } from "@/lib/db/thoi-gian";

/**
 * Đọc lịch sử quay số — nguồn tra soát khi có tranh chấp giải thưởng.
 *
 * 🔴 Từ GĐ 12.1 mỗi dòng là MỘT VÁN, không phải một lần bấm. Chương trình đặt 3
 * lần bấm mà bảng đổ ra ba dòng thì nhân viên đối soát sẽ tưởng có ba người
 * chơi, và trần giải nhìn như đã vỡ trong khi chưa.
 *
 * Số hiển thị trên dòng lấy từ LƯỢT TỐT NHẤT của ván (lệch nhỏ nhất), vì đó
 * mới là kết quả mà người chơi được chấm.
 */

export interface DongLichSu {
  /** id của VÁN — mọi thao tác tích chọn đều nhắm vào ván. */
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
  /** Căn cứ HỢP PHÁP để gọi điện tư vấn. Thiếu cột này trong file xuất thì
   *  trung tâm cầm danh sách mà không biết được phép gọi cho ai. */
  dongYTuVan: boolean;
  daGhiDanh: boolean;
  /** Đã bấm mấy lần trên tổng số được phép — để đối soát khi có tranh chấp. */
  soLanDaDung: number;
  soLanChoPhep: number;
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
  dong_y_tu_van: number | null;
  da_ghi_danh: number;
  so_lan_da_dung: number;
  so_lan_cho_phep: number;
}

const CAU_LICH_SU = `
  select v.id, v.ket_thuc_luc, v.trung, v.ma_xac_thuc, v.da_trao_thuong, v.da_ghi_danh,
         v.so_lan_da_dung, v.so_lan_cho_phep,
         l.so_da_dung, l.khoang_lech, l.het_gio, l.thiet_bi_bam,
         n.ho_ten, n.so_dien_thoai, n.quan_tam_hoc_thu, n.dong_y_tu_van
    from van_choi v
    left join luot_choi l   on l.id = v.luot_tot_nhat_id
    left join nguoi_choi n  on n.id = v.nguoi_choi_id
   where v.chuong_trinh_id = ?
     and v.ket_thuc_luc is not null
   order by v.id desc`;

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
    dongYTuVan: d.dong_y_tu_van === 1,
    daGhiDanh: d.da_ghi_danh === 1,
    soLanDaDung: d.so_lan_da_dung,
    soLanChoPhep: d.so_lan_cho_phep,
  };
}

export function lichSu(chuongTrinhId: number, gioiHan = 200): DongLichSu[] {
  return layNhieu<DongTho>(`${CAU_LICH_SU} limit ?`, chuongTrinhId, gioiHan).map(doi);
}

export function toanBoLichSu(chuongTrinhId: number): DongLichSu[] {
  return layNhieu<DongTho>(CAU_LICH_SU, chuongTrinhId).map(doi);
}

/**
 * Đếm số giải đã trúng HÔM NAY — để so với trần giải mỗi ngày.
 *
 * Đếm VÁN, không đếm lượt: một ván ba lần bấm trúng hai lần vẫn chỉ tốn MỘT
 * phần quà, nên đếm lượt là tự khai vỡ trần trong khi kho vẫn còn.
 */
export function soGiaiHomNay(chuongTrinhId: number): number {
  const d = layMot<{ so: number }>(
    "select count(*) as so from van_choi where chuong_trinh_id = ? and ngay = ? and trung = 1",
    chuongTrinhId,
    ngayVietNam(),
  );
  return d?.so ?? 0;
}

/**
 * THƯỚC ĐO lead → ghi danh.
 *
 * Vì sao đếm theo NGƯỜI chứ không theo VÁN: một phụ huynh chơi năm ngày vẫn là
 * MỘT khách. Đếm theo ván cho ra con số đẹp hơn mà vô nghĩa — và tệ hơn, nó
 * khiến người đọc tưởng đang tăng trưởng trong khi chỉ có một người chơi nhiều.
 *
 * Ván ẩn danh (nhân viên bấm thẳng trên màn hình lớn) không có gì để liên hệ,
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
       from van_choi
      where nguoi_choi_id is not null
        and substr(ngay, 1, 7) = ?`,
    thang,
  );
  return { soKhach: d?.so_khach ?? 0, soGhiDanh: d?.so_ghi_danh ?? 0 };
}

/**
 * Hai cờ nhân viên tự tay tích ở quầy. Tên cột nằm trong BẢNG TRẮNG này chứ
 * không nhận từ nơi gọi — câu SQL phải nối chuỗi tên cột, và một tên cột đến từ
 * bên ngoài là một lỗ tiêm SQL.
 */
const CO_VAN = {
  "ghi-danh": { co: "da_ghi_danh", luc: "ghi_danh_luc" },
  "trao-thuong": { co: "da_trao_thuong", luc: "trao_luc" },
} as const;

export type CoVan = keyof typeof CO_VAN;

/**
 * Bật/tắt một cờ trên VÁN. Trả `false` nếu không có ván nào đổi — nơi gọi tự
 * quyết báo gì, đừng ném lỗi lên mặt người dùng.
 *
 * Bật hai lần liên tiếp KHÔNG được dời mốc thời gian: nó là "lúc ghi nhận", bấm
 * nhầm hai lần không phải là ghi nhận lần thứ hai.
 */
export function datCoVan(vanId: number, coVan: CoVan, bat: boolean): boolean {
  const { co, luc } = CO_VAN[coVan];
  const gt = bat ? 1 : 0;
  return (
    chay(
      `update van_choi
          set ${co} = ?,
              ${luc} = case when ? = 1 then coalesce(${luc}, ?) else null end,
              sua_luc = ?
        where id = ? and ${co} is not ?`,
      gt,
      gt,
      Date.now(),
      Date.now(),
      vanId,
      gt,
    ) > 0
  );
}

/** Lối gọi quen tay cho thước đo ghi danh. */
export function datGhiDanh(vanId: number, daGhiDanh: boolean): boolean {
  return datCoVan(vanId, "ghi-danh", daGhiDanh);
}
