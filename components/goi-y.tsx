"use client";

import { T } from "@/config/locale";

/**
 * Dấu `?` cạnh một nhãn: bấm vào thì hiện giải thích **đặt số này thì điều gì
 * xảy ra** — không phải định nghĩa lại tên ô.
 *
 * 🔴 Dùng `<details>`/`<summary>` gốc của trình duyệt, không thư viện, không tự
 * viết bẫy tiêu điểm: `Esc` đóng, bàn phím đi tới được, trình đọc màn hình hiểu
 * ngay, và nó chạy cả khi JavaScript chưa kịp tải. Một popover tự viết phải làm
 * lại đúng bốn thứ đó và thường quên mất ba.
 */
export function GoiY({ chu }: { chu: string }) {
  return (
    <details className="relative inline-block align-middle">
      <summary
        aria-label={T.goiYNhan}
        className="ml-1.5 inline-flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border border-ke text-xs font-bold text-chi transition hover:border-tim hover:text-tim"
      >
        ?
      </summary>
      {/* 🔴 Trên ĐIỆN THOẠI: `fixed` cách đều hai mép, nổi ở đáy màn như một tấm
          thẻ. Bản đầu neo `absolute left-0` vào chính dấu `?`, và với dấu `?`
          nằm gần mép phải thì khối tràn ra ngoài khung 70px — chữ bị cắt mất
          một phần mà không cuộn ngang tới được. Chỉ đo trên khung 390px mới
          thấy; trên màn rộng nó hoàn toàn bình thường.
          Từ `sm` trở lên mới quay về popover neo cạnh dấu `?`. */}
      <span className="fixed inset-x-3 bottom-4 z-20 block rounded-xl border border-ke bg-white p-3 text-xs font-normal leading-relaxed text-muc shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-7 sm:w-72">
        {chu}
      </span>
    </details>
  );
}
