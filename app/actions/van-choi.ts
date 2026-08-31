"use server";

import { LCD_RESULT_SECONDS } from "@/config/game";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { phat } from "@/lib/dong-bo/tram-phat";
import { kiemGioiHan } from "@/lib/luot/gioi-han";
import { batDauLuot, dungLuot, type ThietBiBam } from "@/lib/luot/luot-service";
import {
  danhDauQuanTamHocThu,
  nhanDien,
  tenRutGon,
} from "@/lib/nguoi-choi/nhan-dien";
import { giaHanCho, giuCho, nhaCho, nhaChoBatKe, type LoaiCho } from "@/lib/phien/giu-cho";

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
  loi?: string;
  /** Hết quà trong ngày: vẫn chơi được, nhưng không còn giải để trao. */
  chiVui?: boolean;
}

export async function moLuot(ma: string, nguoiChoiId: number | null): Promise<TraLoiMoLuot> {
  const ct = timTheoMa(ma);
  if (!ct || ct.trangThai !== "dang_chay") return { ok: false, loi: "Chương trình đã kết thúc." };

  const van = kiemGioiHan(ct.id, nguoiChoiId, ct.tranGiaiMoiNgay);
  if (!van.choPhep) return { ok: false, loi: van.lyDo, chiVui: van.chiVui };

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
    chiVui: van.chiVui,
  };
}

export interface TraLoiNhanDien {
  ok: boolean;
  nguoiChoiId?: number;
  tenRutGon?: string;
  loi?: string;
}

/** Bước 1 trên điện thoại: nhận diện phụ huynh trước khi cho chơi. */
export async function nhanDienNguoiChoi(
  hoTen: string,
  soDienThoai: string,
  dongYTuVan: boolean,
): Promise<TraLoiNhanDien> {
  const kq = nhanDien(hoTen, soDienThoai, dongYTuVan);
  if (!kq.nguoiChoi) return { ok: false, loi: kq.loi };
  return {
    ok: true,
    nguoiChoiId: kq.nguoiChoi.id,
    tenRutGon: tenRutGon(kq.nguoiChoi.hoTen),
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

  // Nhả chỗ NGAY khi có kết quả: giữ thêm hai phút nữa thì người đang xếp hàng
  // phía sau quét mã chỉ thấy "đang có người chơi" mà chẳng hiểu vì sao.
  nhaChoBatKe(ma, "nguoi_choi");

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

/**
 * 97% người chơi sẽ THUA, và màn thua đang là ngõ cụt. Đây là chỗ biến nó thành
 * cửa mời học thử — giá trị thật của cả trò chơi nằm ở đây, không nằm ở 3% trúng.
 */
export async function quanTamHocThu(nguoiChoiId: number): Promise<boolean> {
  return danhDauQuanTamHocThu(nguoiChoiId);
}
