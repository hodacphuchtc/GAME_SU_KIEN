"use client";

import { useActionState, useState } from "react";

import { T } from "@/config/locale";
import { xoaTheoSdtForm, type KetQuaXoaSdt } from "@/app/actions/rieng-tu";

/** Ô xoá dữ liệu theo số điện thoại — hành động không hoàn tác, nên có xác nhận. */
export function OXoaSdt() {
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaXoaSdt, FormData>(
    xoaTheoSdtForm,
    {},
  );
  const [sdt, setSdt] = useState("");

  return (
    <form
      action={guiForm}
      onSubmit={(e) => {
        if (!window.confirm(T.riengTuXoaXacNhan)) e.preventDefault();
      }}
      className="mt-4 rounded-2xl border border-ke bg-white p-5"
    >
      <p className="text-sm font-bold text-muc">{T.riengTuXoaNhan}</p>
      <p className="mt-1 text-xs leading-relaxed text-chi">{T.riengTuXoaHint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          name="soDienThoai"
          required
          inputMode="tel"
          value={sdt}
          onChange={(e) => setSdt(e.target.value)}
          placeholder="0912345678"
          className="min-w-[12rem] flex-1 rounded-xl border border-ke px-4 py-2.5 text-base text-muc focus:border-tim focus:outline-none"
        />
        <button
          type="submit"
          disabled={dangGui}
          className="rounded-xl border border-do/40 px-5 py-2.5 text-sm font-black text-do hover:bg-do/10 disabled:opacity-50"
        >
          {T.riengTuXoaNut}
        </button>
      </div>
      {trangThai.loi && (
        <p role="alert" className="mt-3 rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {trangThai.loi}
        </p>
      )}
      {trangThai.xong && (
        <p role="status" className="mt-3 rounded-xl bg-luc/10 p-3 text-sm font-semibold text-luc">
          {trangThai.xong}
        </p>
      )}
    </form>
  );
}
