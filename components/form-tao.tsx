"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { DIFFICULTIES, MUC_CHON, type DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import { SO_LAN_CHOI, type CheDoChoi } from "@/config/to-chuc";
import { nhanCoSo, type CoSo } from "@/lib/co-so/nhan";
import { taoChuongTrinhForm, type KetQuaTaoForm } from "@/app/actions/chuong-trinh";
import { formatNumber } from "@/lib/bo-dem";
import { Led4Digits } from "@/components/led-4-so";
import { BangTiLe } from "@/components/bang-ti-le";
import { GoiY } from "@/components/goi-y";

/**
 * Màn thiết lập ván chơi.
 *
 * Điểm quan trọng nhất không phải mấy cái ô nhập, mà là bảng **tỉ lệ trúng ước
 * tính** đổi ngay khi nhân viên đổi mức: không có nó thì người ta treo giải mà
 * không biết mình vừa hứa cho đi bao nhiêu.
 */
export function FormTao({ coSo }: { coSo: CoSo[] }) {
  const [soText, setSoText] = useState("0211");
  const [mucDo, setMucDo] = useState<DifficultyId>("vua");
  // Chế độ giữ ở state vì ô "cơ sở của người chơi" chỉ có nghĩa khi chơi online:
  // tại quầy thì phụ huynh đứng ngay trước mặt, không ai đi chọn cơ sở cả.
  const [cheDo, setCheDo] = useState<CheDoChoi>("tai_quay");
  const [coSoId, setCoSoId] = useState<string>(String(coSo[0]?.id ?? ""));
  const khongGanCoSo = coSoId === "";
  // Hai ô này phải CÓ KIỂM SOÁT: bảng tỉ lệ và dòng dự báo phải đổi ngay lúc
  // nhân viên gõ, chứ không phải sau khi họ đã bấm Tạo và lỡ treo giải.
  const [soLan, setSoLan] = useState<number>(SO_LAN_CHOI.macDinh);
  const [tranGiai, setTranGiai] = useState(5);
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaTaoForm, FormData>(
    taoChuongTrinhForm,
    {},
  );

  const soTrung = Number.parseInt(soText === "" ? "0" : soText, 10);
  const thamSo = DIFFICULTIES[mucDo].settings;

  return (
    <form action={guiForm} className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.createTitle}</h1>
      <p className="mt-1 text-sm text-chi">{T.createSubtitle}</p>

      <div className="mt-6 grid gap-5 rounded-2xl border border-ke bg-white p-5 sm:p-6">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">
            {T.createBranch}
            <GoiY chu={T.gyCoSo} />
          </span>
          <select
            name="coSoId"
            value={coSoId}
            onChange={(e) => setCoSoId(e.target.value)}
            className="rounded-xl border border-ke bg-white px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          >
            {coSo.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {nhanCoSo(cs)}
              </option>
            ))}
            {/* Bỏ trống là một LỰA CHỌN, không phải quên điền — nên nó nằm cuối
                danh sách và có tên rõ ràng, không phải một dòng trống. */}
            <option value="">{T.createBranchSkip}</option>
          </select>
          {khongGanCoSo && (
            <span className="rounded-xl bg-tim-nhat p-3 text-xs leading-relaxed text-tim">
              {T.createBranchSkipNote}
            </span>
          )}
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-muc">
            {T.createMode}
            <GoiY chu={T.gyCheDo} />
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["tai_quay", T.createModeCounter, T.createModeCounterNote],
                ["online", T.createModeOnline, T.createModeOnlineNote],
              ] as const
            ).map(([id, nhan, ghiChu]) => (
              <label key={id} className="cursor-pointer">
                <input
                  type="radio"
                  name="cheDo"
                  value={id}
                  checked={cheDo === id}
                  onChange={() => setCheDo(id)}
                  className="peer sr-only"
                />
                <span className="block h-full rounded-xl border border-ke px-3 py-3 text-sm text-muc transition peer-checked:border-tim peer-checked:bg-tim-nhat">
                  <span className="block font-bold">{nhan}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-chi">{ghiChu}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {!khongGanCoSo && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-muc">{T.createBranchSource}</span>
            <select
              name="nguonCoSo"
              defaultValue="gan_san"
              className="rounded-xl border border-ke bg-white px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
            >
              <option value="gan_san">{T.createBranchSourceFixed}</option>
              <option value="phu_huynh_chon">{T.createBranchSourceAsk}</option>
            </select>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-muc">
              {T.createTarget}
              <GoiY chu={T.gySoTrung} />
            </span>
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
          <legend className="text-sm font-semibold text-muc">
            {T.difficulty}
            <GoiY chu={T.gyDoKho} />
          </legend>
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

        <BangTiLe thamSo={thamSo} soTrung={soTrung} soLan={soLan} tranGiai={tranGiai} />

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
            <span className="font-semibold text-muc">
              {T.createCap}
              <GoiY chu={T.gyTranGiai} />
            </span>
            <input
              name="tranGiaiMoiNgay"
              type="number"
              min={0}
              value={tranGiai}
              onChange={(e) => setTranGiai(Math.max(0, Number(e.target.value) || 0))}
              className="rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">
            {T.createTries}
            <GoiY chu={T.gySoLanBam} />
          </span>
          <input
            name="soLanChoi"
            type="number"
            min={SO_LAN_CHOI.toiThieu}
            max={SO_LAN_CHOI.toiDa}
            value={soLan}
            onChange={(e) => setSoLan(Number(e.target.value) || SO_LAN_CHOI.macDinh)}
            className="rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          />
          <span className="text-xs leading-relaxed text-chi">{T.createTriesNote}</span>
        </label>

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
