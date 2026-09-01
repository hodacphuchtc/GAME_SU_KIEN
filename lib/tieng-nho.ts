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
 * Đọc công tắc. **Chưa lưu gì thì trả về `macDinhTat`** — và hai màn hình cố ý
 * có mặc định NGƯỢC NHAU:
 *
 * - **Màn hình LCD: mặc định TẮT.** Nó treo giữa sảnh và chạy suốt ngày; hướng
 *   lệch an toàn là im lặng, không phải là bất ngờ phát ra tiếng giữa giờ học
 *   của lớp bên cạnh.
 * - **Điện thoại: mặc định BẬT.** Nó nằm trong tay đúng người đang chơi, và họ
 *   cầm nó lên là để chơi. Bắt họ tìm một cái nút để nghe được tiếng của trò
 *   chơi mình vừa mở là làm khó vô cớ.
 *
 * Chỉ chuỗi `"0"` nghĩa là bật, `"1"` là tắt — mọi giá trị khác coi như chưa
 * ai chọn gì.
 */
function docTuKho(macDinhTat: boolean): boolean {
  try {
    const daLuu = window.localStorage.getItem(KHOA);
    if (daLuu === "0") return false;
    if (daLuu === "1") return true;
    return macDinhTat;
  } catch {
    // Chế độ riêng tư của Safari ném ngay khi ĐỌC. Một màn hình LCD không được
    // phép trắng chỉ vì cái công tắc âm thanh.
    return macDinhTat;
  }
}

/**
 * Cửa cho bài test đọc đúng hàm mà giao diện đang dùng.
 *
 * Không bọc `useSyncExternalStore` lại được trong môi trường test thuần Node,
 * mà logic "chưa lưu gì thì lấy mặc định nào" mới là thứ đáng canh — nên phơi
 * đúng hàm thuần đó ra thay vì dựng cả một cây React chỉ để kiểm một câu if.
 */
export const docTuKhoChoTest = docTuKho;

/**
 * @param macDinhTat giá trị khi người dùng CHƯA từng chọn gì trên máy này.
 *   Bản dựng sẵn trên máy chủ cũng trả đúng giá trị này, nên hai bên không lệch
 *   nhau ở khung hình đầu tiên.
 */
export function useTatTieng(macDinhTat = true): boolean {
  return useSyncExternalStore(
    dangKy,
    () => docTuKho(macDinhTat),
    () => macDinhTat,
  );
}

export function luuTatTieng(tat: boolean): void {
  try {
    window.localStorage.setItem(KHOA, tat ? "1" : "0");
  } catch {
    // Không lưu được thì thôi — phiên này vẫn đúng, chỉ là không nhớ sang lần sau.
  }
  for (const goiLai of nguoiNghe) goiLai();
}
