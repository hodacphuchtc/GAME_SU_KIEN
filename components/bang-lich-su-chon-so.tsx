"use client";

import { useState } from "react";

import { T } from "@/config/locale";
import { formatNumber } from "@/lib/bo-dem";
import { nhanDongY, nhanNguoiChoi, nhanSdt } from "@/lib/luot/hien-thi";
import type { DongLichSu } from "@/lib/luot/kho-luot";
import { OTichVan } from "@/components/o-tich-van";

/**
 * Sổ số đã phát của game CHỌN SỐ — nơi đối soát khi phụ huynh quay lại quầy.
 *
 * 🔴 Cố ý KHÔNG dùng chung `BangLichSu`: bảng kia có cột "Kết quả" và "Lệch",
 * và ở đây chúng sẽ ghi **"Trượt" trên mọi dòng** cho một trò không có giải.
 *
 * Là component máy khách CHỈ vì công tắc "Hiện đầy đủ" của cột số điện thoại.
 * Thứ chặn người ngoài là phân quyền ở tầng SQL, không phải mấy dấu sao này.
 */

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

export function BangLichSuChonSo({ ma, cacLuot }: { ma: string; cacLuot: DongLichSu[] }) {
  const [hienDu, setHienDu] = useState(false);

  return (
    <section className="khong-in mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-muc">{T.chonSoLichSu}</h2>
        {cacLuot.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHienDu((v) => !v)}
              data-hien-du={hienDu ? "1" : "0"}
              className="rounded-xl border border-ke px-4 py-2 text-sm font-semibold text-muc"
            >
              {hienDu ? T.leadHideFull : T.leadShowFull}
            </button>
            <a
              href={`/api/xuat/chon-so/${ma}`}
              className="rounded-xl bg-tim px-4 py-2 text-sm font-semibold text-white"
            >
              {T.chonSoXuat}
            </a>
          </div>
        )}
      </div>

      {cacLuot.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white/60 px-6 py-12 text-center text-sm text-chi">
          {T.chonSoChuaCoVan}
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-chi">{T.leadMaskNote}</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ke bg-white">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-ke text-xs uppercase tracking-wide text-chi">
                <tr>
                  <th className="px-5 py-3 font-semibold">{T.colTime}</th>
                  <th className="px-5 py-3 font-semibold">{T.colPlayer}</th>
                  <th className="px-5 py-3 font-semibold">{T.leadPhone}</th>
                  <th className="px-5 py-3 font-semibold">{T.leadConsent}</th>
                  <th className="px-5 py-3 font-semibold">{T.chonSoCotSo}</th>
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
                      <td className="px-5 py-3 tabular-nums text-chi">
                        {gioPhut(l.ketThucLuc)}
                      </td>
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
                      {/* Số may mắn — đệm 0 đúng như con số phụ huynh cầm trên tay. */}
                      <td className="px-5 py-3 font-mono text-lg font-black text-cam">
                        {l.soDaDung === null ? "—" : formatNumber(l.soDaDung)}
                      </td>
                      <td className="px-5 py-3 font-mono text-muc">{l.maXacThuc ?? "—"}</td>
                      <td className="px-5 py-3">
                        <OTichVan
                          vanId={l.id}
                          ma={ma}
                          coVan="trao-thuong"
                          banDau={l.daTraoThuong}
                          nhan={T.colAwarded}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <OTichVan
                          vanId={l.id}
                          ma={ma}
                          coVan="ghi-danh"
                          banDau={l.daGhiDanh}
                          nhan={T.colEnrolled}
                        />
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
