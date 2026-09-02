import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";

import { T } from "@/config/locale";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { timTheoMaVongQuay } from "@/lib/chuong-trinh/kho";
import { mucCanhBaoKho } from "@/lib/vong-quay/canh-bao-o";
import { conLai } from "@/lib/vong-quay/chia-o";
import { danhSachO } from "@/lib/vong-quay/kho-o";
import { lichSuLuot } from "@/lib/vong-quay/kho-luot-quay";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
import { NutIn } from "@/components/nut-in";
import { NutManHinh } from "@/components/nut-man-hinh";
import { NutBatTat } from "@/components/nut-bat-tat";
import { BangLuotQuay } from "@/components/bang-luot-quay";
import { FormSuaVongQuay } from "@/components/form-sua-vong-quay";

export const dynamic = "force-dynamic";

export default async function TrangChiTietVongQuay({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  // 🔴 Lọc theo phạm vi NGAY ở câu SQL. Lớp chặn ở `proxy.ts` chỉ hỏi "đã đăng
  // nhập chưa", không hỏi "được xem dữ liệu của ai".
  const nguoi = await batBuocDangNhap();
  const ct = timTheoMaVongQuay(ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) notFound();

  const dsO = danhSachO(ct.id);
  const canhBao = mucCanhBaoKho(dsO);
  const lichSu = lichSuLuot(ct.id);

  // Mã QR sinh Ở MÁY CHỦ từ đúng địa chỉ trình duyệt đang mở, khớp khuôn hai game
  // kia. Mở trang bằng `localhost` thì tờ QR in ra cũng mã hoá `localhost` — màn
  // LCD có dải cảnh báo riêng cho ca đó, xem `man-hinh-vong-quay.tsx`.
  const h = await headers();
  const goc = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const duongDanChoi = `${goc}/choi/${ct.ma}`;
  const anhQr = await QRCode.toDataURL(duongDanChoi, { width: 720, margin: 1 });

  // NĐ 13/2023: mở trang này là xem danh bạ khách, phải để lại dấu vết ai xem.
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xemLead,
    doiTuong: `vong-quay:${ct.ma}`,
    soDong: lichSu.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return (
    <div className="mx-auto max-w-5xl">
      {/* 🔴 MỌI THỨ ngoài khối QR đều mang `khong-in`. `NutIn` chỉ gọi
          `window.print()` — nó KHÔNG tự biết cái gì được in; thiếu các class này
          là in cả danh sách khách hàng ra giấy, tức rò rỉ dữ liệu cá nhân ra vật
          lý và không thu hồi được. Luật ở `app/globals.css` mục @media print. */}
      <Link
        href="/quan-tri/vong-quay"
        className="khong-in text-sm font-bold text-chi hover:text-tim"
      >
        ← {T.vongQuayTitle}
      </Link>

      <div className="khong-in mt-2 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-black text-muc sm:text-3xl">
          {ct.ma} — {ct.tenGiaiThuong}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <NutIn />
          <NutManHinh ma={ct.ma} />
          <NutBatTat ma={ct.ma} dangChay={ct.trangThai === "dang_chay"} />
        </div>
      </div>
      <p className="khong-in mt-1 text-sm text-chi">
        {ct.tenTrungTam} · {T.vongQuayLuotDaQuay}: <b className="text-muc">{lichSu.length}</b>
      </p>

      {/* 🔴 Khối này là thứ DUY NHẤT được in ra giấy. */}
      <section className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-ke bg-white p-6">
        <h2 className="khong-in text-sm font-bold uppercase tracking-widest text-chi">
          {T.detailQr}
        </h2>
        {/* Chỉ hiện TRÊN GIẤY: ba tờ QR của ba cơ sở phải phân biệt được. */}
        <p className="chi-in text-center text-2xl font-black text-muc">{ct.tenTrungTam}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh là data: URI
            sinh tại chỗ, không có tệp nào để `next/image` tối ưu. */}
        <img
          src={anhQr}
          alt={`Mã QR mở lượt quay ${ct.ma}`}
          className="h-64 w-64 rounded-2xl bg-white sm:h-72 sm:w-72"
        />
        <p className="text-center text-lg font-black text-muc">{ct.tenGiaiThuong}</p>
        <p className="khong-in break-all text-center font-mono text-xs text-chi">
          {duongDanChoi}
        </p>
        <p className="khong-in text-center text-xs text-chi">{T.detailQrHint}</p>
      </section>

      {canhBao.muc === "vang" && (
        <p role="alert" className="khong-in mt-4 rounded-xl bg-vang/20 px-4 py-3 text-sm font-semibold text-muc">
          ⚠️ {T.vongQuayCanhBaoVang}
        </p>
      )}
      {canhBao.muc === "do" && (
        <p role="alert" className="khong-in mt-4 rounded-xl bg-do/10 px-4 py-3 text-sm font-semibold text-do">
          🔴 {T.vongQuayCanhBaoDo}
        </p>
      )}

      <h2 className="khong-in mt-8 text-lg font-black text-muc">{T.vongQuayKhoTieuDe}</h2>
      <ul className="khong-in mt-3 grid gap-2 sm:grid-cols-2">
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

      <FormSuaVongQuay
        ma={ct.ma}
        tenDot={ct.tenGiaiThuong}
        dsO={dsO.map((o) => ({
          id: o.id,
          ten: o.ten,
          thuTu: o.thuTu,
          soLuong: o.soLuong,
          tranMoiNgay: o.tranMoiNgay,
          tiLeTrung: o.tiLeTrung,
          mau: o.mau,
          daTrao: o.daTrao,
        }))}
      />

      <BangLuotQuay ma={ct.ma} cacLuot={lichSu} />
    </div>
  );
}
