"use client";

import { useActionState, useState } from "react";

import { T } from "@/config/locale";
import { dangNhapForm, type KetQuaDangNhap } from "@/app/actions/dang-nhap";

/**
 * Màn đăng nhập quản trị.
 *
 * Ô CÓ KIỂM SOÁT như mọi form khác trong dự án: React dọn form sau mỗi lần chạy
 * server action, nên gõ sai một lần là ô bị xoá trắng.
 */
export function FormDangNhap({ tiep }: { tiep: string }) {
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaDangNhap, FormData>(
    dangNhapForm,
    {},
  );
  const [matKhau, setMatKhau] = useState("");

  return (
    <form action={guiForm} className="w-full max-w-sm">
      <input type="hidden" name="tiep" value={tiep} />
      <h1 className="text-2xl font-black text-muc">{T.vaoTieuDe}</h1>
      <p className="mt-1 text-sm text-chi">{T.vaoMoTa}</p>

      <div className="mt-6 grid gap-4 rounded-2xl border border-ke bg-white p-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.vaoMatKhau}</span>
          <input
            name="matKhau"
            type="password"
            required
            autoComplete="current-password"
            autoFocus
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            className="rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          />
        </label>

        {trangThai.loi && (
          <p role="alert" className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
            {trangThai.loi}
          </p>
        )}

        <button
          type="submit"
          disabled={dangGui}
          className="rounded-xl bg-cam px-6 py-3.5 text-base font-black text-white disabled:opacity-60"
        >
          {dangGui ? T.vaoDangGui : T.vaoNut}
        </button>
      </div>
    </form>
  );
}
