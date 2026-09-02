"use client";

import { useMemo, useState } from "react";
import { MAU_O_SAN } from "@/config/thuong-hieu";

import { T } from "@/config/locale";
import { chiaCung, type Cung, type OQua } from "@/lib/vong-quay/chia-o";
import { bocGoc } from "@/lib/vong-quay/goc";
import { useLuotQuay, VongQuay } from "@/components/vong-quay";

/**
 * TRANG THỬ của hạng mục 1.2 — sẽ bị thay bằng màn chơi thật ở GIAI ĐOẠN 3.
 *
 * Không có cơ sở dữ liệu, không có máy chủ: sáu ô cắm cứng, và chính trình duyệt
 * bốc hạt giống. Mục đích duy nhất là để nhìn thấy vòng quay chạy thật, và để
 * đếm được rằng ô cung rộng hơn thì trúng nhiều hơn.
 */

const KHO_THU: OQua[] = [
  { id: 1, ten: "Balo", thuTu: 1, soLuong: 10, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: MAU_O_SAN[0] },
  { id: 2, ten: "Áo thun", thuTu: 2, soLuong: 20, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: MAU_O_SAN[1] },
  { id: 3, ten: "Sổ tay", thuTu: 3, soLuong: 30, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: MAU_O_SAN[2] },
  { id: 4, ten: "Bút", thuTu: 4, soLuong: 40, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: MAU_O_SAN[3] },
  { id: 5, ten: "Kẹo", thuTu: 5, soLuong: 100, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: MAU_O_SAN[4] },
  { id: 6, ten: "Sticker", thuTu: 9, soLuong: null, daTrao: 0, tranMoiNgay: 0, daTraoHomNay: 0, mau: MAU_O_SAN[5] },
];

export default function TrangThuVongQuay() {
  const cung = useMemo(() => chiaCung(KHO_THU), []);
  const { gocDich, batDauLuc, quay } = useLuotQuay();
  const [dangQuay, setDangQuay] = useState(false);
  const [ketQua, setKetQua] = useState<Cung | null>(null);
  const [dem, setDem] = useState<Record<number, number>>({});

  const tongLuot = Object.values(dem).reduce((s, n) => s + n, 0);

  function bamQuay() {
    if (dangQuay) return;
    setDangQuay(true);
    setKetQua(null);
    // Ngẫu nhiên THẬT ở đây; ở bản chơi thật việc này là của máy chủ.
    const hat = crypto.randomUUID();
    quay(bocGoc(hat));
  }

  function khiDung(o: Cung) {
    setDangQuay(false);
    setKetQua(o);
    setDem((truoc) => ({ ...truoc, [o.oId]: (truoc[o.oId] ?? 0) + 1 }));
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-5 py-8">
      <header>
        <h1 className="text-2xl font-black text-muc">{T.thuVongTieuDe}</h1>
        <p className="mt-1 text-sm leading-relaxed text-chi">{T.thuVongMoTa}</p>
      </header>

      <VongQuay cung={cung} gocDich={gocDich} batDauLuc={batDauLuc} onDung={khiDung} />

      <button
        type="button"
        onClick={bamQuay}
        disabled={dangQuay}
        className="rounded-2xl bg-cam px-6 py-5 text-lg font-black text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-cam/40 disabled:opacity-60"
      >
        {dangQuay ? T.thuVongDangQuay : T.thuVongNut}
      </button>

      <p aria-live="polite" className="text-center text-base font-bold text-muc">
        {ketQua ? T.thuVongKetQua(ketQua.ten) : T.thuVongChuaQuay}
      </p>

      <section className="rounded-2xl border border-ke bg-white p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-chi">
          {T.thuVongThongKe}
        </h2>
        {tongLuot === 0 ? (
          <p className="mt-3 text-sm text-chi">{T.thuVongChuaCoLuot}</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-chi">
              <tr>
                <th className="pb-2 font-semibold">{T.thuVongCotO}</th>
                <th className="pb-2 text-right font-semibold">{T.thuVongCotCung}</th>
                <th className="pb-2 text-right font-semibold">{T.thuVongCotTrung}</th>
              </tr>
            </thead>
            <tbody>
              {cung.map((c) => (
                <tr key={c.oId} className="border-t border-ke">
                  <td className="py-2">
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block h-3 w-3 rounded-sm align-middle"
                      style={{ background: c.mau }}
                    />
                    {c.ten}
                  </td>
                  <td className="py-2 text-right tabular-nums text-chi">
                    {((c.doRong / 360) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 text-right tabular-nums font-bold text-muc">
                    {(((dem[c.oId] ?? 0) / tongLuot) * 100).toFixed(1)}%
                    <span className="ml-1 font-normal text-chi">
                      ({dem[c.oId] ?? 0})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs leading-relaxed text-chi">{T.thuVongGhiChu}</p>
      </section>
    </main>
  );
}
