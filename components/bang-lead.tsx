"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { T } from "@/config/locale";
import { TRANG_THAI_LEAD, type TrangThaiLead } from "@/config/to-chuc";
import type { CoSo } from "@/lib/co-so/nhan";
import type { Lead } from "@/lib/lead/kho";
import type { NhanVien } from "@/lib/nhan-vien/kho";
import { cheSdt } from "@/lib/nguoi-choi/so-dien-thoai";
import {
  chiaLuanPhienAction,
  datTrangThaiLeadAction,
  ganLeadAction,
  ghiChuLeadAction,
} from "@/app/actions/lead";

/**
 * Danh sách khách tiềm năng + bộ lọc + thao tác trên từng dòng.
 *
 * 🔴 Số điện thoại CHE SẴN. Đây là lớp chống người đi ngang qua quầy liếc thấy
 * danh bạ trên màn hình — KHÔNG phải chống kẻ tấn công: số đầy đủ vẫn nằm trong
 * HTML để nút "Hiện đầy đủ" chạy được ngay mà không phải gọi lại máy chủ. Ai mở
 * được trang này thì đọc được số, và cửa chặn thật nằm ở đăng nhập + phạm vi.
 *
 * Bộ lọc đi qua ĐƯỜNG DẪN (query string) chứ không giữ trong state: quản lý cần
 * gửi cho nhau đúng cái danh sách đang nhìn, và một trang không chép được địa
 * chỉ thì họ sẽ chụp màn hình gửi qua Zalo.
 */

const O = "rounded-xl border border-ke bg-white px-3 py-2 text-sm text-muc focus:border-tim focus:outline-none";

function ODoiTrangThai({ lead }: { lead: Lead }) {
  const [dangGui, batDau] = useTransition();
  return (
    <select
      value={lead.trangThai}
      disabled={dangGui}
      aria-label={T.leadState}
      onChange={(e) =>
        batDau(() => void datTrangThaiLeadAction(lead.id, e.target.value as TrangThaiLead))
      }
      className={`${O} disabled:opacity-50`}
    >
      {TRANG_THAI_LEAD.map((t) => (
        <option key={t} value={t}>
          {T.trangThaiLead[t] ?? t}
        </option>
      ))}
    </select>
  );
}

function OGanSale({ lead, sale }: { lead: Lead; sale: NhanVien[] }) {
  const [dangGui, batDau] = useTransition();
  // Chỉ sale ĐANG LÀM của đúng cơ sở khách đó — gán khách CS1 cho sale CS2 là
  // tạo ra một dòng không ai chăm sóc được.
  const chon = sale.filter((s) => s.coSoId === lead.coSoId && s.trangThai === "dang_lam");

  return (
    <select
      value={lead.nhanVienId ?? ""}
      disabled={dangGui}
      aria-label={T.leadOwner}
      onChange={(e) =>
        batDau(() =>
          void ganLeadAction(lead.id, e.target.value === "" ? null : Number(e.target.value)),
        )
      }
      className={`${O} disabled:opacity-50`}
    >
      <option value="">{T.leadOwnerNone}</option>
      {chon.map((s) => (
        <option key={s.id} value={s.id}>
          {s.hoTen}
        </option>
      ))}
    </select>
  );
}

function OGhiChu({ lead }: { lead: Lead }) {
  const [chu, setChu] = useState(lead.ghiChu ?? "");
  const [dangGui, batDau] = useTransition();
  const [daLuu, setDaLuu] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <input
        value={chu}
        aria-label={T.leadGhiChu}
        placeholder={T.leadGhiChuPlaceholder}
        onChange={(e) => {
          setChu(e.target.value);
          setDaLuu(false);
        }}
        className={`${O} w-40`}
      />
      <button
        type="button"
        disabled={dangGui || chu === (lead.ghiChu ?? "")}
        onClick={() =>
          batDau(async () => {
            await ghiChuLeadAction(lead.id, chu);
            setDaLuu(true);
          })
        }
        className="rounded-lg border border-ke px-2 py-1 text-xs font-bold text-muc disabled:opacity-30"
      >
        {daLuu ? T.leadDaLuu : T.leadLuu}
      </button>
    </div>
  );
}

export interface BoLocHienThi {
  coSoId: string;
  trangThai: string;
  nhanVienId: string;
  chuaGiao: boolean;
  chiDongY: boolean;
  tuNgay: string;
  denNgay: string;
}

