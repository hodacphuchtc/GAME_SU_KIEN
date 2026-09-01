import "server-only";

import { TIEN_TO_CO_SO, TRANG_THAI_CO_SO, type TrangThaiCoSo } from "@/config/to-chuc";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { khoaTenCoSo, maKeTiep, type CoSo } from "@/lib/co-so/nhan";

/**
 * Kho đọc–ghi CƠ SỞ. MỌI câu SQL của bảng `co_so` nằm ở đây.
 *
 * Cơ sở là DANH MỤC DÙNG CHUNG của mọi game trong app (rule 3 của
 * `module-boundaries`): chương trình, khách tiềm năng, nhân viên và về sau là
 * Vòng Quay đều trỏ về đúng bảng này bằng id — không ai được giữ bản sao.
 */

export type { CoSo } from "@/lib/co-so/nhan";
export { nhanCoSo } from "@/lib/co-so/nhan";

interface DongCoSo {
  id: number;
  ma: string;
  ten: string;
  dia_chi: string | null;
  dien_thoai: string | null;
  trang_thai: string;
  tao_luc: number;
}

function doiDong(dong: DongCoSo): CoSo {
  return {
    id: dong.id,
    ma: dong.ma,
    ten: dong.ten,
    diaChi: dong.dia_chi,
    dienThoai: dong.dien_thoai,
    trangThai: dong.trang_thai as TrangThaiCoSo,
    taoLuc: dong.tao_luc,
  };
}

/**
 * Sắp theo SỐ trong mã, không theo chuỗi — so chuỗi thì CS10 chen vào giữa CS1
 * và CS2. Vị trí cắt suy từ độ dài tiền tố ở `config/to-chuc.ts`, không gõ số 3
 * vào đây: đổi tiền tố thành "CSO" là câu này lặng lẽ cắt nhầm một ký tự.
 */
const SAP_THEO_SO = `order by cast(substr(ma, ${TIEN_TO_CO_SO.length + 1}) as integer), id`;

export function danhSachCoSo(hienCaDaAn = false): CoSo[] {
  const loc = hienCaDaAn ? "" : "where trang_thai <> 'da_an' ";
  return layNhieu<DongCoSo>(`select * from co_so ${loc}${SAP_THEO_SO}`).map(doiDong);
}

export interface RangBuocCoSo {
  soLead: number;
  soNhanVien: number;
  soChuongTrinh: number;
  soVan: number;
}

/**
 * Đếm thứ đang níu cơ sở này lại — để hộp xác nhận nói bằng CON SỐ.
 *
 * 🔴 Bốn con số này quyết định xoá hay ẩn, và ngưỡng ở đây CHẶT hơn chương
 * trình vì một lý do đo được trên lược đồ: `khach_tiem_nang.co_so_id` và
 * `nhan_vien.co_so_id` đều là `ON DELETE CASCADE`. Một câu `delete from co_so`
 * là cuốn theo **toàn bộ danh bạ khách và nhân viên** của cơ sở đó — im lặng,
 * không hỏi, không hoàn tác.
 */
export function demRangBuocCoSo(id: number): RangBuocCoSo {
  const d = layMot<{
    so_lead: number;
    so_nhan_vien: number;
    so_chuong_trinh: number;
    so_van: number;
  }>(
    `select (select count(*) from khach_tiem_nang where co_so_id = ?) as so_lead,
            (select count(*) from nhan_vien       where co_so_id = ?) as so_nhan_vien,
            (select count(*) from chuong_trinh    where co_so_id = ?) as so_chuong_trinh,
            (select count(*) from van_choi        where co_so_id = ?) as so_van`,
    id,
    id,
    id,
    id,
  );
  return {
    soLead: d?.so_lead ?? 0,
    soNhanVien: d?.so_nhan_vien ?? 0,
    soChuongTrinh: d?.so_chuong_trinh ?? 0,
    soVan: d?.so_van ?? 0,
  };
}

/**
 * Xoá HẲN. Chỉ gọi khi **cả bốn** con số của `demRangBuocCoSo` bằng 0 — server
 * action là nơi canh, không tin tham số từ máy khách.
 */
export function xoaCoSo(id: number): boolean {
  return chay("delete from co_so where id = ?", id) > 0;
}

