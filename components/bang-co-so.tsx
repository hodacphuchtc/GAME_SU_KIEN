"use client";

import { useCallback, useState, useTransition } from "react";

import { T } from "@/config/locale";
import type { CoSo } from "@/lib/co-so/nhan";
import { datTrangThaiCoSoAction } from "@/app/actions/co-so";
import { FormCoSo } from "@/components/form-co-so";

/**
 * Bảng cơ sở + chỗ mở form thêm/sửa.
 *
 * Form nằm NGAY TRÊN bảng chứ không phải trang riêng: người khai cơ sở thường
 * gõ liền một mạch bốn năm cái, mỗi lần chuyển trang là một lần mất nhịp.
 */

function NutBatTatCoSo({ cs }: { cs: CoSo }) {
  const [dangGui, batDau] = useTransition();
  const dangBat = cs.trangThai === "bat";

  return (
    <button
      type="button"
      disabled={dangGui}
      onClick={() => {
        if (dangBat && !window.confirm(T.coSoTurnOffConfirm)) return;
        batDau(() => void datTrangThaiCoSoAction(cs.id, dangBat ? "tat" : "bat"));
      }}
      className={[
        "rounded-lg border px-2.5 py-1 text-xs font-bold transition disabled:opacity-50",
        dangBat ? "border-do/40 text-do hover:bg-do/10" : "border-luc/40 text-luc hover:bg-luc/10",
      ].join(" ")}
    >
      {dangBat ? T.coSoTurnOff : T.coSoTurnOn}
    </button>
  );
}

export function BangCoSo({ danhSach }: { danhSach: CoSo[] }) {
  // `null` = đóng · `"moi"` = đang thêm · số = đang sửa cơ sở có id đó.
  const [dangMo, setDangMo] = useState<number | "moi" | null>(null);
  const dong = useCallback(() => setDangMo(null), []);
  const dangSua = typeof dangMo === "number" ? danhSach.find((c) => c.id === dangMo) ?? null : null;
  const soBat = danhSach.filter((c) => c.trangThai === "bat").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.coSoTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-chi">{T.coSoSubtitle}</p>
        </div>
        {dangMo === null && (
          <button
            type="button"
            onClick={() => setDangMo("moi")}
            className="rounded-xl bg-cam px-5 py-3 text-sm font-black text-white"
          >
            {T.coSoNew}
          </button>
        )}
      </div>

      {dangMo !== null && (
        <div className="mt-6">
          {/* `key` ép React dựng lại form khi đổi cơ sở đang sửa — không có nó
              thì ô nhập giữ nguyên giá trị của cơ sở bấm trước đó. */}
          <FormCoSo key={dangMo} coSo={dangSua} dong={dong} />
        </div>
      )}

      {danhSach.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ke bg-white p-8 text-center text-sm text-chi">
          {T.coSoEmpty}
        </p>
      ) : (
        <>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-chi">
            {T.coSoCount(danhSach.length)} · {T.coSoCountOn(soBat)}
          </p>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-ke bg-white">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-ke text-left text-xs uppercase tracking-wider text-chi">
                  <th className="px-4 py-3 font-bold">{T.coSoCode}</th>
                  <th className="px-4 py-3 font-bold">{T.coSoName}</th>
                  <th className="px-4 py-3 font-bold">{T.coSoAddress}</th>
                  <th className="px-4 py-3 font-bold">{T.coSoPhone}</th>
                  <th className="px-4 py-3 font-bold">{T.colStatus}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {danhSach.map((cs) => {
                  const tat = cs.trangThai === "tat";
                  return (
                    <tr
                      key={cs.id}
                      className={["border-b border-ke/60 last:border-0", tat && "opacity-45"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-tim">{cs.ma}</td>
                      <td className="px-4 py-3 font-semibold text-muc">{cs.ten}</td>
                      <td className="px-4 py-3 text-chi">{cs.diaChi ?? "—"}</td>
                      <td className="px-4 py-3 text-chi">{cs.dienThoai ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
                            tat ? "bg-chi/10 text-chi" : "bg-luc/10 text-luc",
                          ].join(" ")}
                        >
                          {tat ? T.coSoOff : T.coSoOn}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDangMo(cs.id)}
                            className="rounded-lg border border-ke px-2.5 py-1 text-xs font-bold text-muc hover:border-tim hover:text-tim"
                          >
                            {T.coSoEdit}
                          </button>
                          <NutBatTatCoSo cs={cs} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
