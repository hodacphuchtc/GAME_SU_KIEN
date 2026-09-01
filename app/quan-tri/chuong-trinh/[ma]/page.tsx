import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { headers } from "next/headers";

import { DIFFICULTIES, type DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import { formatNumber } from "@/lib/bo-dem";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { nhanCoSo } from "@/lib/co-so/nhan";
import { timCoSo } from "@/lib/co-so/kho";
import { SO_LAN_CHOI } from "@/config/to-chuc";
import { lichSu, soGiaiHomNay } from "@/lib/luot/kho-luot";
import { NutIn } from "@/components/nut-in";
import { NutBatTat } from "@/components/nut-bat-tat";
import { KhoQua } from "@/components/kho-qua";
import { danhSachQua } from "@/lib/qua/kho-qua";
import { mucCanhBaoKho } from "@/lib/qua/canh-bao";
import { DaiCanhBaoKho } from "@/components/dai-canh-bao-kho";
import { BangLichSu } from "@/components/bang-lich-su";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";

export const dynamic = "force-dynamic";

export default async function TrangChiTiet({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  // 🔴 Lọc theo phạm vi người đăng nhập, ở TẦNG SQL. Trước GĐ 21.1 trang này
  // không đọc phiên lần nào: sale của cơ sở này gõ đúng mã là đọc trọn lịch sử
  // cơ sở kia. Trả `notFound()` chứ không phải "không có quyền" — không xác
  // nhận sự tồn tại của thứ người ta không được thấy.
  const nguoi = await batBuocDangNhap();
  const ct = timTheoMa(ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) notFound();

  const h = await headers();
  const goc = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const duongDanChoi = `${goc}/choi/${ct.ma}`;
  const anhQr = await QRCode.toDataURL(duongDanChoi, { width: 720, margin: 1 });

  const coSo = ct.coSoId === null ? null : timCoSo(ct.coSoId);
  const kho = danhSachQua(ct.id);
  const canhBao = mucCanhBaoKho(kho);
  const cacLuot = lichSu(ct.id);
  const giaiHomNay = soGiaiHomNay(ct.id);
  const dangChay = ct.trangThai === "dang_chay";

  // Trang này hiện họ tên và số điện thoại phụ huynh ⇒ mỗi lần mở là một lần
  // dữ liệu cá nhân rời khỏi máy chủ. NĐ 13/2023 đòi biết ai đã xem, lúc nào.
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.xemLead,
    doiTuong: `chuong-trinh:${ct.ma}`,
    soDong: cacLuot.length,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <DaiCanhBaoKho
        canhBao={canhBao}
        nhanCoSo={coSo ? nhanCoSo(coSo) : ct.tenTrungTam}
      />

      <div className="khong-in flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/quan-tri" className="text-sm text-tim hover:underline">
            ← {T.createBack}
          </Link>
          {/* Tiêu đề dùng nhãn cơ sở SỐNG (đổi địa chỉ là thấy đổi ngay ở đây),
              còn khối in ra giấy bên dưới giữ BẢN CHỤP tên lúc tạo. Hai chỗ cố ý
              khác nhau: màn quản trị nói "cơ sở này bây giờ là gì", tờ giấy đã in
              nói "chương trình này được mở dưới tên gì". */}
          <h1 className="mt-1 text-2xl font-black text-muc sm:text-3xl">
            {coSo ? nhanCoSo(coSo) : ct.tenTrungTam}
          </h1>
          <p className="mt-1 text-sm text-chi">
            {T.lcdRoomCode}: <span className="font-mono font-bold">{ct.ma}</span> ·{" "}
            {ct.mucDo === "custom"
              ? T.custom
              : DIFFICULTIES[ct.mucDo as DifficultyId].label}{" "}
            · {T.prizeLabel}: {ct.tenGiaiThuong} ·{" "}
            {ct.cheDo === "online" ? T.createModeOnline : T.createModeCounter}
            {ct.soLanChoi > SO_LAN_CHOI.macDinh && ` · ${T.detailTries(ct.soLanChoi)}`}
            {ct.tranGiaiMoiNgay > 0 &&
              ` · hôm nay ${giaiHomNay}/${ct.tranGiaiMoiNgay} giải`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NutIn />
          <a
            href={`/man-hinh/${ct.ma}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-tim px-5 py-3 text-sm font-black text-white"
          >
            {T.detailOpenScreen}
          </a>
          <NutBatTat ma={ct.ma} dangChay={dangChay} />
        </div>
      </div>

      <KhoQua chuongTrinhId={ct.id} ma={ct.ma} kho={kho} />

      {/* Khối này là thứ DUY NHẤT được in ra giấy. */}
      <section className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-ke bg-white p-6">
        <h2 className="khong-in text-sm font-bold uppercase tracking-widest text-chi">
          {T.detailQr}
        </h2>
        <p className="chi-in text-center text-2xl font-black text-muc">
          {ct.tenTrungTam}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={anhQr}
          alt={`Mã QR mở ván chơi ${ct.ma}`}
          className="h-64 w-64 rounded-2xl bg-white sm:h-72 sm:w-72"
        />
        <p className="text-center text-lg font-black text-muc">
          {T.targetLabel}:{" "}
          <span className="font-mono text-2xl text-cam">{formatNumber(ct.soTrung)}</span>
        </p>
        <p className="khong-in break-all text-center font-mono text-xs text-chi">
          {duongDanChoi}
        </p>
        <p className="khong-in text-center text-xs text-chi">{T.detailQrHint}</p>
      </section>

      <BangLichSu ma={ct.ma} cacLuot={cacLuot} />
    </div>
  );
}
