import "server-only";

import { TRANG_THAI_LEAD, type TrangThaiLead, type TroChoi } from "@/config/to-chuc";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { csdl } from "@/lib/db/ket-noi";
import type { PhamVi } from "@/lib/bao-ve/quyen";
import { chiaVong, type SaleDangLam } from "@/lib/lead/chia-luan-phien";

/**
 * KHÁCH TIỀM NĂNG — MỌI SQL của bảng `khach_tiem_nang`.
 *
 * 🔴 Mọi hàm ĐỌC ở đây đều nhận `PhamVi` và nhét nó thẳng vào mệnh đề WHERE.
 * Không có cửa nào đọc "tất cả rồi lọc sau": lọc sau nghĩa là dữ liệu của cơ sở
 * khác đã rời khỏi cơ sở dữ liệu, và chỉ cần một chỗ quên lọc là nó ra tới
 * trình duyệt.
 */

export interface Lead {
  id: number;
  coSoId: number;
  nguoiChoiId: number;
  nhanVienId: number | null;
  hoTen: string;
  soDienThoai: string;
  dongYTuVan: boolean;
  trangThai: TrangThaiLead;
  ghiChu: string | null;
  tenNhanVien: string | null;
  tenCoSo: string | null;
  taoLuc: number;
  suaLuc: number;
  chuaXacThuc: boolean;
  /**
   * Game của chương trình khách chơi LẦN ĐẦU. `null` khi chương trình đó đã bị xoá.
   *
   * 🔴 ĐÂY LÀ GAME ĐẦU TIÊN, KHÔNG PHẢI "các game đã chơi". Upsert của `sinhLead`
   * cố ý không cập nhật `chuong_trinh_id_dau`, nên khách chơi cả ba game vẫn chỉ
   * mang dấu vết game đầu. Nhãn trên giao diện phải nói rõ điều đó — một nhãn mơ hồ
   * ở đây là mời người đọc kết luận sai về khách của chính mình.
   *
   * Muốn biết ĐỦ những game khách đã chơi thì phải tổng hợp từ `van_choi` và
   * `luot_quay` — xem `lib/lead/lich-su-khach.ts`.
   */
  troChoiDau: TroChoi | null;
  /** Tên khách TỪNG khai trước lần đổi gần nhất. `null` = chưa từng đổi. */
  tenTungKhai: string | null;
}

interface DongLead {
  id: number;
  co_so_id: number;
  nguoi_choi_id: number;
  nhan_vien_id: number | null;
  ho_ten: string;
  so_dien_thoai: string;
  dong_y_tu_van: number;
  trang_thai: string;
  ghi_chu: string | null;
  ten_nhan_vien: string | null;
  ten_co_so: string | null;
  tao_luc: number;
  sua_luc: number;
  chua_xac_thuc: number;
  tro_choi_dau: string | null;
  ten_tung_khai: string | null;
}

function doiDong(d: DongLead): Lead {
  return {
    id: d.id,
    coSoId: d.co_so_id,
    nguoiChoiId: d.nguoi_choi_id,
    nhanVienId: d.nhan_vien_id,
    hoTen: d.ho_ten,
    soDienThoai: d.so_dien_thoai,
    dongYTuVan: d.dong_y_tu_van === 1,
    trangThai: d.trang_thai as TrangThaiLead,
    ghiChu: d.ghi_chu,
    tenNhanVien: d.ten_nhan_vien,
    tenCoSo: d.ten_co_so,
    taoLuc: d.tao_luc,
    suaLuc: d.sua_luc,
    chuaXacThuc: d.chua_xac_thuc === 1,
    troChoiDau: (d.tro_choi_dau as TroChoi | null) ?? null,
    tenTungKhai: d.ten_tung_khai,
  };
}

const CAU_CHON = `
  select k.id, k.co_so_id, k.nguoi_choi_id, k.nhan_vien_id, k.trang_thai, k.ghi_chu,
         k.tao_luc, k.sua_luc, k.chua_xac_thuc,
         n.ho_ten, n.so_dien_thoai, n.dong_y_tu_van,
         nv.ho_ten as ten_nhan_vien,
         cs.ten     as ten_co_so,
         ct.tro_choi as tro_choi_dau,
         -- Tên cũ gần nhất, để tab khách hiện một dòng tóm tắt cạnh ô ghi chú của
         -- SALE. Truy vấn con chứ không join: mỗi khách chỉ cần MỘT dòng sổ.
         (select t.gia_tri_cu from nguoi_choi_thay_doi t
           where t.nguoi_choi_id = n.id and t.truong = 'ho_ten'
           order by t.luc desc, t.id desc limit 1) as ten_tung_khai
    from khach_tiem_nang k
    join nguoi_choi n   on n.id  = k.nguoi_choi_id
    left join nhan_vien nv on nv.id = k.nhan_vien_id
    left join co_so cs     on cs.id = k.co_so_id
    -- LEFT join: chuong_trinh_id_dau là ON DELETE SET NULL, và đó là ĐIỀU KIỆN của
    -- tính năng xoá chương trình — khách tiềm năng KHÔNG được mất theo. Dùng join
    -- thường ở đây là làm biến mất chính những khách cũ nhất.
    -- (CẤM ký tự backtick trong chú thích SQL: nó kết thúc sớm chuỗi mẫu này.)
    left join chuong_trinh ct on ct.id = k.chuong_trinh_id_dau`;

