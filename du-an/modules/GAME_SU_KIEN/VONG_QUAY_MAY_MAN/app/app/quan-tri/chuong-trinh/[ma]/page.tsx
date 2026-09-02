import Link from "next/link";
import { notFound } from "next/navigation";

import { T } from "@/config/locale";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { demLuot, lichSuLuot } from "@/lib/luot/kho";
import { mucCanhBaoKho } from "@/lib/o-qua/canh-bao";
import { danhSachO } from "@/lib/o-qua/kho";
import { conLai } from "@/lib/vong-quay/chia-o";
import { OTichTrao } from "@/components/o-tich-trao";

// Người ở quầy tích "đã trao" rồi tải lại trang phải thấy dấu tích còn nguyên.
export const dynamic = "force-dynamic";

function gio(luc: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(luc));
}

export default async function TrangChiTiet({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const ct = timTheoMa(ma);
  if (!ct) notFound();

  const dsO = danhSachO(ct.id);
  const canhBao = mucCanhBaoKho(dsO);
  const lichSu = lichSuLuot(ct.id);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/quan-tri" className="text-sm text-chi hover:text-muc">
        {T.ctQuayLai}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-muc">{T.ctTieuDe(ct.tenCoSo)}</h1>
          <p className="mt-1 text-sm text-chi">
            {T.ctMaChuongTrinh}: <span className="font-mono font-bold text-muc">{ct.ma}</span>
            {" · "}
            {T.ctSoLuot(demLuot(ct.id))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* 🔴 Thẻ <a> thường, KHÔNG phải <Link>: đây là một lượt TẢI FILE, không
              phải điều hướng trong ứng dụng. Router của Next sẽ cố nạp nó như một
              trang và người bấm chẳng nhận được tệp nào. */}
          <a
            href={`/api/xuat/${ct.ma}`}
            className="rounded-xl border border-ke bg-white px-5 py-3 text-sm font-black text-muc hover:bg-ke/30"
          >
            {T.ctXuatExcel}
          </a>
          <Link
            href={`/man-hinh/${ct.ma}`}
            className="rounded-xl bg-tim px-5 py-3 text-sm font-black text-white hover:brightness-110"
          >
            {T.ctManHinhLcd}
          </Link>
        </div>
      </div>

      {/* 🔴 Dải cảnh báo hiện ở CẢ danh sách lẫn trang này. Quản lý mở thẳng
          trang chi tiết từ mã QR trên giấy, không phải lúc nào cũng đi qua
          danh sách — cảnh báo chỉ nằm một chỗ là chỗ họ không nhìn. */}
      {canhBao.muc === "vang" && (
        <div className="mt-5 rounded-2xl bg-vang/20 p-4 text-sm text-muc">
          <p className="font-semibold">{T.ctCanhBaoVang}</p>
          <p className="mt-1">
            {canhBao.sapHet.map((o) => `${o.ten} (${T.ctKhoConLai(conLai(o) ?? 0)})`).join(" · ")}
          </p>
        </div>
      )}
      {canhBao.muc === "do" && (
        <p className="mt-5 rounded-2xl bg-do/10 p-4 text-sm font-semibold text-do">
          {T.ctCanhBaoDo}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-black text-muc">{T.ctKhoTieuDe}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {dsO.map((o) => (
            <li
              key={o.id}
              className="flex items-center gap-2 rounded-xl border border-ke bg-white px-3 py-2 text-sm"
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: o.mau }} />
              <span className="font-semibold text-muc">{o.ten}</span>
              <span className="text-chi">
                {o.soLuong === null ? T.ctKhoKhongGioiHan : T.ctKhoConLai(conLai(o) ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-black text-muc">{T.ctLichSuTieuDe}</h2>

        {lichSu.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white/60 px-6 py-10 text-center text-sm text-chi">
            {T.ctLichSuTrong}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ke bg-white">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-ke text-xs uppercase tracking-wide text-chi">
                <tr>
                  <th className="px-4 py-3 font-semibold">{T.ctCotGio}</th>
                  <th className="px-4 py-3 font-semibold">{T.ctCotNguoi}</th>
                  <th className="px-4 py-3 font-semibold">{T.ctCotSdt}</th>
                  <th className="px-4 py-3 font-semibold">{T.ctCotO}</th>
                  <th className="px-4 py-3 font-semibold">{T.ctCotMa}</th>
                  <th className="px-4 py-3 text-center font-semibold">{T.ctCotTrao}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {lichSu.map((d) => (
                  <tr key={d.id} className="border-b border-ke/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-chi">{gio(d.luc)}</td>
                    <td className="px-4 py-3 font-semibold text-muc">{d.tenRutGon}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-chi">{d.sdtChe}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        {d.oMau && (
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: d.oMau }}
                          />
                        )}
                        {d.oTen ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold tracking-wider text-cam">
                      {d.maXacThuc ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <OTichTrao
                        chuongTrinhMa={ct.ma}
                        luotId={d.id}
                        banDau={d.daTraoThuong}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/quan-tri/chuong-trinh/${ct.ma}/dung-lai/${d.id}`}
                        className="text-sm font-semibold text-tim hover:underline"
                      >
                        {T.ctDungLai}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
