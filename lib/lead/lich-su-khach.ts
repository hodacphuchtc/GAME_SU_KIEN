import "server-only";

import type { TroChoi } from "@/config/to-chuc";
import { layMot, layNhieu } from "@/lib/db/truy-van";
import type { PhamVi } from "@/lib/bao-ve/quyen";

/**
 * LỊCH SỬ CHƠI CỦA MỘT KHÁCH, GỘP CẢ BA GAME.
 *
 * 🔴 Vì sao phải hợp nhất bằng tay. Ba game ghi vào HAI bảng khác nhau: Trúng Số và
 * Chọn Số ghi `van_choi`, Vòng Quay ghi `luot_quay`. Không có một bảng "lượt chơi"
 * chung, và cố dựng một bảng như vậy là ép hai mô hình khác nhau vào một khuôn —
 * vòng quay không có "trúng/trượt", trúng số không có "ô quà".
 *
 * 🔴 Câu hỏi này KHÔNG trả lời được từ `khach_tiem_nang.chuong_trinh_id_dau`: cột
 * đó chỉ ghi game ĐẦU TIÊN và không bao giờ cập nhật. Muốn biết đủ những game khách
 * đã chơi thì phải đi từ chính các bảng lượt.
 */

export interface LuotCuaKhach {
  troChoi: TroChoi;
  chuongTrinhMa: string;
  tenDot: string;
  tenCoSo: string | null;
  luc: number;
  /** Phần quà đã nhận. `null` với ván không trúng của Trúng Số. */
  phanQua: string | null;
  maXacThuc: string | null;
  daTraoThuong: boolean;
}

export interface HoSoKhach {
  nguoiChoiId: number;
  hoTen: string;
  soDienThoai: string;
  dongYTuVan: boolean;
  quanTamHocThu: boolean;
  taoLuc: number;
}

export interface DongThayDoi {
  truong: string;
  giaTriCu: string | null;
  giaTriMoi: string | null;
  troChoi: TroChoi | null;
  luc: number;
}

/**
 * Mệnh đề phạm vi cho các bảng LƯỢT.
 *
 * 🔴 Lọc theo cơ sở của CHƯƠNG TRÌNH, không theo cơ sở của lead: một người có thể
 * chơi ở hai cơ sở, và sale cơ sở A không được đọc ván họ chơi ở cơ sở B.
 */
function locCoSo(pv: PhamVi, cot: string): { sql: string; tham: number[] } {
  if (pv.coSoId === null) return { sql: "", tham: [] };
  return { sql: ` and ${cot} = ?`, tham: [pv.coSoId] };
}

/** Hồ sơ khách, đã lọc phạm vi qua chính lead của họ. */
export function hoSoKhach(nguoiChoiId: number, pv: PhamVi): HoSoKhach | null {
  const loc = locCoSo(pv, "k.co_so_id");
  const d = layMot<{
    id: number;
    ho_ten: string;
    so_dien_thoai: string;
    dong_y_tu_van: number;
    quan_tam_hoc_thu: number;
    tao_luc: number;
  }>(
    `select distinct n.id, n.ho_ten, n.so_dien_thoai, n.dong_y_tu_van,
            n.quan_tam_hoc_thu, n.tao_luc
       from nguoi_choi n
       join khach_tiem_nang k on k.nguoi_choi_id = n.id
      where n.id = ?${loc.sql}`,
    nguoiChoiId,
    ...loc.tham,
  );
  if (d == null) return null;
  return {
    nguoiChoiId: d.id,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    dongYTuVan: d.dong_y_tu_van === 1,
    quanTamHocThu: d.quan_tam_hoc_thu === 1,
    taoLuc: d.tao_luc,
  };
}

/**
 * Mọi lượt chơi của một khách, mới nhất trước, gộp cả ba game.
 *
 * `UNION ALL` chứ không `UNION`: hai nhánh không thể trùng nhau (khác bảng nguồn),
 * và `UNION` sẽ bắt SQLite sắp xếp để khử trùng — công vô ích.
 */
