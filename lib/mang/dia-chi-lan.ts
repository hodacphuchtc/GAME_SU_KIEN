import "server-only";

import { networkInterfaces } from "node:os";

/**
 * Địa chỉ IP trong mạng nội bộ của máy đang chạy máy chủ.
 *
 * 🔴 Vì sao cần: màn LCD sinh mã QR từ `window.location.origin`. Người vận hành
 * mở màn hình bằng `localhost:3111` thì QR mã hoá `http://localhost:3111/choi/…`,
 * và điện thoại quét vào thì `localhost` trỏ về **chính chiếc điện thoại đó**.
 * Trang vẫn hiện QR đẹp đẽ, không một dòng cảnh báo — đây là lỗi đầu tiên gặp
 * phải trong buổi test thật 02/09/2026.
 *
 * Trình duyệt không có cách nào biết IP LAN của máy chủ, nên con số này phải đi
 * từ máy chủ xuống. Trả `null` khi máy không có card mạng nào ra ngoài (máy ảo,
 * máy rút dây) — nơi gọi phải chịu được ca đó.
 */
export function diaChiLan(): string | null {
  for (const ds of Object.values(networkInterfaces())) {
    for (const net of ds ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}
