"use client";

import { useState } from "react";

import { T } from "@/config/locale";
import { formatNumber } from "@/lib/bo-dem";
import { nhanDongY, nhanNguoiChoi, nhanSdt } from "@/lib/luot/hien-thi";
import type { DongLichSu } from "@/lib/luot/kho-luot";
import { OTichVan } from "@/components/o-tich-van";

/**
 * Bảng lịch sử ván chơi — sổ đối soát khi có tranh chấp giải thưởng.
 *
 * 🔴 Là component máy khách CHỈ vì một lý do: công tắc "Hiện đầy đủ" cho cột số
 * điện thoại. Số đầy đủ vẫn nằm trong HTML (nút phải chạy được ngay, không gọi
 * lại máy chủ) — thứ chặn người ngoài là phân quyền ở tầng SQL tại
 * `lib/chuong-trinh/kho.ts`, không phải mấy dấu sao này.
 */

const NHAN_THIET_BI: Record<string, string> = {
  man_hinh: T.deviceScreen,
  dien_thoai: T.devicePhone,
  het_gio: T.deviceTimeout,
};

function gioPhut(luc: number | null): string {
  if (luc === null) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(luc));
}

export function BangLichSu({ ma, cacLuot }: { ma: string; cacLuot: DongLichSu[] }) {
  const [hienDu, setHienDu] = useState(false);

  return (
    <section className="khong-in mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-muc">{T.detailHistory}</h2>
        {cacLuot.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHienDu((v) => !v)}
              data-hien-du={hienDu ? "1" : "0"}
              className="rounded-xl border border-ke bg-white px-4 py-2 text-sm font-bold text-muc hover:border-tim hover:text-tim"
            >
              {hienDu ? T.leadHideFull : T.leadShowFull}
            </button>
            <a
              href={`/api/xuat/chuong-trinh/${ma}`}
              className="rounded-xl border border-ke px-4 py-2 text-sm font-bold text-muc hover:border-tim hover:text-tim"
            >
              {T.detailExport}
            </a>
          </div>
        )}
      </div>

      {cacLuot.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white/60 px-6 py-12 text-center text-sm text-chi">
          {T.detailHistoryEmpty}
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-chi">{T.leadMaskNote}</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ke bg-white">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-ke text-xs uppercase tracking-wide text-chi">
                <tr>
                  <th className="px-5 py-3 font-semibold">{T.colTime}</th>
                  <th className="px-5 py-3 font-semibold">{T.colPlayer}</th>
                  <th className="px-5 py-3 font-semibold">{T.leadPhone}</th>
                  <th className="px-5 py-3 font-semibold">{T.leadConsent}</th>
                  <th className="px-5 py-3 font-semibold">{T.colStopped}</th>
                  <th className="px-5 py-3 font-semibold">{T.colResult}</th>
                  <th className="px-5 py-3 font-semibold">{T.colDevice}</th>
                  <th className="px-5 py-3 font-semibold">{T.colCode}</th>
                  <th className="px-5 py-3 font-semibold">{T.colAwarded}</th>
                  <th className="px-5 py-3 font-semibold">{T.colEnrolled}</th>
                </tr>
              </thead>
              <tbody>
                {cacLuot.map((l) => {
                  const dongY = nhanDongY(l.hoTen, l.dongYTuVan);
                  return (
                    <tr key={l.id} className="border-b border-ke last:border-0">
                      <td className="px-5 py-3 tabular-nums text-chi">{gioPhut(l.ketThucLuc)}</td>
                      <td className="px-5 py-3 font-semibold text-muc">
                        {nhanNguoiChoi(l.hoTen)}
                      </td>
                      <td className="px-5 py-3 font-mono text-muc" data-sdt>
                        {nhanSdt(l.soDienThoai, hienDu)}
                      </td>
                      <td className="px-5 py-3">
                        {dongY === "trong" ? (
                          <span className="text-chi">—</span>
                        ) : (
                          <span
                            className={[
                              "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
                              dongY === "co" ? "bg-luc/10 text-luc" : "bg-chi/10 text-chi",
                            ].join(" ")}
                          >
                            {dongY === "co" ? T.leadConsentYes : T.leadConsentNo}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-muc">
                        {l.soDaDung === null ? "—" : formatNumber(l.soDaDung)}
                      </td>
                      <td className="px-5 py-3">
                        {l.trung ? (
                          <span className="rounded-full bg-luc/10 px-2.5 py-1 text-xs font-black text-luc">
                            {T.resultWin}
                          </span>
                        ) : (
                          <span className="text-chi">
                            {T.resultLose}
                            {l.khoangLech !== null && ` · ${T.offByN(l.khoangLech)}`}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-chi">
                        {NHAN_THIET_BI[l.thietBiBam ?? ""] ?? "—"}
                      </td>
                      {/* Mã xác thực phải tra được ở ĐÂY. Không có cột này thì
                          phụ huynh bấm nhầm "thử lại" trên điện thoại là mất mã,
                          và nhân viên không còn chỗ nào để đối chiếu. */}
                      <td className="px-5 py-3 font-mono text-xs tracking-widest text-muc">
                        {l.maXacThuc ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        {l.trung ? (
                          <OTichVan
                            vanId={l.id}
                            ma={ma}
                            coVan="trao-thuong"
                            banDau={l.daTraoThuong}
                            nhan={T.awardToggle}
                          />
                        ) : (
                          <span className="text-chi">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {/* Chỉ ván có danh tính mới đánh dấu được — ván ẩn danh
                            không có ai để mà ghi danh. */}
                        {l.hoTen === null ? (
                          <span className="text-chi">—</span>
                        ) : (
                          <OTichVan
                            vanId={l.id}
                            ma={ma}
                            coVan="ghi-danh"
                            banDau={l.daGhiDanh}
                            nhan={T.enrollToggle}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
