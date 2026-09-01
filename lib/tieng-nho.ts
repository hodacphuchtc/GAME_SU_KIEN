"use client";

import { useSyncExternalStore } from "react";

/**
 * Nhớ trạng thái BẬT/TẮT tiếng qua `localStorage`, đọc bằng
 * `useSyncExternalStore` chứ không phải setState-trong-effect.
 *
 * Vì sao phải nhớ: màn hình LCD treo ở sảnh chạy suốt ngày và thỉnh thoảng bị
 * tải lại (mất điện, ai đó bấm F5). Không nhớ thì mỗi lần tải lại là tiếng tự
 * bật lên giữa giờ học, hoặc tự tắt mà không ai để ý cả buổi.
 *
 * Vì sao KHÔNG dùng `useState` + `useEffect`: bản dựng sẵn trên máy chủ không
 * đọc được `localStorage`, nên giá trị đầu buộc phải là mặc định rồi mới sửa
 * lại — đúng cái vòng render thừa mà quy tắc lint của dự án chặn.
 *
 * Bọc try/catch: chế độ riêng tư của Safari ném ngay khi ĐỌC `localStorage`.
 * Một màn hình LCD không được phép trắng chỉ vì cái công tắc âm thanh.
 */
const KHOA = "game-su-kien.tat-tieng";

const nguoiNghe = new Set<() => void>();

function dangKy(goiLai: () => void): () => void {
  nguoiNghe.add(goiLai);
  return () => nguoiNghe.delete(goiLai);
}

/**
 * 🔴 CHƯA LƯU GÌ = TẮT TIẾNG. Chỉ chuỗi `"0"` mới có nghĩa là bật.
 *
 * Hai lý do, và cả hai đều quan trọng hơn sự tiện tay:
 *
 * 1. Máy chủ dựng sẵn trang với TẮT (nó không đọc được `localStorage`). Nếu
 *    máy khách mặc định BẬT thì hai bên lệch nhau ngay ở khung hình đầu tiên.
 * 2. Màn hình này treo giữa sảnh. Hướng lệch an toàn là im lặng, không phải là
 *    bất ngờ phát ra tiếng giữa giờ học của lớp bên cạnh.
 */
function docTuKho(): boolean {
  try {
    return window.localStorage.getItem(KHOA) !== "0";
  } catch {
    return true;
  }
}

/**
 * Máy chủ dựng sẵn với TẮT TIẾNG.
 *
 * Cố ý chọn "tắt" làm giá trị của bản dựng sẵn: nếu có lệch một khoảnh khắc
 * giữa bản dựng và bản chạy thì hướng lệch an toàn là im lặng, không phải là
 * bất ngờ phát ra tiếng giữa sảnh.
 */
const TREN_MAY_CHU = true;

export function useTatTieng(): boolean {
  return useSyncExternalStore(dangKy, docTuKho, () => TREN_MAY_CHU);
}

export function luuTatTieng(tat: boolean): void {
  try {
    window.localStorage.setItem(KHOA, tat ? "1" : "0");
  } catch {
    // Không lưu được thì thôi — phiên này vẫn đúng, chỉ là không nhớ sang lần sau.
  }
  for (const goiLai of nguoiNghe) goiLai();
}
