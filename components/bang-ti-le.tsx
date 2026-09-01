"use client";

import {
  NGUONG_CANH_BAO_TRAN,
  REACTION_JITTER_SECONDS,
  VAN_UOC_TINH_MOI_NGAY,
  type RoundSettings,
} from "@/config/game";
import { T } from "@/config/locale";
import { duBaoGiaiMoiNgay, estimateWinChance, formatOdds } from "@/lib/bo-dem";

/**
 * Bảng tỉ lệ trúng + dự báo tiền quà. Dùng CHUNG cho form tạo và form sửa.
 *
 * 🔴 Đây là thứ quan trọng nhất trên cả hai form, không phải mấy ô nhập: không
 * có nó thì người ta treo giải mà không biết mình vừa hứa cho đi bao nhiêu. Và
 * nó phải đổi NGAY LÚC GÕ — sau khi đã bấm Lưu thì đã muộn.
 */
export function BangTiLe({
  thamSo,
  soTrung,
  soLan,
  tranGiai,
}: {
  thamSo: RoundSettings;
  soTrung: number;
  soLan: number;
  tranGiai: number;
}) {
  const uocTinh = estimateWinChance(thamSo, soTrung, soLan);
  const motLan = estimateWinChance(thamSo, soTrung, 1);
  const duBao = duBaoGiaiMoiNgay(uocTinh.perVan, VAN_UOC_TINH_MOI_NGAY);
  const vuotTran = tranGiai > 0 && duBao >= tranGiai * NGUONG_CANH_BAO_TRAN;

  return (
    <div className="rounded-2xl bg-suong p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-chi">{T.createOddsTitle}</p>
      {uocTinh.passes === 0 ? (
        <p className="mt-2 text-sm font-semibold text-do">{T.createWarnUnreachable}</p>
      ) : (
        <>
          <p className="mt-1 text-3xl font-black text-tim">
            {formatOdds(uocTinh.perVan)}{" "}
            <span className="text-base font-medium text-chi">{T.createOddsPerVan}</span>
          </p>
          <p className="mt-1 text-sm text-chi">
            {formatOdds(uocTinh.perRound)} {T.createOddsPerPress} · {T.passCount}:{" "}
            {uocTinh.passes} {T.times} ({T.atSecond}{" "}
            {uocTinh.passSeconds.map((s) => s.toFixed(1)).join(", ")})
          </p>
          {soLan > 1 && (
            <p className="mt-1 text-sm font-semibold text-muc">
              {T.createTriesEffect(soLan, formatOdds(motLan.perVan), formatOdds(uocTinh.perVan))}
            </p>
          )}

          {/* 🔴 Con số DUY NHẤT quy ra tiền được. Tỉ lệ phần trăm thì đọc lên ai
              cũng gật; "khoảng 4,6 giải mỗi ngày" mới khiến người ta dừng lại
              nhìn cái trần mình vừa đặt. */}
          <div className={["mt-3 rounded-xl p-3", vuotTran ? "bg-do/10" : "bg-white"].join(" ")}>
            <p className="text-xs font-bold uppercase tracking-widest text-chi">
              {T.createForecast}
            </p>
            <p
              className={["mt-0.5 text-lg font-black", vuotTran ? "text-do" : "text-muc"].join(" ")}
            >
              {T.createForecastLine(duBao.toFixed(1), VAN_UOC_TINH_MOI_NGAY)}
            </p>
            <p className="mt-0.5 text-sm text-chi">
              {tranGiai > 0 ? T.createForecastCap(tranGiai) : T.createForecastNoCap}
            </p>
            {vuotTran && (
              <p className="mt-2 text-sm font-semibold text-do">{T.createForecastOver}</p>
            )}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-chi">
            {T.oddsNote} (Độ lệch phản xạ dùng để tính: {REACTION_JITTER_SECONDS} giây.)
          </p>
        </>
      )}
    </div>
  );
}
