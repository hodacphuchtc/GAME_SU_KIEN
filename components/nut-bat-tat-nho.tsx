"use client";

import { useTransition } from "react";

import { T } from "@/config/locale";
import { datTrangThaiChuongTrinh } from "@/app/actions/chuong-trinh";

/**
 * Bản gọn của `NutBatTat` cho từng dòng trong danh sách.
 *
 * Vì sao cũng đặt ở đây chứ không chỉ ở trang chi tiết: nhân viên mở danh sách
 * TRƯỚC, và khi cần tắt gấp thì đây là chỗ họ đang đứng.
 */
export function NutBatTatNho({ ma, dangChay }: { ma: string; dangChay: boolean }) {
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
        "rounded-lg border px-2.5 py-1 text-xs font-bold transition disabled:opacity-50",
        dangChay ? "border-do/40 text-do hover:bg-do/10" : "border-luc/40 text-luc hover:bg-luc/10",
      ].join(" ")}
    >
      {dangChay ? T.listTurnOff : T.listTurnOn}
    </button>
  );
}