/**
 * Các điều kiện của phạm vi, kèm tham số.
 *
 * `tienTo` là bí danh bảng (`"k."` trong câu SELECT có join, chuỗi rỗng trong
 * câu UPDATE). Truyền vào chứ KHÔNG mổ chuỗi SQL sau: mổ chuỗi thì một ngày nào
 * đó ai đó đổi bí danh và mệnh đề lọc lặng lẽ biến mất — mà mệnh đề lọc biến
 * mất chính là rò rỉ toàn bộ danh bạ khách.
 */
function dieuKienPhamVi(pv: PhamVi, tienTo: string): { dieu: string[]; tham: number[] } {
  const dieu: string[] = [];
  const tham: number[] = [];
  if (pv.coSoId !== null) {
    dieu.push(`${tienTo}co_so_id = ?`);
    tham.push(pv.coSoId);
  }
  if (pv.nhanVienId !== null) {
    dieu.push(`${tienTo}nhan_vien_id = ?`);
    tham.push(pv.nhanVienId);
  }
  return { dieu, tham };
}

/** Mệnh đề WHERE cho câu SELECT (bảng mang bí danh `k`). */
function locPhamVi(pv: PhamVi): { sql: string; tham: number[] } {
  const { dieu, tham } = dieuKienPhamVi(pv, "k.");
  return { sql: dieu.length ? ` where ${dieu.join(" and ")}` : "", tham };
}

/** Phần nối thêm vào WHERE của câu UPDATE (không có bí danh). */
function chanPhamVi(pv: PhamVi): { sql: string; tham: number[] } {
  const { dieu, tham } = dieuKienPhamVi(pv, "");
  return { sql: dieu.length ? ` and ${dieu.join(" and ")}` : "", tham };
}

/**
 * Bộ lọc của màn Khách tiềm năng.
 *
 * 🔴 `chiDongY` mặc định BẬT. Gọi điện cho người KHÔNG tick ô đồng ý nhận tư
 * vấn là chuyện của pháp lý, không phải của khẩu vị: căn cứ hợp pháp để gọi
 * nằm ở chính cái tick đó. Muốn xem hết thì phải chủ động bỏ tick — bỏ trong
 * một cú bấm có ý thức, chứ không phải quên bật.
 */
export interface BoLocLead {
  coSoId?: number | null;
  chuongTrinhId?: number | null;
  /**
   * Lọc theo GAME của chương trình khách chơi lần ĐẦU.
   *
   * Khác `chuongTrinhId` (một chương trình cụ thể) — cái này gom cả ba đợt Trúng
   * Số về một nhóm. Đội sale hỏi "khách nào đến từ vòng quay", không hỏi "khách
   * nào đến từ chương trình LWRD".
   */
  troChoi?: TroChoi | null;
  trangThai?: TrangThaiLead | null;
  nhanVienId?: number | null;
  /** Chỉ lấy khách CHƯA giao cho ai. */
  chuaGiao?: boolean;
  /** Ngày ở dạng `YYYY-MM-DD` (giờ Việt Nam), tính theo lúc để lại số. */
  tuNgay?: string | null;
  denNgay?: string | null;
  chiDongY?: boolean;
}

