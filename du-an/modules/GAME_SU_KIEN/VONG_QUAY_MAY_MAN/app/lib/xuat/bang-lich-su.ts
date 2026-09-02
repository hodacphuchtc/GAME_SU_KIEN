import "server-only";

import { T } from "@/config/locale";
import { csdl } from "@/lib/db/ket-noi";
import { chu, gio, type TrangTinh } from "@/lib/xuat/xlsx";

/**
 * LỊCH SỬ LƯỢT QUAY ĐẦY ĐỦ — bản DUY NHẤT được phép mang họ tên và số điện
 * thoại KHÔNG che.
 *
 * 🔴 Vì sao có truy vấn riêng ở đây thay vì gọi `lichSuLuot`: hàm kia CỐ Ý trả
 * tên rút gọn + số đã che, vì màn quản trị đặt ở quầy và người đi ngang liếc
 * qua vai là đọc được cả danh bạ khách. File này thì khác — nó đi qua lớp chắn
 * 401 của `proxy.ts`, người tải phải đăng nhập, và nó là căn cứ ĐỐI SOÁT khi
 * phụ huynh cầm mã xác thực tới đòi quà. Che ở đây là làm hỏng đúng công dụng
 * của nó. Hai chỗ, hai luật — đừng gộp.
 *
 * Hệ quả phải nhớ: tệp này rời khỏi hệ thống và nằm trong máy của người tải.
 * Đó là lý do cột "Đồng ý nhận tư vấn" LUÔN đi kèm — người cầm file phải biết
 * được phép gọi cho ai, không thì căn cứ hợp pháp ở lại trong CSDL còn số điện
 * thoại thì đi ra ngoài một mình.
 */
export interface DongXuat {
  luc: number;
  hoTen: string | null;
  soDienThoai: string | null;
  oTen: string | null;
  maXacThuc: string | null;
  daTraoThuong: boolean;
  dongYTuVan: boolean;
  hatGiong: string;
}

interface Dong {
  bat_dau_luc: number;
  ho_ten: string | null;
  so_dien_thoai: string | null;
  o_ten: string | null;
  ma_xac_thuc: string | null;
  da_trao_thuong: number;
  dong_y_tu_van: number | null;
  hat_giong: string;
}

/**
 * TOÀN BỘ lượt của một chương trình, CŨ TRƯỚC MỚI SAU.
 *
 * Ngược thứ tự với màn hình (mới nhất trên cùng) và đó là chủ ý: bảng tính đọc
 * theo dòng thời gian, còn màn hình trực quầy cần thấy lượt vừa xảy ra.
 *
 * KHÔNG có `LIMIT`: bản xuất mà cắt bớt dòng thì nó không còn là sổ đối soát,
 * và không có gì trên màn hình báo cho người tải biết là họ đang cầm bản thiếu.
 */
export function toanBoLichSu(chuongTrinhId: number): DongXuat[] {
  const dong = csdl()
    .prepare(
      `SELECT l.bat_dau_luc, l.ma_xac_thuc, l.da_trao_thuong, l.hat_giong,
              n.ho_ten, n.so_dien_thoai, n.dong_y_tu_van,
              o.ten AS o_ten
         FROM luot_quay l
         LEFT JOIN nguoi_choi n ON n.id = l.nguoi_choi_id
         LEFT JOIN o_qua      o ON o.id = l.o_qua_id
        WHERE l.chuong_trinh_id = ?
        ORDER BY l.id ASC`,
    )
    .all(chuongTrinhId) as unknown as Dong[];

  return dong.map((d) => ({
    luc: d.bat_dau_luc,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    oTen: d.o_ten,
    maXacThuc: d.ma_xac_thuc,
    daTraoThuong: d.da_trao_thuong === 1,
    dongYTuVan: d.dong_y_tu_van === 1,
    hatGiong: d.hat_giong,
  }));
}

/**
 * Lịch sử → trang tính.
 *
 * 🔴 Số điện thoại đi qua `chu()` chứ KHÔNG phải `so()`. Excel đọc số sẽ ăn mất
 * số 0 đầu và `0912345678` thành `912345678` — đội sale nhận file về không gọi
 * được cho ai. Lỗi có thật, không phải giả định.
 *
 * 🔴 Hạt giống cũng là `chu()`: nó là 32 ký tự hex, để `so()` thì Excel đọc
 * `12e5...` thành ký hiệu khoa học và bằng chứng dựng lại ván tan mất.
 */
export function bangLichSu(ten: string, dong: readonly DongXuat[]): TrangTinh {
  return {
    ten,
    tieuDe: [
      T.xuatCotGio,
      T.xuatCotHoTen,
      T.xuatCotSdt,
      T.xuatCotO,
      T.xuatCotMa,
      T.xuatCotTrao,
      T.xuatCotTuVan,
      T.xuatCotHatGiong,
    ],
    dong: dong.map((d) => [
      gio(d.luc),
      chu(d.hoTen),
      chu(d.soDienThoai),
      chu(d.oTen),
      chu(d.maXacThuc),
      chu(d.daTraoThuong ? T.xuatCoDau : ""),
      chu(d.dongYTuVan ? T.xuatDongY : T.xuatKhongDongY),
      chu(d.hatGiong),
    ]),
  };
}
