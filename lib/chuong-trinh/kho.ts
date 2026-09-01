import "server-only";

import { DIFFICULTIES, type DifficultyId, type RoundSettings } from "@/config/game";
import { SO_LAN_CHOI, type CheDoChoi, type NguonCoSo } from "@/config/to-chuc";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { sinhMa } from "@/lib/chuong-trinh/ma-chuong-trinh";
import type { PhamVi } from "@/lib/bao-ve/quyen";
import type { ThietLapChuongTrinh } from "@/lib/chuong-trinh/kiem-hop-le";

/**
 * Kho đọc–ghi chương trình. MỌI câu lệnh SQL của bảng `chuong_trinh` nằm ở đây,
 * không rải rác trong component — đổi cột thì chỉ sửa một chỗ.
 *
 * 🔴 HAI ĐƯỜNG ĐỌC, cố ý tách tên (GĐ 21.1):
 *
 * - `timTheoMa(ma, phamVi)` · `danhSachChuongTrinh(phamVi)` — dùng trong `/quan-tri`,
 *   nơi LUÔN có người đăng nhập. Lọc theo cơ sở ngay trong câu SQL.
 * - `timTheoMaCongKhai(ma)` — dùng ở `/choi/[ma]` và `/man-hinh/[ma]`, nơi KHÔNG có
 *   ai đăng nhập. Phụ huynh quét mã QR thì lấy đâu ra phạm vi; lọc ở đó là khoá
 *   cửa chính trò chơi.
 *
 * Tên khác hẳn nhau là có chủ ý: một cái tên chung với tham số tuỳ chọn thì sớm
 * muộn cũng có người gọi thiếu tham số ở khu quản trị, và không gì báo lỗi cả.
 */

/**
 * `da_an` (GĐ 23.1) = dọn khỏi giao diện nhưng **giữ trọn dữ liệu**. Dùng cho
 * chương trình đã có ván chơi: xoá hẳn là mất sổ đối soát giải thưởng đã trao,
 * và đó là thứ bảo vệ trung tâm khi phụ huynh khiếu nại phần quà.
 *
 * 🔴 Ẩn CŨNG LÀ NGỪNG CHẠY. Ẩn khỏi giao diện mà vẫn nhận lượt chơi là trường
 * hợp tệ nhất: nhân viên tưởng đã dọn xong, còn phụ huynh vẫn quét được mã QR
 * đã dán và vẫn trúng quà mà không ai theo dõi.
 */
export type TrangThaiChuongTrinh = "dang_chay" | "ket_thuc" | "da_an";

export interface ChuongTrinh {
  id: number;
  ma: string;
  tenTrungTam: string;
  soTrung: number;
  mucDo: DifficultyId | "custom";
  thamSo: RoundSettings;
  tenGiaiThuong: string;
  tranGiaiMoiNgay: number;
  trangThai: TrangThaiChuongTrinh;
  taoLuc: number;
  /** Cơ sở tổ chức. NULL chỉ còn ở dữ liệu cũ chưa qua backfill. */
  coSoId: number | null;
  cheDo: CheDoChoi;
  nguonCoSo: NguonCoSo;
  soLanChoi: number;
}

export interface ChuongTrinhKemSoLieu extends ChuongTrinh {
  soLuot: number;
  soGiai: number;
  /**
   * Số VÁN — khác `soLuot` (số lần bấm). Danh sách cần nó để nút dọn hỏi đúng
   * câu: hỏi "xoá hẳn nhé" trong khi máy chủ sắp ẩn là nói dối người dùng, mà
   * hỏi sai một lần thì lần sau họ không đọc hộp thoại nữa.
   */
  soVan: number;
  soGiaiDaTrao: number;
}

interface DongChuongTrinh {
  id: number;
  ma: string;
  ten_trung_tam: string;
  so_trung: number;
  muc_do: string;
  tham_so: string | null;
  ten_giai_thuong: string;
  tran_giai_moi_ngay: number;
  trang_thai: string;
  tao_luc: number;
  co_so_id: number | null;
  che_do: string;
  nguon_co_so: string;
  so_lan_choi: number;
  so_luot?: number;
  so_giai?: number;
  so_van?: number;
  so_giai_da_trao?: number;
}

