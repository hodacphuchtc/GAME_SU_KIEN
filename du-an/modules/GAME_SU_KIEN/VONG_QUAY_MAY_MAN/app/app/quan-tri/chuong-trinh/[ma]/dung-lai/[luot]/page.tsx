import Link from "next/link";
import { notFound } from "next/navigation";

import { T } from "@/config/locale";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { lichSuLuot, timLuot } from "@/lib/luot/kho";
import { chuanHoaGoc } from "@/lib/vong-quay/goc";
import { DungLaiVan } from "@/components/dung-lai-van";

export const dynamic = "force-dynamic";

function gio(luc: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(luc));
}

/**
 * DỰNG LẠI MỘT VÁN ĐÃ QUAY.
 *
 * Đây là câu trả lời cho "có chỉnh kết quả không" — và nó phải là một cái nút
 * bấm được, không phải một lời hứa. Trò do MÁY quyết kết quả thì sớm muộn cũng
 * bị hỏi câu đó.
 */
export default async function TrangDungLai({
  params,
}: {
  params: Promise<{ ma: string; luot: string }>;
}) {
  const { ma, luot } = await params;
  const ct = timTheoMa(ma);
  if (!ct) notFound();

  const l = timLuot(Number(luot));
  // Lượt của chương trình KHÁC thì cũng coi như không có: đường dẫn ghép tay
  // không được phép mở sổ của cơ sở khác.
  if (!l || l.chuongTrinhId !== ct.id) notFound();

  const dong = lichSuLuot(ct.id).find((d) => d.id === l.id);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={`/quan-tri/chuong-trinh/${ct.ma}`}
        className="text-sm text-chi hover:text-muc"
      >
        {T.dlQuayLai}
      </Link>

      <h1 className="mt-3 text-2xl font-black text-muc">{T.dlTieuDe}</h1>
      <p className="mt-1 max-w-2xl text-sm text-chi">{T.dlGiaiThich}</p>

      <div className="mt-6">
        {l.cung ? (
          <DungLaiVan cung={l.cung} gocDung={l.gocDung} />
        ) : (
          <p className="rounded-2xl bg-vang/20 p-4 text-sm text-muc">{T.dlKhongDungDuoc}</p>
        )}
      </div>

      <dl className="mt-8 grid gap-3 rounded-2xl border border-ke bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-chi">{T.dlLucQuay}</dt>
          <dd className="font-semibold text-muc">{gio(l.luc)}</dd>
        </div>
        <div>
          <dt className="text-chi">{T.dlNguoiChoi}</dt>
          <dd className="font-semibold text-muc">{dong?.tenRutGon ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-chi">{T.dlOTrung}</dt>
          <dd className="font-semibold text-muc">{dong?.oTen ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-chi">{T.ctCotMa}</dt>
          <dd className="font-mono font-bold text-cam">{dong?.maXacThuc ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-chi">{T.dlGocDung}</dt>
          <dd className="font-mono text-muc">{chuanHoaGoc(l.gocDung).toFixed(3)}°</dd>
        </div>
        <div>
          <dt className="text-chi">{T.dlPhienBan}</dt>
          <dd className="font-mono text-muc">#{l.phienBanO}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-chi">{T.dlHatGiong}</dt>
          {/* Hạt giống in ra ĐẦY ĐỦ: đây chính là thứ để bên thứ ba tự kiểm
              lại kết quả mà không cần tin lời chúng ta. */}
          <dd className="break-all font-mono text-xs text-muc">{l.hatGiong}</dd>
        </div>
      </dl>
    </main>
  );
}
