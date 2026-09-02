"use client";

import { useState } from "react";

import { T } from "@/config/locale";
import { MAU_O_SAN } from "@/config/thuong-hieu";
import { SAN_CUNG_O_DAY, TRAN_TI_LE_O_DAY } from "@/config/vong-quay";
import { suaVongQuay, type OSua } from "@/app/actions/vong-quay-chuong-trinh";

/**
 * SỬA MỘT CHƯƠNG TRÌNH VÒNG QUAY ĐANG CHẠY.
 *
 * 🔴 MỌI ô nhập đều CÓ KIỂM SOÁT. React dọn ô không kiểm soát sau mỗi lần chạy
 * server action — với form dài như form này, một lỗi khai báo là mất trắng cả bảng
 * ô vừa gõ, và người ta bỏ cuộc chứ không gõ lại.
 *
 * 🔴 Ô ĐÃ TRAO không xoá được: nút xoá của nó bị vô hiệu kèm lý do ngay tại chỗ,
 * chứ không để người dùng bấm rồi mới nhận lỗi ở tận trên đầu form.
 */

export interface ODangCo extends OSua {
  id: number;
  daTrao: number;
}

export function FormSuaVongQuay({
  ma,
  tenDot: tenDotBanDau,
  tiLeODay: tiLeBanDau,
  dsO: dsOBanDau,
}: {
  ma: string;
  tenDot: string;
  tiLeODay: number;
  dsO: ODangCo[];
}) {
  const [mo, setMo] = useState(false);
  const [tenDot, setTenDot] = useState(tenDotBanDau);
  const [tiLe, setTiLe] = useState(String(Math.round(tiLeBanDau * 100)));
  const [dsO, setDsO] = useState<Array<OSua & { daTrao?: number }>>(dsOBanDau);
  const [loi, setLoi] = useState<string[]>([]);
  const [xong, setXong] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  function suaO(i: number, vaSua: Partial<OSua>) {
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

  function boO(i: number) {
    setDsO((cu) => cu.filter((_, j) => j !== i).map((o, j) => ({ ...o, thuTu: j + 1 })));
  }

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    setDangLuu(true);
    setLoi([]);
    setXong(false);
    const kq = await suaVongQuay({
      ma,
      tenDot,
      tiLeODay: Number(tiLe) / 100,
      // Bỏ `daTrao` trước khi gửi: nó là số máy chủ tự đếm từ `luot_quay`, không
      // phải thứ máy khách được quyền khai. Nhận nó từ form là để trình duyệt tự
      // khai mình đã trao bao nhiêu — tức là không có phép kiểm nào cả.
      dsO: dsO.map((o) => ({
        id: o.id,
        ten: o.ten,
        thuTu: o.thuTu,
        soLuong: o.soLuong,
        tranMoiNgay: o.tranMoiNgay,
        mau: o.mau,
      })),
    });
    setDangLuu(false);
    if (kq.loi && kq.loi.length > 0) {
      setLoi(kq.loi);
      return;
    }
    setXong(true);
  }

  const o = "rounded-xl border border-ke px-3 py-2.5 text-sm";

  if (!mo) {
    return (
      <div className="khong-in mt-8">
        <button
          type="button"
          onClick={() => setMo(true)}
          className="rounded-xl border border-ke px-5 py-3 text-sm font-black text-tim hover:border-tim"
        >
          {T.suaVongQuayTieuDe}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={gui} className="khong-in mt-8 rounded-2xl border border-ke bg-white p-5">
      <h2 className="text-lg font-black text-muc">{T.suaVongQuayTieuDe}</h2>

      {loi.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 rounded-xl border border-do/30 bg-do/5 p-4 text-sm text-do">
          {loi.map((d) => (
            <li key={d}>• {d}</li>
          ))}
        </ul>
      )}
      {xong && (
        <p role="status" className="mt-3 rounded-xl bg-luc/10 p-3 text-sm font-semibold text-luc">
          {T.suaVongQuayXong}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-bold text-muc">{T.vongQuayDot}</span>
          <input value={tenDot} onChange={(e) => setTenDot(e.target.value)} className={o} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold text-muc">{T.vongQuayTiLeODay}</span>
          <input
            type="number"
            min={Math.round(SAN_CUNG_O_DAY * 100)}
            max={Math.round(TRAN_TI_LE_O_DAY * 100)}
            value={tiLe}
            onChange={(e) => setTiLe(e.target.value)}
            className={`${o} w-32`}
          />
          <span className="text-xs text-chi">{T.vongQuayTiLeGoiY(Number(tiLe) || 0)}</span>
        </label>
      </div>

      <h3 className="mt-6 text-sm font-black text-muc">{T.vongQuayBangO}</h3>
      <ul className="mt-3 grid gap-3">
        {dsO.map((oq, i) => {
          const daTrao = oq.daTrao ?? 0;
          const khoaXoa = daTrao > 0;
          return (
            <li
              key={oq.id ?? `moi-${i}`}
              className="grid gap-3 rounded-2xl border border-ke p-4 sm:grid-cols-[1fr_7rem_7rem_6rem_auto] sm:items-end"
            >
              <label className="grid gap-1">
                <span className="text-xs font-bold text-chi">{T.vongQuayOTen}</span>
                <input value={oq.ten} onChange={(e) => suaO(i, { ten: e.target.value })} className={o} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold text-chi">{T.vongQuayOSoLuong}</span>
                <input
                  type="number"
                  min={1}
                  value={oq.soLuong === null ? "" : String(oq.soLuong)}
                  placeholder={T.vongQuayKhoKhongGioiHan}
                  onChange={(e) =>
                    suaO(i, { soLuong: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className={o}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold text-chi">{T.vongQuayOTran}</span>
                <input
                  type="number"
                  min={0}
                  value={String(oq.tranMoiNgay)}
                  onChange={(e) => suaO(i, { tranMoiNgay: Number(e.target.value) })}
                  className={o}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold text-chi">{T.vongQuayOMau}</span>
                <select
                  value={oq.mau}
                  onChange={(e) => suaO(i, { mau: e.target.value })}
                  className={`${o} px-2`}
                  style={{ backgroundColor: oq.mau, color: "#FFFFFF" }}
                >
                  {MAU_O_SAN.map((m) => (
                    <option key={m} value={m} style={{ backgroundColor: m, color: "#FFFFFF" }}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-1">
                <button
                  type="button"
                  onClick={() => boO(i)}
                  disabled={khoaXoa}
                  aria-label={T.vongQuayXoaO}
                  title={khoaXoa ? T.suaVongQuayCanhBaoO(daTrao) : T.vongQuayXoaO}
                  className="rounded-xl border border-ke px-3 py-2.5 text-sm font-bold text-chi hover:border-do hover:text-do disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ✕
                </button>
                {khoaXoa && (
                  <span className="text-[11px] leading-tight text-chi">
                    {T.suaVongQuayCanhBaoO(daTrao)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={themO}
        className="mt-3 rounded-xl border border-dashed border-ke px-4 py-2.5 text-sm font-bold text-tim"
      >
        {T.vongQuayThemO}
      </button>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={dangLuu}
          className="rounded-xl bg-cam px-6 py-3.5 text-base font-black text-white disabled:opacity-60"
        >
          {dangLuu ? T.suaVongQuayDangLuu : T.suaVongQuayNut}
        </button>
        <button
          type="button"
          onClick={() => setMo(false)}
          className="text-sm font-bold text-chi hover:text-tim"
        >
          {T.back}
        </button>
      </div>
    </form>
  );
}
