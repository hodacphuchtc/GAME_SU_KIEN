import "server-only";

import { csdl } from "@/lib/db/ket-noi";
import { ngayVN } from "@/lib/thoi-gian";
import type { OQua } from "@/lib/vong-quay/chia-o";

/**
 * MỌI câu SQL của bảng `o_qua` nằm trong đúng file này.
 *
 * Đây là thứ khiến đổi cơ sở dữ liệu về sau chỉ phải sửa MỘT tầng — và khiến
 * câu hỏi "chỗ nào ghi vào bảng ô quà" có đúng một câu trả lời.
 */

interface DongO {
  id: number;
  ten: string;
  thu_tu: number;
  so_luong: number | null;
  tran_moi_ngay: number;
  mau: string;
  da_trao: number;
  da_trao_hom_nay: number;
}

/**
 * Danh sách ô của một chương trình, kèm số đã trao.
 *
 * 🔴 `da_trao` ĐẾM TỪ `luot_quay`, không lưu sẵn một bộ đếm. Một bộ đếm lưu sẵn
 * là con số chỉ chờ ngày lệch khỏi sự thật — và khi nó lệch thì kho báo còn
 * hàng trong lúc trên kệ đã hết.
 */
export function danhSachO(chuongTrinhId: number, ngay = ngayVN()): OQua[] {
  const dong = csdl()
    .prepare(
      `SELECT o.id, o.ten, o.thu_tu, o.so_luong, o.tran_moi_ngay, o.mau,
              (SELECT COUNT(*) FROM luot_quay l
                WHERE l.o_qua_id = o.id) AS da_trao,
              (SELECT COUNT(*) FROM luot_quay l
                WHERE l.o_qua_id = o.id AND l.ngay = ?) AS da_trao_hom_nay
         FROM o_qua o
        WHERE o.chuong_trinh_id = ?
        ORDER BY o.thu_tu, o.id`,
    )
    .all(ngay, chuongTrinhId) as unknown as DongO[];

  return dong.map((d) => ({
    id: d.id,
    ten: d.ten,
    thuTu: d.thu_tu,
    soLuong: d.so_luong,
    daTrao: d.da_trao,
    tranMoiNgay: d.tran_moi_ngay,
    daTraoHomNay: d.da_trao_hom_nay,
    mau: d.mau,
  }));
}

/** Phiên bản cấu hình ô đang hiện hành của một chương trình. */
export function phienBanO(chuongTrinhId: number): number {
  const dong = csdl()
    .prepare("SELECT phien_ban_o FROM chuong_trinh WHERE id = ?")
    .get(chuongTrinhId) as { phien_ban_o: number } | undefined;
  // `get` trả `undefined` khi không có dòng, KHÔNG phải `null` — so `!== null`
  // ở đây là luôn TRUE. Đã trả giá ở app Trúng Số.
  if (dong == null) throw new Error(`Không có chương trình id=${chuongTrinhId}`);
  return dong.phien_ban_o;
}

/**
 * 🔴 Tăng phiên bản cấu hình ô.
 *
 * Gọi sau MỌI thay đổi danh sách ô. Không tăng thì lượt quay cũ và lượt mới
 * cùng mang một số phiên bản trong khi mặt vòng đã khác — và nút "Dựng lại ván"
 * vẽ ra một vòng quay chưa từng tồn tại.
 */
export function tangPhienBanO(chuongTrinhId: number): number {
  const db = csdl();
  db.prepare(
    "UPDATE chuong_trinh SET phien_ban_o = phien_ban_o + 1, sua_luc = ? WHERE id = ?",
  ).run(Date.now(), chuongTrinhId);
  return phienBanO(chuongTrinhId);
}

export interface OMoi {
  ten: string;
  thuTu: number;
  soLuong: number | null;
  tranMoiNgay?: number;
  mau: string;
}

/** Thêm một ô. Tăng phiên bản vì mặt vòng vừa đổi. */
export function themO(chuongTrinhId: number, o: OMoi): number {
  const gio = Date.now();
  const db = csdl();
  const kq = db
    .prepare(
      `INSERT INTO o_qua (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, mau,
                          phien_ban, tao_luc, sua_luc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      chuongTrinhId,
      o.ten,
      o.thuTu,
      o.soLuong,
      o.tranMoiNgay ?? 0,
      o.mau,
      phienBanO(chuongTrinhId) + 1,
      gio,
      gio,
    );
  tangPhienBanO(chuongTrinhId);
  return Number(kq.lastInsertRowid);
}

/** Sửa một ô. Tăng phiên bản vì mặt vòng vừa đổi. */
export function suaO(chuongTrinhId: number, oId: number, o: OMoi): void {
  csdl()
    .prepare(
      `UPDATE o_qua
          SET ten = ?, thu_tu = ?, so_luong = ?, tran_moi_ngay = ?, mau = ?, sua_luc = ?
        WHERE id = ? AND chuong_trinh_id = ?`,
    )
    .run(o.ten, o.thuTu, o.soLuong, o.tranMoiNgay ?? 0, o.mau, Date.now(), oId, chuongTrinhId);
  tangPhienBanO(chuongTrinhId);
}

/**
 * Xoá một ô.
 *
 * 🔴 Chỉ xoá được ô CHƯA từng trao cái nào. Ô đã trao là dấu vết đối soát khi
 * phụ huynh khiếu nại — xoá nó là cắt mất chứng cứ. Ô không dùng nữa thì đặt
 * `so_luong` bằng số đã trao, nó tự biến khỏi vòng mà lịch sử vẫn còn.
 */
export function xoaO(chuongTrinhId: number, oId: number): boolean {
  const db = csdl();
  const daTrao = db
    .prepare("SELECT COUNT(*) AS n FROM luot_quay WHERE o_qua_id = ?")
    .get(oId) as { n: number };
  if (daTrao.n > 0) return false;
  db.prepare("DELETE FROM o_qua WHERE id = ? AND chuong_trinh_id = ?").run(oId, chuongTrinhId);
  tangPhienBanO(chuongTrinhId);
  return true;
}

/** Kho có ít nhất một ô ĐÁY không — thiếu nó thì hết quà là hết trò. */
export function coODay(dsO: readonly OQua[]): boolean {
  return dsO.some((o) => o.soLuong === null);
}