function doiDong(dong: DongChuongTrinh): ChuongTrinhKemSoLieu {
  const mucDo = dong.muc_do as DifficultyId | "custom";
  const thamSo: RoundSettings =
    dong.tham_so !== null
      ? (JSON.parse(dong.tham_so) as RoundSettings)
      : DIFFICULTIES[(mucDo === "custom" ? "vua" : mucDo) as DifficultyId].settings;

  return {
    id: dong.id,
    ma: dong.ma,
    tenTrungTam: dong.ten_trung_tam,
    soTrung: dong.so_trung,
    mucDo,
    thamSo,
    tenGiaiThuong: dong.ten_giai_thuong,
    tranGiaiMoiNgay: dong.tran_giai_moi_ngay,
    trangThai: dong.trang_thai as TrangThaiChuongTrinh,
    taoLuc: dong.tao_luc,
    coSoId: dong.co_so_id,
    cheDo: dong.che_do as CheDoChoi,
    nguonCoSo: dong.nguon_co_so as NguonCoSo,
    soLanChoi: dong.so_lan_choi,
    soLuot: dong.so_luot ?? 0,
    soGiai: dong.so_giai ?? 0,
    soVan: dong.so_van ?? 0,
    soGiaiDaTrao: dong.so_giai_da_trao ?? 0,
  };
}

/** Sinh mã chưa ai dùng. Bốn ký tự cho 390.625 khả năng — đủ xa để không đụng. */
function maChuaDung(): string {
  for (let i = 0; i < 50; i += 1) {
    const ma = sinhMa();
    if (!layMot("select 1 from chuong_trinh where ma = ?", ma)) return ma;
  }
  throw new Error("Không sinh được mã chương trình mới sau 50 lần thử");
}

export interface DauVaoTaoChuongTrinh {
  /**
   * BẢN CHỤP tên cơ sở lúc tạo, không phải nguồn sự thật.
   *
   * 🔴 Vì sao chép chứ không join: đường chơi đọc chương trình ở chỗ nhạy cảm độ
   * trễ, thêm một phép nối bảng ở đó là thêm việc cho mỗi lượt bấm. Và quan
   * trọng hơn: đổi tên cơ sở vào năm sau KHÔNG được phép làm sai tên trên biên
   * lai đã in năm ngoái.
   */
  tenTrungTam: string;
  soTrung: number;
  mucDo: DifficultyId | "custom";
  thamSo?: RoundSettings;
  tenGiaiThuong: string;
  tranGiaiMoiNgay: number;
  /** `null` = chưa gán cơ sở; phụ huynh tự chọn ở bước nhập thông tin (GĐ 25). */
  coSoId: number | null;
  cheDo?: CheDoChoi;
  nguonCoSo?: NguonCoSo;
  soLanChoi?: number;
}

export function taoChuongTrinh(dauVao: DauVaoTaoChuongTrinh): ChuongTrinh {
  const luc = Date.now();
  const ma = maChuaDung();
  chay(
    `insert into chuong_trinh
       (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong,
        tran_giai_moi_ngay, trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi,
        tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, ?, ?, 'dang_chay', ?, ?, ?, ?, ?, ?)`,
    ma,
    dauVao.tenTrungTam,
    dauVao.soTrung,
    dauVao.mucDo,
    dauVao.thamSo ? JSON.stringify(dauVao.thamSo) : null,
    dauVao.tenGiaiThuong,
    dauVao.tranGiaiMoiNgay,
    dauVao.coSoId,
    dauVao.cheDo ?? "tai_quay",
    dauVao.nguonCoSo ?? "gan_san",
    dauVao.soLanChoi ?? SO_LAN_CHOI.macDinh,
    luc,
    luc,
  );
  return doiDong(layMot<DongChuongTrinh>("select * from chuong_trinh where ma = ?", ma)!);
}

