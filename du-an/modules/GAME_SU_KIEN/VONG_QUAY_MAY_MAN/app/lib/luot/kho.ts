import "server-only";

import { csdl } from "@/lib/db/ket-noi";
import { cheSdt, tenRutGon } from "@/lib/nguoi-choi/so-dien-thoai";
import type { Cung } from "@/lib/vong-quay/chia-o";

/**
 * SỔ LƯỢT QUAY — đây là chứng cứ khi phụ huynh khiếu nại quà, không phải một
 * bảng thống kê cho vui. Mỗi dòng giữ đủ `hat_giong` + `goc_dung` +
 * `phien_ban_o` để dựng lại đúng vòng quay của lúc đó (hạng mục 5.2).
 */

export interface DongLichSu {
  id: number;
  luc: number;
  /** Tên RÚT GỌN: "Nguyễn Thị Hoa" → "Nguyễn H." */
  tenRutGon: string;
  /** Số điện thoại đã CHE: `09*****678`. */
  sdtChe: string;
  oTen: string | null;
  oMau: string | null;
  maXacThuc: string | null;
  daTraoThuong: boolean;
  traoLuc: number | null;
}

interface Dong {
  id: number;
  bat_dau_luc: number;
  ho_ten: string | null;
  so_dien_thoai: string | null;
  o_ten: string | null;
  o_mau: string | null;
  ma_xac_thuc: string | null;
  da_trao_thuong: number;
  trao_luc: number | null;
}

/**
 * Lịch sử một chương trình, mới nhất trước.
 *
 * 🔴 Trả về tên RÚT GỌN và số ĐÃ CHE, không phải dữ liệu thô. Màn hình quản trị
 * đặt ở quầy, người đi ngang liếc qua vai là đọc được cả danh bạ khách nếu ta
 * in đầy đủ. Ai thật sự cần số đầy đủ thì đã có bản xuất Excel (5.3) đi qua
 * lớp chắn `/api/xuat`.
 */
export function lichSuLuot(chuongTrinhId: number, gioiHan = 200): DongLichSu[] {
  const dong = csdl()
    .prepare(
      `SELECT l.id, l.bat_dau_luc, l.ma_xac_thuc, l.da_trao_thuong, l.trao_luc,
              n.ho_ten, n.so_dien_thoai,
              o.ten AS o_ten, o.mau AS o_mau
         FROM luot_quay l
         LEFT JOIN nguoi_choi n ON n.id = l.nguoi_choi_id
         LEFT JOIN o_qua      o ON o.id = l.o_qua_id
        WHERE l.chuong_trinh_id = ?
        ORDER BY l.id DESC
        LIMIT ?`,
    )
    .all(chuongTrinhId, gioiHan) as unknown as Dong[];

  return dong.map((d) => ({
    id: d.id,
    luc: d.bat_dau_luc,
    tenRutGon: d.ho_ten ? tenRutGon(d.ho_ten) : "—",
    sdtChe: d.so_dien_thoai ? cheSdt(d.so_dien_thoai) : "—",
    oTen: d.o_ten,
    oMau: d.o_mau,
    maXacThuc: d.ma_xac_thuc,
    daTraoThuong: d.da_trao_thuong === 1,
    traoLuc: d.trao_luc,
  }));
}

export function demLuot(chuongTrinhId: number): number {
  const d = csdl()
    .prepare("SELECT COUNT(*) AS n FROM luot_quay WHERE chuong_trinh_id = ?")
    .get(chuongTrinhId) as { n: number } | undefined;
  return d?.n ?? 0;
}

/**
 * Tích / bỏ tích "đã trao thưởng".
 *
 * Cho phép BỎ tích vì người ở quầy tích nhầm dòng là chuyện sẽ xảy ra, và khoá
 * cứng lại thì họ không có đường sửa ngoài việc gọi người biết SQL.
 */
export function danhDauDaTrao(luotId: number, daTrao: boolean): boolean {
  const soDong = csdl()
    .prepare("UPDATE luot_quay SET da_trao_thuong = ?, trao_luc = ? WHERE id = ?")
    .run(daTrao ? 1 : 0, daTrao ? Date.now() : null, luotId).changes;
  return Number(soDong) > 0;
}

/** Một lượt cụ thể — dùng cho trang dựng lại ván (5.2). */
export function timLuot(luotId: number): {
  id: number;
  chuongTrinhId: number;
  hatGiong: string;
  gocDung: number;
  phienBanO: number;
  oQuaId: number | null;
  /**
   * Ảnh chụp mặt vòng LÚC QUAY. `null` với lượt ghi trước khi có cột này —
   * nơi gọi phải nói thẳng ra là không dựng lại được, đừng vẽ đại vòng hiện tại
   * rồi để người xem tưởng đó là vòng cũ.
   */
  cung: Cung[] | null;
  luc: number;
} | null {
  const d = csdl()
    .prepare(
      `SELECT id, chuong_trinh_id, hat_giong, goc_dung, phien_ban_o, o_qua_id,
              cung_json, bat_dau_luc
         FROM luot_quay WHERE id = ?`,
    )
    .get(luotId) as
    | {
        id: number;
        chuong_trinh_id: number;
        hat_giong: string;
        goc_dung: number;
        phien_ban_o: number;
        o_qua_id: number | null;
        cung_json: string | null;
        bat_dau_luc: number;
      }
    | undefined;

  // `.get()` trả `undefined` khi không có dòng, KHÔNG phải `null`.
  if (d == null) return null;
  return {
    id: d.id,
    chuongTrinhId: d.chuong_trinh_id,
    hatGiong: d.hat_giong,
    gocDung: d.goc_dung,
    phienBanO: d.phien_ban_o,
    oQuaId: d.o_qua_id,
    cung: docCung(d.cung_json),
    luc: d.bat_dau_luc,
  };
}

/**
 * Đọc ảnh chụp mặt vòng. Hỏng định dạng thì trả `null` chứ KHÔNG ném: một dòng
 * lỗi trong sổ không được phép làm sập cả trang lịch sử của những lượt khác.
 */
function docCung(tho: string | null): Cung[] | null {
  if (!tho) return null;
  try {
    const c = JSON.parse(tho) as Cung[];
    return Array.isArray(c) && c.length > 0 ? c : null;
  } catch {
    return null;
  }
}