function themDieuKien(loc: BoLocLead): { dieu: string[]; tham: (number | string)[] } {
  const dieu: string[] = [];
  const tham: (number | string)[] = [];

  if (loc.coSoId != null) {
    dieu.push("k.co_so_id = ?");
    tham.push(loc.coSoId);
  }
  if (loc.chuongTrinhId != null) {
    dieu.push("k.chuong_trinh_id_dau = ?");
    tham.push(loc.chuongTrinhId);
  }
  if (loc.troChoi != null) {
    // Giá trị đến từ union kiểu TroChoi, không từ người dùng — nhưng vẫn dùng
    // tham số ràng buộc chứ không nội suy, để không ai bắt chước sai chỗ khác.
    dieu.push("ct.tro_choi = ?");
    tham.push(loc.troChoi);
  }
  if (loc.trangThai != null) {
    dieu.push("k.trang_thai = ?");
    tham.push(loc.trangThai);
  }
  // `chuaGiao` thắng `nhanVienId`: hỏi "chưa giao" mà lại lọc theo một sale cụ
  // thể là hai câu hỏi mâu thuẫn, và trả về rỗng thì người dùng tưởng hỏng.
  if (loc.chuaGiao) {
    dieu.push("k.nhan_vien_id is null");
  } else if (loc.nhanVienId != null) {
    dieu.push("k.nhan_vien_id = ?");
    tham.push(loc.nhanVienId);
  }
  if (loc.tuNgay) {
    dieu.push("k.tao_luc >= ?");
    tham.push(new Date(`${loc.tuNgay}T00:00:00+07:00`).getTime());
  }
  if (loc.denNgay) {
    // Cả NGÀY cuối, không phải 0h của nó: người dùng gõ "đến 30/09" nghĩa là
    // gồm cả ngày 30, và loại mất một ngày là loại mất dữ liệu trong im lặng.
    dieu.push("k.tao_luc < ?");
    tham.push(new Date(`${loc.denNgay}T00:00:00+07:00`).getTime() + 24 * 3600 * 1000);
  }
  if (loc.chiDongY !== false) {
    dieu.push("n.dong_y_tu_van = 1");
  }
  return { dieu, tham };
}

export function danhSachLead(pv: PhamVi, loc: BoLocLead = {}, gioiHan = 500): Lead[] {
  const phamVi = dieuKienPhamVi(pv, "k.");
  const them = themDieuKien(loc);
  const dieu = [...phamVi.dieu, ...them.dieu];
  const noi = dieu.length ? ` where ${dieu.join(" and ")}` : "";

  return layNhieu<DongLead>(
    `${CAU_CHON}${noi} order by k.sua_luc desc, k.id desc limit ?`,
    ...phamVi.tham,
    ...them.tham,
    gioiHan,
  ).map(doiDong);
}

/**
 * Một khách — nhưng CHỈ khi nằm trong phạm vi.
 *
 * 🔴 Đây là cửa chặn "gõ thẳng địa chỉ chi tiết của khách cơ sở khác". Không có
 * nó thì ẩn dòng khỏi danh sách chẳng để làm gì: id là số đếm, đoán được.
 */
export function timLead(id: number, pv: PhamVi): Lead | null {
  const loc = locPhamVi(pv);
  const noi = loc.sql === "" ? " where k.id = ?" : `${loc.sql} and k.id = ?`;
  const d = layMot<DongLead>(`${CAU_CHON}${noi}`, ...loc.tham, id);
  return d ? doiDong(d) : null;
}

export function demLead(pv: PhamVi): number {
  const loc = locPhamVi(pv);
  return (
    layMot<{ so: number }>(
      `select count(*) as so from khach_tiem_nang k${loc.sql}`,
      ...loc.tham,
    )?.so ?? 0
  );
}

/**
 * Sinh khách tiềm năng. Một phụ huynh × một CƠ SỞ = MỘT khách.
 *
 * 🔴 Khách QUAY LẠI chỉ đẩy `sua_luc` lên, KHÔNG đụng `nhan_vien_id`,
 * `trang_thai`, `ghi_chu`. Ghi đè ba cột đó nghĩa là chị Hoa đã "Đã chốt" tuần
 * trước, hôm nay ghé chơi lần nữa thì tụt về "Mới" và bị một sale khác gọi lại
 * từ đầu — mất cả công chăm sóc lẫn thiện cảm của khách.
 *
 * Cùng SĐT chơi ở HAI cơ sở thì thành HAI lead: hai đội sale khác nhau, và gộp
 * lại là hai bên tranh một ô.
 */
export function sinhLead(
  coSoId: number,
  nguoiChoiId: number,
  chuongTrinhId: number | null,
  chuaXacThuc = false,
): void {
  const luc = Date.now();
  chay(
    `insert into khach_tiem_nang
       (co_so_id, nguoi_choi_id, chuong_trinh_id_dau, trang_thai, chua_xac_thuc, tao_luc, sua_luc)
     values (?, ?, ?, 'moi', ?, ?, ?)
     on conflict (co_so_id, nguoi_choi_id)
       do update set sua_luc = excluded.sua_luc`,
    coSoId,
    nguoiChoiId,
    chuongTrinhId,
    chuaXacThuc ? 1 : 0,
    luc,
    luc,
  );
}

