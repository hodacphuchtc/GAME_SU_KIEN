import "server-only";

import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import type { Cung } from "@/lib/vong-quay/chia-o";

/**
 * SỔ LƯỢT QUAY — chứng cứ khi phụ huynh khiếu nại quà, không phải một bảng
 * thống kê cho vui. Mỗi dòng giữ đủ `hat_giong` + `goc_dung` + `phien_ban_o` +
 * ảnh chụp mặt vòng để dựng lại đúng vòng quay của lúc đó.
 */

export interface DongLichSu {
  id: number;
  luc: number;
  hoTen: string | null;
  /**
   * Số điện thoại ĐẦY ĐỦ.
   *
   * 🔴 Đổi 02/09/2026: trước đây hàm này che ngay ở tầng SQL (`tenRutGon` +
   * `sdtChe`). Hai bảng lịch sử của Trúng Số và Chọn Số thì trả thô rồi che ở
   * trình duyệt kèm nút "Hiện đầy đủ". Hai kiểu che khác nhau trên cùng một màn
   * quản trị là bắt nhân viên nhớ hai luật — anh Phúc đã chốt đồng bộ theo hai
   * game kia.
   *
   * ⚠️ Cái GIÁ của quyết định đó, ghi thẳng: số đầy đủ nay nằm trong HTML gửi
   * xuống trình duyệt, ai mở công cụ nhà phát triển là đọc được dù chưa bấm nút.
   * Đây là lớp chống NGƯỜI LIẾC QUA VAI ở quầy, KHÔNG phải chống kẻ tấn công —
   * đúng như `cheSdt` đã ghi. Hàng rào thật vẫn là `phamViCua` ở tầng SQL.
   */
  soDienThoai: string | null;
  dongYTuVan: boolean;
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
  dong_y_tu_van: number | null;
  o_ten: string | null;
  o_mau: string | null;
  ma_xac_thuc: string | null;
  da_trao_thuong: number;
  trao_luc: number | null;
}

/**
 * Lịch sử một chương trình, mới nhất trước.
 *
 * 🔴 TÊN Ô LẤY TỪ ẢNH CHỤP (`l.o_ten`), KHÔNG lấy từ bảng `o_qua` hiện tại.
 * Join thẳng sang danh mục hiện hành là VIẾT LẠI QUÁ KHỨ: ngày ai đó đổi tên
 * "Balo" thành "Balo mini", mọi người trúng từ tháng trước bỗng được ghi là đã
 * nhận "Balo mini" — kể cả trong file Excel dùng đối soát với phụ huynh.
 * `coalesce` sang bảng ô chỉ để cứu những dòng ghi TRƯỚC khi có cột ảnh chụp;
 * dòng mới không bao giờ rơi vào nhánh đó.
 *
 * 🔴 Trả DỮ LIỆU THÔ; việc che là của `components/bang-luot-quay.tsx` (dùng
 * `nhanSdt` như hai bảng kia) để nút "Hiện đầy đủ" chạy được ngay, không phải gọi
 * lại máy chủ. Xem chú thích ở `soDienThoai` về cái giá của lựa chọn này.
 */
export function lichSuLuot(chuongTrinhId: number, gioiHan = 200): DongLichSu[] {
  const dong = layNhieu<Dong>(
    `select l.id, l.bat_dau_luc, l.ma_xac_thuc, l.da_trao_thuong, l.trao_luc,
            n.ho_ten, n.so_dien_thoai, n.dong_y_tu_van,
            coalesce(l.o_ten, o.ten) as o_ten,
            coalesce(l.o_mau, o.mau) as o_mau
       from luot_quay l
       left join nguoi_choi n on n.id = l.nguoi_choi_id
       left join o_qua      o on o.id = l.o_qua_id
      where l.chuong_trinh_id = ?
      order by l.id desc
      limit ?`,
    chuongTrinhId,
    gioiHan,
  );

  return dong.map((d) => ({
    id: d.id,
    luc: d.bat_dau_luc,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    dongYTuVan: d.dong_y_tu_van === 1,
    oTen: d.o_ten,
    oMau: d.o_mau,
    maXacThuc: d.ma_xac_thuc,
    daTraoThuong: d.da_trao_thuong === 1,
    traoLuc: d.trao_luc,
  }));
}

