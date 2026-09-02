import Link from "next/link";

import { T } from "@/config/locale";

/**
 * Nút mở MÀN HÌNH LCD của một chương trình, dùng chung cho CẢ BA GAME.
 *
 * 🔴 Route `/man-hinh/[ma]` đã tự rẽ nhánh theo `chuong_trinh.tro_choi` (ADR-011),
 * nên nút này không cần biết game nào — và đó chính là lý do nó tách được ra đây.
 * Trước đó nó là một thẻ `<a>` viết thẳng trong trang Trúng Số; hai game kia không
 * có nút này chỉ vì chưa ai chép sang.
 *
 * Mở TAB MỚI có chủ đích: nhân viên đang ở màn quản trị để tạo chương trình, còn
 * màn LCD thì kéo sang máy chiếu và để đó suốt buổi. Thay tab hiện tại là bắt họ
 * bấm quay lại mỗi lần muốn xem danh sách.
 */
export function NutManHinh({ ma }: { ma: string }) {
  return (
    <Link
      href={`/man-hinh/${ma}`}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl bg-tim px-5 py-3 text-sm font-black text-white"
    >
      {T.detailOpenScreen}
    </Link>
  );
}
