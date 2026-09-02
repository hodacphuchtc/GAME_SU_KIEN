"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { T } from "@/config/locale";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { useClientString } from "@/lib/tren-may-khach";
import type { Cung } from "@/lib/vong-quay/chia-o";
import { taoMayAmThanh, type MayAmThanh } from "@/lib/am-thanh";
import { GIAY_QUAY } from "@/config/vong-quay";
import { CauDinhVi, LogoSata } from "./nhan-dien-sata";
import { VongQuay } from "./vong-quay";

/**
 * MÀN HÌNH LCD trước sảnh — nơi DUY NHẤT cả sảnh cùng nhìn.
 *
 * 🔴 Màn này KHÔNG nhận từng khung hình qua mạng. Nó nhận đúng bốn thứ
 * `(gocDung, thoiLuong, batDauLuc, cung)` rồi tự chạy `goc(t)` bằng đồng hồ của
 * chính nó, sau khi đã canh lệch với máy chủ. Nhờ vậy độ trễ mạng chỉ làm lệch
 * phần ĐANG QUAY vài chục mili-giây, còn ô dừng thì khớp với điện thoại 100%.
 *
 * 🔴 Vào GIỮA CHỪNG vẫn đúng: mốc bắt đầu quy về đồng hồ máy này có thể nằm
 * trong QUÁ KHỨ, khi đó `goc(t)` nhảy thẳng tới chỗ đang quay. Tải lại trang
 * giữa ván không làm vòng quay lại từ đầu.
 */
