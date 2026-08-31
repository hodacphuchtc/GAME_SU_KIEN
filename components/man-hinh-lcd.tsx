"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  LCD_IDLE_TIMEOUT_SECONDS,
  LCD_RESULT_SECONDS,
  NEAR_MISS_THRESHOLD,
  type RoundSettings,
} from "@/config/game";
import { T } from "@/config/locale";
import { createSoundEngine, type SoundEngine } from "@/lib/am-thanh";
import { formatNumber, speedAt, valueAt } from "@/lib/bo-dem";
import { buildPlayUrl, parseGameConfig } from "@/lib/cau-hinh-url";
import {
  randomRoomCode,
  relayBase,
  subscribeRoom,
  type RoomEvent,
} from "@/lib/ket-noi";
import { useClientString } from "@/lib/tren-may-khach";
import { Led4Digits } from "@/components/led-4-so";

type Phase = "cho" | "san-sang" | "dem-nguoc" | "chay" | "ket-qua";

/**
 * Mã phòng của LẦN MỞ MÀN HÌNH NÀY. Tính một lần rồi nhớ luôn, nên gọi bao
 * nhiêu lần trong lúc vẽ cũng ra đúng một giá trị.
 */
let cachedRoom: string | null = null;
function sessionRoom(): string {
  if (cachedRoom === null) cachedRoom = randomRoomCode();
  return cachedRoom;
}

interface ResultView {
  value: number;
  win: boolean;
  distance: number;
  timedOut: boolean;
  prizeName: string;
  code: string;
}

