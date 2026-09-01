"use client";

import { useTransition } from "react";

import { T } from "@/config/locale";
import { datTrangThaiChuongTrinh } from "@/app/actions/chuong-trinh";

/**
 * MỘT nút cho cả hai chiều: đang chạy thì tắt, đã tắt thì bật lại.
 *
 * Trước GĐ 8.3, tắt xong nút biến thành chữ chết và muốn bật lại phải sửa thẳng
 * SQLite bằng tay — nghĩa là mỗi lần tổ chức sự kiện mới phải tạo lại chương
 * trình và in lại mã QR.
 *
 * Hỏi xác nhận CHỈ khi tắt: tắt là hành động làm gián đoạn khách đang chơi, còn
 * bật lại thì vô hại, đừng bắt người ta bấm hai lần cho một việc không mất gì.
 */
export function NutBatTat({ ma, dangChay }: { ma: string; dangChay: boolean }) {
  const [dangGui, batDau] = useTransition();

  return (
    <button
      type="button"
      disabled={dangGui}
      onClick={() => {
        if (dangChay && !window.confirm(T.detailStopConfirm)) return;
        batDau(() => void datTrangThaiChuongTrinh(ma, dangChay ? "ket_thuc" : "dang_chay"));
      }}
      className={[
        "rounded-xl px-5 py-3 text-sm font-black transition disabled:opacity-50",
        dangChay
          ? "border-2 border-do text-do hover:bg-do hover:text-white"
          : "border-2 border-luc text-luc hover:bg-luc hover:text-white",
      ].join(" ")}
    >
      {dangChay ? T.detailStop : T.detailStart}
    </button>
  );
}
