import Link from "next/link";

import { T } from "@/config/locale";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import {
  danhSachChonSo,
  danhSachChuongTrinh,
  danhSachVongQuay,
} from "@/lib/chuong-trinh/kho";

export const dynamic = "force-dynamic";

/**
 * TRANG CHỈ MỤC BA GAME (ADR-011).
 *
 * 🔴 KHÔNG chuyển hướng `/quan-tri` sang đây. Đường dẫn đó bị bookmark, nằm
 * trong 20 kịch bản e2e, và là trang mặc định sau đăng nhập. Trang này là một
 * cửa THÊM, không phải cửa thay thế.
 */
export default async function TrangChiMucGame() {
  const nguoi = await batBuocDangNhap();
  const pv = phamViCua(nguoi);

  const the = [
    {
      href: "/quan-tri",
      ten: T.adminNavTrungSo,
      mo: T.gameTrungSoMo,
      so: danhSachChuongTrinh(pv).length,
    },
    {
      href: "/quan-tri/chon-so",
      ten: T.chonSoNav,
      mo: T.gameChonSoMo,
      so: danhSachChonSo(pv).length,
    },
    {
      href: "/quan-tri/vong-quay",
      ten: T.vongQuayNav,
      mo: T.gameVongQuayMo,
      so: danhSachVongQuay(pv).length,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.gameIndexTitle}</h1>
      <p className="mt-1 text-sm text-chi">{T.gameIndexSubtitle}</p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {the.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="flex h-full flex-col rounded-2xl border border-ke bg-white p-5 transition hover:border-tim"
            >
              <p className="text-lg font-black text-muc">{t.ten}</p>
              <p className="mt-2 flex-1 text-sm text-chi">{t.mo}</p>
              <p className="mt-4 text-sm font-bold text-tim">{t.so} chương trình</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
