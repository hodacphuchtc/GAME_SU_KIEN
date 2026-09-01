import "server-only";

import { csdl } from "@/lib/db/ket-noi";
import { chay, layMot } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";
import { bocQuaChoVan } from "@/lib/qua/kho-qua";

/**
 * VÁN CHƠI — đơn vị NHẬN GIẢI. MỌI SQL của `van_choi` nằm ở đây.
 *
 * 🔴 Ranh giới với `luot_choi`, đừng làm lẫn:
 *
 *   van_choi  = một lần chơi của một người → tối đa N lần bấm → MỘT phần quà.
 *   luot_choi = nhật ký TỪNG LẦN BẤM.
 *
 * Bấm ba lần trúng hai lần vẫn chỉ một phần quà, nên `trung` · `ma_xac_thuc` ·
 * `da_trao_thuong` · `da_ghi_danh` phải sống ở VÁN. Để chúng ở lượt thì trần
 * giải đếm ra hai, thước đo ghi danh đếm ra ba, và cả hai con số đều sai theo
 * hướng đẹp mắt — loại sai nguy hiểm nhất.
 */

export interface Van {
  id: number;
  chuongTrinhId: number;
  nguoiChoiId: number | null;
  coSoId: number | null;
  ngay: string;
  soLanChoPhep: number;
  soLanDaDung: number;
  luotTotNhatId: number | null;
  trung: boolean;
  maXacThuc: string | null;
  batDauLuc: number;
  ketThucLuc: number | null;
}

interface DongVan {
  id: number;
  chuong_trinh_id: number;
  nguoi_choi_id: number | null;
  co_so_id: number | null;
  ngay: string;
  so_lan_cho_phep: number;
  so_lan_da_dung: number;
  luot_tot_nhat_id: number | null;
  trung: number;
  ma_xac_thuc: string | null;
  bat_dau_luc: number;
  ket_thuc_luc: number | null;
}

function doiDong(d: DongVan): Van {
  return {
    id: d.id,
    chuongTrinhId: d.chuong_trinh_id,
    nguoiChoiId: d.nguoi_choi_id,
    coSoId: d.co_so_id,
    ngay: d.ngay,
    soLanChoPhep: d.so_lan_cho_phep,
    soLanDaDung: d.so_lan_da_dung,
    luotTotNhatId: d.luot_tot_nhat_id,
    trung: d.trung === 1,
    maXacThuc: d.ma_xac_thuc,
    batDauLuc: d.bat_dau_luc,
    ketThucLuc: d.ket_thuc_luc,
  };
}

export function timVan(id: number): Van | null {
  const d = layMot<DongVan>("select * from van_choi where id = ?", id);
  return d ? doiDong(d) : null;
}

/**
 * Ván đang mở của một người trong ngày, ở đúng chương trình này.
 *
 * Dùng khi phụ huynh lỡ tải lại trang giữa ván: không có hàm này thì họ mất
 * sạch số lần bấm còn lại, mà giới hạn "1 ván/ngày" lại chặn không cho mở ván
 * mới — kẹt cứng, và nhìn y như app hỏng.
 */
export function vanDangMo(chuongTrinhId: number, nguoiChoiId: number | null): Van | null {
  if (nguoiChoiId === null) return null;
  const d = layMot<DongVan>(
    `select * from van_choi
      where chuong_trinh_id = ? and nguoi_choi_id = ? and ngay = ? and ket_thuc_luc is null
      order by id desc limit 1`,
    chuongTrinhId,
    nguoiChoiId,
    ngayVietNam(),
  );
  return d ? doiDong(d) : null;
}

export interface DauVaoMoVan {
  chuongTrinhId: number;
  nguoiChoiId: number | null;
  coSoId: number | null;
  soLanChoPhep: number;
}

