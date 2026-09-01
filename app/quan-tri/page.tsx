import Link from "next/link";

import { DIFFICULTIES, type DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import { formatNumber } from "@/lib/bo-dem";
import { danhSachChuongTrinh } from "@/lib/chuong-trinh/kho";
import { thongKeGhiDanh } from "@/lib/luot/kho-luot";
import { NutBatTatNho } from "@/components/nut-bat-tat-nho";
import { mucCanhBaoKho } from "@/lib/qua/canh-bao";
import { danhSachQua } from "@/lib/qua/kho-qua";
import { DaiCanhBaoKho } from "@/components/dai-canh-bao-kho";

// Đọc thẳng cơ sở dữ liệu ở mỗi lượt tải: nhân viên tắt chương trình lúc 9h thì
// 9h01 danh sách phải hiện "đã kết thúc", không phải sau khi bản dựng hết hạn.
export const dynamic = "force-dynamic";

function TheSoLieu({ so, nhan }: { so: string; nhan: string }) {
  return (
    <div className="rounded-2xl border border-ke bg-white px-6 py-5">
      <p className="text-3xl font-black text-tim">{so}</p>
      <p className="mt-1 text-sm text-chi">{nhan}</p>
    </div>
  );
}

function NhanTrangThai({ dangChay }: { dangChay: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        dangChay ? "bg-luc/10 text-luc" : "bg-chi/10 text-chi",
      ].join(" ")}
    >
      {dangChay ? T.statusRunning : T.statusEnded}
    </span>
  );
}

/**
 * Dòng ROI: thứ DUY NHẤT trên trang này trả lời được câu "có ra tiền không".
 * Ba thẻ số liệu bên dưới chỉ đếm lượt chơi — đẹp mắt mà không quyết được gì.
 */
function DongRoi({ soKhach, soGhiDanh }: { soKhach: number; soGhiDanh: number }) {
  if (soKhach === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-ke bg-white/60 px-5 py-4 text-sm text-chi">
        {T.roiEmpty}
      </p>
    );
  }
  const phanTram = `${Math.round((soGhiDanh / soKhach) * 100)}%`;
  return (
    <p className="mt-4 rounded-2xl border border-tim/20 bg-tim-nhat px-5 py-4 text-sm font-semibold text-tim">
      {T.roiDong(soKhach, soGhiDanh, phanTram)}
    </p>
  );
}

export default function TrangDanhSach() {
  const danhSach = danhSachChuongTrinh();
  // Cảnh báo kho hiện ở CẢ danh sách lẫn trang chi tiết (Đ14): quản lý mở danh
  // sách trước, và nếu dải chỉ nằm trong trang chi tiết thì họ phải bấm vào
  // từng chương trình mới biết cái nào sắp hết quà.
  const canhBao = danhSach
    .filter((c) => c.trangThai === "dang_chay")
    .map((c) => ({ ct: c, kho: mucCanhBaoKho(danhSachQua(c.id)) }))
    .filter((x) => x.kho.muc !== "xanh");
  const roi = thongKeGhiDanh();
  const tongLuot = danhSach.reduce((s, c) => s + c.soLuot, 0);
  const tongGiai = danhSach.reduce((s, c) => s + c.soGiai, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.listTitle}</h1>
          <p className="mt-1 text-sm text-chi">{T.listSubtitle}</p>
        </div>
        <Link
          href="/quan-tri/tao"
          className="rounded-xl bg-cam px-5 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95"
        >
          + {T.listNew}
        </Link>
      </div>

      <div className="mt-6">
        {canhBao.map(({ ct, kho }) => (
          <DaiCanhBaoKho key={ct.id} canhBao={kho} nhanCoSo={ct.tenTrungTam} />
        ))}
      </div>

      <DongRoi soKhach={roi.soKhach} soGhiDanh={roi.soGhiDanh} />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <TheSoLieu so={String(danhSach.length)} nhan={T.totalPrograms} />
        <TheSoLieu so={String(tongLuot)} nhan={T.totalPlays} />
        <TheSoLieu so={String(tongGiai)} nhan={T.totalWins} />
      </div>

      {danhSach.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ke bg-white/60 px-6 py-16 text-center text-sm text-chi">
          {T.listEmpty}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ke bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-ke text-xs uppercase tracking-wide text-chi">
              <tr>
                <th className="px-5 py-3 font-semibold">{T.colCenter}</th>
                <th className="px-5 py-3 font-semibold">{T.colTarget}</th>
                <th className="px-5 py-3 font-semibold">{T.colLevel}</th>
                <th className="px-5 py-3 font-semibold">{T.colPrize}</th>
                <th className="px-5 py-3 font-semibold">{T.colPlays}</th>
                <th className="px-5 py-3 font-semibold">{T.colWins}</th>
                <th className="px-5 py-3 font-semibold">{T.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((c) => (
                <tr key={c.ma} className="border-b border-ke last:border-0 hover:bg-suong">
                  <td className="px-5 py-4">
                    <Link href={`/quan-tri/chuong-trinh/${c.ma}`} className="font-semibold text-tim hover:underline">
                      {c.tenTrungTam}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-chi">{c.ma}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-base font-black text-cam">
                    {formatNumber(c.soTrung)}
                  </td>
                  <td className="px-5 py-4 text-chi">
                    {c.mucDo === "custom"
                      ? T.custom
                      : DIFFICULTIES[c.mucDo as DifficultyId].label}
                  </td>
                  <td className="px-5 py-4">{c.tenGiaiThuong}</td>
                  <td className="px-5 py-4 tabular-nums">{c.soLuot}</td>
                  <td className="px-5 py-4 tabular-nums">{c.soGiai}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <NhanTrangThai dangChay={c.trangThai === "dang_chay"} />
                      <NutBatTatNho ma={c.ma} dangChay={c.trangThai === "dang_chay"} />
                    </div>
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
