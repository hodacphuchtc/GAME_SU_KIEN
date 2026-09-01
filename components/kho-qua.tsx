"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";

import { T } from "@/config/locale";
import { conLai, coLoaiDay } from "@/lib/qua/chon-qua";
import type { QuaTang } from "@/lib/qua/kho-qua";
import {
  doiChoQuaAction,
  luuQuaForm,
  xoaQuaAction,
  type KetQuaQua,
} from "@/app/actions/qua";

/**
 * Khối KHO QUÀ trong trang chi tiết chương trình.
 *
 * Thứ tự hiển thị CHÍNH LÀ thứ tự bốc — trên xuống dưới, hết loại trên mới sang
 * loại dưới. Đó là lý do bảng này có nút Lên/Xuống chứ không sắp theo tên: nhân
 * viên phải nhìn thấy đúng cái thứ tự mà máy sẽ tiêu tiền theo.
 */

const O = "rounded-xl border border-ke px-3 py-2.5 text-base text-muc focus:border-tim focus:outline-none";

function FormQua({
  chuongTrinhId,
  ma,
  qua,
  dong,
}: {
  chuongTrinhId: number;
  ma: string;
  qua: QuaTang | null;
  dong: () => void;
}) {
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaQua, FormData>(luuQuaForm, {});
  // Ô có kiểm soát: React dọn form sau mỗi lần chạy action, ô tự do sẽ trắng
  // trơn ngay khi form báo lỗi và người đang nhập mất hết những gì vừa gõ.
  const [ten, setTen] = useState(qua?.ten ?? "");
  const [soLuong, setSoLuong] = useState(qua?.soLuong === null || qua === null ? "" : String(qua.soLuong));
  const [tranNgay, setTranNgay] = useState(String(qua?.tranMoiNgay ?? 0));
  const [giaTri, setGiaTri] = useState(qua?.giaTri === null || qua === null ? "" : String(qua.giaTri));

  useEffect(() => {
    if (trangThai.xong) dong();
  }, [trangThai.xong, dong]);

  return (
    <form action={guiForm} className="mt-4 grid gap-3 rounded-2xl border border-ke bg-suong p-4">
      <input type="hidden" name="ma" value={ma} />
      <input type="hidden" name="chuongTrinhId" value={chuongTrinhId} />
      {qua && <input type="hidden" name="id" value={qua.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.khoName}</span>
          <input
            name="ten"
            required
            maxLength={80}
            autoFocus
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            placeholder={T.khoNamePlaceholder}
            className={O}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.khoQty}</span>
          <input
            name="soLuong"
            type="number"
            min={0}
            value={soLuong}
            onChange={(e) => setSoLuong(e.target.value)}
            placeholder={T.khoQtyUnlimited}
            className={O}
          />
          <span className="text-xs leading-relaxed text-chi">{T.khoQtyHint}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.khoCapDay}</span>
          <input
            name="tranMoiNgay"
            type="number"
            min={0}
            value={tranNgay}
            onChange={(e) => setTranNgay(e.target.value)}
            className={O}
          />
          <span className="text-xs leading-relaxed text-chi">{T.khoCapDayHint}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-muc">{T.khoValue}</span>
          <input
            name="giaTri"
            type="number"
            min={0}
            value={giaTri}
            onChange={(e) => setGiaTri(e.target.value)}
            className={O}
          />
        </label>
      </div>

      {trangThai.loi && (
        <p role="alert" className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {trangThai.loi}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={dangGui}
          className="rounded-xl bg-cam px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
        >
          {qua ? T.khoUpdate : T.khoSave}
        </button>
        <button
          type="button"
          onClick={dong}
          className="rounded-xl border border-ke bg-white px-5 py-2.5 text-sm font-bold text-muc"
        >
          {T.khoCancel}
        </button>
      </div>
    </form>
  );
}

function NutXep({
  chuongTrinhId,
  ma,
  id,
  huong,
  tat,
}: {
  chuongTrinhId: number;
  ma: string;
  id: number;
  huong: "len" | "xuong";
  tat: boolean;
}) {
  const [dangGui, batDau] = useTransition();
  return (
    <button
      type="button"
      disabled={tat || dangGui}
      aria-label={huong === "len" ? T.khoUp : T.khoDown}
      onClick={() => batDau(() => void doiChoQuaAction(chuongTrinhId, id, huong, ma))}
      className="rounded-lg border border-ke px-2 py-1 text-xs font-bold text-muc disabled:opacity-30"
    >
      {huong === "len" ? "↑" : "↓"}
    </button>
  );
}

export function KhoQua({
  chuongTrinhId,
  ma,
  kho,
}: {
  chuongTrinhId: number;
  ma: string;
  kho: QuaTang[];
}) {
  const [dangMo, setDangMo] = useState<number | "moi" | null>(null);
  const [loiXoa, setLoiXoa] = useState("");
  const [dangXoa, batDauXoa] = useTransition();
  const dong = useCallback(() => setDangMo(null), []);
  const dangSua = typeof dangMo === "number" ? kho.find((q) => q.id === dangMo) ?? null : null;

  return (
    <section className="khong-in mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-muc">{T.khoTitle}</h2>
          <p className="mt-0.5 text-sm text-chi">{T.khoSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {kho.length > 0 && (
            <a
              href={`/api/xuat/kho-qua/${ma}`}
              className="rounded-xl border border-ke bg-white px-4 py-2.5 text-sm font-bold text-muc hover:border-tim hover:text-tim"
            >
              {T.detailExportKho}
            </a>
          )}
          {dangMo === null && (
            <button
              type="button"
              onClick={() => setDangMo("moi")}
              className="rounded-xl bg-tim px-4 py-2.5 text-sm font-black text-white"
            >
              {T.khoAdd}
            </button>
          )}
        </div>
      </div>

      {/* 🔴 Không có loại đáy thì hết hàng là người TRÚNG THẬT ra về tay không.
          Cảnh báo phải nằm ngay trên bảng, không giấu trong tài liệu. */}
      {kho.length > 0 && !coLoaiDay(kho) && (
        <p className="mt-3 rounded-xl bg-vang/20 p-3 text-sm font-semibold text-muc">
          {T.khoWarnNoBottom}
        </p>
      )}

      {loiXoa !== "" && (
        <p role="alert" className="mt-3 rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {loiXoa}
        </p>
      )}

      {dangMo !== null && (
        <FormQua key={dangMo} chuongTrinhId={chuongTrinhId} ma={ma} qua={dangSua} dong={dong} />
      )}

      {kho.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ke bg-white p-6 text-center text-sm text-chi">
          {T.khoEmpty}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-ke bg-white">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-ke text-left text-xs uppercase tracking-wider text-chi">
                <th className="px-4 py-3 font-bold">{T.khoOrder}</th>
                <th className="px-4 py-3 font-bold">{T.khoName}</th>
                <th className="px-4 py-3 font-bold">{T.khoQty}</th>
                <th className="px-4 py-3 font-bold">{T.khoGiven}</th>
                <th className="px-4 py-3 font-bold">{T.khoLeft}</th>
                <th className="px-4 py-3 font-bold">{T.khoCapDay}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {kho.map((q, vt) => {
                const con = conLai(q);
                return (
                  <tr key={q.id} className="border-b border-ke/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-tim">{vt + 1}</span>
                        <NutXep chuongTrinhId={chuongTrinhId} ma={ma} id={q.id} huong="len" tat={vt === 0} />
                        <NutXep
                          chuongTrinhId={chuongTrinhId}
                          ma={ma}
                          id={q.id}
                          huong="xuong"
                          tat={vt === kho.length - 1}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-muc">{q.ten}</td>
                    <td className="px-4 py-3 text-chi">
                      {q.soLuong === null ? (
                        <span className="whitespace-nowrap rounded-full bg-tim-nhat px-2.5 py-1 text-xs font-bold text-tim">
                          {T.khoQtyUnlimited}
                        </span>
                      ) : (
                        q.soLuong
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-muc">{q.daTrao}</td>
                    <td className="px-4 py-3 font-mono font-bold text-muc">
                      {con === null ? "∞" : con}
                    </td>
                    <td className="px-4 py-3 text-chi">{q.tranMoiNgay === 0 ? "—" : q.tranMoiNgay}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLoiXoa("");
                            setDangMo(q.id);
                          }}
                          className="rounded-lg border border-ke px-2.5 py-1 text-xs font-bold text-muc hover:border-tim hover:text-tim"
                        >
                          {T.khoEdit}
                        </button>
                        <button
                          type="button"
                          disabled={dangXoa}
                          onClick={() => {
                            if (!window.confirm(T.khoDeleteConfirm)) return;
                            batDauXoa(async () => {
                              const kq = await xoaQuaAction(q.id, ma);
                              setLoiXoa(kq.loi ?? "");
                            });
                          }}
                          className="rounded-lg border border-do/40 px-2.5 py-1 text-xs font-bold text-do hover:bg-do/10 disabled:opacity-50"
                        >
                          {T.khoDelete}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