export function moVan(dauVao: DauVaoMoVan): Van {
  const luc = Date.now();
  chay(
    `insert into van_choi
       (chuong_trinh_id, nguoi_choi_id, co_so_id, ngay, so_lan_cho_phep,
        so_lan_da_dung, bat_dau_luc, tao_luc, sua_luc)
     values (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    dauVao.chuongTrinhId,
    dauVao.nguoiChoiId,
    dauVao.coSoId,
    ngayVietNam(luc),
    dauVao.soLanChoPhep,
    luc,
    luc,
    luc,
  );
  return timVan(
    layMot<{ id: number }>("select last_insert_rowid() as id")!.id,
  )!;
}

/** Ván còn nhận thêm lần bấm không. */
export function conLanBam(van: Van): boolean {
  return van.ketThucLuc === null && van.soLanDaDung < van.soLanChoPhep;
}

export interface KetQuaGhiLanBam {
  soLanDaDung: number;
  /** Khoảng lệch NHỎ NHẤT trong ván tính đến giờ. */
  lechTotNhat: number | null;
  /** Con số của chính lần bấm tốt nhất đó — thứ màn tổng kết phải hiện. */
  soTotNhat: number | null;
  conLan: number;
  vanXong: boolean;
  trung: boolean;
  /**
   * Phần quà đã bốc cho ván này. `null` khi trượt, hoặc khi TRÚNG mà kho đã
   * cạn sạch — ca thứ hai phải xử lý được, đừng giả định trúng là có quà.
   */
  quaTangId: number | null;
  tenQuaTang: string | null;
}

/**
 * Ghi nhận MỘT lần bấm vừa chốt vào ván, rồi quyết ván còn chạy hay dừng.
 *
 * 🔴 TRÚNG LÀ DỪNG NGAY. Bắt người đã trúng bấm nốt hai lần nữa vừa vô nghĩa
 * (một ván chỉ một phần quà) vừa nguy hiểm: mã xác thực đã hiện ra rồi, kéo
 * dài thêm là kéo dài luôn cái cửa sổ mà nhân viên chưa trao quà.
 *
 * `lechTotNhat` lấy nhỏ nhất trong CẢ ván, không phải lần cuối — người bấm lệch
 * 5 ở lần một rồi lệch 900 ở lần ba mà bị chấm 900 thì họ có quyền giận.
 */
export function ghiLanBam(
  vanId: number,
  luotId: number,
  khoangLech: number,
  soDaDung: number,
  trung: boolean,
  maXacThuc: string | null,
): KetQuaGhiLanBam | null {
  const van = timVan(vanId);
  if (!van || van.ketThucLuc !== null) return null;

  const luotTotCu = van.luotTotNhatId === null
    ? null
    : (layMot<{ khoang_lech: number | null; so_da_dung: number | null }>(
        "select khoang_lech, so_da_dung from luot_choi where id = ?",
        van.luotTotNhatId,
      ) ?? null);
  const totCu = luotTotCu?.khoang_lech ?? null;

  const totHon = totCu === null || khoangLech < totCu;
  const soLan = van.soLanDaDung + 1;
  const hetLan = soLan >= van.soLanChoPhep;
  const xong = trung || hetLan;
  const luc = Date.now();

  // 🔴 Chốt ván VÀ bốc quà trong CÙNG MỘT giao dịch. Tách ra thì hai người
  // trúng sát nhau cùng đọc thấy "còn 1 cái" và cùng nhận cái cuối cùng —
  // quầy hứa hai phần quà mà trong tay chỉ có một.
  const db = csdl();
  let qua: { id: number; ten: string } | null = null;
  db.exec("begin immediate");
  try {
    chay(
      `update van_choi
          set so_lan_da_dung = ?,
              luot_tot_nhat_id = ?,
              trung = ?,
              ma_xac_thuc = ?,
              ket_thuc_luc = ?,
              sua_luc = ?
        where id = ? and ket_thuc_luc is null`,
      soLan,
      totHon ? luotId : van.luotTotNhatId,
      trung ? 1 : 0,
      // Mã xác thực CHỈ có nghĩa khi trúng — ghi mã cho ván trượt là để sẵn một
      // dãy ký tự trông y như phiếu nhận quà trong cơ sở dữ liệu tra soát.
      trung ? maXacThuc : null,
      xong ? luc : null,
      luc,
      vanId,
    );
    if (trung) {
      const bocDuoc = bocQuaChoVan(vanId, van.chuongTrinhId);
      qua = bocDuoc ? { id: bocDuoc.id, ten: bocDuoc.ten } : null;
    }
    db.exec("commit");
  } catch (loi) {
    db.exec("rollback");
    throw loi;
  }

  return {
    soLanDaDung: soLan,
    lechTotNhat: totHon ? khoangLech : totCu,
    soTotNhat: totHon ? soDaDung : (luotTotCu?.so_da_dung ?? null),
    conLan: xong ? 0 : van.soLanChoPhep - soLan,
    vanXong: xong,
    trung,
    quaTangId: qua?.id ?? null,
    tenQuaTang: qua?.ten ?? null,
  };
}

/** Số VÁN đã chốt của một người trong ngày — nền của luật "1 ván/SĐT/ngày". */
export function soVanDaChot(chuongTrinhId: number, nguoiChoiId: number): number {
  return (
    layMot<{ so: number }>(
      `select count(*) as so from van_choi
        where chuong_trinh_id = ? and nguoi_choi_id = ? and ngay = ?
          and ket_thuc_luc is not null`,
      chuongTrinhId,
      nguoiChoiId,
      ngayVietNam(),
    )?.so ?? 0
  );
}

/**
 * Ghi lần bấm DUY NHẤT của một ván CHỌN SỐ, rồi chốt ván ngay.
 *
 * Khác `ghiLanBam` ở ba điểm, cả ba đều cố ý:
 *
 * - **KHÔNG bốc quà.** Quà của game này đánh số thứ tự và nằm NGOÀI hệ thống;
 *   app chỉ phát số. Gọi `bocQuaChoVan` ở đây là bốc trên một kho rỗng.
 * - **KHÔNG so "lần tốt nhất".** Mỗi ván đúng một lần bấm, nên không có lần nào
 *   để mà tốt hơn. `khoang_lech` vô nghĩa khi không có số trúng.
 * - **`trung` LUÔN = 0.** Đặt 1 là làm cột "Đã trúng" của Trúng Số đếm nhầm,
 *   `soGiaiHomNay` nói dối, và file Excel gửi đội sale ghi "Trúng" cho một trò
 *   không có giải.
 *
 * 🔴 KHÔNG sửa `ghiLanBam` để dùng chung. Hàm đó quấn ba việc trong một giao
 * dịch (lần tốt nhất · chốt ván · bốc quà) và là nơi quyết định ai nhận quà ở
 * trò đang chạy thật.
 */
export function ghiLanChonSo(
  vanId: number,
  luotId: number,
  maXacThuc: string,
): KetQuaGhiLanBam | null {
  const van = timVan(vanId);
  if (!van || van.ketThucLuc !== null) return null;

  const doi = chay(
    `update van_choi
        set so_lan_da_dung = 1, luot_tot_nhat_id = ?, trung = 0,
            ma_xac_thuc = ?, ket_thuc_luc = ?
      where id = ? and ket_thuc_luc is null`,
    luotId,
    maXacThuc,
    Date.now(),
    vanId,
  );
  // Máy kia chốt trước — im lặng nhường, đúng như luật ở `luot-service`.
  if (doi === 0) return null;

  return {
    soLanDaDung: 1,
    // Không có "lệch" vì không có số trúng; 0 là giá trị trung tính để bảng
    // lịch sử dùng chung không phải xử lý `null`.
    lechTotNhat: 0,
    soTotNhat: null,
    conLan: 0,
    vanXong: true,
    trung: false,
    quaTangId: null,
    tenQuaTang: null,
  };
}