export function BangLead({
  danhSach,
  coSo,
  sale,
  loc,
  duocChia,
}: {
  danhSach: Lead[];
  coSo: CoSo[];
  sale: NhanVien[];
  loc: BoLocHienThi;
  duocChia: boolean;
}) {
  const router = useRouter();
  const thamSo = useSearchParams();
  const [hienDu, setHienDu] = useState(false);
  const [tinChia, setTinChia] = useState<{ loi?: string; xong?: string }>({});
  const [dangChia, batDauChia] = useTransition();

  const dat = useCallback(
    (khoa: string, gt: string) => {
      const moi = new URLSearchParams(thamSo?.toString() ?? "");
      if (gt === "") moi.delete(khoa);
      else moi.set(khoa, gt);
      router.push(`/quan-tri/khach?${moi.toString()}`);
    },
    [router, thamSo],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.leadTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-chi">{T.leadSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHienDu((v) => !v)}
            data-hien-du={hienDu ? "1" : "0"}
            className="rounded-xl border border-ke bg-white px-4 py-2.5 text-sm font-bold text-muc hover:border-tim hover:text-tim"
          >
            {hienDu ? T.leadHideFull : T.leadShowFull}
          </button>
          {/* Xuất ĐÚNG cái đang nhìn: chép nguyên query string hiện tại sang
              route xuất, nên bộ lọc trên màn và bộ lọc trong file luôn khớp. */}
          <a
            href={`/api/xuat/khach-tiem-nang?${thamSo?.toString() ?? ""}`}
            className="rounded-xl border border-ke bg-white px-4 py-2.5 text-sm font-bold text-muc hover:border-tim hover:text-tim"
          >
            {T.leadExport}
          </a>
          {duocChia && (
            <button
              type="button"
              disabled={dangChia}
              onClick={() => {
                if (!window.confirm(T.leadChiaXacNhan)) return;
                batDauChia(async () => {
                  setTinChia(
                    await chiaLuanPhienAction(loc.coSoId === "" ? null : Number(loc.coSoId)),
                  );
                });
              }}
              className="rounded-xl bg-tim px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {T.leadChia}
            </button>
          )}
        </div>
      </div>

      {tinChia.loi && (
        <p role="alert" className="mt-3 rounded-xl bg-vang/20 p-3 text-sm font-semibold text-muc">
          {tinChia.loi}
        </p>
      )}
      {tinChia.xong && (
        <p role="status" className="mt-3 rounded-xl bg-luc/10 p-3 text-sm font-semibold text-luc">
          {tinChia.xong}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-ke bg-white p-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-chi">
          {T.leadLocCoSo}
          <select value={loc.coSoId} onChange={(e) => dat("coSo", e.target.value)} className={O}>
            <option value="">{T.leadLocMoi}</option>
            {coSo.map((cs) => (
              <option key={cs.id} value={cs.id}>{cs.ma} — {cs.ten}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-chi">
          {T.leadLocTrangThai}
          <select value={loc.trangThai} onChange={(e) => dat("trangThai", e.target.value)} className={O}>
            <option value="">{T.leadLocMoi}</option>
            {TRANG_THAI_LEAD.map((t) => (
              <option key={t} value={t}>{T.trangThaiLead[t] ?? t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-chi">
          {T.leadLocSale}
          <select value={loc.nhanVienId} onChange={(e) => dat("sale", e.target.value)} className={O}>
            <option value="">{T.leadLocMoi}</option>
            {sale.map((s) => (
              <option key={s.id} value={s.id}>{s.hoTen}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-chi">
          {T.leadLocTuNgay}
          <input type="date" value={loc.tuNgay} onChange={(e) => dat("tuNgay", e.target.value)} className={O} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-chi">
          {T.leadLocDenNgay}
          <input type="date" value={loc.denNgay} onChange={(e) => dat("denNgay", e.target.value)} className={O} />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-muc">
          <input type="checkbox" checked={loc.chuaGiao}
            onChange={(e) => dat("chuaGiao", e.target.checked ? "1" : "")}
            className="h-4 w-4 accent-tim" />
          {T.leadLocChuaGiao}
        </label>
        {/* 🔴 Tick này BẬT SẴN. Căn cứ hợp pháp để gọi điện nằm ở chính cái tick
            người ta đã đánh trên điện thoại — muốn xem hết thì phải chủ động bỏ. */}
        <label className="flex items-center gap-2 pb-2 text-sm text-muc">
          <input type="checkbox" checked={loc.chiDongY}
            onChange={(e) => dat("chiDongY", e.target.checked ? "" : "0")}
            className="h-4 w-4 accent-tim" />
          {T.leadLocDongY}
        </label>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-chi">{T.leadMaskNote}</p>

      {danhSach.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ke bg-white p-8 text-center text-sm text-chi">
          {T.leadEmpty}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-chi">
            {T.leadCount(danhSach.length)}
          </p>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-ke bg-white">
            <table className="w-full min-w-[64rem] text-sm">
              <thead>
                <tr className="border-b border-ke text-left text-xs uppercase tracking-wider text-chi">
                  <th className="px-4 py-3 font-bold">{T.leadName}</th>
                  <th className="px-4 py-3 font-bold">{T.leadPhone}</th>
                  <th className="px-4 py-3 font-bold">{T.leadBranch}</th>
                  <th className="px-4 py-3 font-bold">{T.leadOwner}</th>
                  <th className="px-4 py-3 font-bold">{T.leadState}</th>
                  <th className="px-4 py-3 font-bold">{T.leadGhiChu}</th>
                  <th className="px-4 py-3 font-bold">{T.leadConsent}</th>
                </tr>
              </thead>
              <tbody>
                {danhSach.map((l) => (
                  <tr key={l.id} className="border-b border-ke/60 last:border-0">
                    <td className="px-4 py-3 font-semibold text-muc">{l.hoTen}</td>
                    <td className="px-4 py-3 font-mono text-muc" data-sdt>
                      {hienDu ? l.soDienThoai : cheSdt(l.soDienThoai)}
                      {/* Khách online tự gõ số, chưa qua mã xác minh nào. Sale
                          phải biết TRƯỚC khi tính vào chỉ tiêu (xem N.9). */}
                      {l.chuaXacThuc && (
                        <span
                          data-chua-xac-thuc
                          title={T.leadChuaXacThucNhac}
                          className="ml-2 whitespace-nowrap rounded-full bg-vang/25 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide text-muc"
                        >
                          {T.leadChuaXacThuc}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-chi">{l.tenCoSo ?? "—"}</td>
                    <td className="px-4 py-3"><OGanSale lead={l} sale={sale} /></td>
                    <td className="px-4 py-3"><ODoiTrangThai lead={l} /></td>
                    <td className="px-4 py-3"><OGhiChu lead={l} /></td>
                    <td className="px-4 py-3">
                      <span className={[
                        "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
                        l.dongYTuVan ? "bg-luc/10 text-luc" : "bg-chi/10 text-chi",
                      ].join(" ")}>
                        {l.dongYTuVan ? T.leadConsentYes : T.leadConsentNo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
