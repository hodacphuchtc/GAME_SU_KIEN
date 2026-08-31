"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  DIFFICULTIES,
  MUC_CHON,
  REACTION_JITTER_SECONDS,
  type DifficultyId,
} from "@/config/game";
import { T } from "@/config/locale";
import { taoChuongTrinhForm, type KetQuaTaoForm } from "@/app/actions/chuong-trinh";
import { estimateWinChance, formatNumber, formatOdds } from "@/lib/bo-dem";
import { Led4Digits } from "@/components/led-4-so";

/**
 * Màn thiết lập ván chơi.
 *
 * Điểm quan trọng nhất không phải mấy cái ô nhập, mà là bảng **tỉ lệ trúng ước
 * tính** đổi ngay khi nhân viên đổi mức: không có nó thì người ta treo giải mà
 * không biết mình vừa hứa cho đi bao nhiêu.
 */
export function FormTao() {
  const [soText, setSoText] = useState("0211");
  const [mucDo, setMucDo] = useState<DifficultyId>("vua");
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaTaoForm, FormData>(
    taoChuongTrinhForm,
    {},
  );

  const soTrung = Number.parseInt(soText === "" ? "0" : soText, 10);
  const thamSo = DIFFICULTIES[mucDo].settings;
  const uocTinh = estimateWinChance(thamSo, soTrung);

  return (
    <form action={guiForm} className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.createTitle}</h1>
      <p className="mt-1 text-sm text-chi">{T.createSubtitle}</p>

      <div className="mt-6 grid gap-5 rounded-2xl border border-ke bg-white p-5 sm:p-6">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.createCenter}</span>
          <input
            name="tenTrungTam"
            required
            maxLength={80}
            defaultValue="Trung tâm Sata Robo"
            className="rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-muc">{T.createTarget}</span>
            <input
              name="soTrung"
              inputMode="numeric"
              maxLength={4}
              required
              value={soText}
              onChange={(e) => setSoText(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onBlur={() => setSoText(formatNumber(soTrung))}
              className="rounded-xl border border-ke px-4 py-3 font-mono text-3xl font-black tracking-[0.3em] text-cam focus:border-tim focus:outline-none"
            />
          </label>
          <div className="flex justify-center rounded-2xl bg-[var(--color-led-nen)] p-3">
            <Led4Digits value={formatNumber(soTrung)} size="small" />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-muc">{T.difficulty}</legend>
          <div className="grid grid-cols-3 gap-2">
            {MUC_CHON.map((id) => (
              <label key={id} className="cursor-pointer">
                <input
                  type="radio"
                  name="mucDo"
                  value={id}
                  checked={mucDo === id}
                  onChange={() => setMucDo(id)}
                  className="peer sr-only"
                />
                <span className="block rounded-xl border border-ke px-3 py-3 text-center text-sm font-bold text-muc transition peer-checked:border-tim peer-checked:bg-tim peer-checked:text-white">
                  {DIFFICULTIES[id].label}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-chi">{DIFFICULTIES[mucDo].note}</p>
        </fieldset>

        <div className="rounded-2xl bg-suong p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-chi">
            {T.createOddsTitle}
          </p>
          {uocTinh.passes === 0 ? (
            <p className="mt-2 text-sm font-semibold text-do">{T.createWarnUnreachable}</p>
          ) : (
            <>
              <p className="mt-1 text-3xl font-black text-tim">
                {formatOdds(uocTinh.perRound)}{" "}
                <span className="text-base font-medium text-chi">{T.perRound}</span>
              </p>
              <p className="mt-1 text-sm text-chi">
                {formatOdds(uocTinh.perPass)} {T.perPass} · {T.passCount}:{" "}
                {uocTinh.passes} {T.times} ({T.atSecond}{" "}
                {uocTinh.passSeconds.map((s) => s.toFixed(1)).join(", ")})
              </p>
              <p className="mt-2 text-xs leading-relaxed text-chi">
                {T.oddsNote} (Độ lệch phản xạ dùng để tính: {REACTION_JITTER_SECONDS} giây.)
              </p>
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-muc">{T.createPrize}</span>
            <input
              name="tenGiaiThuong"
              required
              maxLength={80}
              defaultValue="Voucher 200.000đ"
              className="rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-muc">{T.createCap}</span>
            <input
              name="tranGiaiMoiNgay"
              type="number"
              min={0}
              defaultValue={5}
              className="rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
            />
          </label>
        </div>

        {trangThai.loi && (
          <p className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
            {trangThai.loi}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={dangGui}
            className="flex-1 rounded-xl bg-cam px-6 py-4 text-base font-black text-white disabled:opacity-60"
          >
            {T.createSubmit}
          </button>
          <Link
            href="/quan-tri"
            className="rounded-xl border border-ke px-6 py-4 text-center text-base font-bold text-muc"
          >
            {T.createBack}
          </Link>
        </div>
      </div>
    </form>
  );
}
