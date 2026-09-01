"use client";

import { useOptimistic, useTransition } from "react";

import { T } from "@/config/locale";
import { datGhiDanhLuot } from "@/app/actions/luot";

/**
 * Ô tích "đã ghi danh" trên từng dòng lịch sử.
 *
 * Dùng `useOptimistic` để ô đổi trạng thái NGAY khi bấm: nhân viên đang ngồi
 * quầy tích một loạt, chờ máy chủ trả lời từng ô thì họ sẽ bấm đúp và tích nhầm
 * dòng bên cạnh.
 */
export function OGhiDanh({
  luotId,
  ma,
  banDau,
}: {
  luotId: number;
  ma: string;
  banDau: boolean;
}) {
  const [dangGui, batDau] = useTransition();
  const [tich, datTich] = useOptimistic(banDau);

  return (
    <label className="inline-flex cursor-pointer items-center" title={T.enrollToggle}>
      <input
        type="checkbox"
        checked={tich}
        disabled={dangGui}
        aria-label={T.enrollToggle}
        onChange={(e) => {
          const gt = e.target.checked;
          batDau(() => {
            datTich(gt);
            void datGhiDanhLuot(luotId, gt, ma);
          });
        }}
        className="h-4 w-4 cursor-pointer accent-tim disabled:opacity-50"
      />
    </label>
  );
}
