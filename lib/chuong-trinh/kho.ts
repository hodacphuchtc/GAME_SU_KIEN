import "server-only";

import { DAI_MAC_DINH } from "@/config/chon-so";
import { DIFFICULTIES, type DifficultyId, type RoundSettings } from "@/config/game";
import {
  SO_LAN_CHOI,
  TRO_CHOI_MAC_DINH,
  type CheDoChoi,
  type NguonCoSo,
  type TroChoi,
} from "@/config/to-chuc";
import { chay, layMot, layNhieu } from "@/lib/db/truy-van";
import { sinhMa } from "@/lib/chuong-trinh/ma-chuong-trinh";
import type { PhamVi } from "@/lib/bao-ve/quyen";
import {
  kiemThietLapChonSo,
  type ThietLapChonSo,
  type ThietLapChuongTrinh,
} from "@/lib/chuong-trinh/kiem-hop-le";

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
  /** Game nào đang chạy trên chương trình này (ADR-005). */
  troChoi: TroChoi;
  /** Dải số của game CHỌN SỐ, hai đầu đều BAO GỒM. Trúng Số không đọc. */
  daiTu: number;
  daiDen: number;
  /** Số đã có người lấy thì biến mất khỏi vòng chạy. Chỉ CHỌN SỐ đọc. */
  loaiTruDaRa: boolean;
  /** Tăng mỗi lần danh sách ô đổi; mỗi lượt quay ghim phiên bản của nó. */
  phienBanO: number;
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
  /**
   * Số lượng số ĐÃ PHÁT của game Chọn Số, đếm trong đúng dải hiện hành.
   *
   * 🔴 Đếm bằng MỘT truy vấn con ngay trong câu danh sách, không gọi `soDaRa`
   * cho từng dòng — danh sách 30 chương trình mà mỗi dòng một truy vấn là 30
   * lượt đi về cơ sở dữ liệu cho một trang chỉ để hiện một con số.
   */
  soDaRaDem: number;
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
  tro_choi: string;
  dai_tu: number;
  dai_den: number;
  loai_tru_da_ra: number;
  phien_ban_o: number;
  so_luot?: number;
  so_giai?: number;
  so_van?: number;
  so_giai_da_trao?: number;
  so_da_ra_dem?: number;
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
    troChoi: dong.tro_choi as TroChoi,
    daiTu: dong.dai_tu,
    daiDen: dong.dai_den,
    loaiTruDaRa: dong.loai_tru_da_ra === 1,
    phienBanO: dong.phien_ban_o,
    soLuot: dong.so_luot ?? 0,
    soGiai: dong.so_giai ?? 0,
    soVan: dong.so_van ?? 0,
    soGiaiDaTrao: dong.so_giai_da_trao ?? 0,
    soDaRaDem: dong.so_da_ra_dem ?? 0,
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
  /** Mặc định `trung_so` — chương trình cũ và mọi nơi gọi cũ không phải đổi. */
  troChoi?: TroChoi;
  daiTu?: number;
  daiDen?: number;
  loaiTruDaRa?: boolean;
}

