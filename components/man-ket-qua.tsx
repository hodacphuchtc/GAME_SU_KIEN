"use client";

import { useEffect, useState } from "react";

import { NEAR_MISS_THRESHOLD, WIN_VALID_SECONDS } from "@/config/game";
import { T } from "@/config/locale";
import { formatNumber, type RoundResult } from "@/lib/bo-dem";
import { verifyCode } from "@/lib/ma-xac-thuc";
import { Led4Digits } from "@/components/led-4-so";

const CONFETTI_COLORS = ["#ff2f2f", "#ffc531", "#33d17a", "#4aa8ff", "#ffffff"];

/**
 * Pháo giấy sinh bằng công thức TẤT ĐỊNH thay vì Math.random(): vẫn trông ngẫu
 * nhiên, nhưng không đụng hàm không thuần trong lúc vẽ và không lệch giữa
 * bản dựng sẵn với bản chạy trên máy người dùng.
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CONFETTI_PIECES = Array.from({ length: 44 }, (_, i) => ({
  key: i,
  left: pseudoRandom(i + 1) * 100,
  drift: (pseudoRandom(i + 41) - 0.5) * 160,
  spin: 360 + pseudoRandom(i + 97) * 900,
  delay: pseudoRandom(i + 173) * 1.4,
  duration: 2.2 + pseudoRandom(i + 251) * 1.8,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI_PIECES.map((piece) => (
        <span
          key={piece.key}
          className="phao-giay"
          style={
            {
              left: `${piece.left}%`,
              background: piece.color,
              "--troi": `${piece.drift}px`,
              "--xoay": `${piece.spin}deg`,
              "--cho": `${piece.delay}s`,
              "--lau": `${piece.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export interface ResultScreenProps {
  result: RoundResult;
  target: number;
  prizeName: string;
  onPlayAgain: () => void;
}

export function ResultScreen({
  result,
  target,
  prizeName,
  onPlayAgain,
}: ResultScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(WIN_VALID_SECONDS);
  const [code, setCode] = useState(() => verifyCode(target));

  useEffect(() => {
    if (!result.win) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const passed = Math.floor((Date.now() - startedAt) / 1000);
      setSecondsLeft(Math.max(0, WIN_VALID_SECONDS - passed));
      // Mã đổi theo PHÚT, nên phải tính lại liên tục thì mới luôn khớp với mã
      // đang hiện trên trang cài đặt của nhân viên.
      setCode(verifyCode(target));
    }, 500);
    return () => window.clearInterval(timer);
  }, [result.win, target]);

  if (result.win) {
    const expired = secondsLeft <= 0;
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-5 py-8 text-center">
        <Confetti />
        <p className="text-4xl font-black tracking-wide text-vang">{T.congrats}</p>
        <p className="text-chu-mo">{T.wonExact}</p>
        <Led4Digits value={formatNumber(result.value)} size="medium" />
        <p className="text-xl font-bold text-luc">
          {T.prizeLabel}: <span className="text-vang">{prizeName}</span>
        </p>

        <div
          className={[
            "w-full max-w-sm rounded-2xl border p-4",
            expired ? "border-vien bg-nen-nhat" : "border-luc/50 bg-luc/10",
          ].join(" ")}
        >
          {expired ? (
            <p className="text-sm text-chu-mo">{T.expired}</p>
          ) : (
            <>
              <p className="text-sm font-semibold">{T.showToStaff}</p>
              <p className="mt-1 text-sm text-chu-mo">
                {T.validFor}{" "}
                <span className="font-mono text-lg font-bold text-chu">
                  {secondsLeft}
                </span>{" "}
                {T.seconds}
              </p>
              <p className="mt-3 text-xs uppercase tracking-widest text-chu-mo">
                {T.verifyCode}
              </p>
              <p className="font-mono text-3xl font-black tracking-[0.35em] text-luc">
                {code}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onPointerDown={onPlayAgain}
          className="mt-2 w-full max-w-sm rounded-2xl bg-nen-nhat py-4 text-lg font-bold text-chu ring-1 ring-vien active:scale-[0.98]"
        >
          {T.playAgain}
        </button>
      </div>
    );
  }

  const near = result.distance <= NEAR_MISS_THRESHOLD;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-8 text-center">
      <p className="text-3xl font-black tracking-wide text-chu-mo">{T.lost}</p>
      <p className="text-chu-mo">{result.timedOut ? T.timedOut : T.youStoppedAt}</p>
      <Led4Digits value={formatNumber(result.value)} size="medium" />
      <p className={near ? "text-2xl font-black text-vang" : "text-2xl font-bold text-chu"}>
        {T.offByN(result.distance)}
      </p>
      <p className="text-chu-mo">{near ? T.soClose : T.stillFar}</p>
      <button
        type="button"
        onPointerDown={onPlayAgain}
        className="mt-2 w-full max-w-sm rounded-2xl bg-vang py-5 text-xl font-black text-black active:scale-[0.98]"
      >
        {T.tryAgain}
      </button>
    </div>
  );
}