export function ManHinh({
  ma,
  cungBanDau,
  tenCoSo,
}: {
  ma: string;
  cungBanDau: Cung[];
  tenCoSo: string;
}) {
  const [anhQr, setAnhQr] = useState("");
  const [daNoi, setDaNoi] = useState(true);
  const [cung, setCung] = useState<Cung[]>(cungBanDau);
  const [gocDich, setGocDich] = useState<number | null>(null);
  const [batDauCucBo, setBatDauCucBo] = useState<number | null>(null);
  const [nguoiQuay, setNguoiQuay] = useState<string | null>(null);
  const [ketQua, setKetQua] = useState<{ oTen: string; ma: string; ten: string } | null>(null);

  // Độ lệch đồng hồ với máy chủ. Giữ trong ref: đọc trong hàm xử lý tin, đổi nó
  // không cần vẽ lại gì cả.
  const lechRef = useRef(0);

  /**
   * Máy âm thanh. Giữ trong ref vì nó là tài nguyên trình duyệt, không phải dữ
   * liệu để vẽ.
   *
   * 🔴 `AudioContext` bị trình duyệt khoá tới khi có tương tác NGƯỜI DÙNG. Màn
   * LCD mở suốt buổi và không ai bấm gì trên nó — nên phải có nút "Bật tiếng"
   * để nhân viên bấm MỘT lần lúc mở màn hình. Không có nút đó thì tiếng im
   * lặng không kêu, và không một dòng lỗi nào giải thích vì sao.
   */
  const mayRef = useRef<MayAmThanh | null>(null);
  const [coTieng, setCoTieng] = useState(false);

  useEffect(() => {
    return () => {
      mayRef.current?.dong();
      mayRef.current = null;
    };
  }, []);

  const doiTieng = useCallback(() => {
    if (!mayRef.current) mayRef.current = taoMayAmThanh();
    const may = mayRef.current;
    // Mở khoá NGAY TRONG sự kiện bấm — hoãn sang tick sau là trình duyệt từ chối.
    may.moKhoa();
    const batLen = !coTieng;
    may.datTatTieng(!batLen);
    setCoTieng(batLen);
  }, [coTieng]);

  const duongDanChoi = useClientString(() =>
    typeof window === "undefined" ? "" : `${window.location.origin}/choi/${ma}`,
  );

  useEffect(() => {
    doLechDongHo().then((kq) => {
      lechRef.current = kq.lech;
    });
  }, []);

  useEffect(() => {
    if (duongDanChoi === "") return;
    let huy = false;
    QRCode.toDataURL(duongDanChoi, { width: 900, margin: 1 })
      .then((url) => {
        if (!huy) setAnhQr(url);
      })
      .catch(() => {
        // Không vẽ được QR thì màn vẫn phải sống: bên dưới còn in đường dẫn chữ.
        if (!huy) setAnhQr("");
      });
    return () => {
      huy = true;
    };
  }, [duongDanChoi]);

  const nhanTin = useCallback((tin: TinTrongPhong) => {
    switch (tin.loai) {
      case "bat-dau-quay": {
        setKetQua(null);
        setCung(tin.cung);
        setGocDich(tin.gocDung);
        setNguoiQuay(tin.tenRutGon);
        // Quy mốc của MÁY CHỦ về đồng hồ máy này. `daTroi` dương nghĩa là ván
        // đã chạy được bấy nhiêu — trừ đi để `goc(t)` nhảy đúng chỗ đang quay.
        const gioMayChuBayGio = Date.now() + lechRef.current;
        const daTroi = gioMayChuBayGio - tin.batDauLuc;
        setBatDauCucBo(performance.now() - daTroi);
        // Xếp trọn nhịp tick + tiếng ăn mừng ngay lúc này, trên đồng hồ của
        // AudioContext. Phát theo vòng lặp khung hình thì rớt khung nghe ra
        // ngay thành tiếng vấp. `daTroi` cho màn vào giữa chừng bắt đúng nhịp.
        mayRef.current?.datLichQuay(
          tin.gocDung,
          tin.thoiLuong || GIAY_QUAY,
          tin.cung,
          Math.max(0, daTroi / 1000),
        );
        break;
      }
      case "ket-qua-quay":
        setKetQua({ oTen: tin.oTen, ma: tin.maXacThuc, ten: tin.tenRutGon });
        break;
      case "nguoi-choi-vao":
        setNguoiQuay(tin.tenRutGon);
        break;
      case "roi-di":
        setNguoiQuay(null);
        setKetQua(null);
        setGocDich(null);
        setBatDauCucBo(null);
        break;
      default:
        // Tin lạ (phiên bản sau) thì bỏ qua, không được làm sập màn đang chiếu.
        break;
    }
  }, []);

  useEffect(() => moKenh(ma, nhanTin, setDaNoi), [ma, nhanTin]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-suong px-6 py-8">
      <header className="flex flex-col items-center text-center">
        {/* 🔴 Logo đặt trên nền TRẮNG/sương, không có hiệu ứng nào chạy xuyên
            qua. Khoảng thở do chính component nhận diện lo. */}
        <LogoSata chieuCao={64} sizes="(max-width: 768px) 160px, 220px" preload />
        <h1 className="text-3xl font-black text-tim md:text-5xl">{T.tenUngDung}</h1>
        <p className="mt-1 text-base text-chi md:text-xl">{tenCoSo}</p>
        <CauDinhVi className="mt-1 text-sm md:text-base" />
      </header>

      <button
        type="button"
        onClick={doiTieng}
        aria-pressed={coTieng}
        className="rounded-xl border border-ke bg-white px-4 py-2 text-sm font-semibold text-chi hover:text-muc"
      >
        {coTieng ? T.amTatTieng : T.amBatTieng}
      </button>

      {!daNoi && (
        <p role="status" className="rounded-xl bg-vang/20 px-4 py-2 text-sm text-muc">
          {T.lcdMatKetNoi}
        </p>
      )}

      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1fr_auto]">
        <div className="mx-auto w-full max-w-2xl">
          <VongQuay cung={cung} gocDich={gocDich} batDauLuc={batDauCucBo} />
        </div>

        <aside className="mx-auto w-full max-w-xs text-center">
          {ketQua ? (
            <div className="rounded-3xl border-4 border-cam bg-white p-6">
              <p className="text-2xl font-black text-cam md:text-3xl">{T.lcdTrungTieuDe}</p>
              <p className="mt-3 text-base text-chi">{T.lcdTrungCua(ketQua.ten)}</p>
              <p className="mt-1 text-2xl font-black text-muc">{ketQua.oTen}</p>
              <p className="mt-5 text-xs uppercase tracking-wide text-chi">{T.lcdMaXacThuc}</p>
              <p className="font-mono text-4xl font-black tracking-[0.25em] text-tim">
                {ketQua.ma}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-ke bg-white p-6">
              <p className="text-xl font-black text-muc">{T.lcdQuetMa}</p>
              {anhQr ? (
                /* eslint-disable-next-line @next/next/no-img-element -- ảnh là
                   data: URI sinh tại chỗ, không có tệp nào để `next/image` tối ưu. */
                <img
                  src={anhQr}
                  alt={T.lcdQuetMa}
                  className="mx-auto mt-4 aspect-square w-full max-w-[15rem]"
                />
              ) : (
                <p className="mt-4 break-all font-mono text-xs text-chi">{duongDanChoi}</p>
              )}
              <p className="mt-4 text-sm text-chi">{T.lcdHuongDan}</p>
              <p className="mt-3 text-sm font-semibold text-tim">
                {nguoiQuay ? T.lcdNguoiChoi(nguoiQuay) : T.lcdDangCho}
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
