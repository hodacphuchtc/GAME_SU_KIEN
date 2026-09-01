"use client";

import { useOptimistic, useTransition } from "react";

import type { CoLuot } from "@/lib/luot/kho-luot";
import { datCoLuotAction } from "@/app/actions/luot";

/**
 * Ô tích trên từng dòng lịch sử — dùng chung cho "đã trao quà" và "đã ghi danh".
 *
 * Dùng `useOptimistic` để ô đổi trạng thái NGAY khi bấm: nhân viên ngồi quầy
 * tích một loạt, chờ máy chủ trả lời từng ô thì họ sẽ bấm đúp và tích nhầm dòng
 * bên cạnh.
 */
export function OTichLuot({
  luotId,
  ma,
  coLuot,
  banDau,
  nhan,
}: {
  luotId: number;
  ma: string;
  coLuot: CoLuot;
  banDau: boolean;
  nhan: string;
}) {
  const [dangGui, batDau] = useTransition();
  const [tich, datTich] = useOptimistic(banDau);

  return (
    <label className="inline-flex cursor-pointer items-center" title={nhan}>
      <input
        type="checkbox"
        checked={tich}
        disabled={dangGui}
        aria-label={nhan}
        onChange={(e) => {
          const gt = e.target.checked;
          batDau(() => {
            datTich(gt);
            void datCoLuotAction(luotId, coLuot, gt, ma);
          });
        }}
        className="h-4 w-4 cursor-pointer accent-tim disabled:opacity-50"
      />
    </label>
  );
}
