import Link from "next/link";

import { T } from "@/config/locale";
import { danhSach } from "@/lib/chuong-trinh/kho";
import { dangXuat } from "@/app/actions/dang-nhap";

// Đọc thẳng cơ sở dữ liệu mỗi lượt tải: nhân viên tắt chương trình lúc 9h thì
// 9h01 danh sách phải hiện "đã kết thúc", không phải sau khi bản dựng hết hạn.
export const dynamic = "force-dynamic";

export default function TrangDanhSach() {
  const ds = danhSach();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-muc">{T.qtTieuDe}</h1>
          <p className="mt-1 max-w-xl text-sm text-chi">{T.qtMoTa}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/quan-tri/tao"
            className="rounded-xl bg-cam px-5 py-3 text-sm font-black text-white hover:brightness-95"
          >
            + {T.qtTaoMoi}
          </Link>
          {/* Máy đặt ở quầy dùng chung: không có nút thoát thì phiên 12 tiếng
              của người trước còn nguyên khi người sau ngồi vào. */}
          <form action={dangXuat}>
            <button
              type="submit"
              className="rounded-xl border border-ke px-4 py-3 text-sm font-semibold text-chi hover:text-muc"
            >
              {T.qtDangXuat}
            </button>
          </form>
        </div>
      </div>

      {ds.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ke bg-white/60 px-6 py-14 text-center text-sm text-chi">
          {T.qtChuaCo}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ke bg-white">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-ke text-xs uppercase tracking-wide text-chi">
              <tr>
                <th className="px-5 py-3 font-semibold">{T.qtCotCoSo}</th>
                <th className="px-5 py-3 font-semibold">{T.qtCotMa}</th>
                <th className="px-5 py-3 text-right font-semibold">{T.qtCotSoO}</th>
                <th className="px-5 py-3 text-right font-semibold">{T.qtCotLuot}</th>
                <th className="px-5 py-3 font-semibold">{T.qtCotTrangThai}</th>
              </tr>
            </thead>
            <tbody>
              {ds.map((c) => (
                <tr key={c.ma} className="border-b border-ke last:border-0">
                  <td className="px-5 py-4">
                    <Link
                      href={`/quan-tri/chuong-trinh/${c.ma}`}
                      className="font-semibold text-muc hover:text-tim hover:underline"
                    >
                      {c.tenCoSo}
                    </Link>
                    {/* 🔴 Dải cảnh báo kho phải hiện ở CẢ danh sách lẫn trang
                        chi tiết. Chỉ để một chỗ là để nó ở đúng chỗ quản lý
                        không nhìn vào cái ngày kho sắp cạn. */}
                    {c.canhBao !== "xanh" && (
                      <span
                        className={[
                          "ml-2 rounded-full px-2 py-0.5 text-xs font-semibold",
                          c.canhBao === "do" ? "bg-do/10 text-do" : "bg-vang/30 text-muc",
                        ].join(" ")}
                      >
                        {c.canhBao === "do" ? T.qtKhoCan : T.qtKhoSapHet}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-cam">{c.ma}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{c.soO}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{c.soLuot}</td>
                  <td className="px-5 py-4">
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        c.trangThai === "dang_chay"
                          ? "bg-luc/10 text-luc"
                          : "bg-chi/10 text-chi",
                      ].join(" ")}
                    >
                      {c.trangThai === "dang_chay" ? T.qtDangChay : T.qtKetThuc}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
