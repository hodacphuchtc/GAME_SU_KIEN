"use client";

import { useState } from "react";

import { T } from "@/config/locale";

/**
 * Trang THỬ của hạng mục V.0 — sẽ bị thay bằng vòng quay ở V.3.
 *
 * Nó tồn tại để chứng minh đúng một điều, và là điều dễ hiểu nhầm nhất khi mở
 * bằng điện thoại thật: JavaScript có tải được không. Mở được trang mà bấm
 * không ăn nghĩa là `allowedDevOrigins` khai sai — trông y hệt app bị treo,
 * không một dòng báo lỗi.
 */
export default function TrangThu() {
  const [soLan, setSoLan] = useState(0);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-12">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-tim">
          {T.tenToChuc}
        </p>
        <h1 className="mt-2 text-3xl font-black text-muc">{T.tenUngDung}</h1>
        <p className="mt-1 text-sm text-chi">{T.cauDinhVi}</p>
      </header>

      <section className="rounded-2xl border border-ke bg-white px-6 py-6">
        <h2 className="text-lg font-black text-muc">{T.thuTieuDe}</h2>
        <p className="mt-2 text-sm leading-relaxed text-chi">{T.thuMoTa}</p>

        <button
          type="button"
          onClick={() => setSoLan((n) => n + 1)}
          className="mt-5 w-full rounded-xl bg-cam px-6 py-4 text-base font-black text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-cam/40"
        >
          {T.thuNut}
        </button>

        <p
          aria-live="polite"
          className="mt-4 text-center text-sm font-semibold text-muc"
        >
          {soLan === 0 ? T.thuChuaBam : T.thuDaBam(soLan)}
        </p>
      </section>

      <p className="text-center text-xs leading-relaxed text-chi">
        {T.thuGhiChu}
      </p>
    </main>
  );
}