/** Gán khách cho một sale. Chỉ đổi được khách NẰM TRONG phạm vi người thao tác. */
export function ganLead(id: number, nhanVienId: number | null, pv: PhamVi): boolean {
  const chan = chanPhamVi(pv);
  return (
    chay(
      `update khach_tiem_nang
          set nhan_vien_id = ?, giao_luc = ?, sua_luc = ?
        where id = ?${chan.sql}`,
      nhanVienId,
      nhanVienId === null ? null : Date.now(),
      Date.now(),
      id,
      ...chan.tham,
    ) > 0
  );
}

export function datTrangThaiLead(id: number, trangThai: TrangThaiLead, pv: PhamVi): boolean {
  if (!TRANG_THAI_LEAD.includes(trangThai)) return false;
  const chan = chanPhamVi(pv);
  return (
    chay(
      `update khach_tiem_nang set trang_thai = ?, sua_luc = ? where id = ?${chan.sql}`,
      trangThai,
      Date.now(),
      id,
      ...chan.tham,
    ) > 0
  );
}

export function ghiChuLead(id: number, ghiChu: string, pv: PhamVi): boolean {
  const chan = chanPhamVi(pv);
  return (
    chay(
      `update khach_tiem_nang set ghi_chu = ?, sua_luc = ? where id = ?${chan.sql}`,
      ghiChu.trim().slice(0, 500) || null,
      Date.now(),
      id,
      ...chan.tham,
    ) > 0
  );
}

/**
 * Sale đang làm việc của một cơ sở, kèm số khách đang giữ.
 *
 * "Đang giữ" KHÔNG tính khách đã `chot` hoặc `bo`: sổ đã đóng thì không còn là
 * việc phải làm, và tính vào tải sẽ khiến người bán giỏi nhất bị phạt vì đã
 * chốt nhiều.
 */
export function saleDangLam(coSoId: number): SaleDangLam[] {
  return layNhieu<{ id: number; so_dang_giu: number }>(
    `select nv.id,
            (select count(*) from khach_tiem_nang k
              where k.nhan_vien_id = nv.id
                and k.trang_thai not in ('chot', 'bo')) as so_dang_giu
       from nhan_vien nv
      where nv.co_so_id = ? and nv.trang_thai = 'dang_lam' and nv.vai_tro in ('sale', 'quan_ly_co_so')
      order by nv.id`,
    coSoId,
  ).map((d) => ({ id: d.id, soDangGiu: d.so_dang_giu }));
}

/** Khách CHƯA GIAO của một cơ sở, cũ nhất trước — khách nguội nhanh nhất gọi trước. */
export function leadChuaGiao(coSoId: number): number[] {
  return layNhieu<{ id: number }>(
    `select id from khach_tiem_nang
      where co_so_id = ? and nhan_vien_id is null and trang_thai not in ('chot', 'bo')
      order by tao_luc, id`,
    coSoId,
  ).map((d) => d.id);
}

export type LyDoKhongChia = "chua-co-sale" | "khong-con-lead";

export interface KetQuaChia {
  daChia: number;
  lyDo?: LyDoKhongChia;
}

/**
 * Chia luân phiên khách chưa giao của MỘT cơ sở.
 *
 * 🔴 Toàn bộ trong MỘT giao dịch. Chia nửa chừng rồi hỏng thì một số khách có
 * chủ, một số không, và bấm lại lần nữa sẽ chia tiếp trên một cái tải đã lệch.
 *
 * 🔴 Chỉ đụng vào khách `nhan_vien_id IS NULL`: hai dòng quản lý vừa giao tay
 * cho đúng người không được phép bị nút này cướp lại.
 */
export function chiaLuanPhien(coSoId: number): KetQuaChia {
  const sale = saleDangLam(coSoId);
  if (sale.length === 0) return { daChia: 0, lyDo: "chua-co-sale" };

  const chuaGiao = leadChuaGiao(coSoId);
  if (chuaGiao.length === 0) return { daChia: 0, lyDo: "khong-con-lead" };

  const cap = chiaVong(sale, chuaGiao);
  const db = csdl();
  db.exec("begin immediate");
  try {
    const luc = Date.now();
    for (const c of cap) {
      chay(
        `update khach_tiem_nang
            set nhan_vien_id = ?, giao_luc = ?, sua_luc = ?
          where id = ? and nhan_vien_id is null`,
        c.nhanVienId,
        luc,
        luc,
        c.leadId,
      );
    }
    db.exec("commit");
  } catch (loi) {
    db.exec("rollback");
    throw loi;
  }
  return { daChia: cap.length };
}
