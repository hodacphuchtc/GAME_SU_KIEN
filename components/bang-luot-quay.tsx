"use client";

import Link from "next/link";
import { useState } from "react";

import { T } from "@/config/locale";
import { nhanDongY, nhanNguoiChoi, nhanSdt } from "@/lib/luot/hien-thi";
import type { DongLichSu } from "@/lib/vong-quay/kho-luot-quay";
import { OTichTrao } from "@/components/o-tich-trao";

/**
 * Sổ lượt quay — nơi đối soát khi phụ huynh quay lại quầy đòi quà.
 *
 * 🔴 Cố ý KHÔNG dùng chung `BangLichSu` của Trúng Số: bảng kia có cột "Kết quả",
 * "Lệch", "Bấm từ", "Số lần bấm" — bốn khái niệm KHÔNG tồn tại ở vòng quay (một
 * lần chạm, không trúng/trượt). Dùng chung là để lại bốn cột nói dối trên mỗi dòng.
 *
 * Là component máy khách CHỈ vì công tắc "Hiện đầy đủ" của cột số điện thoại và
 * ô tích "đã trao quà". Thứ chặn người ngoài là `phamViCua` ở tầng SQL, không
 * phải mấy dấu sao này.
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

export function BangLuotQuay({ ma, cacLuot }: { ma: string; cacLuot: DongLichSu[] }) {
  const [hienDu, setHienDu] = useState(false);

  return (
    <section className="khong-in mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-muc">{T.vongQuayLuotDaQuay}</h2>
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
              href={`/api/xuat/vong-quay/${ma}`}
              className="rounded-xl bg-tim px-4 py-2 text-sm font-semibold text-white"
            >
              {T.vongQuayXuat}
            </a>
          </div>
        )}
      </div>

      {cacLuot.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white/60 px-6 py-12 text-center text-sm text-chi">
          {T.vongQuayChuaCoLuot}
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
                  <th className="px-5 py-3 font-semibold">{T.vongQuayCotO}</th>
                  <th className="px-5 py-3 font-semibold">{T.colCode}</th>
                  <th className="px-5 py-3 font-semibold">{T.colAwarded}</th>
                </tr>
              </thead>
              <tbody>
                {cacLuot.map((l) => {
                  const dongY = nhanDongY(l.hoTen, l.dongYTuVan);
                  return (
                    <tr key={l.id} className="border-b border-ke/60 last:border-0">
                      <td className="px-5 py-3 text-chi">{gioPhut(l.luc)}</td>
                      <td className="px-5 py-3 font-semibold text-muc">
                        {nhanNguoiChoi(l.hoTen)}
                      </td>
                      <td className="px-5 py-3 font-mono text-chi">
                        {nhanSdt(l.soDienThoai, hienDu)}
                      </td>
                      <td className="px-5 py-3">
                        {dongY === "trong" ? (
                          <span className="text-chi">—</span>
                        ) : (
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              dongY === "co" ? "bg-luc/10 text-luc" : "bg-chi/10 text-chi",
                            ].join(" ")}
                          >
                            {dongY === "co" ? T.leadConsentYes : T.leadConsentNo}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2">
                          {l.oMau && (
                            <span
                              aria-hidden="true"
                              className="inline-block h-3 w-3 rounded-full border border-ke"
                              style={{ backgroundColor: l.oMau }}
                            />
                          )}
                          <b className="text-muc">{l.oTen ?? "—"}</b>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {/* 🔴 Mã xác thực là ĐƯỜNG VÀO "Dựng lại ván" — câu trả lời
                            cho "có chỉnh kết quả không" phải là một nút bấm được,
                            không phải một lời hứa. */}
                        <Link
                          href={`/quan-tri/vong-quay/${ma}/dung-lai/${l.id}`}
                          className="font-mono font-bold text-tim hover:underline"
                        >
                          {l.maXacThuc ?? "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <OTichTrao
                          chuongTrinhMa={ma}
                          luotId={l.id}
                          banDau={l.daTraoThuong}
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
