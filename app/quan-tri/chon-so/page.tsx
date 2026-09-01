import Link from "next/link";

import { T } from "@/config/locale";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { danhSachChonSo, type TrangThaiChuongTrinh } from "@/lib/chuong-trinh/kho";
import { soConLai } from "@/lib/tro-choi/luat-chon-so";

// Đọc thẳng cơ sở dữ liệu ở mỗi lượt tải: nhân viên tắt chương trình lúc 9h thì
// 9h01 danh sách phải hiện "đã kết thúc", không phải sau khi bản dựng hết hạn.
export const dynamic = "force-dynamic";

function NhanTrangThai({ trangThai }: { trangThai: TrangThaiChuongTrinh }) {
  const kieu =
    trangThai === "dang_chay"
      ? "bg-luc/10 text-luc"
      : trangThai === "da_an"
        ? "bg-cam/10 text-cam"
        : "bg-chi/10 text-chi";
  const chu =
    trangThai === "dang_chay"
      ? T.statusRunning
      : trangThai === "da_an"
        ? T.donNhanDaAn
        : T.statusEnded;
  return (
    <span
      className={["inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", kieu].join(" ")}
    >
      {chu}
    </span>
  );
}

export default async function TrangChonSo() {
  // 🔴 Lọc theo phạm vi người đăng nhập, ở TẦNG SQL — sale cơ sở này không được
  // thấy chương trình của cơ sở kia.
  const nguoi = await batBuocDangNhap();
  const ds = danhSachChonSo(phamViCua(nguoi));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.chonSoTitle}</h1>
          <p className="mt-1 text-sm text-chi">{T.chonSoSubtitle}</p>
        </div>
        <Link
          href="/quan-tri/chon-so/tao"
          className="rounded-xl bg-cam px-5 py-3 text-sm font-black text-white"
        >
          {T.chonSoTaoNut}
        </Link>
      </div>

      {ds.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ke bg-white p-8 text-center text-sm text-chi">
          {T.chonSoEmpty}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {ds.map((ct) => {
            const con = soConLai(ct);
            return (
              <li key={ct.id}>
                <Link
                  href={`/quan-tri/chon-so/${ct.ma}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ke bg-white px-5 py-4 hover:border-tim"
                >
                  <div>
                    <p className="font-black text-muc">
                      {ct.ma} — {ct.tenGiaiThuong}
                    </p>
                    <p className="mt-0.5 text-sm text-chi">
                      {ct.tenTrungTam} · {T.chonSoDai} {ct.daiTu}–{ct.daiDen}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-chi">
                      {T.chonSoConLai}:{" "}
                      <b className="text-muc">
                        {con === null
                          ? T.chonSoConLaiKhongApDung
                          : T.chonSoConLaiSo(con, ct.daiDen - ct.daiTu + 1)}
                      </b>
                    </span>
                    <NhanTrangThai trangThai={ct.trangThai} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
