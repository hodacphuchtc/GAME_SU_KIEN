"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { T } from "@/config/locale";
import { MAU_O_SAN } from "@/config/thuong-hieu";
import { SAN_CUNG_O_DAY, TI_LE_O_DAY_MAC_DINH, TRAN_TI_LE_O_DAY } from "@/config/vong-quay";
import { themVongQuay } from "@/app/actions/vong-quay-chuong-trinh";
import type { OKhai } from "@/lib/vong-quay/kiem-tra";
import type { CoSo } from "@/lib/co-so/nhan";

/**
 * 🔴 MỌI ô nhập ở đây đều là ô CÓ KIỂM SOÁT.
 *
 * React dọn sạch ô KHÔNG kiểm soát sau mỗi lần chạy server action. Với form dài
 * như form này, một lỗi khai báo là mất trắng cả bảng ô quà vừa gõ — và người ta
 * bỏ cuộc chứ không gõ lại. Đã trả giá ở form ngắn hơn nhiều.
 */

function oMacDinh(): OKhai[] {
  return [
    { ten: "", soLuong: 10, tranMoiNgay: 0, mau: MAU_O_SAN[0], thuTu: 1 },
    { ten: "", soLuong: 30, tranMoiNgay: 0, mau: MAU_O_SAN[2], thuTu: 2 },
    // Ô cuối để TRỐNG số lượng — đó là ô an ủi bắt buộc phải có.
    { ten: "", soLuong: null, tranMoiNgay: 0, mau: MAU_O_SAN[5], thuTu: 3 },
  ];
}

