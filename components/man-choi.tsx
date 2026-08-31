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
import { newClientId, relayBase, sendToRoom } from "@/lib/ket-noi";
import { verifyCode } from "@/lib/ma-xac-thuc";
import { useClientString } from "@/lib/tren-may-khach";
import { VIBRATE_LOSE, VIBRATE_PRESS, VIBRATE_WIN, vibrate } from "@/lib/rung";
import { Led4Digits } from "@/components/led-4-so";
import { PlayButton, type PlayButtonMode } from "@/components/nut-choi";
import { ResultScreen } from "@/components/man-ket-qua";

type Phase = "idle" | "countdown" | "running" | "result";

/** Trạng thái chiếu song song lên màn hình LCD của trung tâm. */
type MirrorState = "off" | "on" | "busy";

/**
 * Định danh của MÁY NÀY trong MỘT phiên — để máy chủ trung chuyển biết ai đang
 * giữ lượt. Không phải danh tính người dùng, không lưu đi đâu, đóng tab là mất.
 */
let cachedClientId: string | null = null;
function sessionClientId(): string {
  if (cachedClientId === null) cachedClientId = newClientId();
  return cachedClientId;
}

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
  const [mirror, setMirror] = useState<MirrorState>("off");

  const base = useClientString(() => relayBase(window.location));
  const clientId = useClientString(sessionClientId);
  const room = config.room;
  const mirrorRef = useRef<MirrorState>("off");

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

  /** Đẩy một diễn biến lên màn hình lớn. Thất bại thì im lặng — ván vẫn chạy. */
  const pushToScreen = useCallback(
    (event: Parameters<typeof sendToRoom>[3]) => {
      if (room === "" || base === "" || mirrorRef.current !== "on") return;
      void sendToRoom(base, room, clientId, event);
    },
    [base, clientId, room],
  );

  const finish = useCallback(
    (seconds: number, timedOut: boolean) => {
      cancelAnimationFrame(rafRef.current);
      const round = resolveRound(settings, config.target, seconds, timedOut);
      setResult(round);
      setPhase("result");
      pushToScreen({
        type: "ket-qua",
        value: round.value,
        target: round.target,
        win: round.win,
        distance: round.distance,
        timedOut: round.timedOut,
        prizeName: config.prizeName,
        code: verifyCode(round.target),
      });
      if (round.win) {
        soundRef.current?.win();
        vibrate(VIBRATE_WIN);
      } else {
        soundRef.current?.lose();
        vibrate(VIBRATE_LOSE);
      }
    },
    [config.prizeName, config.target, pushToScreen, settings],
  );

  const beginRun = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    unlockAnnouncedRef.current = false;
    startedAtRef.current = performance.now();
    setFrame({ value: 0, elapsed: 0 });
    setPhase("running");
    pushToScreen({ type: "bat-dau", target: config.target, settings });

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
  }, [config.target, finish, pushToScreen, settings]);

  const startRound = useCallback(() => {
    soundRef.current?.ensureStarted();
    vibrate(VIBRATE_PRESS);
    setResult(null);

    // Xin một lượt trên màn hình lớn. Không xin được cũng KHÔNG cản ván chơi —
    // chiếu lên LCD là phần thưởng thêm, không phải điều kiện.
    if (room !== "" && base !== "") {
      void sendToRoom(base, room, clientId, { type: "xin-choi" }).then((reply) => {
        const next: MirrorState = !reply.ok ? "off" : reply.duocChoi ? "on" : "busy";
        mirrorRef.current = next;
        setMirror(next);
      });
    }
    if (settings.countdownSeconds <= 0) {
      beginRun();
      return;
    }
    setCountdownLeft(settings.countdownSeconds);
    setPhase("countdown");
  }, [base, beginRun, clientId, room, settings.countdownSeconds]);

  // Đếm ngược 3 – 2 – 1 rồi thả bảng số chạy.
  useEffect(() => {
    if (phase !== "countdown") return;
    soundRef.current?.countdown(false);
    pushToScreen({ type: "dem-nguoc", con: countdownLeft });
    const timer = window.setTimeout(() => {
      if (countdownLeft <= 1) {
        soundRef.current?.countdown(true);
        beginRun();
      } else {
        setCountdownLeft(countdownLeft - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdownLeft, beginRun, pushToScreen]);

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

      {room !== "" && mirror !== "off" && (
        <p
          className={[
            "mx-5 mt-3 rounded-xl px-3 py-2 text-center text-xs font-semibold",
            mirror === "on" ? "bg-luc/15 text-luc" : "bg-vang/15 text-vang",
          ].join(" ")}
        >
          {mirror === "on" ? T.mirrorOn : T.mirrorBusy}
        </p>
      )}

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