/**
 * Ẩn khỏi giao diện, giữ trọn dữ liệu.
 *
 * Khác `datTrangThaiCoSo(id, "tat")` ở chỗ: "tắt" nghĩa là *đừng cho chọn nó khi
 * tạo chương trình mới* nhưng vẫn nằm trong bảng cho ai cần nhìn; "ẩn" là *dọn
 * khỏi mắt hẳn*. Hai mức, vì nhu cầu thật sự có hai: tạm ngừng một quầy khác với
 * dọn một quầy đã đóng cửa từ năm ngoái.
 */
export function anCoSo(id: number): boolean {
  return (
    chay("update co_so set trang_thai = 'da_an', sua_luc = ? where id = ?", Date.now(), id) > 0
  );
}

/** Chỉ cơ sở đang bật — dùng cho mọi ô chọn mà người dùng nhìn thấy. */
export function coSoDangBat(): CoSo[] {
  return layNhieu<DongCoSo>(
    `select * from co_so where trang_thai = 'bat' ${SAP_THEO_SO}`,
  ).map(doiDong);
}

export function timCoSo(id: number): CoSo | null {
  const dong = layMot<DongCoSo>("select * from co_so where id = ?", id);
  return dong ? doiDong(dong) : null;
}

export function timCoSoTheoMa(ma: string): CoSo | null {
  const dong = layMot<DongCoSo>("select * from co_so where ma = ?", ma);
  return dong ? doiDong(dong) : null;
}

/**
 * Có cơ sở nào khác đang mang cái tên này không (so bằng khoá chuẩn hoá).
 *
 * Chặn ở tầng ứng dụng chứ không đặt `UNIQUE(ten)`: ràng buộc của SQLite phân
 * biệt hoa thường lẫn khoảng trắng thừa, nên nó chặn "Cơ sở A" trùng khít mà bỏ
 * lọt "Cơ sở A " — và khi chặn được thì nó ném exception thô vào mặt người dùng
 * thay vì một câu tiếng Việt tử tế.
 */
export function trungTen(ten: string, boQuaId?: number): boolean {
  const khoa = khoaTenCoSo(ten);
  return layNhieu<{ id: number; ten: string }>("select id, ten from co_so").some(
    (d) => d.id !== boQuaId && khoaTenCoSo(d.ten) === khoa,
  );
}

export interface DauVaoCoSo {
  ten: string;
  diaChi?: string | null;
  dienThoai?: string | null;
}

/** Mã kế tiếp theo SỐ LỚN NHẤT đang có + 1 — xoá cơ sở giữa chừng không sinh mã trùng. */
export function maCoSoKeTiep(): string {
  return maKeTiep(layNhieu<{ ma: string }>("select ma from co_so").map((d) => d.ma));
}

export function taoCoSo(dauVao: DauVaoCoSo): CoSo {
  const luc = Date.now();
  const ma = maCoSoKeTiep();
  chay(
    `insert into co_so (ma, ten, dia_chi, dien_thoai, trang_thai, tao_luc, sua_luc)
     values (?, ?, ?, ?, 'bat', ?, ?)`,
    ma,
    dauVao.ten.trim(),
    dauVao.diaChi?.trim() || null,
    dauVao.dienThoai?.trim() || null,
    luc,
    luc,
  );
  return timCoSoTheoMa(ma)!;
}

export function suaCoSo(id: number, dauVao: DauVaoCoSo): boolean {
  return (
    chay(
      "update co_so set ten = ?, dia_chi = ?, dien_thoai = ?, sua_luc = ? where id = ?",
      dauVao.ten.trim(),
      dauVao.diaChi?.trim() || null,
      dauVao.dienThoai?.trim() || null,
      Date.now(),
      id,
    ) > 0
  );
}

/**
 * Nhận TRẠNG THÁI ĐÍCH, không phải "lật" — nhấp đúp thì lật hai lần và người
 * bấm không hiểu vì sao chẳng có gì đổi (cùng lý do với `doiTrangThai` của
 * chương trình).
 *
 * Tắt cơ sở KHÔNG đụng tới chương trình đang chạy tại đó: chương trình đã chép
 * `ten_trung_tam` làm bản chụp lúc tạo, và tắt cơ sở chỉ có nghĩa là "đừng cho
 * chọn nó nữa", không phải "đóng cửa quầy ngay lập tức".
 */
export function datTrangThaiCoSo(id: number, trangThai: TrangThaiCoSo): boolean {
  if (!TRANG_THAI_CO_SO.includes(trangThai)) return false;
  return chay("update co_so set trang_thai = ?, sua_luc = ? where id = ?", trangThai, Date.now(), id) > 0;
}
