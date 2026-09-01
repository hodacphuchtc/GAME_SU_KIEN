"use client";

import { useActionState, useEffect, useState } from "react";

import { T } from "@/config/locale";
import type { CoSo } from "@/lib/co-so/nhan";
import { luuCoSoForm, type KetQuaCoSo } from "@/app/actions/co-so";

/**
 * Form thêm / sửa cơ sở.
 *
 * 🔴 Mọi ô đều là ô CÓ KIỂM SOÁT. React dọn sạch form sau mỗi lần chạy server
 * action, nên ô không kiểm soát sẽ trắng trơn ngay khi form báo lỗi — người
 * đang nhập gõ trùng tên một lần là mất luôn địa chỉ vừa gõ. Đã trả giá ở form
 * nhận diện phụ huynh, không lặp lại.
 */
export function FormCoSo({ coSo, dong }: { coSo: CoSo | null; dong: () => void }) {
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaCoSo, FormData>(
    luuCoSoForm,
    {},
  );
  const [ten, setTen] = useState(coSo?.ten ?? "");
  const [diaChi, setDiaChi] = useState(coSo?.diaChi ?? "");
  const [dienThoai, setDienThoai] = useState(coSo?.dienThoai ?? "");

  // Lưu xong thì đóng. Đóng ngay trong action thì lỗi trả về không kịp hiện.
  useEffect(() => {
    if (trangThai.xong) dong();
  }, [trangThai.xong, dong]);

  const oChung =
    "rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none";

  return (
    <form action={guiForm} className="grid gap-4 rounded-2xl border border-ke bg-white p-5 sm:p-6">
      {coSo && <input type="hidden" name="id" value={coSo.id} />}

      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-black text-muc">
          {coSo ? `${T.coSoEdit} ${coSo.ma}` : T.coSoNew}
        </h2>
        {coSo && <span className="font-mono text-sm text-chi">{coSo.ma}</span>}
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-muc">{T.coSoName}</span>
        <input
          name="ten"
          required
          maxLength={120}
          autoFocus
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder={T.coSoNamePlaceholder}
          className={oChung}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-muc">{T.coSoAddress}</span>
        <input
          name="diaChi"
          maxLength={200}
          value={diaChi}
          onChange={(e) => setDiaChi(e.target.value)}
          placeholder={T.coSoAddressPlaceholder}
          className={oChung}
        />
        <span className="text-xs leading-relaxed text-chi">{T.coSoAddressHint}</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-muc">{T.coSoPhone}</span>
        <input
          name="dienThoai"
          maxLength={30}
          inputMode="tel"
          value={dienThoai}
          onChange={(e) => setDienThoai(e.target.value)}
          placeholder={T.coSoPhonePlaceholder}
          className={oChung}
        />
      </label>

      {trangThai.loi && (
        <p role="alert" className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {trangThai.loi}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={dangGui}
          className="flex-1 rounded-xl bg-cam px-6 py-3.5 text-base font-black text-white disabled:opacity-60"
        >
          {coSo ? T.coSoUpdate : T.coSoSave}
        </button>
        <button
          type="button"
          onClick={dong}
          className="rounded-xl border border-ke px-6 py-3.5 text-base font-bold text-muc"
        >
          {T.coSoCancel}
        </button>
      </div>
    </form>
  );
}
