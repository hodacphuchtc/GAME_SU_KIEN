import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { headers } from "next/headers";

import { T } from "@/config/locale";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { timTheoMaChonSo } from "@/lib/chuong-trinh/kho";
import { coDai, nhipCua } from "@/lib/chon-so/vong-so";
import { soConLai } from "@/lib/tro-choi/luat-chon-so";
import { NutBatTat } from "@/components/nut-bat-tat";
import { NutIn } from "@/components/nut-in";

export const dynamic = "force-dynamic";

function O({ nhan, gt }: { nhan: string; gt: string }) {
  return (
    <div className="rounded-2xl border border-ke bg-white px-5 py-4">
      <p className="text-sm text-chi">{nhan}</p>
      <p className="mt-1 text-xl font-black text-muc">{gt}</p>
    </div>
  );
}

export default async function TrangChiTietChonSo({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  // 🔴 Lọc theo phạm vi ở TẦNG SQL. Trả `notFound()` chứ không phải "không có
  // quyền" — không xác nhận sự tồn tại của thứ người ta không được thấy.
  const nguoi = await batBuocDangNhap();
  const { ma } = await params;
  const ct = timTheoMaChonSo(ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) notFound();

  const h = await headers();
  const goc = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const anhQr = await QRCode.toDataURL(`${goc}/choi/${ct.ma}`, { width: 720, margin: 1 });

  const dai = { tu: ct.daiTu, den: ct.daiDen };
  const tong = coDai(dai);
  const con = soConLai(ct);
  const giayMotVong = tong / nhipCua(dai).maxSpeed;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-muc sm:text-3xl">{ct.tenGiaiThuong}</h1>
          <p className="mt-1 text-sm text-chi">
            {ct.ma} · {ct.tenTrungTam}
          </p>
        </div>
        <NutBatTat ma={ct.ma} dangChay={ct.trangThai === "dang_chay"} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <O nhan={T.chonSoDai} gt={`${ct.daiTu} – ${ct.daiDen}`} />
        <O
          nhan={T.chonSoConLai}
          gt={con === null ? T.chonSoConLaiKhongApDung : T.chonSoConLaiSo(con, tong)}
        />
        <O nhan={T.chonSoLoaiTru} gt={ct.loaiTruDaRa ? T.co : T.khong} />
      </div>

      <p className="mt-3 text-sm text-chi">{T.chonSoNhipQuay(giayMotVong.toFixed(1))}</p>

      {con === 0 && (
        <p className="mt-4 rounded-xl bg-do/10 px-4 py-3 text-sm font-semibold text-do">
          {T.chonSoHetSachSo}
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-ke bg-white p-6 text-center">
        <h2 className="text-lg font-black text-muc">{T.detailQr}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={anhQr}
          alt={`Mã QR mở ván chơi ${ct.ma}`}
          className="mx-auto mt-4 h-64 w-64 rounded-2xl bg-white sm:h-72 sm:w-72"
        />
        <p className="khong-in mt-3 text-center text-xs text-chi">{T.detailQrHint}</p>
        <div className="khong-in mt-4 flex justify-center">
          <NutIn />
        </div>
      </section>
    </div>
  );
}
