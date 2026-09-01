"use client";

import { useOptimistic, useTransition } from "react";

import type { CoVan } from "@/lib/luot/kho-luot";
import { datCoVanAction } from "@/app/actions/luot";

/**
 * Ô tích trên từng dòng lịch sử (mỗi dòng là MỘT VÁN) — dùng chung cho "đã trao quà" và "đã ghi danh".
 *
 * Dùng `useOptimistic` để ô đổi trạng thái NGAY khi bấm: nhân viên ngồi quầy
 * tích một loạt, chờ máy chủ trả lời từng ô thì họ sẽ bấm đúp và tích nhầm dòng
 * bên cạnh.
 */
export function OTichVan({
  vanId,
  ma,
  coVan,
  banDau,
  nhan,
}: {
  vanId: number;
  ma: string;
  coVan: CoVan;
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
            void datCoVanAction(vanId, coVan, gt, ma);
          });
        }}
        className="h-4 w-4 cursor-pointer accent-tim disabled:opacity-50"
      />
    </label>
  );
}
