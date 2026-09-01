import { notFound } from "next/navigation";

import { T } from "@/config/locale";
import { HAN_LUU_LEAD_THANG } from "@/config/to-chuc";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { xemDuocNhatKy } from "@/lib/bao-ve/quyen";
import { demLeadQuaHan, docNhatKy } from "@/lib/nhat-ky/kho";
import { OXoaSdt } from "@/components/o-xoa-sdt";

export const dynamic = "force-dynamic";

function gioPhut(luc: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(luc));
}

export default async function TrangNhatKy() {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi || !xemDuocNhatKy(nguoi)) notFound();

  const dong = docNhatKy();
  const quaHan = demLeadQuaHan(HAN_LUU_LEAD_THANG);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.nkTitle}</h1>
      <p className="mt-1 max-w-2xl text-sm text-chi">{T.nkSubtitle}</p>

      <section className="mt-6">
        <h2 className="text-lg font-black text-muc">{T.riengTuTitle}</h2>
        <p className="mt-1 text-sm text-chi">
          {quaHan > 0
            ? T.riengTuHan(HAN_LUU_LEAD_THANG, quaHan)
            : T.riengTuHanKhong(HAN_LUU_LEAD_THANG)}
        </p>
        <OXoaSdt />
      </section>

      <h2 className="mt-8 text-lg font-black text-muc">{T.nkTitle}</h2>
      {dong.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white p-8 text-center text-sm text-chi">
          {T.nkEmpty}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-ke bg-white">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-ke text-left text-xs uppercase tracking-wider text-chi">
                <th className="px-4 py-3 font-bold">{T.nkWhen}</th>
                <th className="px-4 py-3 font-bold">{T.nkWho}</th>
                <th className="px-4 py-3 font-bold">{T.nkWhat}</th>
                <th className="px-4 py-3 font-bold">{T.nkTarget}</th>
                <th className="px-4 py-3 font-bold">{T.nkRows}</th>
                <th className="px-4 py-3 font-bold">{T.nkIp}</th>
              </tr>
            </thead>
            <tbody>
              {dong.map((d) => (
                <tr key={d.id} className="border-b border-ke/60 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-chi">{gioPhut(d.luc)}</td>
                  <td className="px-4 py-3 font-semibold text-muc">
                    {d.tenNhanVien ?? T.nkHeThong}
                  </td>
                  <td className="px-4 py-3 text-muc">
                    {T.nkHanhDong[d.hanhDong] ?? d.hanhDong}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-chi">{d.doiTuong ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-muc">{d.soDong ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-chi">{d.diaChiIp ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
