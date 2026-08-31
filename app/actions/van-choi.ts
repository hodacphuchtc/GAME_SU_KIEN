"use server";

import { LCD_RESULT_SECONDS } from "@/config/game";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { phat } from "@/lib/dong-bo/tram-phat";
import { batDauLuot, dungLuot, type ThietBiBam } from "@/lib/luot/luot-service";
import { giaHanCho, giuCho, nhaCho, type LoaiCho } from "@/lib/phien/giu-cho";

/**
 * Cửa vào duy nhất cho mọi thao tác của một ván chơi.
 *
 * Máy khách KHÔNG được tự ghi cơ sở dữ liệu; nó chỉ gọi mấy hàm ở đây, và mọi
 * luật (giữ chỗ, ai bấm trước, số mili-giây có hợp lý không) đều nằm phía máy chủ.
 */

export interface TraLoiGiuCho {
  duoc: boolean;
  conBanBao?: number;
  /** Có sẵn để màn hình vẽ ngay mà không phải gọi thêm lượt nữa. */
  soTrung?: number;
  tenTrungTam?: string;
  tenGiaiThuong?: string;
}

export async function xinCho(
  ma: string,
  loai: LoaiCho,
  token: string,
): Promise<TraLoiGiuCho> {
  const ct = timTheoMa(ma);
  if (!ct || ct.trangThai !== "dang_chay") return { duoc: false };

  const kq = giuCho(ma, loai, token);
  if (!kq.duoc) return { duoc: false, conBanBao: kq.conBanBao };

  if (loai === "nguoi_choi") {
    phat(ma, { loai: "nguoi-choi-vao", tenRutGon: "" });
  }
  return {
    duoc: true,
    soTrung: ct.soTrung,
    tenTrungTam: ct.tenTrungTam,
    tenGiaiThuong: ct.tenGiaiThuong,
  };
}

export async function giaHan(ma: string, loai: LoaiCho, token: string): Promise<boolean> {
  return giaHanCho(ma, loai, token);
}

export async function roiDi(ma: string, loai: LoaiCho, token: string): Promise<void> {
  if (nhaCho(ma, loai, token) && loai === "nguoi_choi") {
    phat(ma, { loai: "roi-di" });
  }
}

export interface TraLoiMoLuot {
  ok: boolean;
  luotId?: number;
  batDauLuc?: number;
  /** Giờ máy chủ lúc trả lời — máy khách dùng để canh lại đồng hồ. */
  gioMayChu?: number;
}

export async function moLuot(ma: string, nguoiChoiId: number | null): Promise<TraLoiMoLuot> {
  const luot = batDauLuot(ma, nguoiChoiId);
  if (!luot) return { ok: false };

  phat(ma, {
    loai: "bat-dau",
    luotId: luot.luotId,
    batDauLuc: luot.batDauLuc,
    thamSo: luot.thamSo,
  });
  return {
    ok: true,
    luotId: luot.luotId,
    batDauLuc: luot.batDauLuc,
    gioMayChu: Date.now(),
  };
}

export interface TraLoiChotLuot {
  ok: boolean;
  soDaDung?: number;
  trung?: boolean;
  khoangLech?: number;
  hetGio?: boolean;
  maXacThuc?: string;
}

/**
 * Chốt ván. Trả `ok: false` khi máy kia bấm trước — nơi gọi cứ im lặng chờ tin
 * `ket-qua` từ kênh đồng bộ, KHÔNG báo lỗi cho người chơi.
 */
export async function chotLuot(
  ma: string,
  luotId: number,
  soMiliGiayDaTroi: number,
  thietBi: ThietBiBam,
): Promise<TraLoiChotLuot> {
  const kq = dungLuot(luotId, soMiliGiayDaTroi, thietBi);
  if (!kq) return { ok: false };

  const ct = timTheoMa(ma);
  phat(ma, {
    loai: "ket-qua",
    luotId: kq.luotId,
    soDaDung: kq.value,
    trung: kq.win,
    khoangLech: kq.distance,
    hetGio: kq.timedOut,
    maXacThuc: kq.maXacThuc,
    tenRutGon: "",
    tenGiaiThuong: ct?.tenGiaiThuong ?? "",
    giayXemKetQua: kq.win ? LCD_RESULT_SECONDS.win : LCD_RESULT_SECONDS.lose,
  });

  return {
    ok: true,
    soDaDung: kq.value,
    trung: kq.win,
    khoangLech: kq.distance,
    hetGio: kq.timedOut,
    maXacThuc: kq.maXacThuc,
  };
}
