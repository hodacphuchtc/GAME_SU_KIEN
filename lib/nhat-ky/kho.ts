import "server-only";

import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";

/**
 * NHẬT KÝ TRUY CẬP — ai đã xem/xuất dữ liệu cá nhân của phụ huynh, lúc nào.
 *
 * Vì sao cần: từ GĐ 16 hệ thống giữ danh bạ khách hàng thật. Nghị định 13/2023
 * đòi biết được ai đã chạm vào dữ liệu ấy, và quan trọng hơn — khi có chuyện,
 * đây là thứ duy nhất trả lời được câu "danh sách đó ra ngoài bằng đường nào".
 */

export const HANH_DONG = {
  dangNhap: "dang_nhap",
  xemLead: "xem_lead",
  xuatFile: "xuat_file",
  ganLead: "gan_lead",
  xoaTheoSdt: "xoa_theo_sdt",
  canhBaoKho: "canh_bao_kho",
} as const;

export type HanhDong = (typeof HANH_DONG)[keyof typeof HANH_DONG];

export interface DongNhatKy {
  id: number;
  nhanVienId: number | null;
  tenNhanVien: string | null;
  hanhDong: string;
  doiTuong: string | null;
  soDong: number | null;
  diaChiIp: string | null;
  luc: number;
}

interface DongTho {
  id: number;
  nhan_vien_id: number | null;
  ten_nhan_vien: string | null;
  hanh_dong: string;
  doi_tuong: string | null;
  so_dong: number | null;
  dia_chi_ip: string | null;
  luc: number;
}

export interface DauVaoGhi {
  nhanVienId: number | null;
  hanhDong: HanhDong;
  doiTuong?: string | null;
  soDong?: number | null;
  diaChiIp?: string | null;
}

export function ghiNhatKy(dauVao: DauVaoGhi): void {
  chay(
    `insert into nhat_ky_truy_cap (nhan_vien_id, hanh_dong, doi_tuong, so_dong, dia_chi_ip, ngay_ghi, luc)
     values (?, ?, ?, ?, ?, ?, ?)`,
    dauVao.nhanVienId,
    dauVao.hanhDong,
    dauVao.doiTuong ?? null,
    dauVao.soDong ?? null,
    dauVao.diaChiIp ?? null,
    ngayVietNam(),
    Date.now(),
  );
}

/**
 * Đọc nhật ký, MỚI NHẤT TRƯỚC.
 *
 * 🔴 Sắp theo `luc desc, id desc` chứ không chỉ `luc`: hai hành động trong cùng
 * một mili-giây (đăng nhập rồi vào ngay danh sách khách — chuyện thường) sẽ có
 * `luc` bằng nhau, và SQLite lúc đó trả về theo thứ tự nào cũng được. Người đọc
 * nhật ký để dựng lại trình tự sự việc, nên trình tự không được phép tuỳ hứng.
 */
export function docNhatKy(gioiHan = 300): DongNhatKy[] {
  return layNhieu<DongTho>(
    `select k.*, nv.ho_ten as ten_nhan_vien
       from nhat_ky_truy_cap k
       left join nhan_vien nv on nv.id = k.nhan_vien_id
      order by k.luc desc, k.id desc
      limit ?`,
    gioiHan,
  ).map((d) => ({
    id: d.id,
    nhanVienId: d.nhan_vien_id,
    tenNhanVien: d.ten_nhan_vien,
    hanhDong: d.hanh_dong,
    doiTuong: d.doi_tuong,
    soDong: d.so_dong,
    diaChiIp: d.dia_chi_ip,
    luc: d.luc,
  }));
}

export interface KetQuaXoa {
  nguoiChoi: number;
  khachTiemNang: number;
}

/**
 * XOÁ SẠCH theo số điện thoại — quyền được xoá dữ liệu của người dùng (NĐ 13/2023).
 *
 * 🔴 Xoá ở CẢ HAI bảng và trong CÙNG một giao dịch. `khach_tiem_nang` có khoá
 * ngoại `ON DELETE CASCADE` về `nguoi_choi`, nhưng đếm trước rồi xoá để trả về
 * con số thật cho người bấm nút — "đã xoá" mà không nói xoá mấy dòng thì không
 * ai dám tin là nó xoá hết.
 *
 * `van_choi.nguoi_choi_id` chỉ là tham chiếu thường (không CASCADE): lịch sử
 * ván chơi GIỮ LẠI nhưng thành ẩn danh. Xoá luôn cả ván là xoá sổ đối soát giải
 * thưởng đã trao — hai thứ khác nhau, và luật chỉ đòi thứ nhất.
 */
export function xoaTheoSdt(sdt: string): KetQuaXoa {
  const nguoi = layMot<{ id: number }>(
    "select id from nguoi_choi where so_dien_thoai = ?",
    sdt,
  );
  if (!nguoi) return { nguoiChoi: 0, khachTiemNang: 0 };

  const soLead =
    layMot<{ so: number }>(
      "select count(*) as so from khach_tiem_nang where nguoi_choi_id = ?",
      nguoi.id,
    )?.so ?? 0;

  chay("update van_choi set nguoi_choi_id = null where nguoi_choi_id = ?", nguoi.id);
  chay("update luot_choi set nguoi_choi_id = null where nguoi_choi_id = ?", nguoi.id);
  chay("delete from khach_tiem_nang where nguoi_choi_id = ?", nguoi.id);
  const soNguoi = chay("delete from nguoi_choi where id = ?", nguoi.id);

  return { nguoiChoi: soNguoi, khachTiemNang: soLead };
}

/**
 * Khách quá hạn lưu trữ — chưa xoá, chỉ ĐẾM để màn quản trị nói cho người ta biết.
 *
 * Cố ý KHÔNG tự xoá: xoá dữ liệu người dùng là việc không hoàn tác được, và một
 * tác vụ nền âm thầm dọn sạch danh bạ vào lúc 3 giờ sáng là cách chắc chắn để
 * mất dữ liệu mà không ai kịp nhận ra.
 */
export function demLeadQuaHan(hanThang: number): number {
  const moc = Date.now() - hanThang * 30 * 24 * 3600 * 1000;
  return (
    layMot<{ so: number }>("select count(*) as so from khach_tiem_nang where tao_luc < ?", moc)
      ?.so ?? 0
  );
}
