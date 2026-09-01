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

export function danhSachCoSo(): CoSo[] {
  return layNhieu<DongCoSo>(`select * from co_so ${SAP_THEO_SO}`).map(doiDong);
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