export function demLuotQuay(chuongTrinhId: number): number {
  return layMot<{ n: number }>(
    "select count(*) as n from luot_quay where chuong_trinh_id = ?",
    chuongTrinhId,
  )?.n ?? 0;
}

/**
 * Tích / bỏ tích "đã trao thưởng".
 *
 * Cho phép BỎ tích vì người ở quầy tích nhầm dòng là chuyện sẽ xảy ra, và khoá
 * cứng lại thì họ không có đường sửa ngoài việc gọi người biết SQL.
 */
export function danhDauDaTrao(luotId: number, daTrao: boolean): boolean {
  return (
    chay(
      "update luot_quay set da_trao_thuong = ?, trao_luc = ? where id = ?",
      daTrao ? 1 : 0,
      daTrao ? Date.now() : null,
      luotId,
    ) > 0
  );
}

export interface LuotQuayChiTiet {
  id: number;
  chuongTrinhId: number;
  hatGiong: string;
  gocDung: number;
  phienBanO: number;
  oQuaId: number | null;
  /**
   * Ảnh chụp mặt vòng LÚC QUAY. `null` với lượt ghi trước khi có cột này — nơi
   * gọi phải nói THẲNG là không dựng lại được, đừng vẽ đại vòng hiện tại rồi để
   * người xem tưởng đó là vòng cũ.
   */
  cung: Cung[] | null;
  luc: number;
}

/** Một lượt cụ thể — dùng cho trang dựng lại ván. */
export function timLuotQuay(luotId: number): LuotQuayChiTiet | null {
  const d = layMot<{
    id: number;
    chuong_trinh_id: number;
    hat_giong: string;
    goc_dung: number;
    phien_ban_o: number;
    o_qua_id: number | null;
    cung_json: string | null;
    bat_dau_luc: number;
  }>(
    `select id, chuong_trinh_id, hat_giong, goc_dung, phien_ban_o, o_qua_id,
            cung_json, bat_dau_luc
       from luot_quay where id = ?`,
    luotId,
  );

  // 🔴 `layMot` trả `undefined` khi không có dòng, KHÔNG phải `null`.
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

/**
 * TOÀN BỘ lịch sử, KHÔNG che — chỉ dùng cho đường xuất file.
 *
 * 🔴 Tách hẳn khỏi `lichSuLuot`: màn hình quản trị đặt ở quầy nên phải che, còn
 * file Excel thì đội sale cần số đầy đủ để gọi. Một hàm chung có cờ `che?: boolean`
 * là mời người sau quên truyền cờ ở đúng chỗ nguy hiểm.
 *
 * Đường ra vẫn đi qua `/api/xuat` (có chữ ký cookie + lọc phạm vi + ghi nhật ký).
 */
export interface DongXuatQuay {
  luc: number;
  hoTen: string | null;
  soDienThoai: string | null;
  dongYTuVan: boolean;
  oTen: string | null;
  maXacThuc: string | null;
  daTraoThuong: boolean;
  traoLuc: number | null;
}

export function toanBoLichSuQuay(chuongTrinhId: number): DongXuatQuay[] {
  const dong = layNhieu<{
    bat_dau_luc: number;
    ho_ten: string | null;
    so_dien_thoai: string | null;
    dong_y_tu_van: number | null;
    o_ten: string | null;
    ma_xac_thuc: string | null;
    da_trao_thuong: number;
    trao_luc: number | null;
  }>(
    `select l.bat_dau_luc, l.ma_xac_thuc, l.da_trao_thuong, l.trao_luc,
            n.ho_ten, n.so_dien_thoai, n.dong_y_tu_van,
            coalesce(l.o_ten, o.ten) as o_ten
       from luot_quay l
       left join nguoi_choi n on n.id = l.nguoi_choi_id
       left join o_qua      o on o.id = l.o_qua_id
      where l.chuong_trinh_id = ?
      order by l.id`,
    chuongTrinhId,
  );

  return dong.map((d) => ({
    luc: d.bat_dau_luc,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    dongYTuVan: d.dong_y_tu_van === 1,
    oTen: d.o_ten,
    maXacThuc: d.ma_xac_thuc,
    daTraoThuong: d.da_trao_thuong === 1,
    traoLuc: d.trao_luc,
  }));
}
