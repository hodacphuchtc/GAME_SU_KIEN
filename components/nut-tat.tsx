"use client";

import { useTransition } from "react";

import { T } from "@/config/locale";
import { tatChuongTrinh } from "@/app/actions/chuong-trinh";

/**
 * Nút tắt khẩn cho nhân viên lễ tân.
 *
 * Phải bấm được trong 5 giây mà không cần gọi ai: hết quà, hết giờ, hay có sự
 * cố thì người trực quầy tự dừng được ngay.
 */
export function NutTat({ ma }: { ma: string }) {
  const [dangChay, batDau] = useTransition();

  return (
    <button
      type="button"
      disabled={dangChay}
      onClick={() => {
        if (!window.confirm(`${T.detailStop}?`)) return;
        batDau(() => void tatChuongTrinh(ma));
      }}
      className="rounded-xl border-2 border-do px-5 py-3 text-sm font-black text-do transition hover:bg-do hover:text-white disabled:opacity-50"
    >
      {T.detailStop}
    </button>
  );
}
