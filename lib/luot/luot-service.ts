import "server-only";

import { WIN_VALID_SECONDS, type RoundSettings } from "@/config/game";
import { resolveRound, type RoundResult } from "@/lib/bo-dem";
import { timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { chay, layMot } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";
import { verifyCode } from "@/lib/ma-xac-thuc";
import {
  conLanBam,
  ghiLanBam,
  moVan,
  timVan,
  vanDangMo,
  type KetQuaGhiLanBam,
  type Van,
} from "@/lib/van/kho-van";

/**
 * Vòng đời một lượt chơi.
 *
 * 🔴 Ba luật không được đổi:
 *
 * 1. **Máy nào bấm thì máy đó ĐO.** Nó gửi lên số mili-giây đã trôi kể từ lúc
 *    bảng số của chính nó bắt đầu chạy. Nếu để máy chủ tính từ lúc NHẬN được
 *    lệnh thì độ trễ mạng bị cộng vào: phụ huynh thấy 0211, bấm, máy trả 0219 —
 *    nhìn y như ăn gian.
 * 2. **Postgres/SQLite làm trọng tài.** `UPDATE ... WHERE ket_thuc_luc IS NULL`
 *    chỉ đổi được một lần; máy bấm sau nhận 0 dòng và im lặng bỏ qua.
 * 3. **Số mili-giây phải hợp lý.** Máy khách tự khai nên kiểm được đến đâu hay
 *    đến đó: nằm trong khoảng cho phép, và không quá giờ thực đã trôi. Chống
 *    gian lận thật sự thì dựa vào việc trao giải tận tay + lịch sử tra soát.
 */

/** Cho phép lệch chừng này so với giờ thực — đủ cho mạng chậm, không đủ để gian. */
const DUNG_SAI_MS = 3000;

export interface LuotDangChay {
  luotId: number;
  vanId: number;
  /** Lần bấm thứ mấy trong ván (1-based) và tổng số lần được phép. */
  lanThu: number;
  soLanChoPhep: number;
  batDauLuc: number;
  thamSo: RoundSettings;
  soTrung: number;
}

/**
 * Mở MỘT LẦN BẤM.
 *
 * Ván được mở lười: lần bấm đầu tiên tạo ván, các lần sau nối vào ván đang mở.
 * `vanIdMuonTiep` là ván mà máy khách đang giữ; nó chỉ được dùng nếu đúng
 * chương trình, đúng người và còn lần bấm — máy khách khai gì cũng phải qua cửa
 * này, không tin thẳng.
 */
export function batDauLuot(
  ma: string,
  nguoiChoiId: number | null,
  vanIdMuonTiep: number | null = null,
  /**
   * Cơ sở ĐÃ PHÂN GIẢI ở bước nhận diện (chế độ để phụ huynh tự chọn).
   *
   * 🔴 Ghi vào `van_choi.co_so_id` để báo cáo "lead theo cơ sở" chạy GIỐNG NHAU
   * ở cả hai chế độ, và để lịch sử không sai khi ai đó đổi cấu hình chương
   * trình về sau.
   */
  coSoDaPhanGiai: number | null = null,
): LuotDangChay | null {
  const ct = timTheoMaCongKhai(ma);
  if (!ct || ct.trangThai !== "dang_chay") return null;

  let van: Van | null = null;
  if (vanIdMuonTiep !== null) {
    const ung = timVan(vanIdMuonTiep);
    if (
      ung &&
      ung.chuongTrinhId === ct.id &&
      ung.nguoiChoiId === nguoiChoiId &&
      conLanBam(ung)
    ) {
      van = ung;
    }
  }
  // Tải lại trang giữa ván: máy khách mất vanId, nhưng ván vẫn đang mở trong
  // CSDL. Nhặt lại theo người chơi, nếu không họ vừa mất lượt vừa bị luật
  // "1 ván/ngày" chặn — kẹt cứng mà nhìn như app hỏng.
  if (!van) {
    const dangMo = vanDangMo(ct.id, nguoiChoiId);
    if (dangMo && conLanBam(dangMo)) van = dangMo;
  }
  if (!van) {
    van = moVan({
      chuongTrinhId: ct.id,
      nguoiChoiId,
      coSoId: coSoDaPhanGiai ?? ct.coSoId,
      soLanChoPhep: ct.soLanChoi,
    });
  }

  const bayGio = Date.now();
  const lanThu = van.soLanDaDung + 1;
  chay(
    `insert into luot_choi (chuong_trinh_id, nguoi_choi_id, ngay, bat_dau_luc, van_id, lan_thu)
     values (?, ?, ?, ?, ?, ?)`,
    ct.id,
    nguoiChoiId,
    ngayVietNam(bayGio),
    bayGio,
    van.id,
    lanThu,
  );
  const dong = layMot<{ id: number }>("select last_insert_rowid() as id");
  if (!dong) return null;

  return {
    luotId: dong.id,
    vanId: van.id,
    lanThu,
    soLanChoPhep: van.soLanChoPhep,
    batDauLuc: bayGio,
    thamSo: ct.thamSo,
    soTrung: ct.soTrung,
  };
}

export type ThietBiBam = "man_hinh" | "dien_thoai" | "het_gio";

export interface KetQuaLuot extends RoundResult {
  luotId: number;
  maXacThuc: string;
  hieuLucGiay: number;
  thietBiBam: ThietBiBam;
  /** Trạng thái của VÁN sau lần bấm này — nguồn để màn giữa ván vẽ "Lần 2/3". */
  van: KetQuaGhiLanBam;
}

interface DongLuot {
  id: number;
  chuong_trinh_id: number;
  van_id: number | null;
  bat_dau_luc: number;
  ket_thuc_luc: number | null;
}

/**
 * Chốt một lượt. Trả `null` khi lượt đã được chốt trước đó (máy kia bấm nhanh
 * hơn) — nơi gọi cứ im lặng bỏ qua, KHÔNG báo lỗi cho người chơi.
 */
export function dungLuot(
  luotId: number,
  soMiliGiayDaTroi: number,
  thietBi: ThietBiBam,
): KetQuaLuot | null {
  const luot = layMot<DongLuot>("select * from luot_choi where id = ?", luotId);
  if (!luot || luot.ket_thuc_luc !== null) return null;

  const ct = layMot<{ ma: string }>(
    "select ma from chuong_trinh where id = ?",
    luot.chuong_trinh_id,
  );
  if (!ct) return null;
  const chuongTrinh = timTheoMaCongKhai(ct.ma);
  if (!chuongTrinh) return null;

  const thamSo = chuongTrinh.thamSo;
  const toiDaMs = thamSo.roundLimitSeconds * 1000;
  const toiThieuMs = thamSo.lockSeconds * 1000;
  const gioThucDaTroi = Date.now() - luot.bat_dau_luc;

  const hopLy =
    Number.isFinite(soMiliGiayDaTroi) &&
    soMiliGiayDaTroi >= 0 &&
    soMiliGiayDaTroi <= gioThucDaTroi + DUNG_SAI_MS;
  if (!hopLy) return null;

  const hetGio = thietBi === "het_gio" || soMiliGiayDaTroi >= toiDaMs;
  const giay = Math.min(toiDaMs, Math.max(toiThieuMs, soMiliGiayDaTroi)) / 1000;
  const ketQua = resolveRound(thamSo, chuongTrinh.soTrung, giay, hetGio);
  const maXacThuc = verifyCode(chuongTrinh.soTrung);
  const ketThuc = Date.now();

  const doi = chay(
    `update luot_choi
        set ket_thuc_luc = ?, so_da_dung = ?, trung = ?, khoang_lech = ?,
            het_gio = ?, thiet_bi_bam = ?
      where id = ? and ket_thuc_luc is null`,
    ketThuc,
    ketQua.value,
    ketQua.win ? 1 : 0,
    ketQua.distance,
    hetGio ? 1 : 0,
    thietBi,
    luotId,
  );
  // Máy kia bấm trước — thua cuộc, không ghi đè.
  if (doi === 0) return null;

  // Chốt lượt xong mới ghi vào ván: ván là nơi giữ kết quả chung cuộc, và thứ
  // tự này khiến "ai bấm trước" vẫn do câu UPDATE ở trên phân xử.
  const van = luot.van_id === null
    ? null
    : ghiLanBam(luot.van_id, luotId, ketQua.distance, ketQua.value, ketQua.win, maXacThuc);

  return {
    ...ketQua,
    luotId,
    maXacThuc,
    hieuLucGiay: WIN_VALID_SECONDS,
    thietBiBam: thietBi,
    van: van ?? {
      // Lượt cũ chưa có ván (dữ liệu trước GĐ 12): coi như ván một lần, xong ngay.
      soLanDaDung: 1,
      lechTotNhat: ketQua.distance,
      soTotNhat: ketQua.value,
      conLan: 0,
      vanXong: true,
      trung: ketQua.win,
      quaTangId: null,
      tenQuaTang: null,
    },
  };
}

export interface LuotDaChot {
  luotId: number;
  soDaDung: number;
  trung: boolean;
  khoangLech: number;
  hetGio: boolean;
  maXacThuc: string;
}

/** Đọc lại kết quả đã chốt — dùng khi một máy vào trễ và cần bắt kịp. */
export function docKetQua(luotId: number): LuotDaChot | null {
  const dong = layMot<{
    id: number;
    so_da_dung: number | null;
    trung: number;
    khoang_lech: number | null;
    het_gio: number;
    ma_xac_thuc: string | null;
    ket_thuc_luc: number | null;
  }>("select * from luot_choi where id = ?", luotId);
  if (!dong || dong.ket_thuc_luc === null) return null;
  return {
    luotId: dong.id,
    soDaDung: dong.so_da_dung ?? 0,
    trung: dong.trung === 1,
    khoangLech: dong.khoang_lech ?? 0,
    hetGio: dong.het_gio === 1,
    maXacThuc: dong.ma_xac_thuc ?? "",
  };
}