export function taoChuongTrinh(dauVao: DauVaoTaoChuongTrinh): ChuongTrinh {
  const luc = Date.now();
  const ma = maChuaDung();
  chay(
    `insert into chuong_trinh
       (ma, ten_trung_tam, so_trung, muc_do, tham_so, ten_giai_thuong,
        tran_giai_moi_ngay, trang_thai, co_so_id, che_do, nguon_co_so, so_lan_choi,
        tro_choi, dai_tu, dai_den, loai_tru_da_ra, tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, ?, ?, 'dang_chay', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    dauVao.troChoi ?? TRO_CHOI_MAC_DINH,
    dauVao.daiTu ?? DAI_MAC_DINH.tu,
    dauVao.daiDen ?? DAI_MAC_DINH.den,
    dauVao.loaiTruDaRa ? 1 : 0,
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

/**
 * Mệnh đề WHERE theo GAME. Hai game dùng chung bảng `chuong_trinh` (ADR-005).
 *
 * 🔴 Mọi câu đọc trong khu quản trị PHẢI mang mệnh đề này. Thiếu nó thì màn quản
 * trị của game này hiện chương trình của game kia, và nút Sửa sẽ ghi những cột
 * mà game kia không bao giờ đọc. Hướng lệch nguy hiểm hơn nằm ở phía ngược lại:
 * gõ nhầm hằng ở đây là danh sách chương trình ĐANG CHẠY THẬT biến mất khỏi màn
 * hình quản trị của quầy, mà không một dòng lỗi nào.
 *
 * Giá trị đến từ union kiểu `TroChoi`, không từ người dùng — nội suy an toàn.
 */
function locTroChoi(tc: TroChoi): string {
  return ` and c.tro_choi = '${tc}'`;
}

/**
 * Đường dẫn trang chi tiết trong khu quản trị, theo GAME.
 *
 * 🔴 Ba game có ba route khác nhau. Viết cứng một đường ở nơi gọi là thứ đã làm
 * nút TẮT CHƯƠNG TRÌNH của Chọn Số ném người dùng sang màn 404 — route
 * `/quan-tri/chuong-trinh/[ma]` lọc `tro_choi = 'trung_so'` nên không mở nổi
 * chương trình game khác. Gom về một chỗ để thêm game thứ tư chỉ phải sửa ở đây.
 */
export function duongDanQuanTri(troChoi: TroChoi, ma: string): string {
  switch (troChoi) {
    case "chon_so":
      return `/quan-tri/chon-so/${ma}`;
    case "vong_quay":
      return `/quan-tri/vong-quay/${ma}`;
    default:
      return `/quan-tri/chuong-trinh/${ma}`;
  }
}

/** Đọc trong khu quản trị — LUÔN lọc theo phạm vi của người đang đăng nhập. */
export function timTheoMa(ma: string, pv: PhamVi): ChuongTrinh | null {
  return timTheoMaCuaGame(ma, pv, "trung_so");
}

/** Bản đối ứng cho game CHỌN SỐ. Tên tách hẳn, cùng lý do với `timTheoMaCongKhai`. */
export function timTheoMaChonSo(ma: string, pv: PhamVi): ChuongTrinh | null {
  return timTheoMaCuaGame(ma, pv, "chon_so");
}

/**
 * Bản đối ứng cho game VÒNG QUAY (ADR-011). Tên tách hẳn, cùng lý do với hai
 * game kia: một cái tên chung nhận game làm tham số thì sớm muộn có người gọi
 * thiếu, và màn quản trị của game này hiện chương trình của game khác.
 */
export function timTheoMaVongQuay(ma: string, pv: PhamVi): ChuongTrinh | null {
  return timTheoMaCuaGame(ma, pv, "vong_quay");
}

function timTheoMaCuaGame(ma: string, pv: PhamVi, tc: TroChoi): ChuongTrinh | null {
  const { menh, thamSo } = locPhamVi(pv);
  const dong = layMot<DongChuongTrinh>(
    `select c.* from chuong_trinh c where c.ma = ?${menh}${locTroChoi(tc)}`,
    ma,
    ...thamSo,
  );
  return dong ? doiDong(dong) : null;
}

/**
 * Đọc KHÔNG phân biệt game — chỉ dành cho hai cửa dùng chung: tắt/bật và
 * xoá/ẩn. Chúng làm cùng một việc với mọi chương trình, nên bắt chúng biết game
 * là bắt chúng có hai nhánh chẳng để làm gì.
 *
 * 🔴 Vẫn lọc theo phạm vi. Bỏ `pv` ở đây là mở cửa cho sale cơ sở này tắt
 * chương trình của cơ sở kia.
 */
export function timTheoMaBatKeTroChoi(ma: string, pv: PhamVi): ChuongTrinh | null {
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
  return danhSachCuaGame(pv, hienCaDaAn, "trung_so");
}

/** Bản đối ứng cho game CHỌN SỐ. */
export function danhSachChonSo(pv: PhamVi, hienCaDaAn = false): ChuongTrinhKemSoLieu[] {
  return danhSachCuaGame(pv, hienCaDaAn, "chon_so");
}

/**
 * Danh sách chương trình VÒNG QUAY (ADR-011).
 *
 * 🔴 Hàm RIÊNG chứ không dùng chung `danhSachCuaGame`: vòng quay ghi vào
 * `luot_quay`, hai game kia ghi vào `luot_choi`/`van_choi`. Dùng chung câu đếm
 * là mọi chương trình vòng quay hiện "0 lượt" vĩnh viễn — con số sai mà trông
 * hoàn toàn bình thường, không một dòng lỗi.
 *
 * 🔴 Vẫn mang ĐỦ `locPhamVi` + `locTroChoi`. Thiếu cái đầu là sale cơ sở này
 * đọc được chương trình cơ sở kia; thiếu cái sau là màn Vòng Quay hiện chương
 * trình Trúng Số đang chạy thật ở quầy.
 */
export function danhSachVongQuay(pv: PhamVi, hienCaDaAn = false): ChuongTrinhKemSoLieu[] {
  const { menh, thamSo } = locPhamVi(pv);
  const locAn = hienCaDaAn ? "" : " and c.trang_thai <> 'da_an'";
  const dong = layNhieu<DongChuongTrinh>(
    `select c.*,
            (select count(*) from luot_quay q where q.chuong_trinh_id = c.id) as so_luot,
            (select count(*) from luot_quay q
              where q.chuong_trinh_id = c.id and q.o_qua_id is not null) as so_giai,
            (select count(*) from luot_quay q where q.chuong_trinh_id = c.id) as so_van,
            (select count(*) from luot_quay q
              where q.chuong_trinh_id = c.id and q.da_trao_thuong = 1) as so_giai_da_trao,
            0 as so_da_ra_dem
       from chuong_trinh c
      where 1 = 1${menh}${locAn}${locTroChoi("vong_quay")}
      order by c.id desc`,
    ...thamSo,
  );
  return dong.map(doiDong);
}

function danhSachCuaGame(
  pv: PhamVi,
  hienCaDaAn: boolean,
  tc: TroChoi,
): ChuongTrinhKemSoLieu[] {
  const { menh, thamSo } = locPhamVi(pv);
  const locAn = hienCaDaAn ? "" : " and c.trang_thai <> 'da_an'";
  const dong = layNhieu<DongChuongTrinh>(
    `select c.*,
              (select count(*) from luot_choi l where l.chuong_trinh_id = c.id) as so_luot,
              (select count(*) from luot_choi l where l.chuong_trinh_id = c.id and l.trung = 1) as so_giai,
              (select count(*) from van_choi v where v.chuong_trinh_id = c.id) as so_van,
              (select count(*) from van_choi v where v.chuong_trinh_id = c.id and v.da_trao_thuong = 1) as so_giai_da_trao,
              (select count(distinct l.so_da_dung) from luot_choi l
                where l.chuong_trinh_id = c.id and l.ket_thuc_luc is not null
                  and l.so_da_dung between c.dai_tu and c.dai_den) as so_da_ra_dem
         from chuong_trinh c
        where 1 = 1${menh}${locAn}${locTroChoi(tc)}
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

/**
 * Sửa thiết lập của một chương trình CHỌN SỐ đang sống.
 *
 * 🔴 Cùng ba thứ cố ý KHÔNG có mặt như bên Trúng Số: `ma` (mã QR đã in ra giấy
 * dán ở quầy), `coSoId` và `cheDo`. Thêm `troChoi` — đổi game là một chương
 * trình khác hẳn, không phải một bản sửa.
 *
 * Ván đã chơi KHÔNG bị đụng tới. Thu hẹp dải sau khi đã phát vài số ngoài dải
 * mới là hợp lệ; những số đó rơi khỏi phép đếm "còn lại", còn phần quà đã trao
 * thì vẫn là sự thật của ngày hôm đó.
 */
export function suaChonSo(id: number, d: ThietLapChonSo): boolean {
  const loi = kiemThietLapChonSo(d);
  if (loi !== null) throw new Error(loi);
  return (
    chay(
      `update chuong_trinh
          set dai_tu = ?, dai_den = ?, loai_tru_da_ra = ?, ten_giai_thuong = ?, sua_luc = ?
        where id = ? and tro_choi = 'chon_so'`,
      d.daiTu,
      d.daiDen,
      d.loaiTruDaRa ? 1 : 0,
      d.tenGiaiThuong.trim(),
      Date.now(),
      id,
    ) > 0
  );
}
