"use client";

import type { RoundSettings } from "@/config/game";

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
