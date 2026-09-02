import Link from "next/link";
import { notFound } from "next/navigation";

import { T } from "@/config/locale";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { timTheoMaVongQuay } from "@/lib/chuong-trinh/kho";
import { mucCanhBaoKho } from "@/lib/vong-quay/canh-bao-o";
import { conLai } from "@/lib/vong-quay/chia-o";
import { danhSachO } from "@/lib/vong-quay/kho-o";
import { lichSuLuot } from "@/lib/vong-quay/kho-luot-quay";

export const dynamic = "force-dynamic";

function gioVN(luc: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(luc));
}

export default async function TrangChiTietVongQuay({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  // 🔴 Lọc theo phạm vi NGAY ở câu SQL. Lớp chặn ở `proxy.ts` chỉ hỏi "đã đăng
  // nhập chưa", không hỏi "được xem dữ liệu của ai".
  const nguoi = await batBuocDangNhap();
  const ct = timTheoMaVongQuay(ma, phamViCua(nguoi));
  if (!ct) notFound();

  const dsO = danhSachO(ct.id);
  const canhBao = mucCanhBaoKho(dsO);
  const lichSu = lichSuLuot(ct.id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/quan-tri/vong-quay" className="text-sm font-bold text-chi hover:text-tim">
        ← {T.vongQuayTitle}
      </Link>

      <h1 className="mt-2 text-2xl font-black text-muc sm:text-3xl">
        {ct.ma} — {ct.tenGiaiThuong}
      </h1>
      <p className="mt-1 text-sm text-chi">
        {ct.tenTrungTam} · {T.vongQuayLuotDaQuay}: <b className="text-muc">{lichSu.length}</b>
      </p>

      {canhBao.muc === "vang" && (
        <p role="alert" className="mt-4 rounded-xl bg-vang/20 px-4 py-3 text-sm font-semibold text-muc">
          ⚠️ {T.vongQuayCanhBaoVang}
        </p>
      )}
      {canhBao.muc === "do" && (
        <p role="alert" className="mt-4 rounded-xl bg-do/10 px-4 py-3 text-sm font-semibold text-do">
          🔴 {T.vongQuayCanhBaoDo}
        </p>
      )}

      <h2 className="mt-8 text-lg font-black text-muc">{T.vongQuayKhoTieuDe}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {dsO.map((o) => {
          const con = conLai(o);
          return (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-ke bg-white px-4 py-3"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 shrink-0 rounded-full border border-ke"
                  style={{ backgroundColor: o.mau }}
                />
                <b className="text-muc">{o.ten}</b>
              </span>
              <span className="text-sm text-chi">
                {con === null ? T.vongQuayKhoKhongGioiHan : T.vongQuayKhoConLai(con)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-muc">{T.vongQuayLuotDaQuay}</h2>
        {lichSu.length > 0 && (
          <a
            href={`/api/xuat/vong-quay/${ct.ma}`}
            className="rounded-xl border border-ke px-4 py-2.5 text-sm font-bold text-tim hover:border-tim"
          >
            {T.vongQuayXuat}
          </a>
        )}
      </div>
      {lichSu.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white p-8 text-center text-sm text-chi">
          {T.vongQuayChuaCoLuot}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-ke bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-ke text-left text-xs uppercase tracking-wide text-chi">
                <th className="px-4 py-3 font-bold">{T.vongQuayCotLuc}</th>
                <th className="px-4 py-3 font-bold">{T.vongQuayCotKhach}</th>
                <th className="px-4 py-3 font-bold">{T.vongQuayCotO}</th>
                <th className="px-4 py-3 font-bold">{T.vongQuayCotMa}</th>
                <th className="px-4 py-3 font-bold">{T.vongQuayCotTrao}</th>
              </tr>
            </thead>
            <tbody>
              {lichSu.map((d) => (
                <tr key={d.id} className="border-b border-ke/60 last:border-0">
                  <td className="px-4 py-3 text-chi">{gioVN(d.luc)}</td>
                  <td className="px-4 py-3">
                    <b className="text-muc">{d.tenRutGon}</b>{" "}
                    <span className="text-chi">{d.sdtChe}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      {d.oMau && (
                        <span
                          aria-hidden="true"
                          className="inline-block h-3 w-3 rounded-full border border-ke"
                          style={{ backgroundColor: d.oMau }}
                        />
                      )}
                      {d.oTen ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-tim">
                    {/* 🔴 Nút DỰNG LẠI VÁN — câu trả lời cho "có chỉnh kết quả
                        không" phải là một cái nút bấm được, không phải lời hứa. */}
                    <Link
                      href={`/quan-tri/vong-quay/${ct.ma}/dung-lai/${d.id}`}
                      className="hover:underline"
                    >
                      {d.maXacThuc ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {d.daTraoThuong ? (
                      <span className="font-bold text-luc">✓</span>
                    ) : (
                      <span className="text-chi">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
