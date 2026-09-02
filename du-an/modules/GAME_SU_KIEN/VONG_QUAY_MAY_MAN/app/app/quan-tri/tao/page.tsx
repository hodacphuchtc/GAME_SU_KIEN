"use client";

import { useRouter } from "next/navigation";
import { MAU_O_SAN } from "@/config/thuong-hieu";
import { useState } from "react";
import Link from "next/link";

import { T } from "@/config/locale";
import { TI_LE_O_DAY_MAC_DINH } from "@/config/vong-quay";
import { themChuongTrinh } from "@/app/actions/chuong-trinh";
import type { OKhai } from "@/lib/chuong-trinh/kiem-tra";

/**
 * 🔴 MỌI ô nhập ở đây đều là ô CÓ KIỂM SOÁT.
 *
 * React dọn sạch ô không kiểm soát sau mỗi lần chạy server action. Với form dài
 * như form này, một lỗi khai báo là mất trắng cả bảng ô quà vừa gõ — và người
 * ta bỏ cuộc chứ không gõ lại. Đã trả giá ở app Trúng Số với form ngắn hơn nhiều.
 */


function oMacDinh(): OKhai[] {
  return [
    { ten: "", soLuong: 10, tranMoiNgay: 0, mau: MAU_O_SAN[0], thuTu: 1 },
    { ten: "", soLuong: 30, tranMoiNgay: 0, mau: MAU_O_SAN[2], thuTu: 2 },
    // Ô cuối để TRỐNG số lượng — đó là ô an ủi bắt buộc phải có.
    { ten: "", soLuong: null, tranMoiNgay: 0, mau: MAU_O_SAN[5], thuTu: 9 },
  ];
}

export default function TrangTao() {
  const router = useRouter();
  const [tenCoSo, setTenCoSo] = useState("");
  const [tiLe, setTiLe] = useState(String(Math.round(TI_LE_O_DAY_MAC_DINH * 100)));
  const [tranGiai, setTranGiai] = useState("0");
  const [dsO, setDsO] = useState<OKhai[]>(oMacDinh);
  const [loi, setLoi] = useState<string[]>([]);
  const [dangLuu, setDangLuu] = useState(false);

  function suaO(i: number, vaSua: Partial<OKhai>) {
    setDsO((truoc) => truoc.map((o, j) => (j === i ? { ...o, ...vaSua } : o)));
  }

  async function guiDi() {
    setDangLuu(true);
    setLoi([]);
    const kq = await themChuongTrinh({
      tenCoSo,
      tiLeODay: Number(tiLe) / 100,
      tranGiaiMoiNgay: Number(tranGiai) || 0,
      dsO,
    });
    setDangLuu(false);
    if (kq.loi.length > 0) {
      setLoi(kq.loi);
      return;
    }
    router.push("/quan-tri");
  }

  const oNhap =
    "w-full rounded-lg border border-ke bg-white px-3 py-2 text-sm text-muc focus:border-tim focus:outline-none";

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/quan-tri" className="text-sm text-tim hover:underline">
        ← {T.taoQuayLai}
      </Link>
      <h1 className="mt-2 text-2xl font-black text-muc">{T.taoTieuDe}</h1>

      {loi.length > 0 && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-do/30 bg-do/5 px-5 py-4 text-sm text-muc"
        >
          <p className="font-black text-do">{T.taoLoiTieuDe}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            {loi.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-5 rounded-2xl border border-ke bg-white p-5">
        <label className="block">
          <span className="text-sm font-bold text-muc">{T.taoTenCoSo}</span>
          <input
            value={tenCoSo}
            onChange={(e) => setTenCoSo(e.target.value)}
            placeholder={T.taoTenCoSoGoiY}
            className={`mt-1 ${oNhap}`}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-muc">{T.taoTiLeODay}</span>
          <input
            type="number"
            value={tiLe}
            onChange={(e) => setTiLe(e.target.value)}
            className={`mt-1 ${oNhap} max-w-32`}
          />
          <span className="mt-1 block text-xs leading-relaxed text-chi">
            {T.taoTiLeODayGiaiThich}
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-muc">{T.taoTranGiai}</span>
          <input
            type="number"
            value={tranGiai}
            onChange={(e) => setTranGiai(e.target.value)}
            className={`mt-1 ${oNhap} max-w-32`}
          />
        </label>
      </div>

      <section className="mt-6 rounded-2xl border border-ke bg-white p-5">
        <h2 className="text-sm font-black text-muc">{T.taoDanhSachO}</h2>
        <p className="mt-1 text-xs leading-relaxed text-chi">{T.taoODayGiaiThich}</p>

        <div className="mt-4 space-y-3">
          {dsO.map((o, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <label className="col-span-12 sm:col-span-5">
                <span className="text-xs font-semibold text-chi">{T.taoCotTenO}</span>
                <input
                  value={o.ten}
                  onChange={(e) => suaO(i, { ten: e.target.value })}
                  className={`mt-1 ${oNhap}`}
                />
              </label>
              <label className="col-span-5 sm:col-span-3">
                <span className="text-xs font-semibold text-chi">{T.taoCotSoLuong}</span>
                <input
                  type="number"
                  value={o.soLuong ?? ""}
                  placeholder={T.taoKhongGioiHan}
                  onChange={(e) =>
                    suaO(i, { soLuong: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className={`mt-1 ${oNhap}`}
                />
              </label>
              <label className="col-span-4 sm:col-span-2">
                <span className="text-xs font-semibold text-chi">{T.taoCotTranNgay}</span>
                <input
                  type="number"
                  value={o.tranMoiNgay}
                  onChange={(e) => suaO(i, { tranMoiNgay: Number(e.target.value) || 0 })}
                  className={`mt-1 ${oNhap}`}
                />
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className="text-xs font-semibold text-chi">{T.taoCotMau}</span>
                <input
                  type="color"
                  value={o.mau}
                  onChange={(e) => suaO(i, { mau: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-ke"
                />
              </label>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDsO((t) => t.filter((_, j) => j !== i))}
                  className="rounded-lg border border-ke px-2 py-2 text-xs font-bold text-chi hover:border-do hover:text-do"
                >
                  {T.taoXoaO}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setDsO((t) => [
              ...t,
              {
                ten: "",
                soLuong: 10,
                tranMoiNgay: 0,
                mau: MAU_O_SAN[t.length % MAU_O_SAN.length],
                thuTu: t.length + 1,
              },
            ])
          }
          className="mt-4 rounded-xl border border-ke px-4 py-2 text-sm font-bold text-tim hover:border-tim"
        >
          {T.taoThemO}
        </button>
      </section>

      <button
        type="button"
        onClick={guiDi}
        disabled={dangLuu}
        className="mt-6 w-full rounded-2xl bg-cam px-6 py-4 text-base font-black text-white hover:brightness-95 disabled:opacity-60"
      >
        {dangLuu ? T.taoDangLuu : T.taoNut}
      </button>
    </main>
  );
}