/**
 * Mệnh đề WHERE theo phạm vi, viết MỘT lần cho cả file.
 *
 * 🔴 Chương trình CHƯA GÁN CƠ SỞ (`co_so_id is null`) chỉ quản trị toàn hệ thống
 * thấy. Nó không thuộc cơ sở nào, nên không có cơ sở nào để mà nhận nó về —
 * hướng lệch an toàn là giấu, không phải là cho mọi người thấy.
 */
function locPhamVi(pv: PhamVi): { menh: string; thamSo: number[] } {
  if (pv.coSoId === null) return { menh: "", thamSo: [] };
  return { menh: " and c.co_so_id = ?", thamSo: [pv.coSoId] };
}

/** Đọc trong khu quản trị — LUÔN lọc theo phạm vi của người đang đăng nhập. */
export function timTheoMa(ma: string, pv: PhamVi): ChuongTrinh | null {
  const { menh, thamSo } = locPhamVi(pv);
  const dong = layMot<DongChuongTrinh>(
    `select c.* from chuong_trinh c where c.ma = ?${menh}`,
    ma,
    ...thamSo,
  );
  return dong ? doiDong(dong) : null;
}

/**
 * Đọc trên đường CÔNG KHAI: `/choi/[ma]` và `/man-hinh/[ma]`.
 *
 * Không lọc, và đó là đúng: phụ huynh quét mã QR không đăng nhập gì cả. Mã bốn
 * ký tự chính là thứ đóng vai chìa khoá ở đây.
 */
export function timTheoMaCongKhai(ma: string): ChuongTrinh | null {
  const dong = layMot<DongChuongTrinh>("select * from chuong_trinh where ma = ?", ma);
  return dong ? doiDong(dong) : null;
}

/** Danh sách kèm số lượt và số giải — một câu truy vấn, không đếm vòng lặp. */
export function danhSachChuongTrinh(
  pv: PhamVi,
  hienCaDaAn = false,
): ChuongTrinhKemSoLieu[] {
  const { menh, thamSo } = locPhamVi(pv);
  const locAn = hienCaDaAn ? "" : " and c.trang_thai <> 'da_an'";
  const dong = layNhieu<DongChuongTrinh>(
    `select c.*,
              (select count(*) from luot_choi l where l.chuong_trinh_id = c.id) as so_luot,
              (select count(*) from luot_choi l where l.chuong_trinh_id = c.id and l.trung = 1) as so_giai,
              (select count(*) from van_choi v where v.chuong_trinh_id = c.id) as so_van,
              (select count(*) from van_choi v where v.chuong_trinh_id = c.id and v.da_trao_thuong = 1) as so_giai_da_trao
         from chuong_trinh c
        where 1 = 1${menh}${locAn}
        order by c.id desc`,
    ...thamSo,
  );
  return dong.map(doiDong);
}

/**
 * Sửa thiết lập của một chương trình ĐANG SỐNG.
 *
 * 🔴 Ba thứ cố ý KHÔNG có mặt ở đây: `ma` (mã QR đã in ra giấy dán ở quầy),
 * `coSoId` và `cheDo`. Đổi bất kỳ cái nào trong ba là một chương trình khác,
 * không phải bản sửa — và lịch sử ván cũ sẽ treo lơ lửng giữa hai thân phận.
 *
 * `ten_trung_tam` cũng giữ nguyên: nó là BẢN CHỤP tên cơ sở lúc tạo, thứ in
 * trên tờ giấy đã dán. Sửa nó là sửa quá khứ.
 *
 * Ván đã chơi KHÔNG bị đụng tới. Chúng được chấm theo số cũ, và đó là sự thật
 * của ngày hôm đó — trang chi tiết có nhiệm vụ nói rõ điều này cho người sửa.
 */
