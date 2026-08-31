"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { T } from "@/config/locale";
import {
  canStop,
  formatNumber,
  resolveRound,
  speedAt,
  valueAt,
  type RoundResult,
} from "@/lib/bo-dem";
import { createSoundEngine, type SoundEngine } from "@/lib/am-thanh";
import { parseGameConfig } from "@/lib/cau-hinh-url";
import { VIBRATE_LOSE, VIBRATE_PRESS, VIBRATE_WIN, vibrate } from "@/lib/rung";
import { Led4Digits } from "@/components/led-4-so";
import { PlayButton, type PlayButtonMode } from "@/components/nut-choi";
import { ResultScreen } from "@/components/man-ket-qua";

type Phase = "idle" | "countdown" | "running" | "result";

/**
 * Một số trình duyệt cũ đặt `event.timeStamp` theo mốc 1970 thay vì mốc mở
 * trang. Lệch quá ngần này thì không tin nữa, quay về `performance.now()`.
 */
const TIMESTAMP_TRUST_MS = 5000;

export function GameScreen() {
  // Cấu hình ván chơi nằm ngay trong query string của mã QR dán tại quầy.
  const searchParams = useSearchParams();
  const config = useMemo(() => parseGameConfig(searchParams), [searchParams]);
  const settings = config.settings;

  const [phase, setPhase] = useState<Phase>("idle");
  const [countdownLeft, setCountdownLeft] = useState(0);
  const [frame, setFrame] = useState({ value: 0, elapsed: 0 });
  const [result, setResult] = useState<RoundResult | null>(null);
  const [muted, setMuted] = useState(false);

  const startedAtRef = useRef(0);
  const rafRef = useRef(0);
  const unlockAnnouncedRef = useRef(false);
  const soundRef = useRef<SoundEngine | null>(null);

  useEffect(() => {
    const engine = createSoundEngine();
    soundRef.current = engine;
    return () => {
      cancelAnimationFrame(rafRef.current);
      engine.dispose();
      soundRef.current = null;
    };
  }, []);

  const finish = useCallback(
    (seconds: number, timedOut: boolean) => {
      cancelAnimationFrame(rafRef.current);
      const round = resolveRound(settings, config.target, seconds, timedOut);
      setResult(round);
      setPhase("result");
      if (round.win) {
        soundRef.current?.win();
        vibrate(VIBRATE_WIN);
      } else {
        soundRef.current?.lose();
        vibrate(VIBRATE_LOSE);
      }
    },
    [config.target, settings],
  );

  const beginRun = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    unlockAnnouncedRef.current = false;
    startedAtRef.current = performance.now();
    setFrame({ value: 0, elapsed: 0 });
    setPhase("running");

    function loop() {
      const elapsed = (performance.now() - startedAtRef.current) / 1000;

      if (elapsed >= settings.roundLimitSeconds) {
        finish(settings.roundLimitSeconds, true);
        return;
      }
      if (!unlockAnnouncedRef.current && canStop(settings, elapsed)) {
        unlockAnnouncedRef.current = true;
        soundRef.current?.unlocked();
        vibrate(VIBRATE_PRESS);
      }

      setFrame({ value: valueAt(settings, elapsed), elapsed });
      soundRef.current?.tick(speedAt(settings, elapsed) / settings.maxSpeed);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [finish, settings]);

  const startRound = useCallback(() => {
    soundRef.current?.ensureStarted();
    vibrate(VIBRATE_PRESS);
    setResult(null);
    if (settings.countdownSeconds <= 0) {
      beginRun();
      return;
    }
    setCountdownLeft(settings.countdownSeconds);
    setPhase("countdown");
  }, [beginRun, settings.countdownSeconds]);

  // Đếm ngược 3 – 2 – 1 rồi thả bảng số chạy.
  useEffect(() => {
    if (phase !== "countdown") return;
    soundRef.current?.countdown(false);
    const timer = window.setTimeout(() => {
      if (countdownLeft <= 1) {
        soundRef.current?.countdown(true);
        beginRun();
      } else {
        setCountdownLeft(countdownLeft - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdownLeft, beginRun]);

  const stopNow = useCallback(
    (rawTimestamp: number) => {
      const now = performance.now();
      const stamp =
        Number.isFinite(rawTimestamp) &&
        Math.abs(rawTimestamp - now) < TIMESTAMP_TRUST_MS
          ? rawTimestamp
          : now;
      const elapsed = Math.min(
        settings.roundLimitSeconds,
        (stamp - startedAtRef.current) / 1000,
      );
      if (!canStop(settings, elapsed)) return;
      vibrate(VIBRATE_PRESS);
      finish(elapsed, false);
    },
    [finish, settings],
  );

  const handlePress = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (phase === "idle") {
        startRound();
        return;
      }
      // 🔴 Lấy mốc thời gian của CHÍNH sự kiện chạm, không lấy con số đang vẽ:
      // máy lag hay máy 120Hz đều cho cùng một kết quả.
      if (phase === "running") stopNow(event.nativeEvent.timeStamp);
    },
    [phase, startRound, stopNow],
  );

  // Bàn phím: phím cách / Enter cho máy có bàn phím rời hoặc nút bấm USB.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      if (event.repeat) return;
      event.preventDefault();
      if (phase === "result") setPhase("idle");
      else if (phase === "idle") startRound();
      else if (phase === "running") stopNow(event.timeStamp);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, startRound, stopNow]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    soundRef.current?.setMuted(next);
    setMuted(next);
  }, [muted]);

  const playAgain = useCallback(() => setPhase("idle"), []);

  const locked = phase === "running" && !canStop(settings, frame.elapsed);
  const buttonMode: PlayButtonMode =
    phase === "running" ? (locked ? "locked" : "stop") : "start";
  const secondsLeft = Math.max(
    0,
    Math.ceil(settings.roundLimitSeconds - frame.elapsed),
  );
  const shownValue = formatNumber(phase === "running" ? frame.value : 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between gap-2 px-5 pt-5 text-sm">
        <span className="truncate font-semibold text-chu-mo">{config.centerName}</span>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
            className="rounded-lg px-2 py-1 text-base ring-1 ring-vien"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <Link href="/the-le/" className="text-chu-mo underline underline-offset-4">
            {T.rulesLink}
          </Link>
        </div>
      </header>

      {phase === "result" && result ? (
        <ResultScreen
          result={result}
          target={config.target}
          prizeName={config.prizeName}
          onPlayAgain={playAgain}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-6 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-chu-mo">
              {T.targetLabel}
            </p>
            <p className="mt-1 font-mono text-5xl font-black tracking-[0.2em] text-vang">
              {formatNumber(config.target)}
            </p>
          </div>

          <Led4Digits value={shownValue} label={`Bảng số ${shownValue}`} />

          <div className="min-h-12">
            {phase === "countdown" ? (
              <p className="text-6xl font-black text-vang">{countdownLeft}</p>
            ) : phase === "running" ? (
              <p className="text-sm text-chu-mo">
                {locked ? T.hintLocked : `${T.timeLeft} ${secondsLeft} ${T.seconds}`}
              </p>
            ) : (
              <p className="text-sm text-chu-mo">{T.hint}</p>
            )}
          </div>
        </div>
      )}

      {phase !== "result" && (
        <div className="px-5 pb-8">
          <PlayButton
            mode={buttonMode}
            lockProgress={
              settings.lockSeconds > 0 ? frame.elapsed / settings.lockSeconds : 1
            }
            onPress={handlePress}
          />
        </div>
      )}
    </main>
  );
}
