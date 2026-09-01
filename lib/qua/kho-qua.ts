import "server-only";

import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";
import { chonQua, type LoaiQua } from "@/lib/qua/chon-qua";
import { mucCanhBaoKho, type CanhBaoKho, type MucCanhBao } from "@/lib/qua/canh-bao";
import { HANH_DONG } from "@/lib/nhat-ky/kho";

/**
 * KHO QUÀ — MỌI SQL của bảng `qua_tang` nằm ở đây.
 *
 * 🔴 Số đã trao ĐẾM TỪ `van_choi.qua_tang_id`, KHÔNG lưu bộ đếm riêng. Một bộ
 * đếm lưu sẵn là con số chỉ chờ ngày lệch khỏi sự thật — và ngày nó lệch thì
 * không ai biết bên nào đúng.
 */

export type { LoaiQua } from "@/lib/qua/chon-qua";

interface DongQua {
  id: number;
  chuong_trinh_id: number;
  ten: string;
  thu_tu: number;
  so_luong: number | null;
  tran_moi_ngay: number;
  gia_tri: number | null;
  da_trao: number;
  da_trao_hom_nay: number;
}

export interface QuaTang extends LoaiQua {
  chuongTrinhId: number;
  giaTri: number | null;
}

function doiDong(d: DongQua): QuaTang {
  return {
    id: d.id,
    chuongTrinhId: d.chuong_trinh_id,
    ten: d.ten,
    thuTu: d.thu_tu,
    soLuong: d.so_luong,
    tranMoiNgay: d.tran_moi_ngay,
    giaTri: d.gia_tri,
    daTrao: d.da_trao,
    daTraoHomNay: d.da_trao_hom_nay,
  };
}

/**
 * Danh sách kho kèm TỒN THẬT, tính bằng đúng một câu truy vấn.
 *
 * Đếm trong câu con thay vì vòng lặp ở tầng ứng dụng: kho chỉ vài dòng nên khác
 * biệt tốc độ không đáng kể, nhưng gộp một câu thì con số tồn luôn nhất quán
 * với nhau — đếm lẻ từng loại thì hai loại có thể phản ánh hai thời điểm khác
 * nhau, và tổng cộng lại không khớp.
 */
export function danhSachQua(chuongTrinhId: number, ngay = ngayVietNam()): QuaTang[] {
  return layNhieu<DongQua>(
    `select q.*,
            (select count(*) from van_choi v
              where v.qua_tang_id = q.id) as da_trao,
            (select count(*) from van_choi v
              where v.qua_tang_id = q.id and v.ngay = ?) as da_trao_hom_nay
       from qua_tang q
      where q.chuong_trinh_id = ?
      order by q.thu_tu, q.id`,
    ngay,
    chuongTrinhId,
  ).map(doiDong);
}

export function timQua(id: number): QuaTang | null {
  const d = layNhieu<DongQua>(
    `select q.*,
            (select count(*) from van_choi v where v.qua_tang_id = q.id) as da_trao,
            (select count(*) from van_choi v where v.qua_tang_id = q.id and v.ngay = ?) as da_trao_hom_nay
       from qua_tang q where q.id = ?`,
    ngayVietNam(),
    id,
  ).map(doiDong)[0];
  return d ?? null;
}

export interface DauVaoQua {
  ten: string;
  thuTu: number;
  /** `null` = không giới hạn (loại đáy kho). */
  soLuong: number | null;
  tranMoiNgay: number;
  giaTri: number | null;
}

