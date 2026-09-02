"use client";

import type { RoundSettings } from "@/config/game";
import type { Cung } from "@/lib/vong-quay/chia-o";

/**
 * Phía máy khách của kênh đồng bộ.
 *
 * 🔴 Nguyên tắc: nối được màn hình lớn là PHẦN THƯỞNG THÊM, không phải điều kiện
 * để chơi. Mọi hàm ở đây nuốt lỗi và báo "không nối được" — mất mạng hay tắt máy
 * chủ thì trang vẫn phải dùng được, không được trắng màn hình.
 *
 * Kênh nằm ngay trong máy chủ của chính ứng dụng (`/api/su-kien`) nên không cần
 * biết địa chỉ máy chủ riêng nào — cùng gốc với trang đang mở.
 */

export type TinTrongPhong =
  | { loai: "da-noi"; phong: string }
  | { loai: "nguoi-choi-vao"; tenRutGon: string }
  | { loai: "dem-nguoc"; con: number }
  | { loai: "bat-dau"; luotId: number; batDauLuc: number; thamSo: RoundSettings }
  | {
      loai: "ket-qua";
      luotId: number;
      soDaDung: number;
      trung: boolean;
      khoangLech: number;
      hetGio: boolean;
      maXacThuc: string;
      tenRutGon: string;
      tenGiaiThuong: string;
      /**
       * VÁN đã chốt hẳn chưa.
       *
       * 🔴 Tin này vẫn phải phát khi ván CHƯA chốt. Không phát thì màn hình lớn
       * đứng hình giữa hai lần bấm, chạy hết giờ rồi tự về màn chờ — tức là đá
       * người đang chơi ra khỏi ván của chính họ, mà chẳng ai hiểu vì sao.
       */
      vanXong: boolean;
      lanDaDung: number;
      soLanChoPhep: number;
      lechTotNhat: number | null;
      soTotNhat: number | null;
    }
  /**
   * GAME CHỌN SỐ — hai loại tin RIÊNG, cố ý không nhồi vào `bat-dau`/`ket-qua`.
   *
   * 🔴 Vì sao: tin `ket-qua` mang 15 trường, BẢY trong đó là khái niệm trúng/quà
   * (`trung`, `khoangLech`, `tenGiaiThuong`, `lechTotNhat`, `soTotNhat`…). Nhồi
   * Chọn Số vào đó là để lại bảy trường nói dối trong mỗi gói tin. Và vì hai
   * game dùng hai bộ component riêng, tin mới không bao giờ tới màn hình của
   * Trúng Số — chúng rơi vào `default: return` mà không gây tác dụng phụ nào.
   */
  | {
      loai: "bat-dau-chon-so";
      luotId: number;
      batDauLuc: number;
      nhip: RoundSettings;
      /**
       * Ảnh chụp VÒNG CHẠY tại lúc mở lượt. Hai màn hình dựng lại vòng bằng
       * chính `vongChay()` rồi tự chạy — chỉ MỐC BẮT ĐẦU đi qua mạng, không
       * phải từng khung hình.
       */
      dai: { tu: number; den: number };
      daRa: number[];
    }
  | {
      loai: "ket-qua-chon-so";
      luotId: number;
      so: number;
      maXacThuc: string;
      tenRutGon: string;
      /** Còn bao nhiêu số chưa phát. `null` khi không bật loại trừ. */
      conLai: number | null;
      giayXemKetQua: number;
    }
  /**
   * GAME VÒNG QUAY (ADR-011) — hai loại tin RIÊNG, cùng lý do với Chọn Số.
   *
   * 🔴 Chỉ MỐC BẮT ĐẦU + GÓC DỪNG đi qua mạng, không phải từng khung hình. Ở
   * mạng wifi trung tâm, truyền khung hình vừa nghẽn vừa lệch nhịp; cách này
   * khiến độ trễ mạng chỉ làm lệch phần ĐANG QUAY, còn ô dừng thì khớp 100%.
   *
   * 🔴 Đây là file DÙNG CHUNG của cả ba game. Union kiểu chỉ ảnh hưởng lúc biên
   * dịch, và tin mới không bao giờ tới màn hình hai game kia — chúng rơi vào
   * `default: return` mà không gây tác dụng phụ nào.
   */
  | {
      loai: "bat-dau-quay";
      luotId: number;
      /** Mốc theo đồng hồ MÁY CHỦ. Máy khách quy đổi bằng `lech` đã đo. */
      batDauLuc: number;
      gocDung: number;
      thoiLuong: number;
      phienBanO: number;
      cung: Cung[];
      tenRutGon: string;
    }
  | {
      loai: "ket-qua-quay";
      luotId: number;
      oTen: string;
      oMau: string;
      maXacThuc: string;
      tenRutGon: string;
    }
  | { loai: "roi-di" }
  /**
   * Chương trình vừa bị tắt hoặc bật lại. Điện thoại LUÔN mở kênh này (không phụ
   * thuộc đang ở bước nào), nên máy đang kẹt ở màn "Chưa chơi được" vẫn nhận
   * được và tự thoát ra — không bắt phụ huynh tải lại trang.
   */
  | { loai: "trang-thai"; dangChay: boolean };

export function moKenh(
  phong: string,
  khiCoTin: (tin: TinTrongPhong) => void,
  khiDoiTrangThai?: (daNoi: boolean) => void,
): () => void {
  if (typeof EventSource === "undefined" || phong === "") {
    khiDoiTrangThai?.(false);
    return () => {};
  }

  let nguon: EventSource | null = null;
  try {
    nguon = new EventSource(`/api/su-kien?phong=${encodeURIComponent(phong)}`);
  } catch {
    khiDoiTrangThai?.(false);
    return () => {};
  }

  nguon.onopen = () => khiDoiTrangThai?.(true);
  nguon.onerror = () => khiDoiTrangThai?.(false);
  nguon.onmessage = (tin) => {
    try {
      khiCoTin(JSON.parse(tin.data) as TinTrongPhong);
    } catch {
      // Gói tin hỏng thì bỏ qua, không được làm sập màn hình đang chiếu.
    }
  };

  return () => nguon?.close();
}
