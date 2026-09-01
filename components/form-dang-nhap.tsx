"use client";

import { useActionState, useState } from "react";

import { T } from "@/config/locale";
import { dangNhapForm, type KetQuaDangNhap } from "@/app/actions/dang-nhap";

/**
 * Màn đăng nhập quản trị.
 *
 * Ô có kiểm soát như mọi form khác trong dự án: React dọn form sau mỗi lần chạy
 * action, nên gõ sai mật khẩu một lần là mất luôn cả tên đăng nhập vừa nhập.
 */
export function FormDangNhap({ tiep }: { tiep: string }) {
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaDangNhap, FormData>(
    dangNhapForm,
    {},
  );
  const [ten, setTen] = useState("");
  const [matKhau, setMatKhau] = useState("");

  const o =
    "rounded-xl border border-ke px-4 py-3 text-base text-muc focus:border-tim focus:outline-none";

  return (
    <form action={guiForm} className="w-full max-w-sm">
      <input type="hidden" name="tiep" value={tiep} />
      <h1 className="text-2xl font-black text-muc">{T.vaoTitle}</h1>
      <p className="mt-1 text-sm text-chi">{T.vaoSubtitle}</p>

      <div className="mt-6 grid gap-4 rounded-2xl border border-ke bg-white p-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.vaoUser}</span>
          <input
            name="tenDangNhap"
            required
            autoComplete="username"
            autoFocus
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            className={o}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.vaoPass}</span>
          <input
            name="matKhau"
            type="password"
            required
            autoComplete="current-password"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            className={o}
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
          {T.vaoSubmit}
        </button>
      </div>
    </form>
  );
}