export function LcdScreen() {
  const searchParams = useSearchParams();
  const config = useMemo(() => parseGameConfig(searchParams), [searchParams]);

  const generatedRoom = useClientString(sessionRoom);
  const room = config.room !== "" ? config.room : generatedRoom;
  const base = useClientString(() => relayBase(window.location));
  const origin = useClientString(() => window.location.origin);

  const [phase, setPhase] = useState<Phase>("cho");
  const [connected, setConnected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [display, setDisplay] = useState(0);
  const [result, setResult] = useState<ResultView | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [soundOn, setSoundOn] = useState(false);

  const rafRef = useRef(0);
  const startedAtRef = useRef(0);
  const settingsRef = useRef<RoundSettings | null>(null);
  const soundRef = useRef<SoundEngine | null>(null);
  const lastEventRef = useRef(0);

  const playUrl = useMemo(
    () => (origin ? buildPlayUrl(origin, { ...config, room }) : ""),
    [config, origin, room],
  );

  useEffect(() => {
    const engine = createSoundEngine();
    engine.setMuted(true);
    soundRef.current = engine;
    return () => {
      cancelAnimationFrame(rafRef.current);
      engine.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!playUrl) return;
    let cancelled = false;
    QRCode.toDataURL(playUrl, { width: 900, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [playUrl]);

  const backToIdle = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    settingsRef.current = null;
    setResult(null);
    setDisplay(0);
    setPhase("cho");
  }, []);

  const animate = useCallback((settings: RoundSettings) => {
    cancelAnimationFrame(rafRef.current);
    settingsRef.current = settings;
    startedAtRef.current = performance.now();

    function loop() {
      const current = settingsRef.current;
      if (!current) return;
      const elapsed = (performance.now() - startedAtRef.current) / 1000;
      setDisplay(valueAt(current, elapsed));
      soundRef.current?.tick(speedAt(current, elapsed) / current.maxSpeed);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const handleEvent = useCallback(
    (event: RoomEvent) => {
      lastEventRef.current = Date.now();
      switch (event.type) {
        case "trang-thai":
          if (!event.ban) backToIdle();
          return;
        case "vao-phong":
          setResult(null);
          setDisplay(0);
          setPhase("san-sang");
          return;
        case "dem-nguoc":
          setCountdown(event.con);
          setPhase("dem-nguoc");
          soundRef.current?.countdown(event.con <= 1);
          return;
        case "bat-dau":
          setPhase("chay");
          animate(event.settings);
          return;
        case "ket-qua": {
          // Chốt đúng con số điện thoại đã dừng — độ trễ mạng chỉ làm lệch phần
          // nhoè ở giữa, còn kết quả cuối thì khớp tuyệt đối.
          cancelAnimationFrame(rafRef.current);
          settingsRef.current = null;
          setDisplay(event.value);
          setResult({
            value: event.value,
            win: event.win,
            distance: event.distance,
            timedOut: event.timedOut,
            prizeName: event.prizeName,
            code: event.code,
          });
          setPhase("ket-qua");
          if (event.win) soundRef.current?.win();
          else soundRef.current?.lose();
          return;
        }
        case "roi-di":
          backToIdle();
          return;
      }
    },
    [animate, backToIdle],
  );

  useEffect(() => {
    if (base === "" || room === "") return;
    lastEventRef.current = Date.now();
    return subscribeRoom(base, room, handleEvent, setConnected);
  }, [base, room, handleEvent]);

  // Về màn chờ khi hết giờ xem kết quả.
  useEffect(() => {
    if (phase !== "ket-qua" || !result) return;
    const seconds = result.win ? LCD_RESULT_SECONDS.win : LCD_RESULT_SECONDS.lose;
    const timer = window.setTimeout(backToIdle, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [phase, result, backToIdle]);

  // Điện thoại bỏ đi giữa chừng thì màn hình không được treo mãi ở đó.
  useEffect(() => {
    if (phase === "cho") return;
    const timer = window.setInterval(() => {
      if (Date.now() - lastEventRef.current > LCD_IDLE_TIMEOUT_SECONDS * 1000) {
        backToIdle();
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [phase, backToIdle]);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    soundRef.current?.ensureStarted();
    soundRef.current?.setMuted(!next);
    setSoundOn(next);
  }, [soundOn]);

  const near = result !== null && result.distance <= NEAR_MISS_THRESHOLD;

  return (
    <main className="flex min-h-dvh flex-col gap-4 p-6 lg:p-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-black lg:text-4xl">{config.centerName}</p>
          <p className="text-sm text-chu-mo lg:text-base">
            {T.lcdRoomCode}: <span className="font-mono font-bold">{room || "…"}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-chu-mo lg:text-sm">
            {T.targetLabel}
          </p>
          <p className="font-mono text-4xl font-black tracking-[0.15em] text-vang lg:text-6xl">
            {formatNumber(config.target)}
          </p>
        </div>
      </header>

      {!connected && (
        <p className="rounded-xl bg-led/15 p-3 text-sm font-semibold leading-relaxed text-led">
          {T.lcdOffline}
        </p>
      )}

      {phase === "cho" ? (
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
            <p className="text-4xl font-black leading-tight text-vang lg:text-6xl">
              {T.lcdScanToPlay}
            </p>
            <p className="text-lg text-chu-mo lg:text-2xl">{T.hint}</p>
            <p className="text-xl font-bold lg:text-3xl">
              {T.prizeLabel}: <span className="text-luc">{config.prizeName}</span>
            </p>
            <p className="text-sm text-chu-mo lg:text-lg">{T.lcdWaiting}</p>
          </div>
          <div className="flex justify-center">
            {qrDataUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt={T.lcdScanToPlay}
                className="aspect-square w-full max-w-[min(80vw,60vh)] rounded-3xl bg-white p-4"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          {phase === "san-sang" && (
            <p className="text-3xl font-black text-vang lg:text-5xl">{T.lcdJoined}</p>
          )}
          {phase === "dem-nguoc" && (
            <p className="text-[22vh] font-black leading-none text-vang">{countdown}</p>
          )}

          {phase !== "dem-nguoc" && (
            <Led4Digits value={formatNumber(display)} size="tv" />
          )}

          {phase === "chay" && (
            <p className="text-2xl font-black tracking-[0.3em] text-led lg:text-4xl">
              {T.lcdPlaying}
            </p>
          )}

          {phase === "ket-qua" && result && (
            <div className="flex flex-col items-center gap-3">
              {result.win ? (
                <>
                  <p className="text-5xl font-black text-vang lg:text-8xl">{T.congrats}</p>
                  <p className="text-2xl font-bold text-luc lg:text-4xl">
                    {T.prizeLabel}: {result.prizeName}
                  </p>
                  <p className="text-lg text-chu-mo lg:text-2xl">
                    {T.verifyCode}:{" "}
                    <span className="font-mono font-black tracking-[0.35em] text-luc">
                      {result.code}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black text-chu-mo lg:text-7xl">{T.lost}</p>
                  <p
                    className={
                      near
                        ? "text-3xl font-black text-vang lg:text-5xl"
                        : "text-3xl font-bold lg:text-5xl"
                    }
                  >
                    {result.timedOut ? T.timedOut : T.offByN(result.distance)}
                  </p>
                  <p className="text-lg text-chu-mo lg:text-2xl">
                    {near ? T.soClose : T.stillFar}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <footer className="flex items-center justify-end">
        <button
          type="button"
          onClick={toggleSound}
          className="rounded-xl px-3 py-2 text-lg ring-1 ring-vien"
          aria-label={soundOn ? "Tắt tiếng" : "Bật tiếng"}
        >
          {soundOn ? "🔊" : "🔇"}
        </button>
      </footer>
    </main>
  );
}
