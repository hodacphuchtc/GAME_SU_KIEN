"use client";

import { useTransition } from "react";

import { T } from "@/config/locale";
import { xoaHoacAnChuongTrinh } from "@/app/actions/chuong-trinh";

/**
 * Nút dọn một chương trình. MỘT nút, hai kết cục — và người bấm biết trước mình
 * đang rơi vào kết cục nào.
 *
 * 🔴 Máy chủ mới là nơi QUYẾT xoá hay ẩn (`xoaHoacAnChuongTrinh`). Ở đây chỉ
 * dùng số ván để chọn câu hỏi cho đúng: hỏi "xoá hẳn nhé" trong khi máy chủ sắp
 * ẩn là nói dối người dùng, mà hỏi sai một lần thì lần sau họ không đọc nữa.
 */
export function NutXoaChuongTrinh({
  ma,
  ten,
  soVan,
  soGiaiDaTrao,
}: {
  ma: string;
  ten: string;
  soVan: number;
  soGiaiDaTrao: number;
}) {
  const [dangGui, batDau] = useTransition();
  const seXoaHan = soVan === 0;

  return (
    <button
      type="button"
      disabled={dangGui}
      data-nut-don={seXoaHan ? "xoa" : "an"}
      onClick={() => {
        const cau = seXoaHan
          ? T.donXacNhanXoaCt(ten)
          : T.donXacNhanAnCt(ten, soVan, soGiaiDaTrao);
        if (!window.confirm(cau)) return;
        batDau(() => void xoaHoacAnChuongTrinh(ma));
      }}
      className="rounded-lg border border-do/40 px-2.5 py-1 text-xs font-bold text-do transition hover:bg-do/10 disabled:opacity-50"
    >
      {seXoaHan ? T.donXoa : T.donAn}
    </button>
  );
}
