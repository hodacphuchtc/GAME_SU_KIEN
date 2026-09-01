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
import { OTichVan } from "@/components/o-tich-van";
import { NutBatTat } from "@/components/nut-bat-tat";
import { KhoQua } from "@/components/kho-qua";
import { danhSachQua } from "@/lib/qua/kho-qua";
import { mucCanhBaoKho } from "@/lib/qua/canh-bao";
import { DaiCanhBaoKho } from "@/components/dai-canh-bao-kho";

export const dynamic = "force-dynamic";

const NHAN_THIET_BI: Record<string, string> = {
  man_hinh: T.deviceScreen,
  dien_thoai: T.devicePhone,
  het_gio: T.deviceTimeout,
};

function gioPhut(luc: number | null): string {
  if (luc === null) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(luc));
}

/** Che bớt tên để bảng công khai không lộ danh tính đầy đủ. */
function tenRutGon(hoTen: string | null): string {
  if (!hoTen) return "—";
  const tu = hoTen.trim().split(/\s+/);
  if (tu.length === 1) return tu[0];
  return `${tu[0]} ${tu[tu.length - 1][0]}.`;
}

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

      <section className="khong-in mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-muc">{T.detailHistory}</h2>
          {cacLuot.length > 0 && (
            <a
              href={`/api/xuat/chuong-trinh/${ct.ma}`}
              className="rounded-xl border border-ke px-4 py-2 text-sm font-bold text-muc"
            >
              {T.detailExport}
            </a>
          )}
        </div>

        {cacLuot.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ke bg-white/60 px-6 py-12 text-center text-sm text-chi">
            {T.detailHistoryEmpty}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ke bg-white">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-ke text-xs uppercase tracking-wide text-chi">
                <tr>
                  <th className="px-5 py-3 font-semibold">{T.colTime}</th>
                  <th className="px-5 py-3 font-semibold">{T.colPlayer}</th>
                  <th className="px-5 py-3 font-semibold">{T.colStopped}</th>
                  <th className="px-5 py-3 font-semibold">{T.colResult}</th>
                  <th className="px-5 py-3 font-semibold">{T.colDevice}</th>
                  <th className="px-5 py-3 font-semibold">{T.colCode}</th>
                  <th className="px-5 py-3 font-semibold">{T.colAwarded}</th>
                  <th className="px-5 py-3 font-semibold">{T.colEnrolled}</th>
                </tr>
              </thead>
              <tbody>
                {cacLuot.map((l) => (
                  <tr key={l.id} className="border-b border-ke last:border-0">
                    <td className="px-5 py-3 tabular-nums text-chi">
                      {gioPhut(l.ketThucLuc)}
                    </td>
                    <td className="px-5 py-3">{tenRutGon(l.hoTen)}</td>
                    <td className="px-5 py-3 font-mono font-bold text-muc">
                      {l.soDaDung === null ? "—" : formatNumber(l.soDaDung)}
                    </td>
                    <td className="px-5 py-3">
                      {l.trung ? (
                        <span className="rounded-full bg-luc/10 px-2.5 py-1 text-xs font-black text-luc">
                          {T.resultWin}
                        </span>
                      ) : (
                        <span className="text-chi">
                          {T.resultLose}
                          {l.khoangLech !== null && ` · ${T.offByN(l.khoangLech)}`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-chi">
                      {NHAN_THIET_BI[l.thietBiBam ?? ""] ?? "—"}
                    </td>
                    {/* Mã xác thực phải tra được ở ĐÂY. Không có cột này thì
                        phụ huynh bấm nhầm "thử lại" trên điện thoại là mất mã,
                        và nhân viên không còn chỗ nào để đối chiếu. */}
                    <td className="px-5 py-3 font-mono text-xs tracking-widest text-muc">
                      {l.maXacThuc ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      {l.trung ? (
                        <OTichVan
                          vanId={l.id}
                          ma={ct.ma}
                          coVan="trao-thuong"
                          banDau={l.daTraoThuong}
                          nhan={T.awardToggle}
                        />
                      ) : (
                        <span className="text-chi">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {/* Chỉ ván có danh tính mới đánh dấu được — ván ẩn danh
                          không có ai để mà ghi danh. */}
                      {l.hoTen === null ? (
                        <span className="text-chi">—</span>
                      ) : (
                        <OTichVan
                          vanId={l.id}
                          ma={ct.ma}
                          coVan="ghi-danh"
                          banDau={l.daGhiDanh}
                          nhan={T.enrollToggle}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
