"use client";

import type { Cung } from "@/lib/vong-quay/chia-o";

/*
 * NGUỒN: cấu trúc chép từ `modules/GAME_SU_KIEN/app/lib/dong-bo/kenh.ts` @ 3d96358.
 * LOẠI TIN thì viết MỚI hoàn toàn: Vòng Quay có đúng một lần chạm, không có đếm
 * ngược, không có "hết giờ", không có nhiều lần bấm trong một ván. Chép nguyên
 * bộ tin của Trúng Số sang đây là mang theo bảy trường nói dối trong mỗi gói.
 */

/**
 * Phía máy khách của kênh đồng bộ.
 *
 * 🔴 Nguyên tắc: nối được màn hình lớn là PHẦN THƯỞNG THÊM, không phải điều kiện
 * để chơi. Mọi hàm ở đây nuốt lỗi và báo "không nối được" — mất mạng hay tắt máy
 * chủ thì điện thoại vẫn quay được, không được trắng màn hình.
 */

export type TinTrongPhong =
  | { loai: "da-noi"; phong: string }
  | { loai: "nguoi-choi-vao"; tenRutGon: string }
  /**
   * Máy chủ đã quyết kết quả. 🔴 Gói này mang `gocDung` + `batDauLuc` + `cung`,
   * và mỗi màn hình TỰ chạy `goc(t)` từ đó. Không truyền từng khung hình: ở
   * mạng wifi trung tâm thì truyền khung hình vừa nghẽn vừa lệch nhịp, còn cách
   * này khiến độ trễ mạng chỉ làm lệch phần ĐANG QUAY, còn ô dừng thì khớp 100%.
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
   * Chương trình vừa bị tắt hoặc bật lại. Màn LCD LUÔN mở kênh này nên đang
   * đứng ở màn chờ vẫn nhận được và tự đổi trạng thái — không bắt ai tải lại.
   */
  | { loai: "trang-thai"; dangChay: boolean };

/** Mở kênh nghe. Trả về hàm đóng — PHẢI gọi khi rời trang. */
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

/** Phát một tin cho cả phòng. Nuốt lỗi: phát hụt không được làm hỏng lượt chơi. */
export async function phatTin(phong: string, tin: TinTrongPhong): Promise<void> {
  try {
    await fetch(`/api/su-kien?phong=${encodeURIComponent(phong)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tin),
      cache: "no-store",
    });
  } catch {
    // Màn LCD không nghe được thì điện thoại vẫn chơi bình thường.
  }
}
