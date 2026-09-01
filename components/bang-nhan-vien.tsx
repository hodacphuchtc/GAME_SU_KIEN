"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";

import { T } from "@/config/locale";
import { VAI_TRO, type VaiTro } from "@/config/to-chuc";
import type { CoSo } from "@/lib/co-so/nhan";
import { nhanCoSo } from "@/lib/co-so/nhan";
import type { NhanVien } from "@/lib/nhan-vien/kho";
import {
  datTrangThaiNhanVienAction,
  luuNhanVienForm,
  thuHoiDangNhapAction,
  type KetQuaNhanVien,
} from "@/app/actions/nhan-vien";

const NHAN_VAI: Record<VaiTro, string> = {
  quan_tri: T.vaiTroQuanTri,
  quan_ly_co_so: T.vaiTroQuanLy,
  sale: T.vaiTroSale,
};

const O = "rounded-xl border border-ke px-3 py-2.5 text-base text-muc focus:border-tim focus:outline-none";

function FormNhanVien({
  nv,
  coSo,
  dong,
}: {
  nv: NhanVien | null;
  coSo: CoSo[];
  dong: () => void;
}) {
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaNhanVien, FormData>(
    luuNhanVienForm,
    {},
  );
  const [hoTen, setHoTen] = useState(nv?.hoTen ?? "");
  const [tenDangNhap, setTenDangNhap] = useState(nv?.tenDangNhap ?? "");
  const [matKhau, setMatKhau] = useState("");
  const [soDienThoai, setSoDienThoai] = useState(nv?.soDienThoai ?? "");
  const [email, setEmail] = useState(nv?.email ?? "");

  useEffect(() => {
    if (trangThai.xong) dong();
  }, [trangThai.xong, dong]);

  return (
    <form action={guiForm} className="mt-4 grid gap-3 rounded-2xl border border-ke bg-white p-5">
      {nv && <input type="hidden" name="id" value={nv.id} />}
      <h2 className="text-lg font-black text-muc">{nv ? `${T.nvEdit}: ${nv.hoTen}` : T.nvAdd}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.nvName}</span>
          <input name="hoTen" required maxLength={100} autoFocus value={hoTen}
            onChange={(e) => setHoTen(e.target.value)} className={O} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.nvBranch}</span>
          <select name="coSoId" defaultValue={nv?.coSoId ?? ""} className={`${O} bg-white`}>
            <option value="">{T.nvBranchAll}</option>
            {coSo.map((cs) => (
              <option key={cs.id} value={cs.id}>{nhanCoSo(cs)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.nvRole}</span>
          <select name="vaiTro" defaultValue={nv?.vaiTro ?? "sale"} className={`${O} bg-white`}>
            {VAI_TRO.map((v) => (
              <option key={v} value={v}>{NHAN_VAI[v]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.nvPhone}</span>
          <input name="soDienThoai" maxLength={30} inputMode="tel" value={soDienThoai}
            onChange={(e) => setSoDienThoai(e.target.value)} className={O} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.nvEmail}</span>
          <input name="email" maxLength={120} type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={O} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.nvUser}</span>
          <input name="tenDangNhap" maxLength={60} autoComplete="off" value={tenDangNhap}
            onChange={(e) => setTenDangNhap(e.target.value)} className={O} />
          <span className="text-xs leading-relaxed text-chi">{T.nvUserHint}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.nvPass}</span>
          <input name="matKhau" type="password" autoComplete="new-password" value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)} className={O} />
          <span className="text-xs leading-relaxed text-chi">{T.nvPassHint}</span>
        </label>
      </div>

      {trangThai.loi && (
        <p role="alert" className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {trangThai.loi}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={dangGui}
          className="rounded-xl bg-cam px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
          {nv ? T.nvUpdate : T.nvSave}
        </button>
        <button type="button" onClick={dong}
          className="rounded-xl border border-ke px-5 py-2.5 text-sm font-bold text-muc">
          {T.nvCancel}
        </button>
      </div>
    </form>
  );
}

export function BangNhanVien({
  danhSach,
  coSo,
  toiLa,
}: {
  danhSach: NhanVien[];
  coSo: CoSo[];
  toiLa: number;
}) {
  const [dangMo, setDangMo] = useState<number | "moi" | null>(null);
  const [dangChay, batDau] = useTransition();
  const dong = useCallback(() => setDangMo(null), []);
  const dangSua = typeof dangMo === "number" ? danhSach.find((n) => n.id === dangMo) ?? null : null;
  const tenCoSo = (id: number | null) =>
    id === null ? T.nvBranchAll : (coSo.find((c) => c.id === id)?.ma ?? "—");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.nvTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-chi">{T.nvSubtitle}</p>
        </div>
        {dangMo === null && (
          <button type="button" onClick={() => setDangMo("moi")}
            className="rounded-xl bg-cam px-5 py-3 text-sm font-black text-white">
            {T.nvAdd}
          </button>
        )}
      </div>

      {dangMo !== null && <FormNhanVien key={dangMo} nv={dangSua} coSo={coSo} dong={dong} />}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ke bg-white">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-ke text-left text-xs uppercase tracking-wider text-chi">
              <th className="px-4 py-3 font-bold">{T.nvName}</th>
              <th className="px-4 py-3 font-bold">{T.nvBranch}</th>
              <th className="px-4 py-3 font-bold">{T.nvRole}</th>
              <th className="px-4 py-3 font-bold">{T.nvLogin}</th>
              <th className="px-4 py-3 font-bold">{T.nvStatus}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {danhSach.map((nv) => {
              const nghi = nv.trangThai === "da_nghi";
              return (
                <tr key={nv.id}
                  className={["border-b border-ke/60 last:border-0", nghi && "opacity-45"]
                    .filter(Boolean).join(" ")}>
                  <td className="px-4 py-3 font-semibold text-muc">
                    {nv.hoTen}
                    {nv.tenDangNhap && (
                      <span className="ml-2 font-mono text-xs text-chi">@{nv.tenDangNhap}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-chi">{tenCoSo(nv.coSoId)}</td>
                  <td className="px-4 py-3 text-chi">{NHAN_VAI[nv.vaiTro] ?? nv.vaiTro}</td>
                  <td className="px-4 py-3">
                    <span className={[
                      "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
                      nv.coDangNhap ? "bg-luc/10 text-luc" : "bg-chi/10 text-chi",
                    ].join(" ")}>
                      {nv.coDangNhap ? T.nvLoginYes : T.nvLoginNo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={[
                      "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
                      nghi ? "bg-chi/10 text-chi" : "bg-luc/10 text-luc",
                    ].join(" ")}>
                      {nghi ? T.nvLeft : T.nvWorking}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => setDangMo(nv.id)}
                        className="rounded-lg border border-ke px-2.5 py-1 text-xs font-bold text-muc hover:border-tim hover:text-tim">
                        {T.nvEdit}
                      </button>
                      {nv.coDangNhap && nv.id !== toiLa && (
                        <button type="button" disabled={dangChay}
                          onClick={() => {
                            if (!window.confirm(T.nvRevokeConfirm)) return;
                            batDau(() => void thuHoiDangNhapAction(nv.id));
                          }}
                          className="rounded-lg border border-ke px-2.5 py-1 text-xs font-bold text-muc disabled:opacity-50">
                          {T.nvRevoke}
                        </button>
                      )}
                      {/* Không có nút nào cho CHÍNH MÌNH: người quản trị cuối
                          cùng tự cho mình nghỉ thì không còn ai mở cửa lại. */}
                      {nv.id !== toiLa && (
                        <button type="button" disabled={dangChay}
                          onClick={() => {
                            if (!nghi && !window.confirm(T.nvRetireConfirm)) return;
                            batDau(() =>
                              void datTrangThaiNhanVienAction(nv.id, nghi ? "dang_lam" : "da_nghi"));
                          }}
                          className={[
                            "rounded-lg border px-2.5 py-1 text-xs font-bold disabled:opacity-50",
                            nghi ? "border-luc/40 text-luc" : "border-do/40 text-do",
                          ].join(" ")}>
                          {nghi ? T.nvBack : T.nvRetire}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