export function FormTaoVongQuay({ coSo }: { coSo: CoSo[] }) {
  const router = useRouter();
  const [coSoId, setCoSoId] = useState<string>(String(coSo[0]?.id ?? ""));
  const [tenDot, setTenDot] = useState("");
  const [tiLe, setTiLe] = useState(String(Math.round(TI_LE_O_DAY_MAC_DINH * 100)));
  const [dsO, setDsO] = useState<OKhai[]>(oMacDinh);
  const [loi, setLoi] = useState<string[]>([]);
  const [dangLuu, setDangLuu] = useState(false);

  function suaO(i: number, vaSua: Partial<OKhai>) {
    setDsO((cu) => cu.map((o, j) => (j === i ? { ...o, ...vaSua } : o)));
  }

  function themO() {
    setDsO((cu) => [
      ...cu,
      {
        ten: "",
        soLuong: 10,
        tranMoiNgay: 0,
        mau: MAU_O_SAN[cu.length % MAU_O_SAN.length],
        thuTu: cu.length + 1,
      },
    ]);
  }

  function xoaO(i: number) {
    setDsO((cu) => cu.filter((_, j) => j !== i).map((o, j) => ({ ...o, thuTu: j + 1 })));
  }

  async function guiDi(e: React.FormEvent) {
    e.preventDefault();
    setDangLuu(true);
    setLoi([]);
    const kq = await themVongQuay({
      coSoId: coSoId === "" ? null : Number(coSoId),
      tenDot,
      tiLeODay: Number(tiLe) / 100,
      dsO,
    });
    setDangLuu(false);
    if (kq.loi.length > 0) {
      setLoi(kq.loi);
      return;
    }
    router.push(`/quan-tri/vong-quay/${kq.ma}`);
  }

  const coODay = dsO.some((o) => o.soLuong === null);

  return (
    <form onSubmit={guiDi} className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.vongQuayCreateTitle}</h1>
      <p className="mt-1 text-sm text-chi">{T.vongQuayCreateSubtitle}</p>

      {loi.length > 0 && (
        <ul
          role="alert"
          className="mt-4 space-y-1 rounded-2xl border border-do/30 bg-do/5 p-4 text-sm text-do"
        >
          {loi.map((d) => (
            <li key={d}>• {d}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-4 rounded-2xl border border-ke bg-white p-5">
        <label className="grid gap-1.5">
          <span className="text-sm font-bold text-muc">{T.createBranch}</span>
          <select
            name="coSoId"
            value={coSoId}
            onChange={(e) => setCoSoId(e.target.value)}
            className="rounded-xl border border-ke px-4 py-3 text-sm"
          >
            {coSo.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-bold text-muc">{T.vongQuayDot}</span>
          <input
            value={tenDot}
            onChange={(e) => setTenDot(e.target.value)}
            placeholder={T.vongQuayDotGoiY}
            className="rounded-xl border border-ke px-4 py-3 text-sm"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-bold text-muc">{T.vongQuayTiLeODay}</span>
          <input
            type="number"
            min={Math.round(SAN_CUNG_O_DAY * 100)}
            max={Math.round(TRAN_TI_LE_O_DAY * 100)}
            value={tiLe}
            onChange={(e) => setTiLe(e.target.value)}
            className="w-32 rounded-xl border border-ke px-4 py-3 text-sm"
          />
          <span className="text-xs text-chi">
            {T.vongQuayTiLeGoiY(Number(tiLe) || 0)}
          </span>
        </label>
      </div>

      <h2 className="mt-8 text-lg font-black text-muc">{T.vongQuayBangO}</h2>
      {!coODay && (
        <p role="alert" className="mt-2 rounded-xl bg-cam/10 px-4 py-3 text-sm font-semibold text-muc">
          ⚠️ {T.vongQuayCanODay}
        </p>
      )}

      <ul className="mt-3 grid gap-3">
        {dsO.map((o, i) => (
          <li key={i} className="grid gap-3 rounded-2xl border border-ke bg-white p-4 sm:grid-cols-[1fr_7rem_7rem_6rem_auto] sm:items-end">
            <label className="grid gap-1">
              <span className="text-xs font-bold text-chi">{T.vongQuayOTen}</span>
              <input
                value={o.ten}
                onChange={(e) => suaO(i, { ten: e.target.value })}
                className="rounded-xl border border-ke px-3 py-2.5 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-chi">{T.vongQuayOSoLuong}</span>
              <input
                type="number"
                min={1}
                value={o.soLuong === null ? "" : String(o.soLuong)}
                placeholder={T.vongQuayKhoKhongGioiHan}
                onChange={(e) =>
                  suaO(i, { soLuong: e.target.value === "" ? null : Number(e.target.value) })
                }
                className="rounded-xl border border-ke px-3 py-2.5 text-sm"
              />
              <span className="text-[11px] leading-tight text-chi">{T.vongQuayOSoLuongGoiY}</span>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-chi">{T.vongQuayOTran}</span>
              <input
                type="number"
                min={0}
                value={String(o.tranMoiNgay)}
                onChange={(e) => suaO(i, { tranMoiNgay: Number(e.target.value) })}
                className="rounded-xl border border-ke px-3 py-2.5 text-sm"
              />
              <span className="text-[11px] leading-tight text-chi">{T.vongQuayOTranGoiY}</span>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-chi">{T.vongQuayOMau}</span>
              <select
                value={o.mau}
                onChange={(e) => suaO(i, { mau: e.target.value })}
                className="rounded-xl border border-ke px-2 py-2.5 text-sm"
                style={{ backgroundColor: o.mau, color: "#FFFFFF" }}
              >
                {MAU_O_SAN.map((m) => (
                  <option key={m} value={m} style={{ backgroundColor: m, color: "#FFFFFF" }}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => xoaO(i)}
              aria-label={T.vongQuayXoaO}
              className="rounded-xl border border-ke px-3 py-2.5 text-sm font-bold text-chi hover:border-do hover:text-do"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={themO}
        className="mt-3 rounded-xl border border-dashed border-ke px-4 py-2.5 text-sm font-bold text-tim"
      >
        {T.vongQuayThemO}
      </button>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={dangLuu}
          className="rounded-xl bg-cam px-6 py-3.5 text-base font-black text-white disabled:opacity-60"
        >
          {dangLuu ? T.vongQuayDangLuu : T.vongQuayTaoNut}
        </button>
        <Link href="/quan-tri/vong-quay" className="text-sm font-bold text-chi hover:text-tim">
          {T.back}
        </Link>
      </div>
    </form>
  );
}
