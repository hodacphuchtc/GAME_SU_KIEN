"use client";

import Link from "next/link";
import QRCode from "qrcode";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  DEFAULT_CENTER_NAME,
  DEFAULT_DIFFICULTY,
  DEFAULT_PRIZE_NAME,
  DEFAULT_TARGET,
  DIFFICULTIES,
  LIMITS,
  REACTION_JITTER_SECONDS,
  WHEEL_SIZE,
  type DifficultyId,
  type RoundSettings,
} from "@/config/game";
import { T } from "@/config/locale";
import { estimateWinChance, formatNumber, formatOdds } from "@/lib/bo-dem";
import { verifyCode } from "@/lib/ma-xac-thuc";
import {
  buildPlayUrl,
  clampSettings,
  type DifficultyChoice,
  type GameConfig,
} from "@/lib/cau-hinh-url";
import { Led4Digits } from "@/components/led-4-so";

const subscribeNothing = () => () => {};

/**
 * Địa chỉ gốc của trang — chỉ biết được ở phía trình duyệt. Dùng
 * useSyncExternalStore để bản dựng sẵn và bản chạy trên máy khớp nhau, thay vì
 * gọi setState trong effect.
 */
function useOrigin(): string {
  return useSyncExternalStore(
    subscribeNothing,
    () => window.location.origin,
    () => "",
  );
}

/** Dễ hơn ngưỡng này thì không nên treo giải thật. */
const TOO_EASY_PER_ROUND = 0.25;

const CHOICES: { id: DifficultyChoice; label: string; note: string }[] = [
  ...(Object.keys(DIFFICULTIES) as DifficultyId[]).map((id) => ({
    id: id as DifficultyChoice,
    label: DIFFICULTIES[id].label,
    note: DIFFICULTIES[id].note,
  })),
  {
    id: "custom",
    label: T.custom,
    note: "Tự đặt từng tham số. Bảng tỉ lệ bên dưới cập nhật ngay để bạn biết mình vừa làm nó dễ hay khó đi.",
  },
];

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-chu-mo">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-xl border border-vien bg-nen-nhat px-3 py-2 text-base text-chu"
      />
    </label>
  );
}

