/**
 * LÕI VÒNG QUAY — hàm THUẦN của thời gian, không đụng cơ sở dữ liệu, không
 * `server-only`: màn LCD và điện thoại đều gọi chính file này.
 *
 * 🔴 Vì sao phải thuần: hai màn hình chỉ nhận `(gocDich, thoiLuong)` rồi mỗi
 * máy TỰ tính góc theo đồng hồ của mình. Không truyền từng khung hình qua mạng.
 * Điều kiện để chuyện đó khớp là `goc(t)` cho cùng một kết quả ở mọi máy, mọi
 * tần số quét, mọi lúc chạy lại. Lấy góc "đang vẽ" làm kết quả là sai — máy yếu
 * và máy 120Hz sẽ cho hai câu trả lời khác nhau.
 */

import { MU_GIAM_TOC, VONG_TOI_THIEU } from "@/config/vong-quay";

/** Tổng số độ phải quay để dừng đúng `gocDich`, sau khi đi trọn số vòng tối thiểu. */
export function tongGocQuay(gocDich: number): number {
  return VONG_TOI_THIEU * 360 + chuanHoaGoc(gocDich);
}

/** Đưa một góc bất kỳ về khoảng [0, 360). Nhận cả số âm. */
export function chuanHoaGoc(goc: number): number {
  const g = goc % 360;
  return g < 0 ? g + 360 : g;
}

/**
 * Góc đã quay được tại giây thứ `t` kể từ lúc bắt đầu.
 *
 * Đường giảm tốc `1 − (1−x)^n`: xuất phát nhanh nhất rồi chậm dần đều, chạm
 * đích đúng lúc `t = thoiLuong` với vận tốc bằng 0. Đơn điệu tăng, nên vòng
 * không bao giờ giật lùi — thứ mà mắt người bắt được ngay và làm mất tin tưởng.
 */
export function goc(t: number, gocDich: number, thoiLuong: number): number {
  const tong = tongGocQuay(gocDich);
  if (!(thoiLuong > 0)) return tong;
  if (t <= 0) return 0;
  if (t >= thoiLuong) return tong;
  const x = t / thoiLuong;
  return tong * (1 - Math.pow(1 - x, MU_GIAM_TOC));
}

/* ------------------------------------------------------------------------- *
 * BỐC GÓC — nơi quyết định ai nhận gì
 *
 * 🔴 Rút một góc NGẪU NHIÊN ĐỀU trên [0°, 360°) rồi xem kim rơi vào cung nào.
 * Nhờ vậy "cung rộng bao nhiêu thì cơ hội bấy nhiêu" KHÔNG phải một luật ai đó
 * phải nhớ mà tuân thủ — nó là đồng nhất thức toán học. Không tồn tại một con
 * số trọng số nào để mà chỉnh lén, bởi vì không có trọng số.
 *
 * Ngẫu nhiên THẬT lấy từ `crypto.getRandomValues` lúc mở lượt và lưu lại thành
 * `hat_giong`; hàm dưới đây chỉ làm việc biến hạt giống đó thành góc một cách
 * TẤT ĐỊNH — đó là thứ khiến mọi ván dựng lại được về sau.
 * ------------------------------------------------------------------------- */

/** Băm chuỗi thành 32 bit. Bản rút gọn của xmur3 — thuần, không phụ thuộc gì. */
function bam32(chuoi: string): number {
  let h = 1779033703 ^ chuoi.length;
  for (let i = 0; i < chuoi.length; i++) {
    h = Math.imul(h ^ chuoi.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * Hạt giống → một góc trong [0, 360). Cùng hạt luôn cho cùng góc.
 *
 * Đây là hàm để DỰNG LẠI ván cũ, không phải nguồn ngẫu nhiên. Nguồn ngẫu nhiên
 * là `crypto.getRandomValues` ở chỗ sinh ra hạt giống.
 */
export function bocGoc(hatGiong: string): number {
  return (bam32(hatGiong) / 4294967296) * 360;
}