export function lichSuChoiCuaKhach(nguoiChoiId: number, pv: PhamVi): LuotCuaKhach[] {
  const a = locCoSo(pv, "c.co_so_id");
  const b = locCoSo(pv, "c.co_so_id");
  return layNhieu<{
    tro_choi: string;
    ma: string;
    ten_dot: string;
    ten_co_so: string | null;
    luc: number;
    phan_qua: string | null;
    ma_xac_thuc: string | null;
    da_trao: number;
  }>(
    `select c.tro_choi, c.ma, c.ten_giai_thuong as ten_dot, cs.ten as ten_co_so,
            v.bat_dau_luc as luc,
            case when v.trung = 1 then c.ten_giai_thuong else null end as phan_qua,
            v.ma_xac_thuc, v.da_trao_thuong as da_trao
       from van_choi v
       join chuong_trinh c on c.id = v.chuong_trinh_id
       left join co_so cs  on cs.id = c.co_so_id
      where v.nguoi_choi_id = ?${a.sql}
     union all
     select c.tro_choi, c.ma, c.ten_giai_thuong as ten_dot, cs.ten as ten_co_so,
            q.bat_dau_luc as luc,
            coalesce(q.o_ten, o.ten) as phan_qua,
            q.ma_xac_thuc, q.da_trao_thuong as da_trao
       from luot_quay q
       join chuong_trinh c on c.id = q.chuong_trinh_id
       left join co_so cs  on cs.id = c.co_so_id
       left join o_qua o   on o.id = q.o_qua_id
      where q.nguoi_choi_id = ?${b.sql}
     order by luc desc`,
    nguoiChoiId,
    ...a.tham,
    nguoiChoiId,
    ...b.tham,
  ).map((d) => ({
    troChoi: d.tro_choi as TroChoi,
    chuongTrinhMa: d.ma,
    tenDot: d.ten_dot,
    tenCoSo: d.ten_co_so,
    luc: d.luc,
    phanQua: d.phan_qua,
    maXacThuc: d.ma_xac_thuc,
    daTraoThuong: d.da_trao === 1,
  }));
}

/**
 * Sổ thay đổi hồ sơ, mới nhất trước.
 *
 * KHÔNG lọc phạm vi ở đây: nơi gọi đã phải qua `hoSoKhach()` mới có `nguoiChoiId`,
 * và hàm đó lọc rồi. Lọc hai lần ở hai tầng là mời người sau tin nhầm rằng chỉ cần
 * một trong hai.
 */
export function soThayDoi(nguoiChoiId: number, gioiHan = 50): DongThayDoi[] {
  return layNhieu<{
    truong: string;
    gia_tri_cu: string | null;
    gia_tri_moi: string | null;
    tro_choi: string | null;
    luc: number;
  }>(
    `select t.truong, t.gia_tri_cu, t.gia_tri_moi, c.tro_choi, t.luc
       from nguoi_choi_thay_doi t
       left join chuong_trinh c on c.id = t.chuong_trinh_id
      where t.nguoi_choi_id = ?
      order by t.luc desc, t.id desc
      limit ?`,
    nguoiChoiId,
    gioiHan,
  ).map((d) => ({
    truong: d.truong,
    giaTriCu: d.gia_tri_cu,
    giaTriMoi: d.gia_tri_moi,
    troChoi: (d.tro_choi as TroChoi | null) ?? null,
    luc: d.luc,
  }));
}

/** Tên cũ gần nhất, để hiện một dòng tóm tắt cạnh ô ghi chú ở tab khách. */
export function tenTungKhai(nguoiChoiId: number): string | null {
  return (
    layMot<{ gia_tri_cu: string | null }>(
      `select gia_tri_cu from nguoi_choi_thay_doi
        where nguoi_choi_id = ? and truong = 'ho_ten'
        order by luc desc, id desc limit 1`,
      nguoiChoiId,
    )?.gia_tri_cu ?? null
  );
}