export function suaChuongTrinh(id: number, d: ThietLapChuongTrinh): boolean {
  return (
    chay(
      `update chuong_trinh
          set so_trung = ?, muc_do = ?, tham_so = ?, ten_giai_thuong = ?,
              tran_giai_moi_ngay = ?, so_lan_choi = ?, sua_luc = ?
        where id = ?`,
      d.soTrung,
      d.mucDo,
      // Ghi lại tham số của mức mới. Giữ bộ cũ thì nhãn nói "Khó" mà dãy số vẫn
      // chạy theo nhịp "Vừa" — người chơi thấy một đằng, máy chấm một nẻo.
      JSON.stringify(DIFFICULTIES[d.mucDo].settings),
      d.tenGiaiThuong.trim(),
      d.tranGiaiMoiNgay,
      d.soLanChoi,
      Date.now(),
      id,
    ) > 0
  );
}

export interface RangBuocChuongTrinh {
  soVan: number;
  soGiaiDaTrao: number;
}

/**
 * Đếm thứ sẽ mất nếu xoá — để hộp xác nhận nói bằng CON SỐ, không bằng lời doạ.
 *
 * "Sẽ mất 14 ván chơi và 2 giải đã trao" khiến người ta dừng lại; "hành động này
 * không thể hoàn tác" thì ai cũng bấm qua.
 */
export function demRangBuoc(id: number): RangBuocChuongTrinh {
  const d = layMot<{ so_van: number; so_giai: number }>(
    `select (select count(*) from van_choi where chuong_trinh_id = ?)                       as so_van,
            (select count(*) from van_choi where chuong_trinh_id = ? and da_trao_thuong = 1) as so_giai`,
    id,
    id,
  );
  return { soVan: d?.so_van ?? 0, soGiaiDaTrao: d?.so_giai ?? 0 };
}

/**
 * Xoá HẲN. Chỉ gọi khi `demRangBuoc().soVan === 0` — người gọi tự canh, và
 * server action là nơi canh (không tin tham số từ máy khách).
 *
 * Cascade dọn `qua_tang`, `luot_choi`, `van_choi` của chính nó.
 * 🔴 `khach_tiem_nang.chuong_trinh_id_dau` là `ON DELETE SET NULL` ⇒ **khách
 * tiềm năng KHÔNG mất theo**. Đó là điều kiện của cả tính năng này.
 */
export function xoaChuongTrinh(id: number): boolean {
  return chay("delete from chuong_trinh where id = ?", id) > 0;
}

/** Ẩn khỏi giao diện, giữ trọn dữ liệu. Dọn cả bốn ô giữ chỗ như `doiTrangThai`. */
export function anChuongTrinh(id: number): boolean {
  return (
    chay(
      `update chuong_trinh
          set trang_thai = 'da_an', sua_luc = ?,
              token_man_hinh = null, han_man_hinh = null,
              token_nguoi_choi = null, han_nguoi_choi = null
        where id = ?`,
      Date.now(),
      id,
    ) > 0
  );
}

/**
 * Bật hoặc tắt chương trình, đồng thời DỌN SẠCH cả bốn ô giữ chỗ — ở CẢ HAI chiều.
 *
 * 🔴 Vì sao phải dọn: `ROOM_HOLD_SECONDS` là 120 giây. Nhân viên tắt chương trình
 * đúng lúc có người đang giữ chỗ, rồi 20 giây sau bật lại → suốt HAI PHÚT đầu,
 * người mới quét mã bị báo "màn hình đang có người chơi" bởi một chiếc điện
 * thoại đã rời đi từ lâu. Nhìn y như bật lại không ăn thua. Một câu UPDATE,
 * không thêm lượt đi–về nào — cứ dọn.
 */
export function doiTrangThai(ma: string, trangThai: TrangThaiChuongTrinh): boolean {
  return (
    chay(
      `update chuong_trinh
          set trang_thai = ?, sua_luc = ?,
              token_man_hinh = null, han_man_hinh = null,
              token_nguoi_choi = null, han_nguoi_choi = null
        where ma = ?`,
      trangThai,
      Date.now(),
      ma,
    ) > 0
  );
}
