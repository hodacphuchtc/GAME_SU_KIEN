"use client";

import type { PointerEvent } from "react";

import { T } from "@/config/locale";

export type PlayButtonMode = "start" | "locked" | "stop";

export interface PlayButtonProps {
  mode: PlayButtonMode;
  /** Phần trăm đã tăng tốc (0..1) — vẽ vòng sáng lúc nút còn khoá. */
  lockProgress?: number;
  onPress: (event: PointerEvent<HTMLButtonElement>) => void;
}

const LABEL: Record<PlayButtonMode, string> = {
  start: T.start,
  locked: T.speedingUp,
  stop: T.stop,
};

export function PlayButton({ mode, lockProgress = 0, onPress }: PlayButtonProps) {
  const locked = mode === "locked";
  const percent = Math.round(Math.min(1, Math.max(0, lockProgress)) * 100);

  return (
    <button
      type="button"
      // pointerdown chứ không phải click: click chỉ nổ khi NHẤC ngón tay lên,
      // tức là cộng thêm cả thời gian giữ nút vào độ trễ — với trò bấm phản xạ
      // thì đó là khác biệt sống còn.
      onPointerDown={onPress}
      disabled={locked}
      aria-live="polite"
      className={[
        "relative w-full overflow-hidden rounded-3xl py-8 text-3xl font-black tracking-widest",
        "transition-transform duration-100 active:scale-[0.98]",
        "focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white/70",
        locked
          ? "cursor-not-allowed bg-nen-nhat text-chu-mo"
          : mode === "stop"
            ? "nhip-tim bg-led text-white"
            : "bg-vang text-black shadow-[0_0_36px_rgba(255,197,49,0.35)]",
      ].join(" ")}
    >
      {locked && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-led-mo transition-[width] duration-100"
          style={{ width: `${percent}%` }}
        />
      )}
      <span className="relative">{LABEL[mode]}</span>
    </button>
  );
}
