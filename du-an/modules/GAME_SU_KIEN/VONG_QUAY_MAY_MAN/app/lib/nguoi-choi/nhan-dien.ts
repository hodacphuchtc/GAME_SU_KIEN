import "server-only";

import { csdl } from "@/lib/db/ket-noi";
import { ngayVN } from "@/lib/thoi-gian";
import { LUOT_MOI_NGUOI_MOI_NGAY } from "@/config/vong-quay";
import { chuanHoaSdt } from "./so-dien-thoai";

/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/lib/nguoi-choi/nhan-dien.ts` @ 3d96358.
 * ĐÃ SỬA: dùng thẳng `csdl()` (app này không có lớp `truy-van.ts`), bỏ cột
 * `quan_tam_hoc_thu` (lược đồ Vòng Quay không có), thêm phần giới hạn lượt.
 */

/**
 * Nhận diện phụ huynh bằng Họ tên + Số điện thoại.
 *
 * MỘT số điện thoại = MỘT hồ sơ. Gặp lại số cũ thì gắn vào đúng hồ sơ đó chứ
 * không đẻ bản sao — nếu không thì lịch sử tra soát vô dụng và giới hạn lượt
 * chơi bị lách chỉ bằng cách gõ tên khác.
 */

export interface NguoiChoi {
  id: number;
  hoTen: string;
  soDienThoai: string;
  dongYTuVan: boolean;
}

export interface KetQuaNhanDien {
  nguoiChoi?: NguoiChoi;
  loi?: string;
}

/** Chỉ khai đúng những cột câu SELECT ở dưới thật sự lấy lên. */
interface Dong {
  id: number;
  ho_ten: string;
  so_dien_thoai: string;
  dong_y_tu_van: number;
}

export function nhanDien(
  hoTenTho: string,
  sdtTho: string,
  dongYTuVan: boolean,
): KetQuaNhanDien {
  const hoTen = hoTenTho.trim().replace(/\s+/g, " ").slice(0, 60);
  if (hoTen.length < 2) return { loi: "Bạn điền giúp họ tên nhé." };

  const sdt = chuanHoaSdt(sdtTho);
  if (sdt === null) return { loi: "Số điện thoại chưa đúng. Ví dụ: 0912345678." };

  const luc = Date.now();
  const db = csdl();
  // 🔴 `.get()` trả `undefined` khi không có dòng, KHÔNG phải `null`. So `!== null`
  // ở đây làm mọi số điện thoại trông như đã có hồ sơ. Dùng `!= null`.
  const cu = db
    .prepare("SELECT id, ho_ten, so_dien_thoai, dong_y_tu_van FROM nguoi_choi WHERE so_dien_thoai = ?")
    .get(sdt) as Dong | undefined;

  if (cu != null) {
    // Cập nhật tên mới nhất; cờ đồng ý chỉ BẬT thêm, không tự tắt cái đã đồng ý.
    db.prepare(
      `UPDATE nguoi_choi
          SET ho_ten = ?, dong_y_tu_van = max(dong_y_tu_van, ?), sua_luc = ?
        WHERE id = ?`,
    ).run(hoTen, dongYTuVan ? 1 : 0, luc, cu.id);
    return { nguoiChoi: { id: cu.id, hoTen, soDienThoai: sdt, dongYTuVan: dongYTuVan || cu.dong_y_tu_van === 1 } };
  }

  const kq = db
    .prepare(
      `INSERT INTO nguoi_choi (so_dien_thoai, ho_ten, dong_y_tu_van, tao_luc, sua_luc)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(sdt, hoTen, dongYTuVan ? 1 : 0, luc, luc);

  return {
    nguoiChoi: { id: Number(kq.lastInsertRowid), hoTen, soDienThoai: sdt, dongYTuVan },
  };
}

/** Đếm số lượt người này đã quay trong ngày, ở ĐÚNG chương trình này. */
export function soLuotTrongNgay(
  chuongTrinhId: number,
  nguoiChoiId: number,
  ngay = ngayVN(),
): number {
  const d = csdl()
    .prepare(
      `SELECT COUNT(*) AS n FROM luot_quay
        WHERE chuong_trinh_id = ? AND nguoi_choi_id = ? AND ngay = ?`,
    )
    .get(chuongTrinhId, nguoiChoiId, ngay) as { n: number } | undefined;
  return d?.n ?? 0;
}

/**
 * Người này còn được quay hôm nay không.
 *
 * 🔴 Đếm theo TỪNG chương trình, không đếm toàn hệ thống: hai cơ sở khác nhau
 * là hai chương trình khác nhau, và một phụ huynh đưa con tới cả hai cơ sở thì
 * họ có quyền chơi ở cả hai. Đếm gộp là phạt oan đúng người đi lại nhiều nhất.
 */
export function conLuotHomNay(
  chuongTrinhId: number,
  nguoiChoiId: number,
  ngay = ngayVN(),
): boolean {
  return soLuotTrongNgay(chuongTrinhId, nguoiChoiId, ngay) < LUOT_MOI_NGUOI_MOI_NGAY;
}
