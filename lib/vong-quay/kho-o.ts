import "server-only";

import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";
import type { OQua } from "@/lib/vong-quay/chia-o";

/**
 * MỌI câu SQL của bảng `o_qua` nằm trong đúng file này — đổi cơ sở dữ liệu về
 * sau chỉ phải sửa MỘT tầng, và câu hỏi "chỗ nào ghi vào bảng ô quà" có đúng
 * một câu trả lời.
 *
 * 🔴 KHÔNG có mệnh đề lọc phạm vi/game ở đây, và đó là ĐÚNG: `o_qua` treo dưới
 * `chuong_trinh_id`, mà mọi nơi gọi đã phải lấy `chuongTrinhId` từ
 * `timTheoMaVongQuay(ma, phamVi)` — nơi phạm vi và game đã được lọc rồi. Lọc
 * hai lần ở hai tầng là mời người sau tin nhầm rằng chỉ cần một trong hai.
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
 * 🔴 `da_trao` ĐẾM TỪ `luot_quay`, không lưu sẵn một bộ đếm. Bộ đếm lưu sẵn là
 * con số chỉ chờ ngày lệch khỏi sự thật — và khi nó lệch thì kho báo còn hàng
 * trong lúc trên kệ đã hết.
 */
export function danhSachO(chuongTrinhId: number, ngay = ngayVietNam()): OQua[] {
  const dong = layNhieu<DongO>(
    `select o.id, o.ten, o.thu_tu, o.so_luong, o.tran_moi_ngay, o.mau,
            (select count(*) from luot_quay l where l.o_qua_id = o.id) as da_trao,
            (select count(*) from luot_quay l where l.o_qua_id = o.id and l.ngay = ?) as da_trao_hom_nay
       from o_qua o
      where o.chuong_trinh_id = ?
      order by o.thu_tu, o.id`,
    ngay,
    chuongTrinhId,
  );

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
  const dong = layMot<{ phien_ban_o: number }>(
    "select phien_ban_o from chuong_trinh where id = ?",
    chuongTrinhId,
  );
  // 🔴 `layMot` trả `undefined` khi không có dòng, KHÔNG phải `null` — so
  // `!== null` ở đây là luôn TRUE. Đã trả giá thật, xem CLAUDE.md.
  if (dong == null) throw new Error(`Không có chương trình id=${chuongTrinhId}`);
  return dong.phien_ban_o;
}

/**
 * 🔴 Tăng phiên bản cấu hình ô.
 *
 * Gọi sau MỌI thay đổi danh sách ô. Không tăng thì lượt quay cũ và lượt mới
 * cùng mang một số phiên bản trong khi mặt vòng đã khác — và nút "Dựng lại ván"
 * vẽ ra một vòng quay CHƯA TỪNG TỒN TẠI, đúng thứ nó sinh ra để bác bỏ.
 */
export function tangPhienBanO(chuongTrinhId: number): number {
  chay(
    "update chuong_trinh set phien_ban_o = phien_ban_o + 1, sua_luc = ? where id = ?",
    Date.now(),
    chuongTrinhId,
  );
  return phienBanO(chuongTrinhId);
}

export interface OMoi {
  ten: string;
  thuTu: number;
  /** `null` = Ô ĐÁY, không giới hạn. Vòng luôn phải có ít nhất một ô đáy. */
  soLuong: number | null;
  tranMoiNgay?: number;
  mau: string;
}

/** Thêm một ô. Tăng phiên bản vì mặt vòng vừa đổi. */
export function themO(chuongTrinhId: number, o: OMoi): number {
  const luc = Date.now();
  chay(
    `insert into o_qua (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, mau,
                        phien_ban, tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    chuongTrinhId,
    o.ten,
    o.thuTu,
    o.soLuong,
    o.tranMoiNgay ?? 0,
    o.mau,
    phienBanO(chuongTrinhId) + 1,
    luc,
    luc,
  );
  const id = layMot<{ id: number }>("select last_insert_rowid() as id")!.id;
  tangPhienBanO(chuongTrinhId);
  return id;
}

/** Sửa một ô. Tăng phiên bản vì mặt vòng vừa đổi. */
export function suaO(chuongTrinhId: number, oId: number, o: OMoi): boolean {
  const soDong = chay(
    `update o_qua
        set ten = ?, thu_tu = ?, so_luong = ?, tran_moi_ngay = ?, mau = ?, sua_luc = ?
      where id = ? and chuong_trinh_id = ?`,
    o.ten,
    o.thuTu,
    o.soLuong,
    o.tranMoiNgay ?? 0,
    o.mau,
    Date.now(),
    oId,
    chuongTrinhId,
  );
  if (soDong === 0) return false;
  tangPhienBanO(chuongTrinhId);
  return true;
}

/**
 * Xoá một ô.
 *
 * 🔴 Chỉ xoá được ô CHƯA từng trao cái nào. Ô đã trao là dấu vết đối soát khi
 * phụ huynh khiếu nại — xoá nó là cắt mất chứng cứ. Ô không dùng nữa thì đặt
 * `so_luong` bằng số đã trao: nó tự biến khỏi vòng mà lịch sử vẫn còn nguyên.
 */
export function xoaO(chuongTrinhId: number, oId: number): boolean {
  const daTrao = layMot<{ n: number }>(
    "select count(*) as n from luot_quay where o_qua_id = ?",
    oId,
  );
  if ((daTrao?.n ?? 0) > 0) return false;
  const soDong = chay("delete from o_qua where id = ? and chuong_trinh_id = ?", oId, chuongTrinhId);
  if (soDong === 0) return false;
  tangPhienBanO(chuongTrinhId);
  return true;
}

/** Kho có ít nhất một ô ĐÁY không — thiếu nó thì hết quà là hết trò. */
export function coODay(dsO: readonly OQua[]): boolean {
  return dsO.some((o) => o.soLuong === null);
}