export default function SettingsPage() {
  const [targetText, setTargetText] = useState(formatNumber(DEFAULT_TARGET));
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(DEFAULT_DIFFICULTY);
  const [customSettings, setCustomSettings] = useState<RoundSettings>(
    DIFFICULTIES[DEFAULT_DIFFICULTY].settings,
  );
  const [centerName, setCenterName] = useState(DEFAULT_CENTER_NAME);
  const [prizeName, setPrizeName] = useState(DEFAULT_PRIZE_NAME);
  const origin = useOrigin();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [staffCode, setStaffCode] = useState("");

  const target = useMemo(() => {
    const parsed = Number.parseInt(targetText, 10);
    if (!Number.isFinite(parsed)) return 0;
    return ((parsed % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;
  }, [targetText]);

  const settings = useMemo(
    () =>
      difficulty === "custom"
        ? clampSettings(customSettings)
        : DIFFICULTIES[difficulty].settings,
    [customSettings, difficulty],
  );

  const config: GameConfig = useMemo(
    () => ({ target, difficulty, settings, centerName, prizeName }),
    [centerName, difficulty, prizeName, settings, target],
  );

  const playUrl = useMemo(
    () => (origin ? buildPlayUrl(origin, config) : ""),
    [config, origin],
  );

  const estimate = useMemo(
    () => estimateWinChance(settings, target),
    [settings, target],
  );

  useEffect(() => {
    if (!playUrl) return;
    let cancelled = false;
    QRCode.toDataURL(playUrl, { width: 512, margin: 1 })
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

  // Mã xác thực của phút hiện tại — nhân viên đối chiếu với mã trên máy khách.
  useEffect(() => {
    const update = () => setStaffCode(verifyCode(target));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const copyUrl = useCallback(() => {
    if (!playUrl) return;
    void navigator.clipboard?.writeText(playUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, [playUrl]);

  const patchCustom = useCallback((patch: Partial<RoundSettings>) => {
    setCustomSettings((current) => ({ ...current, ...patch }));
  }, []);

  const chooseDifficulty = useCallback((id: DifficultyChoice) => {
    setDifficulty(id);
    if (id !== "custom") setCustomSettings(DIFFICULTIES[id].settings);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-7 px-5 py-8">
      <header className="khong-in flex flex-col gap-2">
        <h1 className="text-2xl font-black">{T.settingsTitle}</h1>
        <p className="text-sm leading-relaxed text-chu-mo">{T.settingsIntro}</p>
      </header>

      <section className="khong-in flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-chu-mo">{T.targetField}</span>
          <input
            value={targetText}
            inputMode="numeric"
            maxLength={4}
            onChange={(event) =>
              setTargetText(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onBlur={() => setTargetText(formatNumber(target))}
            className="rounded-xl border border-vien bg-nen-nhat px-4 py-3 font-mono text-3xl tracking-[0.3em] text-vang"
          />
        </label>

        <div className="flex justify-center py-1">
          <Led4Digits value={formatNumber(target)} size="small" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-chu-mo">{T.difficulty}</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => chooseDifficulty(choice.id)}
                className={[
                  "rounded-xl px-3 py-3 text-sm font-bold ring-1 transition",
                  difficulty === choice.id
                    ? "bg-vang text-black ring-vang"
                    : "bg-nen-nhat text-chu ring-vien",
                ].join(" ")}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-chu-mo">
            {CHOICES.find((choice) => choice.id === difficulty)?.note}
          </p>
        </div>

        {difficulty === "custom" && (
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-vien p-3">
            <NumberField
              label={T.startSpeedField}
              value={settings.startSpeed}
              min={LIMITS.speed.min}
              max={LIMITS.speed.max}
              onChange={(value) => patchCustom({ startSpeed: value })}
            />
            <NumberField
              label={T.maxSpeedField}
              value={settings.maxSpeed}
              min={LIMITS.speed.min}
              max={LIMITS.speed.max}
              onChange={(value) => patchCustom({ maxSpeed: value })}
            />
            <NumberField
              label={T.rampField}
              value={settings.rampSeconds}
              min={LIMITS.rampSeconds.min}
              max={LIMITS.rampSeconds.max}
              onChange={(value) => patchCustom({ rampSeconds: value })}
            />
            <NumberField
              label={T.lockField}
              value={settings.lockSeconds}
              min={LIMITS.lockSeconds.min}
              max={LIMITS.lockSeconds.max}
              onChange={(value) => patchCustom({ lockSeconds: value })}
            />
            <NumberField
              label={T.roundLimitField}
              value={settings.roundLimitSeconds}
              min={LIMITS.roundLimitSeconds.min}
              max={LIMITS.roundLimitSeconds.max}
              onChange={(value) => patchCustom({ roundLimitSeconds: value })}
            />
            <NumberField
              label={T.countdownField}
              value={settings.countdownSeconds}
              min={LIMITS.countdownSeconds.min}
              max={LIMITS.countdownSeconds.max}
              onChange={(value) => patchCustom({ countdownSeconds: value })}
            />
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-chu-mo">{T.centerNameField}</span>
          <input
            value={centerName}
            maxLength={60}
            onChange={(event) => setCenterName(event.target.value)}
            className="rounded-xl border border-vien bg-nen-nhat px-3 py-2 text-base text-chu"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-chu-mo">{T.prizeNameField}</span>
          <input
            value={prizeName}
            maxLength={60}
            onChange={(event) => setPrizeName(event.target.value)}
            className="rounded-xl border border-vien bg-nen-nhat px-3 py-2 text-base text-chu"
          />
        </label>
      </section>

      <section className="khong-in flex flex-col gap-2 rounded-2xl border border-vien bg-nen-nhat p-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-chu-mo">
          {T.oddsTitle}
        </h2>
        {estimate.passes === 0 ? (
          <p className="rounded-xl bg-led/15 p-3 text-sm font-semibold text-led">
            {T.warnUnreachable}
          </p>
        ) : (
          <>
            <p className="text-3xl font-black text-vang">
              {formatOdds(estimate.perRound)}{" "}
              <span className="text-base font-medium text-chu-mo">{T.perRound}</span>
            </p>
            <p className="text-sm text-chu-mo">
              {formatOdds(estimate.perPass)} {T.perPass} · {T.passCount}:{" "}
              {estimate.passes} {T.times} ({T.atSecond}{" "}
              {estimate.passSeconds.map((s) => s.toFixed(1)).join(", ")})
            </p>
            {estimate.perRound > TOO_EASY_PER_ROUND && (
              <p className="rounded-xl bg-vang/15 p-3 text-sm font-semibold text-vang">
                {T.warnTooEasy}
              </p>
            )}
          </>
        )}
        <p className="text-xs leading-relaxed text-chu-mo">
          {T.oddsNote} (Độ lệch phản xạ dùng để tính: {REACTION_JITTER_SECONDS} giây.)
        </p>
      </section>

      <section className="khong-in flex flex-col gap-2 rounded-2xl border border-vien p-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-chu-mo">
          {T.verifyCode}
        </h2>
        <p className="font-mono text-3xl font-black tracking-[0.35em] text-luc">
          {staffCode}
        </p>
        <p className="text-xs leading-relaxed text-chu-mo">
          Khách báo trúng thì so mã trên máy khách với mã này. Khớp nghĩa là màn
          hình đang chạy thật, không phải ảnh chụp. Mã tự đổi mỗi phút.
        </p>
      </section>

      <section className="khong-in flex flex-col gap-3">
        <span className="text-sm text-chu-mo">{T.playUrl}</span>
        <code className="break-all rounded-xl border border-vien bg-nen-nhat p-3 text-xs text-chu-mo">
          {playUrl || "…"}
        </code>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyUrl}
            className="flex-1 rounded-xl bg-nen-nhat py-3 text-sm font-bold ring-1 ring-vien"
          >
            {copied ? T.copied : T.copyUrl}
          </button>
          <a
            href={playUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl bg-nen-nhat py-3 text-center text-sm font-bold ring-1 ring-vien"
          >
            {T.openTest}
          </a>
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <h2 className="khong-in text-sm font-bold uppercase tracking-widest text-chu-mo">
          {T.qrTitle}
        </h2>
        {qrDataUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrDataUrl}
            alt={`Mã QR mở ván chơi số ${formatNumber(target)}`}
            className="h-64 w-64 rounded-2xl bg-white p-3"
          />
        )}
        <p className="text-center text-2xl font-black text-black chi-in">
          Số trúng thưởng: {formatNumber(target)}
        </p>
        <p className="khong-in text-center text-xs text-chu-mo">{T.qrHint}</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="khong-in w-full rounded-xl bg-vang py-3 text-sm font-black text-black"
        >
          {T.printPage}
        </button>
      </section>

      <Link
        href="/"
        className="khong-in rounded-2xl bg-nen-nhat py-4 text-center text-lg font-bold ring-1 ring-vien"
      >
        {T.back}
      </Link>
    </main>
  );
}
