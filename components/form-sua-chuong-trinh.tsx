"use client";

import { useActionState, useState } from "react";

import { DIFFICULTIES, MUC_CHON, type DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import { SO_LAN_CHOI } from "@/config/to-chuc";
import { suaChuongTrinhForm, type KetQuaSua } from "@/app/actions/chuong-trinh";
import { formatNumber } from "@/lib/bo-dem";
import { BangTiLe } from "@/components/bang-ti-le";
import { Led4Digits } from "@/components/led-4-so";

/**
 * Sửa thiết lập ngay trên trang chi tiết, không phải mở trang riêng.
 *
 * 🔴 Mọi ô đều CÓ KIỂM SOÁT, và bảng tỉ lệ đổi ngay lúc gõ — thứ đáng nhìn nhất
 * ở đây không phải mấy cái ô mà là dòng "khoảng N giải mỗi ngày". Đổi số rồi mới
 * biết mình vừa hứa cho đi bao nhiêu thì đã muộn.
 *
 * Chỉ hỏi xác nhận khi chương trình ĐÃ CÓ VÁN: sửa một chương trình chưa ai chơi
 * là chuyện vô hại, bắt bấm hai lần cho một việc không mất gì là làm phiền.
 */
export function FormSuaChuongTrinh({
  ma,
  soTrungHienTai,
  mucDoHienTai,
  tenGiaiThuongHienTai,
  tranGiaiHienTai,
  soLanChoiHienTai,
  soVan,
}: {
  ma: string;
  soTrungHienTai: number;
  mucDoHienTai: DifficultyId | "custom";
  tenGiaiThuongHienTai: string;
  tranGiaiHienTai: number;
  soLanChoiHienTai: number;
  soVan: number;
}) {
  const [mo, setMo] = useState(false);
  const [soText, setSoText] = useState(formatNumber(soTrungHienTai));
  const [mucDo, setMucDo] = useState<DifficultyId>(
    mucDoHienTai === "custom" ? "vua" : mucDoHienTai,
  );
  const [soLan, setSoLan] = useState(soLanChoiHienTai);
  const [tranGiai, setTranGiai] = useState(tranGiaiHienTai);
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaSua, FormData>(
    suaChuongTrinhForm,
    {},
  );

  const soTrung = Number.parseInt(soText === "" ? "0" : soText, 10);

  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => setMo(true)}
        data-mo-sua
        className="rounded-xl border border-ke px-5 py-3 text-sm font-bold text-muc transition hover:border-tim hover:text-tim"
      >
        {T.suaMo}
      </button>
    );
  }

  return (
    <form
      action={guiForm}
      onSubmit={(e) => {
        // Chỉ cảnh báo khi đã có ván — và nói bằng con số thật, không bằng lời doạ.
        if (soVan > 0 && soTrung !== soTrungHienTai) {
          if (!window.confirm(T.suaCanhBaoCoVan(soVan, formatNumber(soTrungHienTai)))) {
            e.preventDefault();
          }
        }
      }}
      className="khong-in mt-6 grid gap-5 rounded-2xl border-2 border-tim bg-white p-5 sm:p-6"
    >
      <input type="hidden" name="ma" value={ma} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-muc">{T.suaTieuDe}</h2>
        <button
          type="button"
          onClick={() => setMo(false)}
          className="rounded-xl border border-ke px-4 py-2 text-sm font-bold text-muc"
        >
          {T.suaDong}
        </button>
      </div>
      <p className="-mt-3 text-xs leading-relaxed text-chi">{T.suaNhacKhongDoi}</p>

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

      <BangTiLe
        thamSo={DIFFICULTIES[mucDo].settings}
        soTrung={soTrung}
        soLan={soLan}
        tranGiai={tranGiai}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.createPrize}</span>
          <input
            name="tenGiaiThuong"
            required
            maxLength={80}
            defaultValue={tenGiaiThuongHienTai}
            className="rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.createCap}</span>
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
        <span className="font-semibold text-muc">{T.createTries}</span>
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
        <p role="alert" className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {trangThai.loi}
        </p>
      )}
      {trangThai.xong && (
        <p role="status" className="rounded-xl bg-luc/10 p-3 text-sm font-semibold text-luc">
          {T.suaXongNhac}
        </p>
      )}

      <button
        type="submit"
        disabled={dangGui}
        data-luu-sua
        className="rounded-xl bg-cam px-6 py-4 text-base font-black text-white disabled:opacity-60"
      >
        {T.suaLuu}
      </button>
    </form>
  );
}
