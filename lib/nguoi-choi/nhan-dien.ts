import "server-only";

import { chay, layMot } from "@/lib/db/truy-van";
import { chuanHoaSdt } from "./so-dien-thoai";

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
  quanTamHocThu: boolean;
}

export interface KetQuaNhanDien {
  nguoiChoi?: NguoiChoi;
  loi?: string;
}

interface Dong {
  id: number;
  ho_ten: string;
  so_dien_thoai: string;
  dong_y_tu_van: number;
  quan_tam_hoc_thu: number;
}

function doi(d: Dong): NguoiChoi {
  return {
    id: d.id,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    dongYTuVan: d.dong_y_tu_van === 1,
    quanTamHocThu: d.quan_tam_hoc_thu === 1,
  };
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
  const cu = layMot<Dong>("select * from nguoi_choi where so_dien_thoai = ?", sdt);

  if (cu) {
    // Cập nhật tên mới nhất; cờ đồng ý chỉ BẬT thêm, không tự tắt cái đã đồng ý.
    chay(
      `update nguoi_choi
          set ho_ten = ?, dong_y_tu_van = max(dong_y_tu_van, ?), sua_luc = ?
        where id = ?`,
      hoTen,
      dongYTuVan ? 1 : 0,
      luc,
      cu.id,
    );
    const moi = layMot<Dong>("select * from nguoi_choi where id = ?", cu.id)!;
    return { nguoiChoi: doi(moi) };
  }

  chay(
    `insert into nguoi_choi (so_dien_thoai, ho_ten, dong_y_tu_van, tao_luc, sua_luc)
     values (?, ?, ?, ?, ?)`,
    sdt,
    hoTen,
    dongYTuVan ? 1 : 0,
    luc,
    luc,
  );
  const moi = layMot<Dong>("select * from nguoi_choi where so_dien_thoai = ?", sdt)!;
  return { nguoiChoi: doi(moi) };
}

export function danhDauQuanTamHocThu(nguoiChoiId: number): boolean {
  return (
    chay(
      "update nguoi_choi set quan_tam_hoc_thu = 1, sua_luc = ? where id = ?",
      Date.now(),
      nguoiChoiId,
    ) > 0
  );
}

/** Tên rút gọn cho bảng công khai: "Nguyễn Thị Hoa" → "Nguyễn H." */
export function tenRutGon(hoTen: string): string {
  const tu = hoTen.trim().split(/\s+/);
  if (tu.length === 1) return tu[0];
  return `${tu[0]} ${tu[tu.length - 1][0]}.`;
}