export function themQua(chuongTrinhId: number, dauVao: DauVaoQua): number {
  const luc = Date.now();
  chay(
    `insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, gia_tri, tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    chuongTrinhId,
    dauVao.ten.trim(),
    dauVao.thuTu,
    dauVao.soLuong,
    dauVao.tranMoiNgay,
    dauVao.giaTri,
    luc,
    luc,
  );
  return layMot<{ id: number }>("select last_insert_rowid() as id")!.id;
}

export function suaQua(id: number, dauVao: DauVaoQua): boolean {
  return (
    chay(
      `update qua_tang
          set ten = ?, thu_tu = ?, so_luong = ?, tran_moi_ngay = ?, gia_tri = ?, sua_luc = ?
        where id = ?`,
      dauVao.ten.trim(),
      dauVao.thuTu,
      dauVao.soLuong,
      dauVao.tranMoiNgay,
      dauVao.giaTri,
      Date.now(),
      id,
    ) > 0
  );
}

/**
 * Xoá một loại quà.
 *
 * 🔴 Từ chối xoá loại ĐÃ TRAO cho ai đó: `van_choi.qua_tang_id` trỏ về đây, và
 * xoá đi thì biên lai cũ mất tên phần quà — đúng lúc có tranh chấp thì không
 * còn gì để đối chiếu. Hết hàng thì đặt số lượng bằng số đã trao, đừng xoá.
 */
export function xoaQua(id: number): { xong: boolean; lyDo?: "da-trao" } {
  const daTrao =
    layMot<{ so: number }>("select count(*) as so from van_choi where qua_tang_id = ?", id)?.so ?? 0;
  if (daTrao > 0) return { xong: false, lyDo: "da-trao" };
  return { xong: chay("delete from qua_tang where id = ?", id) > 0 };
}

/** Thứ tự kế tiếp khi thêm loại mới — nối vào CUỐI kho, không chen lên đầu. */
export function thuTuKeTiep(chuongTrinhId: number): number {
  const d = layMot<{ lon_nhat: number | null }>(
    "select max(thu_tu) as lon_nhat from qua_tang where chuong_trinh_id = ?",
    chuongTrinhId,
  );
  return (d?.lon_nhat ?? -1) + 1;
}

/**
 * Bốc phần quà cho một ván VỪA TRÚNG và ghi thẳng vào ván.
 *
 * 🔴 Đọc kho và ghi kết quả phải nằm TRONG CÙNG một giao dịch. Tách ra thì hai
 * người trúng sát nhau cùng đọc thấy "còn 1 cái" và cùng nhận cái cuối cùng —
 * quầy hứa hai phần quà mà trong tay chỉ có một.
 */
/** Mức cảnh báo kho của một chương trình, đọc từ tồn thật. */
export function canhBaoKho(chuongTrinhId: number): CanhBaoKho {
  return mucCanhBaoKho(danhSachQua(chuongTrinhId));
}

/**
 * Ghi MỘT dòng nhật ký khi kho chạm một ngưỡng mới.
 *
 * 🔴 Mỗi ngưỡng mỗi ngày ĐÚNG MỘT lần. Ghi mỗi lượt thì nhật ký thành rác trong
 * một buổi chiều, và cái nhật ký không ai đọc nổi thì bằng không có.
 *
 * Trả `true` nếu vừa ghi — dùng để test canh được, không phải để nơi gọi rẽ nhánh.
 */
export function ghiNhatKyNguongKho(
  chuongTrinhId: number,
  muc: MucCanhBao,
  ngay = ngayVietNam(),
): boolean {
  if (muc === "xanh") return false;

  const doiTuong = `chuong_trinh:${chuongTrinhId}:${muc}`;
  const daCo = layMot<{ so: number }>(
    `select count(*) as so from nhat_ky_truy_cap
      where hanh_dong = ? and doi_tuong = ? and ngay_ghi = ?`,
    HANH_DONG.canhBaoKho,
    doiTuong,
    ngay,
  );
  if ((daCo?.so ?? 0) > 0) return false;

  // Ngày ghi truyền tường minh: hàm này nhận `ngay` để bài test dựng được
  // "hôm qua" và "hôm nay" mà không phải đổi đồng hồ hệ thống.
  chay(
    `insert into nhat_ky_truy_cap (hanh_dong, doi_tuong, ngay_ghi, luc)
     values (?, ?, ?, ?)`,
    HANH_DONG.canhBaoKho,
    doiTuong,
    ngay,
    Date.now(),
  );
  return true;
}

export function bocQuaChoVan(vanId: number, chuongTrinhId: number): QuaTang | null {
  const kho = danhSachQua(chuongTrinhId);
  const chon = chonQua(kho);
  if (!chon) return null;

  // `where qua_tang_id is null` là trọng tài: ván đã được gán quà rồi thì câu
  // này đổi 0 dòng và không ai lấy thêm phần thứ hai.
  const doi = chay(
    "update van_choi set qua_tang_id = ?, sua_luc = ? where id = ? and qua_tang_id is null",
    chon.id,
    Date.now(),
    vanId,
  );
  if (doi === 0) return null;

  // Đánh giá kho SAU khi đã trừ đi phần vừa bốc — đó mới là cái kho mà người
  // tiếp theo nhìn thấy.
  ghiNhatKyNguongKho(chuongTrinhId, mucCanhBaoKho(danhSachQua(chuongTrinhId)).muc);

  return timQua(chon.id) ?? null;
}
