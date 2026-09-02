import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { T } from "@/config/locale";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { danhSachLead } from "@/lib/lead/kho";
import {
  hoSoKhach,
  lichSuChoiCuaKhach,
  soThayDoi,
} from "@/lib/lead/lich-su-khach";
import { cheSdt } from "@/lib/nguoi-choi/so-dien-thoai";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";

export const dynamic = "force-dynamic";

function gio(luc: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(luc));
}

/**
 * HỒ SƠ MỘT KHÁCH, gộp cả ba game.
 *
 * 🔴 Số điện thoại hiện dạng ĐÃ CHE và KHÔNG có nút mở. Trang danh sách có nút đó
 * vì nhân viên cần soi nhanh nhiều dòng; trang này chỉ có MỘT người, ai cần số đầy
 * đủ thì tải Excel qua `/api/xuat/khach-tiem-nang` — đường đó có ghi nhật ký ai tải.
 */
export default async function TrangChiTietKhach({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nguoiChoiId = Number(id);
  if (!Number.isInteger(nguoiChoiId) || nguoiChoiId <= 0) notFound();

  // 🔴 Lọc phạm vi ở TẦNG SQL. `hoSoKhach` chỉ trả về khi người đăng nhập có ít
  // nhất một lead của khách này trong phạm vi của họ — sale cơ sở khác nhận null.
  const nguoi = await batBuocDangNhap();
  const pv = phamViCua(nguoi);
  const hs = hoSoKhach(nguoiChoiId, pv);
  if (!hs) notFound();

  const luot = lichSuChoiCuaKhach(nguoiChoiId, pv);
  const so = soThayDoi(nguoiChoiId);
  const cacLead = danhSachLead(pv).filter((l) => l.nguoiChoiId === nguoiChoiId);

  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xemLead,
    doiTuong: `khach:${nguoiChoiId}`,
    soDong: luot.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/quan-tri/khach" className="text-sm font-bold text-chi hover:text-tim">
        {T.khachQuayLai}
      </Link>

      <p className="mt-2 text-xs font-bold uppercase tracking-widest text-chi">
        {T.khachChiTietTitle}
      </p>
      <h1 className="mt-1 text-2xl font-black text-muc sm:text-3xl">{hs.hoTen}</h1>
      <p className="mt-1 font-mono text-sm text-chi">{cheSdt(hs.soDienThoai)}</p>

      <dl className="mt-6 grid gap-3 rounded-2xl border border-ke bg-white p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-chi">{T.leadConsent}</dt>
          <dd className={hs.dongYTuVan ? "font-bold text-luc" : "font-bold text-chi"}>
            {hs.dongYTuVan ? T.leadConsentYes : T.leadConsentNo}
          </dd>
        </div>
        <div>
          <dt className="text-chi">{T.khachQuanTam}</dt>
          <dd className="font-bold text-muc">{hs.quanTamHocThu ? T.co : T.khong}</dd>
        </div>
        <div>
          <dt className="text-chi">{T.khachTuNgay}</dt>
          <dd className="font-bold text-muc">{gio(hs.taoLuc)}</dd>
        </div>
      </dl>

      <h2 className="mt-8 text-lg font-black text-muc">
        {T.khachDaChoi} ({luot.length})
      </h2>
      {luot.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white p-8 text-center text-sm text-chi">
          {T.khachChuaChoi}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-ke bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-ke text-xs uppercase tracking-wide text-chi">
              <tr>
                <th className="px-4 py-3 font-bold">{T.colTime}</th>
                <th className="px-4 py-3 font-bold">{T.khachCotGame}</th>
                <th className="px-4 py-3 font-bold">{T.khachCotDot}</th>
                <th className="px-4 py-3 font-bold">{T.leadBranch}</th>
                <th className="px-4 py-3 font-bold">{T.khachCotQua}</th>
                <th className="px-4 py-3 font-bold">{T.colAwarded}</th>
              </tr>
            </thead>
            <tbody>
              {luot.map((l, i) => (
                <tr key={`${l.chuongTrinhMa}-${l.luc}-${i}`} className="border-b border-ke/60 last:border-0">
                  <td className="px-4 py-3 text-chi">{gio(l.luc)}</td>
                  <td className="px-4 py-3 font-semibold text-tim">
                    {T.tenTroChoi[l.troChoi] ?? l.troChoi}
                  </td>
                  <td className="px-4 py-3 text-muc">
                    {l.chuongTrinhMa} — {l.tenDot}
                  </td>
                  <td className="px-4 py-3 text-chi">{l.tenCoSo ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-muc">{l.phanQua ?? "—"}</td>
                  <td className="px-4 py-3">
                    {l.daTraoThuong ? <span className="font-bold text-luc">✓</span> : <span className="text-chi">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-black text-muc">{T.khachSoThayDoi}</h2>
      <p className="mt-1 text-xs leading-relaxed text-chi">{T.khachSoThayDoiVi}</p>
      {so.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white p-6 text-center text-sm text-chi">
          {T.khachSoThayDoiTrong}
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {so.map((d, i) => (
            <li
              key={`${d.luc}-${i}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-ke bg-white px-4 py-3 text-sm"
            >
              <span className="text-chi">{gio(d.luc)}</span>
              <b className="text-muc">
                {d.truong === "ho_ten" ? T.khachTruongHoTen : d.truong}
              </b>
              <span className="text-chi line-through">{d.giaTriCu ?? "—"}</span>
              <span aria-hidden="true">→</span>
              <span className="font-semibold text-muc">{d.giaTriMoi ?? "—"}</span>
              {d.troChoi && (
                <span className="rounded-full bg-tim-nhat px-2 py-0.5 text-xs font-semibold text-tim">
                  {T.tenTroChoi[d.troChoi] ?? d.troChoi}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-black text-muc">{T.khachLeadTieuDe}</h2>
      {/* 🔴 Một người ở HAI cơ sở là HAI đầu mối, cố ý không gộp. Nói rõ ra đây,
          nếu không người xem tưởng là lỗi rồi đi báo. */}
      <p className="mt-1 text-xs leading-relaxed text-chi">{T.khachLeadNhieuCoSo}</p>
      <ul className="mt-3 grid gap-2">
        {cacLead.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ke bg-white px-4 py-3 text-sm"
          >
            <b className="text-muc">{l.tenCoSo ?? "—"}</b>
            <span className="text-chi">
              {T.leadOwner}: {l.tenNhanVien ?? "—"} · {T.trangThaiLead[l.trangThai] ?? l.trangThai}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
