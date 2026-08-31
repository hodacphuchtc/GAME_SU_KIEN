import "server-only";

import { WIN_VALID_SECONDS, type RoundSettings } from "@/config/game";
import { resolveRound, type RoundResult } from "@/lib/bo-dem";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { chay, layMot } from "@/lib/db/truy-van";
import { ngayVietNam } from "@/lib/db/thoi-gian";
import { verifyCode } from "@/lib/ma-xac-thuc";

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
  batDauLuc: number;
  thamSo: RoundSettings;
  soTrung: number;
}

export function batDauLuot(ma: string, nguoiChoiId: number | null): LuotDangChay | null {
  const ct = timTheoMa(ma);
  if (!ct || ct.trangThai !== "dang_chay") return null;

  const bayGio = Date.now();
  chay(
    `insert into luot_choi (chuong_trinh_id, nguoi_choi_id, ngay, bat_dau_luc)
     values (?, ?, ?, ?)`,
    ct.id,
    nguoiChoiId,
    ngayVietNam(bayGio),
    bayGio,
  );
  const dong = layMot<{ id: number }>(
    "select id from luot_choi where chuong_trinh_id = ? order by id desc limit 1",
    ct.id,
  );
  if (!dong) return null;

  return {
    luotId: dong.id,
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
}

interface DongLuot {
  id: number;
  chuong_trinh_id: number;
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
  const chuongTrinh = timTheoMa(ct.ma);
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
            het_gio = ?, thiet_bi_bam = ?, ma_xac_thuc = ?
      where id = ? and ket_thuc_luc is null`,
    ketThuc,
    ketQua.value,
    ketQua.win ? 1 : 0,
    ketQua.distance,
    hetGio ? 1 : 0,
    thietBi,
    maXacThuc,
    luotId,
  );
  // Máy kia bấm trước — thua cuộc, không ghi đè.
  if (doi === 0) return null;

  return {
    ...ketQua,
    luotId,
    maXacThuc,
    hieuLucGiay: WIN_VALID_SECONDS,
    thietBiBam: thietBi,
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
